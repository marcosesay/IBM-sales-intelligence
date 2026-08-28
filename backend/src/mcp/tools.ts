// tools.ts — every MCP tool this server exposes, registered onto a caller's
// McpServer. stdio.ts is the stdio entry point; keeping the tools here lets a
// second transport mount the same set.

import { McpServer, type ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { and, count, desc, eq, gt, ilike, max, ne, sql } from "drizzle-orm";
import { IBM_PRODUCTS } from "../data/ibm-products";
import { db } from "../lib/db";
import { perplexitySearchOrThrow } from "../lib/perplexity-client";
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

// Every tool reported a throw the same way: isError plus a per-tool prefix on
// the message. That try/catch was copied into each handler; it lives here now,
// so a handler can let a db call or a fetch throw and say nothing about it.
// ToolCallback<Args> is the SDK's own handler type, so each tool's args stay
// inferred from its inputSchema exactly as they were under registerTool.
function safeTool<Args extends z.ZodRawShape>(
  server: McpServer,
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




// ── Generation lifecycle ─────────────────────────────────────────────────────
// start_briefing writes a row at status "running" and hands its id to the
// generation route, which flips it to "done" or "failed". Nothing rescues a row
// whose run died between those two writes — the backend restarted, the socket
// dropped, the process was killed — so a row still "running" past this cutoff is
// read as failed everywhere rather than reported as in progress forever.
const RUNNING_TIMEOUT_MS = 5 * 60_000;

function runningCutoff(): Date {
  return new Date(Date.now() - RUNNING_TIMEOUT_MS);
}

function isStale(row: { status: string; createdAt: Date }): boolean {
  return row.status === "running" && row.createdAt.getTime() < runningCutoff().getTime();
}

// The status a caller should see, with a timed-out run counted as failed.
function effectiveStatus(row: { status: string; createdAt: Date }): string {
  return isStale(row) ? "failed" : row.status;
}

function elapsedSince(started: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - started.getTime()) / 1000));
  return seconds < 90 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
}

// How many rows list_briefings / search_accounts are hiding, under the same
// company filter they were given. Counted in SQL rather than by fetching the
// rows: the two tools only need the tally for their footer.
async function incompleteTally(filter?: string): Promise<{ running: number; failed: number }> {
  const incomplete = ne(briefings.status, "done");
  const where = filter ? and(incomplete, ilike(briefings.company, `%${filter}%`)) : incomplete;

  const [row] = await db
    .select({
      running: sql<number>`cast(count(*) filter (
        where ${briefings.status} = 'running' and ${briefings.createdAt} > ${runningCutoff()}
      ) as int)`,
      total: sql<number>`cast(count(*) as int)`,
    })
    .from(briefings)
    .where(where);

  const running = row?.running ?? 0;
  return { running, failed: (row?.total ?? 0) - running };
}

function incompleteFooter({ running, failed }: { running: number; failed: number }): string {
  if (running === 0 && failed === 0) return "";
  return `\n\nHidden: ${running} running, ${failed} failed. Pass include_incomplete: true to include them.`;
}

const INCLUDE_INCOMPLETE_DESCRIPTION =
  "Include briefings that are still generating or that failed (excluded by default)";

