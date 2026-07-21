// architecture.ts — Generate a Mermaid architecture diagram + IBM upgrade path
// from the briefing context and prospect research data.
// POST /api/architecture/generate
// Body: { briefingText, prospectStep1?, prospectStep2?, companyName }
// Streams SSE: data: {"content": "..."} / data: {"done": true}

import { Router, type IRouter } from "express";
import { streamAnthropicChat } from "../lib/anthropic-client";

const router: IRouter = Router();

// Concrete skeleton Claude must follow exactly. Swap only the quoted labels and IDs.
const DIAGRAM_EXAMPLE = `\`\`\`mermaid
graph TD
    subgraph SOURCES["Data Sources & Current Stack"]
        A1["Snowflake DW"]
        A2["SAP ERP"]
        A3["Salesforce CRM"]
        A4["Azure Data Lake"]
    end
    subgraph IBM["IBM Data & AI Platform"]
        B1(["watsonx.data"])
        B2(["DataStage"])
        B3(["watsonx.governance"])
        B4(["watsonx.ai"])
    end
    subgraph OUTCOMES["Business Outcomes"]
        C1("Unified Data Fabric")
        C2("AI-Ready Pipelines")
        C3("Governed AI at Scale")
    end
    A1 --> B1
    A2 --> B2
    A3 --> B2
    A4 --> B1
    B1 --> B4
    B2 --> B1
    B3 --> B4
    B4 --> C3
    B1 --> C1
    B2 --> C2
\`\`\``;

const SYSTEM = `You are an IBM solution architect producing a pre-sales architecture diagram.

OUTPUT STRUCTURE — two parts, nothing else:
PART 1: A fenced mermaid block. Output the opening fence on the very first line.
PART 2: After the closing fence, output exactly "### IBM Upgrade Path" then 3 phases.

DIAGRAM RULES — copy this structure exactly, substituting real values for this account:
${DIAGRAM_EXAMPLE}

STRICT SYNTAX RULES (Mermaid will reject anything that violates these):
1. First line inside the fence must be exactly: graph TD
2. Three subgraphs in this exact order: SOURCES, IBM, OUTCOMES — each opens with subgraph ID["Title"] and closes with end
3. Node definitions go inside their subgraph. Use ONLY these shapes:
   - SOURCES nodes: A1["Short Label"]   (square brackets, one line, no newlines inside)
   - IBM nodes:     B1(["Short Label"])  (round+square brackets)
   - OUTCOMES nodes: C1("Short Label")  (round brackets)
4. ALL edges go AFTER the last end, never inside a subgraph block
5. Edge syntax: ID --> ID  or  ID -->|"short label"| ID  — IDs only, no inline node definitions
6. Max 4 nodes per subgraph, max 10 edges total
7. No %% comments, no classDef, no style, no click, no direction inside subgraphs
8. Node labels: single line, max 4 words, no special characters except spaces

UPGRADE PATH RULES:
- 3 numbered phases.
- Each: **Phase N — Title**, then 3 bullets: **Lead with:**, **Delivers:**, **Timeline:**
- Use real product names and account-specific pain. No generic statements.`;

function buildPrompt(
  companyName: string,
  briefingText: string,
  prospectStep1: string,
  prospectStep2: string,
): string {
  const parts: string[] = [];

  if (briefingText.trim()) {
    parts.push(`## Pre-Call Briefing\n${briefingText.slice(0, 3000)}`);
  }
  if (prospectStep1.trim()) {
    parts.push(`## Account Research\n${prospectStep1.slice(0, 2000)}`);
  }
  if (prospectStep2.trim()) {
    parts.push(`## Sales Play\n${prospectStep2.slice(0, 2000)}`);
  }

  return `Generate an IBM architecture diagram and upgrade path for ${companyName}.

${parts.join("\n\n")}

Follow the output format and diagram rules exactly. Use real systems you know about from the research above — never generic placeholders.`;
}

router.post("/generate", async (req, res) => {
  const { companyName, briefingText, prospectStep1, prospectStep2 } = req.body as {
    companyName: string;
    briefingText?: string;
    prospectStep1?: string;
    prospectStep2?: string;
  };

  if (!companyName) {
    res.status(400).json({ error: "companyName is required" });
    return;
  }

  const prompt = buildPrompt(
    companyName,
    briefingText || "",
    prospectStep1 || "",
    prospectStep2 || "",
  );

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = streamAnthropicChat(
      [{ role: "user", content: prompt }],
      {
        system: SYSTEM,
        model: "claude-sonnet-4-5",
        maxTokens: 2000,
        temperature: 0.3,
      },
    );

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log.error({ err: err?.message, companyName }, "Architecture generation failed");
    res.write(`data: ${JSON.stringify({ error: "Generation failed", done: true })}\n\n`);
    res.end();
  }
});

export default router;
