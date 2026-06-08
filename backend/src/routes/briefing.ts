import { Router, type IRouter } from "express";
import { generateTextStream } from "@workspace/integrations-ibm-watsonx";

const router: IRouter = Router();

const INDUSTRY_MAP: Record<string, string> = {
  "jpmorgan": "Financial Services", "jpmorgan chase": "Financial Services",
  "goldman sachs": "Financial Services", "morgan stanley": "Financial Services",
  "bank of america": "Financial Services", "wells fargo": "Financial Services",
  "citibank": "Financial Services", "citigroup": "Financial Services",
  "blackrock": "Financial Services", "fidelity": "Financial Services",
  "american express": "Financial Services", "visa": "Financial Services",
  "mastercard": "Financial Services", "capital one": "Financial Services",
  "apple": "Technology", "microsoft": "Technology", "google": "Technology",
  "alphabet": "Technology", "amazon": "Technology", "meta": "Technology",
  "ibm": "Technology", "oracle": "Technology", "salesforce": "Technology",
  "sap": "Technology", "cisco": "Technology", "adobe": "Technology",
  "servicenow": "Technology", "workday": "Technology", "snowflake": "Technology",
  "databricks": "Technology", "nvidia": "Technology",
  "unitedhealth": "Healthcare", "cvs health": "Healthcare", "cvs": "Healthcare",
  "johnson & johnson": "Healthcare", "pfizer": "Healthcare", "merck": "Healthcare",
  "anthem": "Healthcare", "cigna": "Healthcare", "humana": "Healthcare",
  "aetna": "Insurance", "metlife": "Insurance", "prudential": "Insurance",
  "allstate": "Insurance", "state farm": "Insurance", "aig": "Insurance",
  "walmart": "Retail", "target": "Retail", "costco": "Retail",
  "home depot": "Retail", "nike": "Retail", "nordstrom": "Retail",
  "exxonmobil": "Energy", "shell": "Energy", "bp": "Energy",
  "chevron": "Energy", "duke energy": "Energy",
  "boeing": "Manufacturing", "lockheed martin": "Manufacturing",
  "general electric": "Manufacturing", "ford": "Manufacturing",
  "general motors": "Manufacturing", "caterpillar": "Manufacturing",
};

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "Financial Services": ["bank", "banking", "financial", "investment", "asset management", "wealth management", "trading", "capital markets", "brokerage"],
  "Healthcare": ["health", "hospital", "medical", "pharmaceutical", "biotech", "clinical", "patient", "physician", "drug", "therapy"],
  "Technology": ["software", "technology", "tech", "saas", "cloud", "ai ", "data", "digital", "platform", "developer", "cybersecurity"],
  "Retail": ["retail", "store", "e-commerce", "ecommerce", "shopping", "consumer goods", "merchandise"],
  "Manufacturing": ["manufactur", "industrial", "aerospace", "automotive", "defense", "factory", "supply chain"],
  "Insurance": ["insurance", "insurer", "underwriting", "reinsurance", "claims", "actuar"],
  "Energy": ["energy", "oil", "gas", "utilities", "renewable", "power", "petroleum", "electric", "solar", "wind"],
  "Government": ["government", "federal", "agency", "public sector", "municipality", "department of", "ministry"],
};

const IBM_PRODUCTS = `
IBM watsonx.ai — foundation model studio for building and fine-tuning AI models
IBM watsonx.data — open data lakehouse for governed data access across clouds
IBM watsonx.governance — AI risk and compliance management
IBM Cognos Analytics — business intelligence and reporting
IBM OpenPages — GRC platform
IBM Instana — application performance monitoring
IBM Turbonomic — AIOps and resource management
IBM Cloud Pak for Data — unified data and AI platform
`;

