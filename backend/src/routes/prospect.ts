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

  const ctx = context?.trim() ? ` Seller context: ${context.trim()}.` : "";

  const prompt = `IBM sales brief for ${companyName}.${ctx}

## Company Overview
3 sentences on what ${companyName} does and their key business challenges.

## Top IBM Products
1. [Product]: [Why it fits in 1 sentence]
2. [Product]: [Why it fits in 1 sentence]
3. [Product]: [Why it fits in 1 sentence]

## Sales Play
Entry point: [How to get in the door]
Key use case: [Best use case for ${companyName}]
Elevator pitch: [One sentence IBM pitch]
Competitive edge: [Why IBM beats Microsoft/AWS here]

## Buyers
- [Title 1]: [Why they care]
- [Title 2]: [Why they care]`;

  try {
    req.log.info({ companyName }, "Prospect generation starting");

    const output = await generateText(prompt, {
      model: "meta-llama/llama-3-1-8b-instruct",
      maxTokens: 400,
      temperature: 0.4,
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
      error: "Generation failed.",
      detail: err?.message || String(err),
    });
  }
});

export default router;
