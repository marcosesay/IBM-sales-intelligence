import { Router, type IRouter } from "express";
import { generateText } from "../lib/watsonx-client";

const router: IRouter = Router();

// Use the larger model for quality; the two sections run in parallel so
// latency stays in the 15–30s range the UI already advertises. Drop to
// "meta-llama/llama-3-1-8b-instruct" if you want it faster at lower quality.
const MODEL = "meta-llama/llama-3-3-70b-instruct";

// ---------------------------------------------------------------------------
// Scrape the prospect's OWN site (homepage + likely about/contact pages) so
// the overview and contacts are grounded in real content. No external
// services — only the prospect's domain is fetched. Degrades to "" on failure.
// ---------------------------------------------------------------------------
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000), // a slow page can't stall the brief
    });
    if (!res.ok) return "";
    return htmlToText(await res.text());
  } catch {
    return "";
  }
}

async function fetchSiteText(url: string, maxChars = 9000): Promise<string> {
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  let origin: string;
  try {
    origin = new URL(normalized).origin;
  } catch {
    return "";
  }

  const homepageHtml = await fetch(normalized, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  })
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "");

  const sections: string[] = [];
  if (homepageHtml) sections.push(`[Homepage]\n${htmlToText(homepageHtml)}`);

  // Discover same-domain about/contact links from the homepage.
  const candidates = new Set<string>();
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(homepageHtml)) !== null) {
    const href = m[1];
    const label = htmlToText(m[2]).toLowerCase();
    if (!/about|contact|company|leadership|team|who-we-are/i.test(href + " " + label)) continue;
    try {
      const abs = new URL(href, origin).href;
      if (abs.startsWith(origin)) candidates.add(abs);
    } catch {
      /* skip malformed href */
    }
  }
  if (candidates.size === 0) {
    for (const path of ["/about", "/about-us", "/contact", "/company"]) {
      candidates.add(origin + path);
    }
  }

  const extra = await Promise.all(
    Array.from(candidates)
      .slice(0, 3)
      .map(async (u) => {
        const t = await fetchPageText(u);
        return t ? `[${u}]\n${t}` : "";
      })
  );
  for (const e of extra) if (e) sections.push(e);

  return sections.join("\n\n").slice(0, maxChars).trim();
}

// ---------------------------------------------------------------------------
// Prompts — single-string (the helper has no system param). Persona folded in.
// Each returns clean Markdown that the frontend splits on "##" headings.
// ---------------------------------------------------------------------------
function researchPrompt(company: string, url: string, scraped: string, ctx: string): string {
  return `You are an IBM Data & AI technical seller writing a pre-call research brief.
You know IBM's portfolio deeply: watsonx.ai, watsonx.data, watsonx.governance, watsonx Orchestrate,
Db2 (including Db2 AI Advanced Edition), DataStage, Cloud Pak for Data, and Guardium.
Be concrete and specific to the account. NEVER invent contact names, emails, or phone numbers —
list a contact only if it appears in the website content below; otherwise write "Not found on site."
Output clean Markdown only, starting directly with the first "##" heading. No preamble.

Company: ${company}
Website: ${url}
${
  scraped
    ? `Website content:\n"""\n${scraped}\n"""`
    : `No website content was retrieved. Base the overview on what you reliably know and note uncertainty. Mark Contacts as "Not found on site."`
}${ctx}

Produce these sections in this order:

## Company Overview
2–4 sentences: mission, the market segments they serve, and who their customers are.

## IBM Product Recommendations by Line of Business
For each major line of business, the best-fit IBM product(s) and one sentence on why.

## Solution Mapping
A Markdown table with columns: Line of Business | IBM Product | Use Case. 4–6 rows.

## Contract Vehicle Alignment & Differentiators
How IBM can be procured for this account and 2–3 differentiators that matter here.

## Contacts
Names, titles, emails, or phone numbers ONLY if present in the website content above. Otherwise: "Not found on site."`;
}

function salesPlayPrompt(company: string, url: string, scraped: string, ctx: string): string {
  return `You are an IBM Data & AI seller building an account sales play.
You know how IBM wins on data governance, data gravity, hybrid/on-prem, and total cost.
Be specific to this account, not generic.
Output clean Markdown only, starting directly with the first "##" heading. No preamble.

Company: ${company}
Website: ${url}
${scraped ? `Website content:\n"""\n${scraped}\n"""` : ""}${ctx}

Produce these sections in this order:

## Best-Fit Use Cases
2–3 use cases tied to THIS company's actual business. For each: the IBM product that delivers it and the business outcome.

## 6-Step Sales Play
A numbered list from entry point through expansion: 1) entry wedge, 2) discovery, 3) technical proof/demo, 4) initial land, 5) value realization, 6) expansion. Make every step specific to this account.

## Competitive Wedge
How IBM wins vs. each, 1–2 sentences each: Microsoft Azure (OpenAI), AWS (Bedrock/SageMaker), and open-source/self-hosted stacks. Emphasize governance, data gravity, hybrid/on-prem, total cost.

## Sales Card
4–5 lines: target buyer, primary pain, lead product, proof point.

## Elevator Pitch
One sentence, under 40 words.`;
}

// ---------------------------------------------------------------------------
// Route — same path and response shape the frontend already expects.
// ---------------------------------------------------------------------------
router.post("/generate", async (req, res) => {
  const { companyName, websiteUrl, context } = req.body as {
    companyName: string;
    websiteUrl: string;
    context?: string;
  };

  if (!companyName || !websiteUrl) {
    res.status(400).json({ error: "companyName and websiteUrl are required" });
    return;
  }

  const ctx = context?.trim() ? `\nSeller context: ${context.trim()}.` : "";

  try {
    req.log.info({ companyName }, "Prospect generation starting");

    const scraped = await fetchSiteText(websiteUrl);

    // Two sections in parallel — no chaining, no streaming.
    const [step1, step2] = await Promise.all([
      generateText(researchPrompt(companyName, websiteUrl, scraped, ctx), {
        model: MODEL,
        maxTokens: 1100,
        temperature: 0.3,
      }),
      generateText(salesPlayPrompt(companyName, websiteUrl, scraped, ctx), {
        model: MODEL,
        maxTokens: 1000,
        temperature: 0.3,
      }),
    ]);

    req.log.info(
      { companyName, usedWebsiteContent: Boolean(scraped) },
      "Prospect generation complete"
    );

    res.json({
      companyName,
      websiteUrl,
      step1,
      step2,
      usedWebsiteContent: Boolean(scraped),
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    req.log.error({ err: err?.message, companyName }, "Prospect generation failed");
    res.status(500).json({
      error: "Generation failed.",
      detail: err?.message || String(err),
    });
  }
});

export default router;
