import { Router, type IRouter } from "express";
import { generateText } from "../lib/watsonx-client";

const router: IRouter = Router();

const MODEL = "meta-llama/llama-3-3-70b-instruct";
const MAX_TOKENS = 3500;
const TEMPERATURE = 0.6;

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

  const contextBlock = context && context.trim()
    ? `\n\nAdditional context provided by the seller:\n${context.trim()}\nIncorporate this context into your analysis where relevant.`
    : "";

  try {
    req.log.info({ companyName, websiteUrl }, "Starting prospect generation - Step 1");

    // ── Step 1: Company Research & IBM Product Mapping ──────────────────────
    const step1Prompt = `You are an IBM AI sales expert. A seller needs a detailed company research brief and IBM product mapping for a new prospect.

Company: ${companyName}
Website: ${websiteUrl}${contextBlock}

Research this company and produce a structured markdown document covering:

## Company Overview
Write 2-3 paragraphs covering the company's mission, core business model, primary market segments, key customers or end markets, and overall scale. Be specific and factual.

## AI & Technology Capabilities
Identify the company's existing AI, data, and technology capabilities based on their business and industry. What technology investments are they likely making? What data challenges do they face?

## IBM AI Product Recommendations
Recommend the top 3 IBM AI products that are the strongest fit for this company. For each product, explain specifically why it maps to this company's business.

Use this format for each:
**[IBM Product Name]**
- Why it fits: [specific reasoning tied to this company]
- Key capability: [what it does for them]
- Business outcome: [measurable result]

IBM products to consider: IBM watsonx.ai, IBM watsonx.data, IBM watsonx.governance, IBM Cognos Analytics, IBM OpenPages, IBM Instana, IBM Turbonomic, IBM Cloud Pak for Data

## Solution Mapping Table
Create a table with these columns: Line of Business | IBM Product | Use Case | Expected Outcome
Include 4-5 rows covering different parts of the business.

## Key Differentiators for IBM Pitch
List 4-5 specific reasons why IBM wins at this account over competitors like Microsoft, AWS, Google, or open-source alternatives. Be specific to this company's context.

## Contact Information
Based on the company's website and typical org structure, identify the most likely buyer personas:
- Primary contact: [title, why they care]
- Secondary contact: [title, why they care]
- Technical evaluator: [title, why they care]

Write in a professional, direct tone. Be specific to ${companyName} — avoid generic statements.`;

    const step1Output = await generateText(step1Prompt, {
      model: MODEL,
      maxTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    });

    req.log.info({ companyName }, "Step 1 complete, starting Step 2");

    // ── Step 2: Best Fit Use Case & Sales Play ──────────────────────────────
    const step2Prompt = `You are an IBM AI sales expert. Based on the following company research for ${companyName}, create a detailed sales play document.${contextBlock}

--- COMPANY RESEARCH ---
${step1Output}
--- END RESEARCH ---

Now produce a Best Fit Use Case and Sales Play document:

## Best Fit IBM Product
State the single best fit IBM product for ${companyName} and a one-line elevator pitch.

**Elevator Pitch:** [One sentence that an IBM seller can say in the first 30 seconds of a call]

## Standalone Licensing & Packaging
Explain how the best fit product can be sold independently (without requiring a full platform purchase). Cover:
- Entry-level packaging options
- Pricing model (subscription, consumption, etc.)
- Typical deal size range for a company of this type
- Contract vehicle options (ELA, SaaS subscription, etc.)

## Use Cases
Describe 3 specific use cases for ${companyName}, each tied to their actual business:

### Use Case 1: [Name]
**Problem:** [Specific pain at ${companyName}]
**Solution:** [How the IBM product solves it]
**Business Value:** [Quantified outcome where possible]

### Use Case 2: [Name]
**Problem:** [Specific pain at ${companyName}]
**Solution:** [How the IBM product solves it]
**Business Value:** [Quantified outcome where possible]

### Use Case 3: [Name]
**Problem:** [Specific pain at ${companyName}]
**Solution:** [How the IBM product solves it]
**Business Value:** [Quantified outcome where possible]

## 6-Step Sales Play

**Step 1 — Entry Point**
[How to get in the door — which team, which pain, which event triggers urgency]

**Step 2 — Discovery**
[Key questions to ask, what to uncover, who to talk to]

**Step 3 — Contract Vehicle**
[Which procurement path to use and why]

**Step 4 — Objection Handling**
[Top 2-3 objections you'll face and how to counter them]

**Step 5 — Competitive Wedge**
[How IBM wins vs Azure, AWS, Google, or open-source — specific to ${companyName}'s context]

**Step 6 — Expansion Path**
[After the initial win, what's the next product to bring in and why]

## Summary Sales Card
| Field | Detail |
|---|---|
| Best Fit Product | |
| Primary Buyer | |
| Entry Use Case | |
| Competitive Threat | |
| Deal Size Estimate | |
| Time to Close | |
| Expansion Opportunity | |

Fill in every row with specifics for ${companyName}.`;

    const step2Output = await generateText(step2Prompt, {
      model: MODEL,
      maxTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    });

    req.log.info({ companyName }, "Prospect generation completed successfully");

    res.json({
      companyName,
      websiteUrl,
      step1: step1Output,
      step2: step2Output,
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    req.log.error({ err, companyName }, "Prospect generation failed");
    res.status(500).json({ error: "Generation failed. Please try again." });
  }
});

export default router;