function backendUrl(): string {
  return (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");
}

type BriefingFields = {
  company: string;
  contactName: string;
  contactTitle: string;
  industry: string;
  callType: string;
};

// Drive the backend's own /api/briefing/generate rather than calling Anthropic
// here, so an MCP-started briefing goes through exactly the prompt, fallback and
// persistence path the UI uses. The route writes the finished text to the row we
// pre-created, which is why the id can be returned before any of this runs.
async function generateInBackground(id: number, fields: BriefingFields): Promise<void> {
  const response = await fetch(`${backendUrl()}/api/briefing/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...fields, briefingId: id }),
  });

  if (!response.ok) {
    throw new Error(`POST /api/briefing/generate returned ${response.status} ${response.statusText}`);
  }

  // Read the SSE stream to the end and discard it — the briefing text lands in
  // the row, not here, but the route only gets to that write once its stream is
  // done, and an unread body would leave this request hanging open.
  const reader = response.body?.getReader();
  if (!reader) return;
  for (;;) {
    const { done } = await reader.read();
    if (done) return;
  }
}

// Only ever narrows a row that is still "running": if the route already recorded
// an outcome, that outcome is the truthful one.
async function markFailed(id: number, message: string): Promise<void> {
  await db
    .update(briefings)
    .set({ status: "failed", error: message })
    .where(and(eq(briefings.id, id), eq(briefings.status, "running")));
}


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


// Mirrors the analyst persona and the five research axes the prospect route
// sends to Perplexity (routes/prospect.ts), condensed for a tool caller that
// wants the research on its own rather than folded into a generated brief.
const RESEARCH_SYSTEM =
  "You are a senior enterprise sales intelligence analyst. Your job is to give an IBM seller the richest possible factual briefing on an account before a call. Write in dense, specific prose — no bullet templates. Include every relevant number, name, date, product name, and deal you can find.";

function researchQuestion(company: string, focus: string): string {
  return `Give me everything I need to know about ${company} before an IBM Data & AI sales call.

Cover, in as much depth as the sources allow:
1. What the company does, who its customers are, the markets it serves, and its revenue / scale.
2. Its competitive position — who it competes against and how it is differentiated.
3. Its known technology stack — cloud providers, data platforms, analytics tools, ERP, and any AI/ML investments or vendor relationships (especially Microsoft, AWS, Snowflake, Databricks, Google, SAP, Palantir, or open-source).
4. The most important developments of the last 12–18 months — earnings surprises, CEO/CTO changes, acquisitions or divestitures, layoffs, regulatory actions, strategic pivots.
5. The business pressures, cost or compliance challenges, or transformation initiatives that create an opening for IBM's Data & AI portfolio right now.
${focus ? `\nWeight the answer toward this in particular: ${focus}. Still cover the ground above, but lead with what bears on it.\n` : ""}
Be specific: dollar figures, percentages, executive names, product names, dates. Do not summarise — give the full picture.`;
}

export function registerTools(server: McpServer): void {
  safeTool(
    server,
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
    server,
    "list_briefings",
    {
      failurePrefix: "Failed to list briefings",
      description:
        "List saved pre-call briefings (metadata only, never the briefing text). Optionally filter by company.",
      inputSchema: {
        company: z.string().optional().describe("Case-insensitive substring of the company name"),
        limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 20)"),
        include_incomplete: z.boolean().optional().describe(INCLUDE_INCOMPLETE_DESCRIPTION),
      },
    },
    async ({ company, limit, include_incomplete: includeIncomplete }) => {
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
          status: briefings.status,
          error: briefings.error,
          createdAt: briefings.createdAt,
        })
        .from(briefings);

      const filter = company?.trim();
      const conditions = [
        filter ? ilike(briefings.company, `%${filter}%`) : undefined,
        // A half-written or failed briefing is not a briefing as far as a caller
        // asking "what do we have on this account" is concerned.
        includeIncomplete ? undefined : eq(briefings.status, "done"),
      ].filter((c) => c !== undefined);

      const rows = await (conditions.length ? query.where(and(...conditions)) : query)
        .orderBy(desc(briefings.createdAt))
        .limit(limit ?? 20);

      const footer = includeIncomplete ? "" : incompleteFooter(await incompleteTally(filter));

      if (rows.length === 0) {
        const nothing = filter
          ? `No ${includeIncomplete ? "" : "completed "}briefings found for company "${filter}".`
          : `No ${includeIncomplete ? "" : "completed "}briefings saved yet.`;
        return { content: [{ type: "text", text: `${nothing}${footer}` }] };
      }

      const text = [
        `${rows.length} briefing${rows.length === 1 ? "" : "s"}${filter ? ` matching "${filter}"` : ""}:`,
        "",
        JSON.stringify(
          rows.map(({ error, ...row }) => ({
            ...row,
            status: effectiveStatus(row),
            // Only carried when there is one — every completed row would
            // otherwise report a null field.
            ...(error ? { error } : {}),
            createdAt: row.createdAt.toISOString(),
          })),
          null,
          2,
        ),
      ].join("\n");

      return { content: [{ type: "text", text: `${text}${footer}` }] };
    },
  );

  safeTool(
    server,
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
        include_incomplete: z.boolean().optional().describe(INCLUDE_INCOMPLETE_DESCRIPTION),
      },
    },
    async ({ query, limit, include_incomplete: includeIncomplete }) => {
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
      // Counts and "latest briefing" have to mean completed work, or an account
      // whose only briefing is still generating reads as ready to open.
      const conditions = [
        filter ? ilike(briefings.company, `%${filter}%`) : undefined,
        includeIncomplete ? undefined : eq(briefings.status, "done"),
      ].filter((c) => c !== undefined);

      const rows = await (conditions.length ? select.where(and(...conditions)) : select)
        .groupBy(briefings.company)
        .orderBy(desc(max(briefings.createdAt)))
        .limit(limit ?? 20);

      const footer = includeIncomplete ? "" : incompleteFooter(await incompleteTally(filter));

      if (rows.length === 0) {
        const nothing = filter
          ? `No accounts matched "${filter}".`
          : `No ${includeIncomplete ? "" : "completed "}briefings saved yet.`;
        return { content: [{ type: "text", text: `${nothing}${footer}` }] };
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

      return { content: [{ type: "text", text: `${text}${footer}` }] };
    },
  );

  safeTool(
    server,
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

  safeTool(
    server,
    "start_briefing",
    {
      failurePrefix: "Failed to start briefing",
      description:
        "Start generating a new pre-call briefing and return its id immediately, without waiting for it to finish. Poll get_briefing_status with that id, then read the finished brief with get_briefing.",
      inputSchema: {
        company: z.string().min(1).describe('Company the briefing is for, e.g. "HSBC"'),
        contactName: z.string().optional().describe("Name of the person being met"),
        contactTitle: z.string().optional().describe("Their job title"),
        industry: z.string().optional().describe('Industry of the account, e.g. "Banking"'),
        callType: z
          .string()
          .optional()
          .describe('Discovery | Competitive | Renewal & Upsell | EBC (default "Discovery")'),
      },
    },
    async ({ company, contactName, contactTitle, industry, callType }) => {
      const name = company.trim();
      if (!name) {
        return { isError: true, content: [{ type: "text", text: "company must not be empty." }] };
      }

      const fields: BriefingFields = {
        company: name,
        contactName: contactName?.trim() ?? "",
        contactTitle: contactTitle?.trim() ?? "",
        industry: industry?.trim() ?? "",
        callType: callType?.trim() || "Discovery",
      };

      // The generation route only writes its row once the model stream has
      // finished, so the row is opened here and its id handed over — that is
      // what makes returning before generation completes possible at all.
      const [row] = await db
        .insert(briefings)
        .values({ ...fields, text: "", status: "running", createdAt: new Date() })
        .returning({ id: briefings.id });

      // Deliberately not awaited — the point of this tool is to return now. The
      // route owns the terminal write to this row, so this catch covers only
      // never reaching it (backend down, request rejected, socket dropped); a
      // failure with nothing left to record it is caught by the running timeout.
      void generateInBackground(row.id, fields).catch((err: unknown) => {
        void markFailed(row.id, err instanceof Error ? err.message : String(err)).catch(() => {});
      });

      const text = [
        `Briefing ${row.id} started for ${name} (${fields.callType}).`,
        "Status: running — generation takes roughly a minute.",
        `Check it with get_briefing_status({ id: ${row.id} }), then read it with get_briefing({ id: ${row.id} }).`,
      ].join("\n");

      return { content: [{ type: "text", text }] };
    },
  );

  safeTool(
    server,
    "get_briefing_status",
    {
      failurePrefix: "Failed to check briefing status",
      description:
        "Check whether a briefing started with start_briefing has finished. Returns running, done, or failed — a run that has made no progress for over five minutes is reported as failed.",
      inputSchema: {
        id: z.number().int().describe("Briefing id, as returned by start_briefing"),
      },
    },
    async ({ id }) => {
      const [row] = await db
        .select({
          id: briefings.id,
          company: briefings.company,
          callType: briefings.callType,
          status: briefings.status,
          error: briefings.error,
          createdAt: briefings.createdAt,
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

      const header = `Briefing ${row.id} — ${row.company} (${row.callType})`;
      const status = effectiveStatus(row);

      if (status === "done") {
        return {
          content: [
            {
              type: "text",
              text: `${header}\nStatus: done\nRead it with get_briefing({ id: ${row.id} }).`,
            },
          ],
        };
      }

      if (status === "running") {
        return {
          content: [
            {
              type: "text",
              text: `${header}\nStatus: running for ${elapsedSince(row.createdAt)}. Check again shortly.`,
            },
          ],
        };
      }

      // A row that timed out has no recorded error — whatever was generating it
      // never came back to write one — so say that rather than inventing a cause.
      const reason = isStale(row)
        ? `Generation has been running for ${elapsedSince(row.createdAt)} with no result, so it is being treated as failed.`
        : row.error?.trim() || "Generation failed; no error was recorded.";

      return {
        isError: true,
        content: [{ type: "text", text: `${header}\nStatus: failed\n${reason}` }],
      };
    },
  );

  safeTool(
    server,
    "research_account",
    {
      failurePrefix: "Perplexity research failed",
      description:
        "Run live, citation-backed web research on a company via Perplexity — the same grounded search that backs the prospect route. Use for an account with no saved briefing, or to refresh a stale one.",
      inputSchema: {
        company: z.string().min(1).describe('Company to research, e.g. "HSBC"'),
        focus: z
          .string()
          .optional()
          .describe('Narrow the research, e.g. "their Snowflake migration" or "recent regulatory actions"'),
      },
    },
    async ({ company, focus }) => {
      const name = company.trim();
      if (!name) {
        return { isError: true, content: [{ type: "text", text: "company must not be empty." }] };
      }

      const narrowing = focus?.trim() ?? "";

      // perplexitySearchOrThrow, not perplexitySearch: the routes swallow failures
      // into "" because research is optional enrichment there, but a caller that
      // asked for research and got silence would read it as "no information
      // exists" rather than "the call failed". safeTool turns the throw into
      // isError; the 60s timeout is the client's own AbortSignal.
      const summary = await perplexitySearchOrThrow(
        RESEARCH_SYSTEM,
        researchQuestion(name, narrowing),
        1500,
      );

      // A 200 with no content is a failed research call, not an empty answer.
      if (!summary) {
        return {
          isError: true,
          content: [{ type: "text", text: `Perplexity returned an empty response for "${name}".` }],
        };
      }

      const header = [`Live web research — ${name}`, narrowing ? `Focus: ${narrowing}` : ""]
        .filter(Boolean)
        .join("\n");

      return { content: [{ type: "text", text: `${header}\n\n${summary}` }] };
    },
  );
}
