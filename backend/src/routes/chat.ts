// chat.ts — Contextual chat endpoint for follow-up questions on a briefing.
// POST /api/chat
// Body: { messages: [{role, content}], briefingContext?: string, companyName?: string }
// Streams SSE: data: {"content": "..."} / data: {"done": true}

import { Router, type IRouter } from "express";
import { streamAnthropicChat } from "../lib/anthropic-client";

const router: IRouter = Router();

const SYSTEM = `You are an IBM pre-sales expert assistant helping a seller prepare for a specific customer meeting.
You have deep knowledge of IBM's Data & AI portfolio: watsonx.ai, watsonx.data, watsonx.governance, watsonx Orchestrate, Db2, DataStage, IBM Guardium, Cognos Analytics.

STRICT OUTPUT RULES — violating any of these is a failure:
- Answer the question asked. Stop. Do not add conclusions, next steps, or closing remarks unless asked.
- Maximum 150 words unless the user explicitly asks for a draft, email, or longer output.
- No repetition — never restate something you just said.
- No hedging words (could, may, might, perhaps, potentially).
- No meta-commentary (e.g. "Here is the response", "In conclusion", "Final recommendation").
- Use markdown: bullet points with -, **bold** for key terms, and ## headings when the answer has clear sections.
- For short factual answers, reply in plain sentences — no forced bullets.
- Be decisive: one best-fit IBM product per need, never a list of options.
- Write in the second person ("you", "your customer") — never third person about yourself.`;

router.post("/", async (req, res) => {
  const { messages, briefingContext, companyName } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    briefingContext?: string;
    companyName?: string;
  };

  if (!messages?.length) {
    res.status(400).json({ error: "messages are required" });
    return;
  }

  // Prepend the briefing context as the first user message so the model
  // always has full account awareness without blowing the system prompt.
  const contextBlock = briefingContext?.trim()
    ? `Briefing context for ${companyName || "this account"}:\n"""\n${briefingContext.slice(0, 4000)}\n"""\n\nAcknowledge with "Got it." only.`
    : null;

  const anthropicMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (contextBlock) {
    anthropicMessages.push({ role: "user", content: contextBlock });
    anthropicMessages.push({ role: "assistant", content: "Got it." });
  }

  anthropicMessages.push(...messages);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = streamAnthropicChat(anthropicMessages, {
      system: SYSTEM,
      model: "claude-haiku-4-5",
      maxTokens: 600,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Chat generation failed");
    res.write(`data: ${JSON.stringify({ error: "Generation failed", done: true })}\n\n`);
    res.end();
  }
});

export default router;
