import { Router, type IRouter } from "express";
import { generateAnthropicText } from "../lib/anthropic-client";
import { fetchSiteText } from "../lib/scrape";
import { perplexitySearch } from "../lib/perplexity-client";
import { db } from "../lib/db";
import { prospectResults } from "../lib/schema";
import { IBM_PRODUCTS } from "../data/ibm-products";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// IBM product strategy — injected into every section so recommendations stay
// tight, data-first, and anchored to IBM's core Data & AI focus products.
// Answers "what should IBM LEAD with to win this deal?", not "what could we sell?"
// ---------------------------------------------------------------------------
const PRODUCT_STRATEGY = `IBM PRODUCT STRATEGY (follow strictly):
Lead with IBM's core Data & AI focus products, prioritized in this DATA-FIRST order:
1) Data foundation — watsonx.data, watsonx.data integration, Db2, Netezza, DataStage, Data Replication
2) Governance & trust — IBM Guardium, watsonx.governance
3) AI & productivity — watsonx.ai, watsonx Orchestrate, watsonx Code Assistant
4) Analytics & automation — Cognos Analytics, Planning Analytics, SPSS, Decision Optimization, FileNet
Recommend a MAXIMUM of 4 products across the whole brief. Choose only the most relevant for this account's business problem, industry, and call type. Be decisive: name ONE product per need — never list alternatives or "options". Every AI use case must be anchored in data readiness (data + governance precede AI). For each product, make explicit: WHY this specific product (not an alternative), the exact business pain it removes for THIS account, and a measurable business outcome. Write like a top IBM seller — lead with hybrid-cloud, governance, integration, and data-gravity differentiation vs Azure/OpenAI, AWS, and open-source. No generic AI messaging. Do not recommend legacy or non-core IBM products unless clearly the best fit.

PRODUCT CAPABILITY REFERENCE (ground all product claims in this — do not invent capabilities beyond it; the 4-product maximum above still applies):
${IBM_PRODUCTS}`;


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

FORMATTING — the structure must be identical in the web UI and the exported PDF; clarity comes from structure, not styling. EVERY section is bullet points ONLY — NO paragraphs. Each bullet is <= 20 words and starts with a **bolded key phrase**. Max 5 bullets per section; use short sub-bullets, not sentences. Keep Solution Mapping as a clean, minimal Markdown table. Every section must be readable in under 10 seconds. Executive, consultative tone; no fluff; no lead-in (no "Here's..." or "The final answer is"). Write in a single confident pass: no hedging ("could/may/might"), no repetition, no self-revision, exactly one final version.

${PRODUCT_STRATEGY}

Produce these sections in this order:

## Solution Mapping
A decision tool. Markdown table with columns: Line of Business | IBM Product | Use Case | Business Impact. Exactly 4 rows, ORDERED DATA-FIRST BY PRIORITY: row 1 = the data-foundation play (watsonx.data / Db2 / DataStage), row 2 = governance (IBM Guardium / watsonx.governance), row 3 = integration or the next data play, row 4 = one AI or analytics product the data foundation unlocks. Use ONLY focus products from the strategy above. Keep every cell under 6 words. Use Case must be specific to this account (never generic); Business Impact is a one-phrase measurable outcome. This table is the ONLY place to map products to lines of business — do not restate it as prose.

## Contacts
List names, titles, emails, or phone numbers ONLY if they appear in the website content above. If none are present, OMIT this section entirely — do not output the heading, an empty table, or any placeholder text.

Do NOT include a company overview or a general product-recommendations section — those appear earlier in the brief. Avoid repeating anything already covered by Company Background or Product Recommendations.

OUTPUT RULES (critical): Produce each section above exactly once, in the given order, then end. Do not repeat any section, do not invent extra sections (no "Key Messages", "Next Steps", or duplicate tables), and do not add notes, commentary, questions, apologies, or any text about revising or following instructions. Return only the section content.`;
}

function salesPlayPrompt(company: string, url: string, scraped: string, ctx: string): string {
  return `You are an IBM Data & AI seller building an account sales play.
You know how IBM wins on data governance, data gravity, hybrid/on-prem, and total cost.
Be specific to this account, not generic.
Output clean Markdown only, starting directly with the first "##" heading. No preamble.

Company: ${company}
Website: ${url}
${scraped ? `Website content:\n"""\n${scraped}\n"""` : ""}${ctx}

FORMATTING — the structure must be identical in the web UI and the exported PDF; clarity comes from structure, not styling. EVERY section is bullet points ONLY — NO paragraphs. Each bullet is <= 20 words and starts with a **bolded key phrase**. Max 5 bullets per section; use short sub-bullets, not sentences. Keep Solution Mapping as a clean, minimal Markdown table. Every section must be readable in under 10 seconds. Executive, consultative tone; no fluff; no lead-in (no "Here's..." or "The final answer is"). Write in a single confident pass: no hedging ("could/may/might"), no repetition, no self-revision, exactly one final version.

${PRODUCT_STRATEGY}

Produce these sections in this order:

## Best-Fit Use Cases
2–3 use cases tied to THIS company's actual business, each anchored in data readiness. For each: the single focus IBM product that delivers it (from the strategy above), the specific business pain it removes, and a measurable outcome.

## 6-Step Sales Play
Six numbered steps from entry through expansion (entry wedge, discovery, technical proof/demo, initial land, value realization, expansion). Under each numbered step, four short labeled lines: **Title:** a 2-4 word step name, **Do:** the action, **Say:** one line to say to the buyer, **Outcome:** the expected result. Lead with at least one data-foundation focus product in the early steps (entry/discovery/proof), and build the expansion arc data → governance → AI/analytics. Keep every line short — this renders as a horizontal flow. Every step specific to this account, never generic.

