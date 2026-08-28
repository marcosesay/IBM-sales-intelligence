import "dotenv/config";
import { McpServer, type ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { count, desc, eq, ilike, max, sql } from "drizzle-orm";
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

// Every tool reported a throw the same way: isError plus a per-tool prefix on
// the message. That try/catch was copied into each handler; it lives here now,
// so a handler can let a db call or a fetch throw and say nothing about it.
// ToolCallback<Args> is the SDK's own handler type, so each tool's args stay
// inferred from its inputSchema exactly as they were under registerTool.
function safeTool<Args extends z.ZodRawShape>(
  name: string,
  {
    failurePrefix,
    ...config
  }: { description: string; inputSchema: Args; failurePrefix: string },
  handler: ToolCallback<Args>,
): void {
  const run = handler as (...args: unknown[]) => Promise<{ content: unknown[] }>;

  const guarded = async (...args: unknown[]) => {
    try {
      return await run(...args);
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `${failurePrefix}: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  };

  server.registerTool(name, config, guarded as unknown as ToolCallback<Args>);
}

safeTool(
  "lookup_ibm_product",
  {
    failurePrefix: "Failed to look up product",
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

safeTool(
  "list_briefings",
  {
    failurePrefix: "Failed to list briefings",
    description:
      "List saved pre-call briefings (metadata only, never the briefing text). Optionally filter by company.",
    inputSchema: {
      company: z.string().optional().describe("Case-insensitive substring of the company name"),
      limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 20)"),
    },
  },
  async ({ company, limit }) => {
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
  },
);

safeTool(
  "search_accounts",
  {
    failurePrefix: "Failed to search accounts",
    description:
      "Search saved briefings by company and return one row per account — briefing count, most recent briefing id, most recent date. Use this instead of list_briefings to see which accounts exist.",
    inputSchema: {
      query: z
        .string()
        .optional()
        .describe("Case-insensitive substring of the company name; omit to return every account"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max accounts to return (default 20)"),
    },
  },
  async ({ query, limit }) => {
    // One row per company — eleven HSBC briefings collapse to a single line.
    // array_agg picks the id of the newest row; max(id) would only agree with
    // it by accident of the serial sequence.
    const select = db
      .select({
        company: briefings.company,
        briefingCount: count(briefings.id),
        latestBriefingId: sql<number>`(array_agg(${briefings.id} order by ${briefings.createdAt} desc))[1]`,
        latestCreatedAt: max(briefings.createdAt),
      })
      .from(briefings);

    const filter = query?.trim();
    const rows = await (filter ? select.where(ilike(briefings.company, `%${filter}%`)) : select)
      .groupBy(briefings.company)
      .orderBy(desc(max(briefings.createdAt)))
      .limit(limit ?? 20);

    if (rows.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: filter ? `No accounts matched "${filter}".` : "No briefings saved yet.",
          },
        ],
      };
    }

    const total = rows.reduce((sum, row) => sum + row.briefingCount, 0);
    const text = [
      `${rows.length} account${rows.length === 1 ? "" : "s"}${
        filter ? ` matching "${filter}"` : ""
      } across ${total} briefing${total === 1 ? "" : "s"}:`,
      "",
      JSON.stringify(
        rows.map((row) => ({
          ...row,
          latestCreatedAt: row.latestCreatedAt?.toISOString() ?? null,
        })),
        null,
        2,
      ),
    ].join("\n");

    return { content: [{ type: "text", text }] };
  },
);

function parseHeading(line: string): { title: string; level: number } | null {
  const match = /^(#{2,6})\s+(.*\S)\s*$/.exec(line);
  return match ? { title: match[2]!, level: match[1]!.length } : null;
}

function normalizeHeading(text: string): string {
  return text.replace(/[*_`#]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function listHeadings(text: string): string[] {
  return text.split("\n").flatMap((line) => parseHeading(line)?.title ?? []);
}

// Callers ask for "Discovery Questions" but the generated heading may be
// "Who is <name>?", so match on a normalized substring. A section runs to the
// next heading of the same or a shallower level, keeping nested "###" content.
function extractSection(text: string, wanted: string): string | null {
  const lines = text.split("\n");
  const needle = normalizeHeading(wanted);
  if (!needle) return null;

  let start = -1;
  let level = 0;

  for (let i = 0; i < lines.length; i++) {
    const heading = parseHeading(lines[i]!);
    if (!heading) continue;

    if (start === -1) {
      if (normalizeHeading(heading.title).includes(needle)) {
        start = i;
        level = heading.level;
      }
      continue;
    }

    if (heading.level <= level) return lines.slice(start, i).join("\n").trim();
  }

  return start === -1 ? null : lines.slice(start).join("\n").trim();
}

safeTool(
  "get_briefing",
  {
    failurePrefix: "Failed to fetch briefing",
    description:
      "Fetch one saved pre-call briefing by id, including its text. Pass `section` to return only one markdown section, or `headings_only` to list the section headings without the body.",
    inputSchema: {
      id: z.number().int().describe("Briefing id, as returned by list_briefings"),
      section: z
        .string()
        .optional()
        .describe('Markdown heading to return on its own, e.g. "Discovery Questions"'),
      headings_only: z
        .boolean()
        .optional()
        .describe("Return only the list of section headings, not the briefing body. Overrides `section`."),
    },
  },
  async ({ id, section, headings_only: headingsOnly }) => {
    // industry and contact_title are never populated by the generator, so they
    // are left out rather than returned as empty strings.
    const [row] = await db
      .select({
        id: briefings.id,
        company: briefings.company,
        contactName: briefings.contactName,
        callType: briefings.callType,
        createdAt: briefings.createdAt,
        text: briefings.text,
      })
      .from(briefings)
      .where(eq(briefings.id, id))
      .limit(1);

    if (!row) {
      return {
        isError: true,
        content: [{ type: "text", text: `No briefing found with id ${id}.` }],
      };
    }

    // headings_only is a discovery call — it wins over `section`, which asks
    // for a body this caller has said it doesn't want.
    const wanted = headingsOnly ? "" : section?.trim();
    let body = row.text;

    if (headingsOnly) {
      const headings = listHeadings(row.text);
      body = headings.length
        ? `Sections:\n  ${headings.join("\n  ")}`
        : "This briefing has no markdown headings.";
    } else if (wanted) {
      const match = extractSection(row.text, wanted);
      if (!match) {
        const available = listHeadings(row.text);
        return {
          content: [
            {
              type: "text",
              text: `Briefing ${id} has no section matching "${wanted}".${
                available.length ? `\n\nSections in this briefing:\n  ${available.join("\n  ")}` : ""
              }`,
            },
          ],
        };
      }
      body = match;
    }

    const header = [
      `Briefing ${row.id} — ${row.company}`,
      row.contactName ? `Contact: ${row.contactName}` : "",
      `Call type: ${row.callType}`,
      `Created: ${row.createdAt.toISOString()}`,
      wanted ? `Section: ${wanted}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return { content: [{ type: "text", text: `${header}\n\n${body}` }] };
  },
);

await server.connect(new StdioServerTransport());
