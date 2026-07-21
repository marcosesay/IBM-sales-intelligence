// anthropic-client.ts — Thin streaming wrapper around the Anthropic Messages API.
// Uses the raw REST API (no SDK) so it stays consistent with the watsonx pattern.

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!anthropicApiKey) {
  throw new Error("ANTHROPIC_API_KEY must be set.");
}

export type AnthropicMessage = { role: "user" | "assistant"; content: string };

type StreamOptions = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
};

/**
 * Stream a response from the Anthropic Messages API using server-sent events.
 * Yields text delta strings as they arrive.
 */
export async function* streamAnthropicChat(
  messages: AnthropicMessage[],
  options?: StreamOptions
): AsyncGenerator<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: options?.model ?? "claude-haiku-4-5",
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.3,
      system: options?.system,
      messages,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]" || data === "") continue;
      try {
        const parsed = JSON.parse(data) as {
          type: string;
          delta?: { type: string; text?: string };
        };
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          yield parsed.delta.text;
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
}

/**
 * Single-turn non-streaming call — returns the full text response.
 * Use for batch generation where you don't need to stream to the client.
 */
export async function generateAnthropicText(
  prompt: string,
  options?: StreamOptions & { system?: string }
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: options?.model ?? "claude-sonnet-4-5",
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.3,
      system: options?.system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  return data.content?.find(b => b.type === "text")?.text?.trim() ?? "";
}
