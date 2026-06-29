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

  const step1Prompt = `IBM sales brief for ${companyName} (${websiteUrl}).${contextLine}

## Company Overview
2 paragraphs on business model, market position, key challenges.

## IBM Product Recommendations
Top 3 IBM products. For each: name, why it fits (1 sentence), business outcome (1 sentence).
Products: watsonx.ai, watsonx.data, watsonx.governance, Cognos Analytics, OpenPages, Instana, Turbonomic

## Solution Mapping
| Line of Business | IBM Product | Use Case |
3-4 rows.

## Key Differentiators
4 bullets why IBM beats Microsoft/AWS/Google here.

## Buyer Personas
3 buyer titles, one line each.`;

  const step2Prompt = `IBM sales play for ${companyName} (${websiteUrl}).${contextLine}

## Best Fit Product
Product name + 1-sentence elevator pitch.

## Top 3 Use Cases
Each: name, problem at ${companyName}, IBM solution, business value.

## 6-Step Sales Play
Entry Point, Discovery, Contract Vehicle, Objection Handling, Competitive Wedge, Expansion Path. 2-3 sentences each.

## Summary Sales Card
| Field | Detail |
Best Fit Product, Primary Buyer, Entry Use Case, Competitive Threat, Deal Size, Time to Close, Expansion.`;

  try {
    req.log.info({ companyName }, "Prospect generation starting - parallel calls");

    // Run both calls in parallel
    const [step1Output, step2Output] = await Promise.all([
      generateText(step1Prompt, {
        model: "meta-llama/llama-3-3-70b-instruct",
        maxTokens: 900,
        temperature: 0.5,
      }),
      generateText(step2Prompt, {
        model: "meta-llama/llama-3-3-70b-instruct",
        maxTokens: 900,
        temperature: 0.5,
      }),
    ]);

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
