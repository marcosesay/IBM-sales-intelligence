import { Router, type IRouter } from "express";
import { generateText } from "../lib/watsonx-client";

const router: IRouter = Router();

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

  const contextLine = context?.trim() ? `\nSeller context: ${context.trim()}` : "";

  try {
    req.log.info({ companyName }, "Prospect generation starting");

    // Step 1 — compact company research
    const step1Prompt = `You are an IBM AI sales expert. Research this company and produce a concise IBM sales brief.

Company: ${companyName}
Website: ${websiteUrl}${contextLine}

Write the following sections:

## Company Overview
2 paragraphs: business model, market, key challenges.

## IBM Product Recommendations
Top 3 IBM products for this company. For each: product name, one sentence why it fits, one sentence business outcome.

## Solution Mapping
Table: Line of Business | IBM Product | Use Case (4 rows max)

## Key Differentiators
4 bullet points why IBM wins here vs Microsoft/AWS/Google.

## Buyer Personas
3 titles most likely to buy, one line each on why they care.

Be specific to ${companyName}. Keep each section tight.`;

    const step1Output = await generateText(step1Prompt, {
      model: "meta-llama/llama-3-3-70b-instruct",
      maxTokens: 1200,
      temperature: 0.5,
    });

    req.log.info({ companyName }, "Step 1 done, starting Step 2");

    // Step 2 — sales play, using only company name (not full step1 to save tokens)
    const step2Prompt = `You are an IBM AI sales expert writing a sales play for ${companyName} (${websiteUrl}).${contextLine}

Write the following sections:

## Best Fit Product
One IBM product + one-line elevator pitch the seller can use in the first 30 seconds.

## Top 3 Use Cases
For each: use case name, the specific problem at ${companyName}, IBM solution, business value.

## 6-Step Sales Play
Step 1 Entry Point, Step 2 Discovery, Step 3 Contract Vehicle, Step 4 Objection Handling, Step 5 Competitive Wedge, Step 6 Expansion Path. One short paragraph each.

## Summary Sales Card
Table: Field | Detail — covering Best Fit Product, Primary Buyer, Entry Use Case, Competitive Threat, Deal Size Estimate, Time to Close, Expansion Opportunity.

Be specific to ${companyName}. Keep it tight and actionable.`;

    const step2Output = await generateText(step2Prompt, {
      model: "meta-llama/llama-3-3-70b-instruct",
      maxTokens: 1200,
      temperature: 0.5,
    });

    req.log.info({ companyName }, "Prospect generation complete");

    res.json({
      companyName,
      websiteUrl,
      step1: step1Output,
      step2: step2Output,
      generatedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    req.log.error({ err: err?.message, companyName }, "Prospect generation failed");
    res.status(500).json({
      error: "Generation failed. Please try again.",
      detail: err?.message || String(err),
    });
  }
});

export default router;
