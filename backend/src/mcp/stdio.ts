import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { desc, ilike } from "drizzle-orm";
import { IBM_PRODUCTS } from "../data/ibm-products";
import { db } from "../lib/db";
import { briefings } from "../lib/schema";

type Product = {
  name: string;
  tier: string;
  tierRank: number;
  tagline: string;
  body: string;
  aliases: string[];
  haystack: string;
};

// IBM_PRODUCTS is prose written for prompt injection, not a lookup table, so
// parse it once at startup: tiers are "## Priority N — ...", products "### <name>".
function parseProducts(markdown: string): Product[] {
  const catalog = markdown.split("\n## Summary")[0] ?? "";
  const products: Product[] = [];

  for (const block of catalog.split("\n## ").slice(1)) {
    const [tierBlock, ...entries] = block.split("\n### ");
    const tier = (tierBlock ?? "").split("\n")[0]!.trim();
    const tierRank = Number(tier.match(/Priority (\d+)/)?.[1] ?? 99);

    for (const entry of entries) {
      const lines = entry.split("\n");
      const name = (lines.shift() ?? "").trim();
      if (!name) continue;

      // Each product section is terminated by a "---" rule — drop it.
      const raw = lines.join("\n").replace(/\s*-{3,}\s*$/, "").trim();

      // The one-line "**...**" summary above "How it works" is the tagline; it
      // is lifted out of the body so it isn't rendered twice.
      const taglineLine = raw
        .split("\n")
        .find((l) => l.trim().startsWith("**") && !/^\*\*How it works/i.test(l.trim()));
      const tagline = taglineLine?.replace(/\*\*/g, "").trim() ?? "";
      const body = (taglineLine ? raw.replace(taglineLine, "") : raw).trim();

      const aliases = [name.toLowerCase()];
      const withoutIbm = name.replace(/^IBM\s+/i, "").toLowerCase();
      if (withoutIbm !== name.toLowerCase()) aliases.push(withoutIbm);
      // "IBM Planning Analytics (TM1)" is asked for as "TM1".
      const parenthetical = name.match(/\(([^)]+)\)/)?.[1]?.toLowerCase();
      if (parenthetical) aliases.push(parenthetical);
      const withoutParenthetical = withoutIbm.replace(/\s*\([^)]*\)/, "").trim();
      if (withoutParenthetical && !aliases.includes(withoutParenthetical)) {
        aliases.push(withoutParenthetical);
      }

      products.push({
        name,
        tier,
        tierRank,
        tagline,
        body,
        aliases,
        haystack: `${name}\n${body}`.toLowerCase(),
      });
    }
  }

  return products;
}

const PRODUCTS = parseProducts(IBM_PRODUCTS);

const STOP_WORDS = new Set([
  "the", "and", "for", "our", "are", "with", "that", "this", "they", "their",
  "from", "have", "has", "how", "what", "which", "does", "can", "you", "your",
  "we", "us", "is", "be", "it", "to", "of", "in", "on", "at", "as", "by", "or",
  "an", "a", "but", "not", "my", "do", "need", "needs", "want", "wants", "looking",
  "help", "about", "into", "them", "there", "would", "should", "could", "customer",
]);

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9.+]+/)
        .map((t) => t.replace(/^\.+|\.+$/g, ""))
        .filter((t) => t.length >= 2 && !STOP_WORDS.has(t)),
    ),
  );
}

