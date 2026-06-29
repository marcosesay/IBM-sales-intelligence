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

  const prompt = `You are an IBM AI sales expert. Write a concise IBM prospecting report for ${companyName} (${websiteUrl}).${contextLine}

## Company Overview
2 short paragraphs: business model, market, key challenges.

## IBM Product Recommendations
Top 3 IBM products. Each: product name, why it fits (1 sentence), business outcome (1 sentence).

## Best Fit Sales Play
Best single IBM product + 1-line elevator pitch.
Top 2 use cases: problem, solution, value.
How to get in the door (entry point).
Main competitive wedge vs Microsoft/AWS/Google.

## Buyer Personas
3 titles most likely to buy, one line each.

Keep every section tight. Be specific to ${companyName}.`;

  try {
    req.log.info({ companyName }, "Prospect generation starting");

    const output = await generateText(prompt, {
      model: "meta-llama/llama-3-1-8b-instruct",
      maxTokens: 1000,
      temperature: 0.5,
    });

    req.log.info({ companyName }, "Prospect generation complete");

    res.json({
      companyName,
      websiteUrl,
      step1: output,
      step2: "",
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
