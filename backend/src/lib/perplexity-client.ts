// perplexity-client.ts
// Thin wrapper around the Perplexity sonar API for grounded web search.
// Falls back gracefully (returns "") when the key is absent or the call fails,
// so every caller can treat it as optional enrichment.

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY ?? "";
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// sonar-pro = grounded search with citations, good balance of speed + quality.
const MODEL = "sonar-pro";

type PerplexityMessage = { role: "system" | "user" | "assistant"; content: string };

type PerplexityResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

/**
 * Call Perplexity with a system + user message and return the text.
 * Throws on a missing key, a non-2xx response, or a network/timeout failure.
 * Use this when the caller has to report *why* the search failed; use
 * `perplexitySearch` when the search is optional enrichment.
 */
export async function perplexitySearchOrThrow(
  system: string,
  user: string,
  maxTokens = 800,
): Promise<string> {
  if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not set");

  const messages: PerplexityMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.1,
      return_citations: true,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Perplexity ${response.status}: ${body}`);
  }

  const data = (await response.json()) as PerplexityResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/**
 * Call Perplexity with a system + user message and return the text.
 * Returns "" on any failure so callers never need to handle errors.
 */
export async function perplexitySearch(
  system: string,
  user: string,
  maxTokens = 800,
): Promise<string> {
  try {
    return await perplexitySearchOrThrow(system, user, maxTokens);
  } catch (err) {
    // Non-fatal — callers degrade gracefully when this returns ""
    console.error("[perplexity] search failed:", err);
    return "";
  }
}

