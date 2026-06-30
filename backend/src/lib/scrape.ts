// scrape.ts
// Shared, best-effort site scraper. Used by both the prospect and briefing
// routes so the model can ground its output in real site content.
//
// Hardened for messy real-world URLs: marketing/ad links with UTM and other
// tracking query params (e.g. campaigns.celonis.com/home?utm_source=...&gclid=...)
// are collapsed to their clean origin before fetching. Always degrades to "" on
// any failure so callers can treat scraping as strictly optional.

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalize any user-pasted URL to a clean origin. Strips paths, query strings,
// tracking params, and fragments. Returns null if it can't be parsed.
export function normalizeOrigin(input: string): string | null {
  if (!input || !input.trim()) return null;
  const raw = input.trim();
  const withScheme = raw.startsWith("http") ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin; // origin drops path, query, and hash
  } catch {
    return null;
  }
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000), // a slow page can't stall the brief
    });
    if (!res.ok) return "";
    return htmlToText(await res.text());
  } catch {
    return "";
  }
}

// Scrape the prospect's OWN site (homepage + likely about/contact pages) so the
// overview and contacts are grounded in real content. Only the prospect's own
// domain is fetched. Degrades to "" on any failure.
export async function fetchSiteText(url: string, maxChars = 9000): Promise<string> {
  const origin = normalizeOrigin(url);
  if (!origin) return "";

  const homepageHtml = await fetch(origin, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  })
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "");

  const sections: string[] = [];
  if (homepageHtml) sections.push(`[Homepage]\n${htmlToText(homepageHtml)}`);

  // Discover same-domain about/contact links from the homepage.
  const candidates = new Set<string>();
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(homepageHtml)) !== null) {
    const href = m[1];
    const label = htmlToText(m[2]).toLowerCase();
    if (!/about|contact|company|leadership|team|who-we-are/i.test(href + " " + label)) continue;
    try {
      const abs: string = new URL(href, origin).href;
      if (abs.startsWith(origin)) candidates.add(abs);
    } catch {
      /* skip malformed href */
    }
  }
  if (candidates.size === 0) {
    for (const path of ["/about", "/about-us", "/contact", "/company"]) {
      candidates.add(origin + path);
    }
  }

  const extra = await Promise.all(
    Array.from(candidates)
      .slice(0, 3)
      .map(async (u) => {
        const t = await fetchPageText(u);
        return t ? `[${u}]\n${t}` : "";
      })
  );
  for (const e of extra) if (e) sections.push(e);

  return sections.join("\n\n").slice(0, maxChars).trim();
}
