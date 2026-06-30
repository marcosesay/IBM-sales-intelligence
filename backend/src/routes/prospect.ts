import { Router, type IRouter } from "express";
import { generateText } from "../lib/watsonx-client";
import { fetchSiteText } from "../lib/scrape";

const router: IRouter = Router();

// Use the larger model for quality; the two sections run in parallel so
// latency stays in the 15–30s range the UI already advertises. Drop to
// "meta-llama/llama-3-1-8b-instruct" if you want it faster at lower quality.
const MODEL = "meta-llama/llama-3-3-70b-instruct";


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

FORMATTING — the structure must be identical in the web UI and the exported PDF; clarity comes from structure, not styling. EVERY section is bullet points ONLY — NO paragraphs. Each bullet is <= 20 words and starts with a **bolded key phrase**. Max 5 bullets per section; use short sub-bullets, not sentences. Keep Solution Mapping as a clean, minimal Markdown table. Every section must be readable in under 10 seconds. Executive, consultative tone; no fluff; no lead-in (no "Here's..." or "The final answer is").

Produce these sections in this order:

## Solution Mapping
A Markdown table with columns: Line of Business | IBM Product | Use Case. 4–6 rows. This table is the ONLY place to map products to lines of business — do not restate it as prose.

## Contract Vehicle Alignment & Differentiators
How IBM can be procured for this account and 2–3 differentiators that matter here.

## Contacts
Names, titles, emails, or phone numbers ONLY if present in the website content above. Otherwise: "Not found on site."

Do NOT include a company overview or a general product-recommendations section — those appear earlier in the brief. Avoid repeating anything already covered by Company Background or Product Recommendations.`;
}

function salesPlayPrompt(company: string, url: string, scraped: string, ctx: string): string {
  return `You are an IBM Data & AI seller building an account sales play.
You know how IBM wins on data governance, data gravity, hybrid/on-prem, and total cost.
Be specific to this account, not generic.
Output clean Markdown only, starting directly with the first "##" heading. No preamble.

Company: ${company}
Website: ${url}
${scraped ? `Website content:\n"""\n${scraped}\n"""` : ""}${ctx}

FORMATTING — the structure must be identical in the web UI and the exported PDF; clarity comes from structure, not styling. EVERY section is bullet points ONLY — NO paragraphs. Each bullet is <= 20 words and starts with a **bolded key phrase**. Max 5 bullets per section; use short sub-bullets, not sentences. Keep Solution Mapping as a clean, minimal Markdown table. Every section must be readable in under 10 seconds. Executive, consultative tone; no fluff; no lead-in (no "Here's..." or "The final answer is").

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
3–4 sentences. Reference the specific IBM products recommended for this account and the concrete business outcome they drive. Make it sound natural spoken aloud, not a slogan.`;
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

    const scraped = site ? await fetchSiteText(site) : "";

    // Two sections in parallel — no chaining, no streaming.
    const [step1, step2] = await Promise.all([
      generateText(researchPrompt(companyName, site, scraped, ctx), {
        model: MODEL,
        maxTokens: 1100,
        temperature: 0.3,
      }),
      generateText(salesPlayPrompt(companyName, site, scraped, ctx), {
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