function buildSections(callType: string, company: string, industry: string, title: string): string {
  const t = title || "senior leader";
  const sections: Record<string, string> = {
    "Discovery": `## Company & Contact Background
Overview of ${company}, strategic priorities in ${industry}, and what a ${t} cares about. Include likely AI maturity level. Write in clear prose paragraphs — no sub-headers, no bullet lists in this section.

## Discovery Questions
List exactly 8 discovery questions as a simple numbered list. Each question on its own line. No sub-headers. No explanations after each question. Just the questions.

## Opportunity Qualification
CRITICAL: Use exactly these 6 labels as bold AND italic sub-headers using THREE asterisks on each side (***Budget***, ***Authority***, ***Need***, ***Timeline***, ***Champion***, ***Political Blockers***), each followed by 1-2 sentences. Example format:
***Budget***: [1-2 sentences about budget]
***Authority***: [1-2 sentences about authority]
Keep it tight.

## Product Recommendations
Recommend exactly 3 IBM products. For each use this format:
*Product name* on its own line (italic, not bold).
Combined positioning (2-3 sentences): Explain why it fits ${company} and how to position it in a single cohesive paragraph.`,

    "Renewal": `## Account Health & Risk
Current account health for ${company}. Signs of risk, champion turnover, or expansion opportunity. Write in clear prose — no sub-headers or nested bullets.

## Renewal & Expansion Questions
List exactly 8 questions as a simple numbered list. No sub-headers. No explanations. Just the questions.

## Expansion Qualification
CRITICAL: Use exactly these 6 labels as bold AND italic sub-headers using THREE asterisks on each side (***Budget***, ***Authority***, ***Need***, ***Timeline***, ***Champion***, ***Political Blockers***). 1-2 sentences each.

## Retention & Upsell Positioning
Recommend exactly 3 IBM products for expansion. For each use this format:
*Product name* on its own line (italic, not bold).
Combined positioning (2-3 sentences): Explain why it fits now and how to position it in a single cohesive paragraph.`,

    "Competitive": `## Competitive Landscape
Likely incumbent at ${company} and their weaknesses. Write in clear prose — no sub-headers or nested bullets.

## Competitive Discovery Questions
List exactly 8 questions as a simple numbered list. No sub-headers. No explanations. Just the questions.

## Win/Loss Qualification
CRITICAL: Use exactly these 6 labels as bold AND italic sub-headers using THREE asterisks on each side (***Budget***, ***Authority***, ***Need***, ***Timeline***, ***Champion***, ***Political Blockers***). 1-2 sentences each.

## IBM Differentiation
Recommend exactly 3 IBM products to displace or surround the incumbent. For each: *product name* (italic, not bold), key differentiator vs rival (one sentence), top objection + reframe (one sentence).`,

    "EBC": `## Executive Profile & Strategic Agenda
What a ${t} at ${company} cares about at board level. 3-year horizon and AI investment priorities. Write in clear prose — no sub-headers or nested bullets.

## Executive Engagement Questions
List exactly 8 strategic C-suite questions as a simple numbered list. No sub-headers. No explanations. Just the questions.

## Business Case Qualification
CRITICAL: Use exactly these 6 labels as bold AND italic sub-headers using THREE asterisks on each side (***Budget***, ***Authority***, ***Need***, ***Timeline***, ***Champion***, ***Political Blockers***). 1-2 sentences each.

## Strategic Investment Themes
Recommend exactly 3 IBM solutions framed as executive bets. For each: *solution name* (italic, not bold), business outcome it drives (one sentence), industry proof point (one sentence).`,
  };
  return sections[callType] ?? sections["Discovery"];
}

