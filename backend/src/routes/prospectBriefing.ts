// prospectBriefing.ts
// Drop-in replacement for the prospect-research route.
// Key changes vs. the old approach:
//   1. NO sequential chaining — both sections run in parallel (Promise.all).
//   2. NO JSON parsing — each call returns clean Markdown, rendered as-is.
//   3. Fixed-structure prompts with explicit max_tokens, so nothing truncates.
//   4. Optional homepage scrape so contacts/overview are real, not hallucinated.

import express from "express";

const WATSONX_URL = process.env.WATSONX_URL ?? "https://us-south.ml.cloud.ibm.com";
const PROJECT_ID = process.env.WATSONX_PROJECT_ID!;
const API_KEY = process.env.WATSONX_API_KEY!;
const MODEL_ID = "meta-llama/llama-3-3-70b-instruct";

// ----------------------------------------------------------------------------
// IAM token (cached). You likely already have this in your codebase — reuse it.
// ----------------------------------------------------------------------------
let cachedToken: { value: string; exp: number } | null = null;

async function getIamToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.exp - 60_000) return cachedToken.value;
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: API_KEY,
    }),
  });
  if (!res.ok) throw new Error(`IAM token failed: ${res.status}`);
  const json = await res.json();
  cachedToken = { value: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

// ----------------------------------------------------------------------------
// One clean watsonx chat call. Uses the /text/chat endpoint (better for
// instruct models than /text/generation). Match the ?version= string to
// whatever your existing working calls use if this date errors.
// ----------------------------------------------------------------------------
async function callWatsonx(system: string, user: string, maxTokens: number): Promise<string> {
  const token = await getIamToken();
  const res = await fetch(`${WATSONX_URL}/ml/v1/text/chat?version=2024-10-08`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify({
      model_id: MODEL_ID,
      project_id: PROJECT_ID,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`watsonx ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

// ----------------------------------------------------------------------------
// Best-effort homepage scrape so the model has real content to ground on.
// Truncated to ~6k chars (~1.5k tokens). Returns "" on any failure.
// ----------------------------------------------------------------------------
async function fetchSiteText(url: string, maxChars = 6000): Promise<string> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(normalized, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars);
  } catch {
    return "";
  }
}

// ----------------------------------------------------------------------------
// PROMPTS — fixed structure, Markdown output, no preamble.
// ----------------------------------------------------------------------------
const RESEARCH_SYSTEM = `You are an IBM Data & AI technical seller writing a pre-call research brief.
You know IBM's portfolio deeply: watsonx.ai, watsonx.data, watsonx.governance, watsonx Orchestrate,
Db2 (including Db2 AI Advanced Edition), DataStage, Cloud Pak for Data, Guardium, and IBM Consulting.
Be concrete and specific to the account. NEVER invent contact names, emails, or phone numbers —
list a contact only if it appears in the provided website content; otherwise write "Not found on site."
Output clean Markdown only. No preamble, no closing remarks.`;

function researchUser(name: string, url: string, scraped: string): string {
  return `Company: ${name}
Website: ${url || "(none provided)"}
${
  scraped
    ? `Website content:\n"""${scraped}"""`
    : `No website content was provided. Base the overview on what you reliably know and explicitly note uncertainty. Mark Contacts as "Not found on site."`
}

Produce a research brief with EXACTLY these Markdown sections and nothing else:

## Company Overview
2–4 sentences: mission, the market segments they serve, and who their customers are.

## IBM AI Product Recommendations by Line of Business
For each major line of business, name the best-fit IBM product(s) and one sentence on why it fits.

## Solution Mapping
A Markdown table with columns: Line of Business | IBM Product | Use Case. 4–6 rows.

## Contract Vehicle Alignment & Differentiators
How IBM can be procured for this account (e.g. IBM Passport Advantage, AWS/Azure Marketplace for IBM SaaS, government vehicles if relevant) plus 2–3 key differentiators for this specific account.

## Contacts
Names, titles, emails, or phone numbers ONLY if present in the website content above. If none, write "Not found on site."`;
}

const SALESPLAY_SYSTEM = `You are an IBM Data & AI seller building an account sales play.
You know IBM's portfolio (watsonx.ai/.data/.governance, Db2, DataStage, Cloud Pak for Data) and how
it wins on data governance, data gravity, hybrid/on-prem, and total cost. Be specific to the account,
not generic. Output clean Markdown only. No preamble, no closing remarks.`;

function salesPlayUser(name: string, url: string, scraped: string): string {
  return `Company: ${name}
Website: ${url || "(none provided)"}
${scraped ? `Website content:\n"""${scraped}"""` : ""}

Produce a sales play with EXACTLY these Markdown sections and nothing else:

## Best-Fit Use Cases
2–3 use cases tied to THIS company's actual business. For each: the IBM product that delivers it and the business outcome.

## 6-Step Sales Play
A numbered list from entry point through expansion. Suggested arc: 1) entry wedge, 2) discovery, 3) technical proof / demo, 4) initial land, 5) value realization, 6) expansion. Make every step specific to this account.

## Competitive Wedge
How IBM wins vs. each, 1–2 sentences each: Microsoft Azure (OpenAI), AWS (Bedrock / SageMaker), and open-source / self-hosted stacks. Emphasize governance, data gravity, hybrid/on-prem, total cost.

## Sales Card
4–5 lines: target buyer, primary pain, lead product, proof point.

## Elevator Pitch
One sentence, under 40 words.`;
}

// ----------------------------------------------------------------------------
// Route
// ----------------------------------------------------------------------------
const router = express.Router();

router.post("/api/prospect-brief", async (req, res) => {
  const { company, website } = req.body ?? {};
  if (!company) return res.status(400).json({ error: "company is required" });

  try {
    const scraped = website ? await fetchSiteText(website) : "";

    // Parallel — no chaining. This is the latency fix.
    const [research, salesPlay] = await Promise.all([
      callWatsonx(RESEARCH_SYSTEM, researchUser(company, website, scraped), 2400),
      callWatsonx(SALESPLAY_SYSTEM, salesPlayUser(company, website, scraped), 2000),
    ]);

    res.json({
      company,
      website: website ?? null,
      usedWebsiteContent: Boolean(scraped), // surface this in the UI so you know if contacts are real
      research, // Markdown -> Tab 1
      salesPlay, // Markdown -> Tab 2
    });
  } catch (err: any) {
    console.error("prospect-brief error:", err);
    res.status(502).json({ error: err?.message ?? "watsonx call failed" });
  }
});

export default router;