## Competitive Wedge
Exactly 3 bullets — one each for Microsoft Azure (OpenAI), AWS (Bedrock/SageMaker), and open-source/self-hosted. For each: name their genuine strength briefly, then IBM's decisive counter, then a line the seller can say. Format: **<Competitor>:** their strength, then IBM's edge on governance / data gravity / hybrid / total cost — **Say:** "<one sharp line>". No paragraphs.

## Why Act Now
2–3 bullets. Urgency drivers specific to THIS account — tie each to a real risk, deadline, regulatory pressure, market move, or cost of inaction. Each bullet <= 18 words and starts with a **bolded driver**. No generic urgency; give the seller a reason to push timing this quarter.

## Sales Card
5 lines, each a labeled one-liner: **Target buyer:**, **Primary pain:**, **Lead product:**, **Proof point:**, **Say this:** (one opening line the seller can use almost verbatim).

## Elevator Pitch
Exactly 2 sentences. Lead with the business value and outcome for this account, not a product description. Natural to say aloud in a real conversation — not a slogan.

## What To Do Next
Exactly 3 bullets, action-first — the seller's immediate next moves after this brief. Cover, one per bullet: **First move:** the single first action to take, **Who to engage:** the persona/role to reach and how, **Lead with:** the IBM product and angle to open on. Each <= 16 words, imperative voice (start with a verb). Specific to this account — no generic advice.

OUTPUT RULES (critical): Produce all seven sections above exactly once, in the given order, then end. Why Act Now and What To Do Next are mandatory — never omit them ("What To Do Next" is a required section, not a forbidden "Next Steps" list). Do not repeat any section, do not invent extra sections (no "Key Messages" or duplicate tables), and do not add notes, commentary, questions, apologies, or any text about revising or following instructions. Return only the section content.`;
}

// ---------------------------------------------------------------------------
// Route — same path and response shape the frontend already expects.
// ---------------------------------------------------------------------------
router.post("/generate", async (req, res) => {
  const { companyName, websiteUrl, context } = req.body as {
    companyName: string;
    websiteUrl?: string;
    context?: string;
  };

  const site = (websiteUrl || "").trim();

  if (!companyName) {
    res.status(400).json({ error: "companyName is required" });
    return;
  }

  const ctx = context?.trim() ? `\nSeller context: ${context.trim()}.` : "";

  try {
    req.log.info({ companyName }, "Prospect generation starting");

    // Run site scrape + Perplexity research in parallel to keep latency down.
    const [scraped, perplexitySummary] = await Promise.all([
      site ? fetchSiteText(site) : Promise.resolve(""),
      perplexitySearch(
        `You are a senior enterprise sales intelligence analyst. Your job is to give an IBM seller the richest possible factual briefing on an account before a call. Write in dense, specific prose — no bullet templates, no word limits per section. Include every relevant number, name, date, product name, and deal you can find. The seller will use this to sound like they've done weeks of research in 30 seconds.`,
        `Give me everything I need to know about ${companyName} before an IBM Data & AI sales call.

Cover all of the following in as much depth as the sources allow:
1. What does the company actually do, who are their customers, what markets do they serve, and what is their revenue / scale?
2. What is their current competitive position — who are they competing against and how are they differentiated?
3. What is their known technology stack — cloud providers, data platforms, analytics tools, ERP, and any AI/ML investments or vendor relationships (especially Microsoft, AWS, Snowflake, Databricks, Google, SAP, Palantir, or open-source)?
4. What are the most important recent developments in the last 12–18 months — earnings surprises, CEO/CTO changes, major acquisitions or divestitures, layoffs, regulatory actions, or strategic pivots?
5. What specific business pressures, cost or compliance challenges, or transformation initiatives create an opening for IBM's Data & AI portfolio right now?

Be as specific as possible. Include dollar figures, percentages, executive names, product names, and dates. Do not summarise — give the full picture.`,
        1500,
      ),
    ]);

    // Merge Perplexity grounded research into the context injected into prompts.
    const enrichedCtx = [
      ctx,
      perplexitySummary ? `\n\nLive web research (verified facts — use as primary source):\n${perplexitySummary}` : "",
    ].join("");

    // Two sections in parallel — Claude Sonnet for reliable structured output.
    const [step1, step2] = await Promise.all([
      generateAnthropicText(researchPrompt(companyName, site, scraped, enrichedCtx), {
        model: "claude-sonnet-4-5",
        maxTokens: 1200,
        temperature: 0.3,
      }),
      generateAnthropicText(salesPlayPrompt(companyName, site, scraped, enrichedCtx), {
        model: "claude-sonnet-4-5",
        maxTokens: 2000,
        temperature: 0.3,
      }),
    ]);

    req.log.info(
      { companyName, usedWebsiteContent: Boolean(scraped) },
      "Prospect generation complete"
    );

    // Persist to SQLite (non-fatal)
    let savedId: number | undefined;
    try {
      const saved = db.insert(prospectResults).values({
        companyName,
        websiteUrl: site,
        step1,
        step2,
        createdAt: new Date(),
      }).returning().get();
      savedId = saved.id;
      req.log.info({ companyName, id: savedId }, "Prospect result saved to DB");
    } catch (dbErr) {
      req.log.warn({ dbErr }, "Failed to save prospect result to DB (non-fatal)");
    }

    res.json({
      id: savedId,
      companyName,
      websiteUrl: site,
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