router.post("/generate", async (req, res) => {
  const { company, industry, contactName, contactTitle, context, callType } = req.body as {
    company: string;
    industry?: string;
    contactName?: string;
    contactTitle?: string;
    context?: string;
    callType?: string;
  };

  if (!company) {
    res.status(400).json({ error: "company is required" });
    return;
  }

  const ct = callType || "Discovery";
  const ind = industry || "";
  const title = contactTitle || "senior leader";

  const prompt = `You are an expert enterprise sales coach helping a Solutions Engineer prepare for a ${ct} call.

Call details:
- Company: ${company}
- Industry: ${ind}
- Contact: ${contactName || "Unknown"}
- Title: ${title}
- Context: ${context || "None"}

IBM products available:
${IBM_PRODUCTS}

CRITICAL: Write a pre-call briefing with EXACTLY FOUR sections using ## headers. Each section should appear ONLY ONCE. Do not repeat any section headers. Follow the formatting instructions in each section exactly.

For product names: Use *italic* format (single asterisks), NOT bold (**).
Keep everything clean and professional — no extra markdown symbols like ---, or ### in the output.

${buildSections(ct, company, ind, title)}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = generateTextStream(prompt, {
      model: "ibm/granite-13b-chat-v2",
      maxTokens: 8192,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    req.log.info({ company, callType: ct }, "Briefing generation completed successfully");
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err, company, callType: ct }, "Briefing generation failed");
    res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
    res.end();
  }
});

router.get("/news", async (req, res) => {
  const company = String(req.query["company"] || "");
  if (!company) {
    res.json([]);
    return;
  }

  try {
    const query = encodeURIComponent(`${company} when:1d`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    
    const response = await fetch(rssUrl, {
      headers: { "User-Agent": "SalesIntelligenceApp/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      req.log.warn({ status: response.status, company }, "News fetch returned non-OK status");
      res.json([]);
      return;
    }

    const xml = await response.text();
    const items: { title: string; source: string; url: string | null; date: string | null; timestamp: number }[] = [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/);
      const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const publishedAt = dateMatch ? Date.parse(dateMatch[1]) : Number.NaN;

      if (!titleMatch || Number.isNaN(publishedAt) || publishedAt < cutoff) {
        continue;
      }

      // Format: Month/Day/Year, Time AM/PM (no day of week)
      const dateObj = new Date(publishedAt);
      const datePart = dateObj.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
      const timePart = dateObj.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const formattedDate = `${datePart}, ${timePart}`;

      items.push({
        title: titleMatch[1].replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, '"'),
        source: sourceMatch ? sourceMatch[1] : "Google News",
        url: linkMatch ? linkMatch[1] : null,
        date: formattedDate,
        timestamp: publishedAt,
      });
    }

    // Sort by timestamp (most recent first)
    items.sort((a, b) => b.timestamp - a.timestamp);

    // Remove timestamp before sending (only used for sorting)
    const finalItems = items.slice(0, 5).map(({ timestamp, ...item }) => item);

    req.log.info({
      company,
      itemCount: finalItems.length,
      firstItemDate: finalItems[0]?.date,
      lastItemDate: finalItems[finalItems.length - 1]?.date
    }, "News fetch successful - sorted by most recent first");
    
    // Add cache control headers to prevent stale data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json(finalItems);
  } catch (err) {
    req.log.error({ err, company }, "News fetch failed");
    res.json([]);
  }
});

router.get("/logo", async (req, res) => {
  const company = String(req.query["company"] || "");
  if (!company) {
    res.json({ url: "" });
    return;
  }

  let clean = company
    .toLowerCase()
    .replace(/\b(inc|corp|llc|ltd|group|holdings|co|plc|se|ag|sa|gmbh|international|global|technologies|technology|solutions|systems|services|enterprises?)\b\.?/gi, "")
    .replace(/[&,.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(" ").filter((w) => w.length > 1);
  if (!words.length) words.push(company.split(" ")[0].toLowerCase());

  const domain = (words.length === 1 ? words[0] : words.slice(0, 2).join("")) + ".com";
  const clearbit = `https://logo.clearbit.com/${domain}`;

  try {
    const r = await fetch(clearbit, {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok && r.headers.get("content-type")?.includes("image")) {
      req.log.info({ company, domain, source: "clearbit" }, "Logo found");
      res.json({ url: clearbit });
      return;
    }
  } catch (err) {
    req.log.warn({ err, company, domain }, "Clearbit logo fetch failed, using fallback");
  }

  req.log.info({ company, domain, source: "favicon" }, "Using favicon fallback");
  res.json({ url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128` });

router.get("/proxy-image", async (req, res) => {
  const url = String(req.query["url"] || "");
  if (!url) {
    res.status(400).json({ error: "URL parameter is required" });
    return;
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: "Invalid URL protocol" });
      return;
    }

    req.log.info({ url }, "Proxying image request");

    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BriefingBot/1.0)",
      },
    });

    if (!response.ok) {
      req.log.warn({ url, status: response.status }, "Image fetch failed");
      res.status(response.status).json({ error: "Failed to fetch image" });
      return;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      req.log.warn({ url, contentType }, "Response is not an image");
      res.status(400).json({ error: "URL does not point to an image" });
      return;
    }

    // Get image data as buffer
    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Set appropriate headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    req.log.info({ url, size: buffer.length, contentType }, "Image proxied successfully");
    res.send(buffer);
  } catch (err) {
    req.log.error({ err, url }, "Image proxy failed");
    res.status(500).json({ error: "Failed to proxy image" });
  }
});
});

router.get("/industry", (req, res) => {
  const company = String(req.query["company"] || "").toLowerCase().trim();
  if (!company) {
    res.json({ industry: "" });
    return;
  }

  const direct = INDUSTRY_MAP[company];
  if (direct) {
    res.json({ industry: direct });
    return;
  }

  for (const [name, mappedIndustry] of Object.entries(INDUSTRY_MAP)) {
    if (company.includes(name) || name.includes(company)) {
      res.json({ industry: mappedIndustry });
      return;
    }
  }

  for (const [mappedIndustry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some((keyword) => company.includes(keyword))) {
      res.json({ industry: mappedIndustry });
      return;
    }
  }

  res.json({ industry: "" });
});

router.get("/parse-contact", async (req, res) => {
  const contact = String(req.query["contact"] || "");
  if (!contact) {
    res.json({ name: "", photoUrl: "", company: "" });
    return;
  }

  try {
    const linkedinMatch = contact.match(/linkedin\.com\/in\/([^/?]+)/i);
    if (!linkedinMatch || !linkedinMatch[1]) {
      req.log.info({ contact }, "No LinkedIn URL found in contact");
      res.json({ name: contact, photoUrl: "", company: "" });
      return;
    }

    const slug = linkedinMatch[1];
    let name = "";
    let companyName = "";
    
    // Try to fetch actual LinkedIn profile data
    try {
      const profileUrl = `https://www.linkedin.com/in/${slug}`;
      const response = await fetch(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.google.com/'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Try multiple extraction methods
        let extractedName = '';
        
        // Method 1: og:title meta tag
        const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          extractedName = ogTitleMatch[1].trim().replace(/\s*-\s*LinkedIn.*$/i, '').trim();
        }
        
        // Method 2: twitter:title meta tag
        if (!extractedName) {
          const twitterTitleMatch = html.match(/name="twitter:title"\s+content="([^"]+)"/i);
          if (twitterTitleMatch && twitterTitleMatch[1]) {
            extractedName = twitterTitleMatch[1].trim().replace(/\s*-\s*LinkedIn.*$/i, '').trim();
          }
        }
        
        // Method 3: title tag
        if (!extractedName) {
          const titleMatch = html.match(/<title>([^|<]+)/i);
          if (titleMatch && titleMatch[1]) {
            extractedName = titleMatch[1].trim().replace(/\s*-\s*LinkedIn.*$/i, '').trim();
          }
        }
        
        // Method 4: JSON-LD structured data
        if (!extractedName) {
          const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/i);
          if (jsonLdMatch && jsonLdMatch[1]) {
            try {
              const jsonData = JSON.parse(jsonLdMatch[1]);
              if (jsonData.name) {
                extractedName = jsonData.name;
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
        
        if (extractedName && extractedName.length > 2) {
          name = extractedName;
          req.log.info({ slug, name, method: 'scraped' }, "Successfully extracted name from LinkedIn");
        } else {
          req.log.warn({ slug, extractedName }, "Extracted name too short or empty");
        }
        
        // Extract company using multiple methods
        // Method 1: og:description with "at [Company]" pattern
        let companyMatch = html.match(/property="og:description"\s+content="[^"]*\bat\s+([^"|•·\n]+)/i);
        if (companyMatch && companyMatch[1]) {
          companyName = companyMatch[1].trim();
        }
        
        // Method 2: Look for company in title tag (e.g., "Name - Title - Company | LinkedIn")
        if (!companyName) {
          const titleCompanyMatch = html.match(/<title>[^-|]+-[^-|]+-\s*([^|<]+)/i);
          if (titleCompanyMatch && titleCompanyMatch[1]) {
            const potential = titleCompanyMatch[1].trim().replace(/\s*-?\s*LinkedIn.*$/i, '').trim();
            if (potential && potential.length > 2 && potential.length < 100) {
              companyName = potential;
            }
          }
        }
        
        // Method 3: JSON-LD structured data for organization
        if (!companyName) {
          const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/gi);
          for (const match of jsonLdMatches) {
            try {
              const jsonData = JSON.parse(match[1]);
              if (jsonData['@type'] === 'Person' && jsonData.worksFor) {
                if (typeof jsonData.worksFor === 'string') {
                  companyName = jsonData.worksFor;
                } else if (jsonData.worksFor.name) {
                  companyName = jsonData.worksFor.name;
                }
                break;
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
        
        // Method 4: Look for experience section with current role
        if (!companyName) {
          const expMatch = html.match(/Experience[^<]*<[^>]*>([^<]+)<[^>]*>.*?Present/is);
          if (expMatch && expMatch[1]) {
            const potential = expMatch[1].trim();
            if (potential && potential.length > 2 && potential.length < 100) {
              companyName = potential;
            }
          }
        }
      } else {
        req.log.warn({ slug, status: response.status }, "LinkedIn profile fetch returned non-OK status");
      }
    } catch (fetchErr) {
      req.log.warn({ err: fetchErr, slug }, "Failed to fetch LinkedIn profile, falling back to slug parsing");
    }
    
    // Fallback: parse name from slug if fetch failed
    if (!name) {
      name = slug
        .replace(/[-_]/g, " ")
        .replace(/\d+/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter(word => word.length > 1) // Filter out single letters
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    }

    // Try unavatar.io for photo
    const photoUrl = `https://unavatar.io/linkedin/${slug}`;
    
    // Check if unavatar has the photo
    try {
      const photoCheck = await fetch(photoUrl, { method: 'HEAD' });
      if (photoCheck.ok && photoCheck.headers.get('content-length') && parseInt(photoCheck.headers.get('content-length') || '0') > 1000) {
        req.log.info({ slug, photoUrl }, `Found LinkedIn photo via unavatar.io (${photoCheck.headers.get('content-length')} bytes)`);
      } else {
        req.log.info({ slug }, "Using generated avatar");
      }
    } catch (e) {
      // Ignore photo check errors
    }

    // If we couldn't extract company from LinkedIn, try web search
    if (!companyName && name) {
      try {
        const searchQuery = encodeURIComponent(`${name} current company position`);
        const searchUrl = `https://html.duckduckgo.com/html/?q=${searchQuery}`;
        
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (searchResponse.ok) {
          const searchHtml = await searchResponse.text();
          
          // Look for common patterns in search results
          // Pattern 1: "Name - Title at Company"
          const atPattern = new RegExp(`${name.split(' ')[0]}[^<]*?\\bat\\s+([A-Z][^<|•·]{2,50})`, 'i');
          const atMatch = searchHtml.match(atPattern);
          if (atMatch && atMatch[1]) {
            const potential = atMatch[1].trim().replace(/\s*-.*$/, '').trim();
            if (potential.length > 2 && potential.length < 60) {
              companyName = potential;
              req.log.info({ name, companyName, method: 'search' }, 'Found company via web search');
            }
          }
          
          // Pattern 2: Look for LinkedIn snippet in search results
          if (!companyName) {
            const linkedinSnippet = searchHtml.match(/linkedin[^<]*?(?:at|@)\s+([A-Z][^<|•·]{2,50})/i);
            if (linkedinSnippet && linkedinSnippet[1]) {
              const potential = linkedinSnippet[1].trim().replace(/\s*-.*$/, '').trim();
              if (potential.length > 2 && potential.length < 60) {
                companyName = potential;
                req.log.info({ name, companyName, method: 'search-linkedin' }, 'Found company via search LinkedIn snippet');
              }
            }
          }
        }
      } catch (searchErr) {
        req.log.warn({ err: searchErr, name }, 'Web search for company failed');
      }
    }
    
    req.log.info({ slug, name, companyName }, `LinkedIn parse result for ${slug}`);
    res.json({
      name: name || contact,
      photoUrl,
      company: companyName,
    });
  } catch (err) {
    req.log.error({ err, contact }, "Contact parsing failed");
    res.json({ name: contact, photoUrl: "", company: "" });
  }
});

export default router;

// Made with Bob