// Reduce a query word to a prefix that survives inflection, so "regulators"
// still finds "regulatory" and "forecasting" still finds "forecasts". Matched at
// a word boundary (below) so short keys like "ai" can't hit inside "chain".
function searchKey(token: string): string {
  const stemmed = token
    .replace(/ies$/, "y")
    .replace(/(ing|ed|es|s)$/, "");
  const key = stemmed.length >= 2 ? stemmed : token;
  return key.length >= 8 ? key.slice(0, 6) : key;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(haystack: string, pattern: RegExp): number {
  return haystack.match(pattern)?.length ?? 0;
}

// `test` on a /g regex advances lastIndex, so reset before every probe.
function hasMatch(text: string, pattern: RegExp): boolean {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

// A product must clear this on query terms alone — the tier bonus is applied
// afterwards, so it can reorder near-ties but never invent a match.
const MIN_RELEVANCE = 3;

// Rank products by: explicit name match > distinctive term hits > tier priority.
// Terms are weighted by inverse document frequency so ubiquitous words in this
// catalog ("data", "cloud") don't drown out discriminating ones ("cobol", "cdc").
function rank(query: string): Array<{ product: Product; score: number }> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const keys = Array.from(new Set(tokenize(q).map(searchKey))).filter((k) => k.length >= 2);
  const patterns = new Map(
    keys.map((key) => [key, new RegExp(`\\b${escapeRegExp(key)}`, "g")] as const),
  );
  const documentFrequency = new Map(
    keys.map((key) => [
      key,
      PRODUCTS.filter((p) => hasMatch(p.haystack, patterns.get(key)!)).length,
    ]),
  );

  const hits: Array<{ product: Product; score: number }> = [];

  for (const product of PRODUCTS) {
    let relevance = 0;

    for (const alias of product.aliases) {
      if (q.includes(alias) || (q.length >= 3 && alias.includes(q))) {
        relevance += 50;
        break;
      }
    }

    const nameKey = product.name.toLowerCase();
    for (const key of keys) {
      const pattern = patterns.get(key)!;
      if (hasMatch(nameKey, pattern)) relevance += 12;

      const df = documentFrequency.get(key) ?? 0;
      if (df === 0) continue;
      const idf = Math.log(PRODUCTS.length / df) + 0.2;
      relevance += Math.min(countMatches(product.haystack, pattern), 4) * idf * 3;
    }

    // Reward multi-word phrase hits ("supply chain", "change data capture").
    if (q.length >= 6 && product.haystack.includes(q)) relevance += 15;

    if (relevance < MIN_RELEVANCE) continue;

    // Data-first strategy: on a near tie, the lower priority tier wins.
    hits.push({ product, score: relevance + (5 - Math.min(product.tierRank, 5)) * 0.5 });
  }

  return hits.sort((a, b) => b.score - a.score || a.product.tierRank - b.product.tierRank);
}

function formatProduct(product: Product): string {
  return [
    `## ${product.name}`,
    `**Tier:** ${product.tier}`,
    product.tagline ? `**Positioning:** ${product.tagline}` : "",
    "",
    product.body,
  ]
    .filter(Boolean)
    .join("\n");
}

function catalogListing(): string {
  const byTier = new Map<string, string[]>();
  for (const product of PRODUCTS) {
    byTier.set(product.tier, [...(byTier.get(product.tier) ?? []), product.name]);
  }
  return Array.from(byTier.entries())
    .map(([tier, names]) => `${tier}\n  ${names.join("\n  ")}`)
    .join("\n\n");
}

const server = new McpServer({ name: "ibm-sales-intelligence", version: "0.1.0" });

server.registerTool(
  "lookup_ibm_product",
  {
    description: "Look up IBM Data & AI product capabilities relevant to a customer pain point.",
    inputSchema: { query: z.string().describe("Customer pain point or product name") },
  },
  async ({ query }) => {
    const hits = rank(query).slice(0, 3);

    if (hits.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No IBM Data & AI product matched "${query}".\n\nAvailable products:\n\n${catalogListing()}`,
          },
        ],
      };
    }

    const text = [
      `Top ${hits.length} IBM Data & AI ${hits.length === 1 ? "match" : "matches"} for "${query}":`,
      "",
      hits.map(({ product }) => formatProduct(product)).join("\n\n---\n\n"),
    ].join("\n");

    return { content: [{ type: "text", text }] };
  },
);

server.registerTool(
  "list_briefings",
  {
    description:
      "List saved pre-call briefings (metadata only, never the briefing text). Optionally filter by company.",
    inputSchema: {
      company: z.string().optional().describe("Case-insensitive substring of the company name"),
      limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 20)"),
    },
  },
  async ({ company, limit }) => {
    try {
      // Select explicit columns — `briefings.text` (and the prospect/architecture
      // blobs) must never leave this tool.
      const query = db
        .select({
          id: briefings.id,
          company: briefings.company,
          contactName: briefings.contactName,
          contactTitle: briefings.contactTitle,
          industry: briefings.industry,
          callType: briefings.callType,
          createdAt: briefings.createdAt,
        })
        .from(briefings);

      const filter = company?.trim();
      const rows = await (filter ? query.where(ilike(briefings.company, `%${filter}%`)) : query)
        .orderBy(desc(briefings.createdAt))
        .limit(limit ?? 20);

      if (rows.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: filter ? `No briefings found for company "${filter}".` : "No briefings saved yet.",
            },
          ],
        };
      }

      const text = [
        `${rows.length} briefing${rows.length === 1 ? "" : "s"}${filter ? ` matching "${filter}"` : ""}:`,
        "",
        JSON.stringify(
          rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
          null,
          2,
        ),
      ].join("\n");

      return { content: [{ type: "text", text }] };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to list briefings: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
);

await server.connect(new StdioServerTransport());
