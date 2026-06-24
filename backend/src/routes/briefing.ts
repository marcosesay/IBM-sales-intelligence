import { Router, type IRouter } from "express";
import { generateTextStream } from "../lib/watsonx-client";

const router: IRouter = Router();

// User-Agent rotation to avoid bot detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
];

let userAgentIndex = 0;

function getRandomUserAgent(): string {
  // Rotate through user agents sequentially with some randomness
  userAgentIndex = (userAgentIndex + 1) % USER_AGENTS.length;
  return USER_AGENTS[userAgentIndex];
}

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

function buildSections(callType: string, company: string, industry: string, title: string, contactName?: string): string {
  const t = title || "senior leader";
  const sections: Record<string, string> = {
    "Discovery": `## Who is ${contactName || "the Contact"}?

CRITICAL: The section header above must stand alone on its own line. Do NOT add any text after the question mark on the header line.

Provide a focused profile of the contact covering:
1) What a ${t} typically cares about (their priorities, pain points, and success metrics)
2) How someone in this role influences technology decisions
3) Key challenges they likely face in their position
4) What would make them a champion for new solutions

Write in clear, informative prose paragraphs (2-3 paragraphs). No sub-headers, no bullet lists. CRITICAL: Begin the first paragraph with the contact's name (e.g. "[Name] is a..." or "[Name] leads..."). Do NOT start with "As a professional", "In their role", or any generic phrase — open with the person's name directly.

## Company Background
Provide a comprehensive company overview covering:
1) ${company}'s business model, market position, and recent strategic initiatives in ${industry}
2) Key challenges and opportunities the company is facing
3) The company's likely AI/technology maturity level and digital transformation stage
4) Recent news or developments that might create urgency

Then on a new line write exactly: ***Likely Tech Stack & Competitive Landscape:***
Follow with 2-3 sentences covering: what data, AI, or analytics vendors ${company} likely uses based on their industry and size, which of those vendors IBM directly competes with or displaces, and the single strongest IBM displacement angle for this account.

Write the overview in clear prose paragraphs. Keep the entire section to 3 paragraphs maximum.

## Discovery Questions
List exactly 8 discovery questions as a simple numbered list. Each question on its own line. No sub-headers. No explanations after each question. Just the questions.
Questions must be specifically tailored to:
- The contact's title and likely priorities as a ${title} at ${company}
- The ${industry} industry context and its specific challenges
- The ${callType} call type (e.g. for Discovery focus on uncovering pain; for Competitive focus on displacement; for Renewal focus on expansion)
- Any additional context provided about this opportunity
Do NOT use generic questions. Every question should feel like it was written specifically for this person at this company.

## Opportunity Qualification
CRITICAL: Use exactly these 6 labels as bold AND italic sub-headers using THREE asterisks on each side (***Budget***, ***Authority***, ***Need***, ***Timeline***, ***Champion***, ***Political Blockers***), each followed by 1-2 sentences. Example format:
***Budget***: [1-2 sentences about budget]
***Authority***: [1-2 sentences about authority]
Keep it tight.

## Product Recommendations
List exactly 3 IBM product names only, one per line, using *italic* format. Nothing else - no descriptions, no bullet points, no "Combined positioning". Just 3 product names.
Example:
*IBM watsonx.ai*
*IBM watsonx.data*
*IBM watsonx.governance*`,

    "Renewal": `## Who is ${contactName || "the Contact"}?

CRITICAL: The section header above must stand alone on its own line. Do NOT add any text after the question mark on the header line.

Provide a focused profile of the contact covering:
1) What a ${t} typically cares about in renewal discussions
2) Their satisfaction indicators and pain points with current solutions
3) How they influence renewal and expansion decisions
4) What would motivate them to expand the relationship

Write in clear, informative prose paragraphs (2-3 paragraphs). No sub-headers, no bullet lists. CRITICAL: Begin the first paragraph with the contact's name (e.g. "[Name] is a..." or "[Name] leads..."). Do NOT start with "As a professional", "In their role", or any generic phrase — open with the person's name directly.

## Account Health & Risk
Provide a comprehensive account assessment covering:
1) Current relationship health with ${company} and deployment status
2) Key stakeholders and champion strength (or risks of champion turnover)
3) Signs of satisfaction, risk factors, or competitive threats
4) Expansion opportunities based on ${industry} trends
5) Contract timing considerations and renewal risk factors

Write in clear, informative prose paragraphs (2-3 paragraphs). No sub-headers, no bullet lists. Make this section substantive and actionable.

## Renewal & Expansion Questions
List exactly 8 questions as a simple numbered list. No sub-headers. No explanations. Just the questions.

## Expansion Qualification
CRITICAL: Use exactly these 6 labels as bold AND italic sub-headers using THREE asterisks on each side (***Budget***, ***Authority***, ***Need***, ***Timeline***, ***Champion***, ***Political Blockers***). 1-2 sentences each.

## Retention & Upsell Positioning
List exactly 3 IBM product names only, one per line, using *italic* format. No descriptions, no bullet points. Just 3 names.
Example:
*IBM watsonx.ai*
*IBM watsonx.data*
*IBM watsonx.governance*`,

    "Competitive": `## Who is ${contactName || "the Contact"}?

CRITICAL: The section header above must stand alone on its own line. Do NOT add any text after the question mark on the header line.

Provide a focused profile of the contact covering:
1) What a ${t} values when evaluating competitive alternatives
2) Their likely relationship with incumbent vendors
3) How they influence vendor selection decisions
4) What would make them advocate for a change

Write in clear, informative prose paragraphs (2-3 paragraphs). No sub-headers, no bullet lists. CRITICAL: Begin the first paragraph with the contact's name (e.g. "[Name] is a..." or "[Name] leads..."). Do NOT start with "As a professional", "In their role", or any generic phrase — open with the person's name directly.

## Competitive Landscape
Provide a comprehensive competitive analysis covering:
1) Likely incumbent vendors at ${company} in ${industry} and their market position
2) Specific weaknesses or gaps in the incumbent's solution
3) Recent competitive wins/losses in similar ${industry} accounts
4) Key differentiation opportunities for IBM based on ${company}'s needs

Write in clear, informative prose paragraphs (2-3 paragraphs). No sub-headers, no bullet lists. Make this section substantive and actionable.

## Competitive Discovery Questions
List exactly 8 questions as a simple numbered list. No sub-headers. No explanations. Just the questions.

## Win/Loss Qualification
CRITICAL: Use exactly these 6 labels as bold AND italic sub-headers using THREE asterisks on each side (***Budget***, ***Authority***, ***Need***, ***Timeline***, ***Champion***, ***Political Blockers***). 1-2 sentences each.

## IBM Differentiation
List exactly 3 IBM product names only, one per line, using *italic* format. No descriptions, no bullet points. Just 3 names.
Example:
*IBM watsonx.ai*
*IBM watsonx.data*
*IBM watsonx.governance*`,

    "EBC": `## Who is ${contactName || "the Contact"}?

CRITICAL: The section header above must stand alone on its own line. Do NOT add any text after the question mark on the header line.

Provide a focused executive profile covering:
1) Strategic priorities for a ${t} at ${company} over the next 3 years
2) What drives their decision-making at the board level
3) How they measure success and define ROI
4) What would make them champion a strategic technology investment

Write in clear, informative prose paragraphs (2-3 paragraphs). No sub-headers, no bullet lists. CRITICAL: Begin the first paragraph with the contact's name (e.g. "[Name] is a..." or "[Name] leads..."). Do NOT start with "As a professional", "In their role", or any generic phrase — open with the person's name directly.

## Company Strategic Agenda
Provide a comprehensive strategic overview covering:
1) Board-level concerns and shareholder expectations in ${industry}
2) Digital transformation and AI investment priorities at ${company}
3) Competitive pressures and market dynamics affecting strategic decisions
4) How technology investments tie to business outcomes and KPIs

Write in clear, informative prose paragraphs (2-3 paragraphs). No sub-headers, no bullet lists. Make this section substantive and actionable.

## Executive Engagement Questions
List exactly 8 strategic C-suite questions as a simple numbered list. No sub-headers. No explanations. Just the questions.

## Business Case Qualification
CRITICAL: Use exactly these 6 labels as bold AND italic sub-headers using THREE asterisks on each side (***Budget***, ***Authority***, ***Need***, ***Timeline***, ***Champion***, ***Political Blockers***). 1-2 sentences each.

## Strategic Investment Themes
List exactly 3 IBM product names only, one per line, using *italic* format. No descriptions, no bullet points. Just 3 names.
Example:
*IBM watsonx.ai*
*IBM watsonx.data*
*IBM watsonx.governance*`,
  };
  return sections[callType] ?? sections["Discovery"];
}

function buildFallbackBriefing(params: {
  company: string;
  industry: string;
  contactName?: string;
  contactTitle: string;
  callType: string;
  context?: string;
}): string {
  const { company, industry, contactName, contactTitle, callType, context } = params;
  const contact = contactName || "the Contact";
  const title = contactTitle || "professional";
  const normalizedIndustry = industry || "Technology";
  const contextLine = context && context !== "None"
    ? `Additional context suggests focus areas around ${context.slice(0, 180)}.`
    : `${company} should be approached with a practical point of view tied to current business priorities and measurable outcomes.`;

  const discoveryQuestions = [
    `What are the top business priorities your team is accountable for this quarter?`,
    `Which workflows are creating the most friction for ${contact}'s organization today?`,
    `How is ${company} currently evaluating AI, automation, or data modernization initiatives?`,
    `What metrics would define success for a new initiative in this area?`,
    `Which stakeholders besides ${contact} would influence evaluation and approval?`,
    `What existing tools or vendors are hardest to replace or integrate with?`,
    `Where does the team feel the most urgency to improve speed, insight, or governance?`,
    `What would need to be true for this project to become a priority this cycle?`,
  ];

  const renewalQuestions = [
    `What outcomes has the current solution delivered so far?`,
    `Where are users satisfied, and where are they still experiencing friction?`,
    `Which capabilities are most important to preserve during renewal?`,
    `What gaps could justify expansion or a broader platform discussion?`,
    `How are budget and timing being evaluated for the renewal decision?`,
    `Which stakeholders need to see value before approving expansion?`,
    `What competitive alternatives are being considered, if any?`,
    `What would make renewal feel low-risk and strategically valuable?`,
  ];

  const competitiveQuestions = [
    `What is working well enough with the incumbent that change feels difficult?`,
    `Where is the incumbent falling short for users or leadership?`,
    `What business risks are created by staying with the current approach?`,
    `Which evaluation criteria matter most in a competitive review?`,
    `How important are governance, integration, and time-to-value in the decision?`,
    `Who is most motivated internally to consider an alternative?`,
    `What proof points would help IBM stand apart from the incumbent?`,
    `What timeline is driving the competitive evaluation?`,
  ];

  const ebcQuestions = [
    `Which strategic outcomes matter most to leadership over the next 12 to 24 months?`,
    `How is ${company} thinking about AI investment versus operational risk?`,
    `What board-level concerns are shaping technology priorities right now?`,
    `Which transformation initiatives are most likely to receive executive sponsorship?`,
    `How are ROI and business value measured for strategic technology bets?`,
    `What organizational barriers could slow execution after approval?`,
    `Where could IBM help accelerate value while reducing delivery risk?`,
    `What would make this initiative compelling enough for executive follow-through?`,
  ];

  const questionsByType: Record<string, string[]> = {
    Discovery: discoveryQuestions,
    Renewal: renewalQuestions,
    Competitive: competitiveQuestions,
    EBC: ebcQuestions,
  };

  const questions = questionsByType[callType] ?? discoveryQuestions;

  const recommendationSets: Record<string, string[]> = {
    Technology: ["IBM watsonx.ai", "IBM watsonx.data", "IBM Instana"],
    "Financial Services": ["IBM watsonx.governance", "IBM OpenPages", "IBM watsonx.data"],
    Healthcare: ["IBM watsonx.ai", "IBM watsonx.governance", "IBM Cloud Pak for Data"],
    Retail: ["IBM watsonx.ai", "IBM Cognos Analytics", "IBM Turbonomic"],
    Manufacturing: ["IBM Instana", "IBM watsonx.data", "IBM Turbonomic"],
    Insurance: ["IBM OpenPages", "IBM watsonx.governance", "IBM Cognos Analytics"],
    Energy: ["IBM Maximo", "IBM Instana", "IBM watsonx.data"],
    Government: ["IBM watsonx.governance", "IBM Cloud Pak for Data", "IBM Cognos Analytics"],
  };

  const recommendations = recommendationSets[normalizedIndustry] ?? recommendationSets["Technology"];

  return `## Who is ${contact}?

${contact} appears to be operating in a ${title} capacity at ${company}, which means they are likely balancing execution needs with cross-functional coordination. In a ${normalizedIndustry} environment, leaders in this kind of role typically care about reducing operational friction, improving visibility into outcomes, and making sure new initiatives can be adopted without creating unnecessary delivery risk.

For a ${callType} conversation, the most effective approach is to connect IBM's value to practical business priorities rather than abstract innovation themes. ${contextLine}

## Company Background

${company} appears to be operating in the ${normalizedIndustry} space, where teams are under pressure to improve efficiency, decision quality, and resilience while still moving quickly. Organizations in this segment often evaluate AI, data, and automation investments based on how well they improve governance, accelerate insight, and support measurable business outcomes.

A strong briefing for ${company} should assume a need for pragmatic modernization: better access to trusted data, clearer operational visibility, and solutions that can scale without adding unnecessary complexity. Recent market conditions across ${normalizedIndustry} continue to reward vendors that can show fast time-to-value, strong governance, and credible integration with existing workflows.

## ${callType === "Renewal" ? "Renewal & Expansion Questions" : callType === "Competitive" ? "Competitive Discovery Questions" : callType === "EBC" ? "Executive Engagement Questions" : "Discovery Questions"}

1. ${questions[0]}
2. ${questions[1]}
3. ${questions[2]}
4. ${questions[3]}
5. ${questions[4]}
6. ${questions[5]}
7. ${questions[6]}
8. ${questions[7]}

## ${callType === "Renewal" ? "Expansion Qualification" : callType === "Competitive" ? "Win/Loss Qualification" : callType === "EBC" ? "Business Case Qualification" : "Opportunity Qualification"}

***Budget***: Budget is most likely available when the initiative is tied to efficiency, risk reduction, or faster decision-making. Position value in terms of measurable business outcomes rather than technical features.

***Authority***: ${contact} may influence requirements and internal momentum, but final approval likely depends on additional business and technology stakeholders. Confirm who owns budget, architecture, and procurement decisions.

***Need***: The likely need is better visibility, governance, and execution speed in a way that fits existing workflows. Validate where current tools are creating friction or limiting scale.

***Timeline***: Timing is probably driven by planning cycles, active transformation work, or pressure to show near-term results. Identify whether urgency is operational, strategic, or competitive.

***Champion***: A strong champion will care about practical adoption, low disruption, and clear business value. Build the case around outcomes they can defend internally.

***Political Blockers***: Common blockers include competing priorities, incumbent vendors, and uncertainty about implementation effort. Reduce risk by emphasizing phased adoption and integration with current processes.

## ${callType === "Renewal" ? "Retention & Upsell Positioning" : callType === "Competitive" ? "IBM Differentiation" : callType === "EBC" ? "Strategic Investment Themes" : "Product Recommendations"}

*${recommendations[0]}*
Combined positioning: Strong fit for ${company}'s ${normalizedIndustry.toLowerCase()} priorities around scalable AI and faster business insight.

*${recommendations[1]}*
Combined positioning: Helps unify trusted data and governance so teams can move faster with lower operational risk.

*${recommendations[2]}*
Combined positioning: Supports measurable operational improvement with better visibility, resilience, and execution discipline.`;
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
  const title = contactTitle || "professional";

  // Detect if context contains structured web research (injected by /company-research endpoint)
  const RESEARCH_MARKER = "Company Overview (from web):";
  const hasResearch = context && context.includes(RESEARCH_MARKER);
  const researchBlock = hasResearch ? context : "";
  const userContext = hasResearch ? "None" : (context || "None");

  const prompt = `You are an expert enterprise sales coach helping a Solutions Engineer prepare for a ${ct} call.

Call details:
- Company: ${company}
- Industry: ${ind}
- Contact: ${contactName || "Unknown"}
- Title: ${title}
- Additional Context: ${userContext}
${researchBlock ? `
## Live Company Research (web search results — use as primary source for Company Background)
${researchBlock}
` : ""}IBM products available:
${IBM_PRODUCTS}

IMPORTANT INSTRUCTIONS:
- For the Company Background section: if Live Company Research is provided above, anchor your analysis in those facts and expand on them. Do not contradict the research data.
- If no live research is provided, draw on your training knowledge and be appropriately measured about uncertainty.
- DO NOT make assumptions about seniority level, tenure, or experience unless explicitly stated in the title
- If the title is generic (like "professional"), tailor content for a mid-level professional, not executives
- Focus on practical, actionable insights rather than assumptions about the contact's influence or authority
- Be accurate and conservative in your assessments

CRITICAL: Write a pre-call briefing with EXACTLY FIVE sections using ## headers in THIS EXACT ORDER:
1. ## Who is [Contact Name]?
2. ## Company Background
3. ## Discovery Questions
4. ## Opportunity Qualification
5. ## Product Recommendations

Each section appears ONLY ONCE. Do not repeat any section headers. Do not add extra sections.
Do NOT include any meta-commentary, chain of thought, self-correction, or notes about your instructions.
Do NOT write things like "Since the response needs to..." or "I'll rewrite according to..." or "adhering to providing..."
Just write the briefing content directly. No preamble, no postscript.

For product names: Use *italic* format (single asterisks), NOT bold (**).
Keep everything clean and professional — no extra markdown symbols like ---, or ### in the output.

${buildSections(ct, company, ind, title, contactName)}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = generateTextStream(prompt, {
      model: "meta-llama/llama-3-1-8b-instruct",
      maxTokens: 2000,
      temperature: 0.6,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    req.log.info({ company, callType: ct }, "Briefing generation completed successfully");
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err, company, callType: ct }, "Briefing generation failed");
    const fallbackBriefing = buildFallbackBriefing({
      company,
      industry: ind,
      contactName,
      contactTitle: title,
      callType: ct,
      context: userContext,
    });
    res.write(`data: ${JSON.stringify({ content: fallbackBriefing })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, fallback: true })}\n\n`);
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

// Server-side pulse cache (30 min TTL)
let pulseCache: { items: any[]; expiresAt: number } | null = null;

router.get("/pulse", async (req, res) => {
  try {
    // Serve from cache if still valid
    if (pulseCache && Date.now() < pulseCache.expiresAt) {
      res.setHeader("Cache-Control", "public, max-age=1800");
      res.json(pulseCache.items);
      return;
    }

    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const prompt = `You are a sales intelligence assistant. Generate 5 realistic enterprise AI and technology news headlines for ${today} from Bloomberg, WSJ, or TechCrunch. Respond ONLY with a JSON array. Example: [{"title": "IBM Expands watsonx Platform", "source": "Bloomberg", "date": "${today}", "url": null}]`;

    const stream = generateTextStream(prompt, { maxTokens: 800, temperature: 0.7, model: "meta-llama/llama-3-1-8b-instruct" });
    let raw = "";
    for await (const chunk of stream) { raw += chunk; }

    const match = raw.match(/\[([\s\S]*?)\]/);
    if (!match) { res.json([]); return; }

    let items: any[] = [];
    try { items = JSON.parse(match[0]); } catch { res.json([]); return; }

    const itemsWithUrls = items.slice(0, 5).map((item: any) => ({
      ...item,
      url: `https://news.google.com/search?q=${encodeURIComponent(item.title)}&hl=en-US&gl=US&ceid=US:en`,
    }));

    // Store in cache for 30 minutes
    pulseCache = { items: itemsWithUrls, expiresAt: Date.now() + 30 * 60 * 1000 };

    res.setHeader("Cache-Control", "public, max-age=1800");
    res.json(itemsWithUrls);
  } catch (err) {
    req.log.error({ err }, "Pulse news generation failed");
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

// ─── Company Research ────────────────────────────────────────────────────────
// Searches the web for real company background and returns a structured
// research summary to be injected into the briefing prompt as `context`.
router.get("/company-research", async (req, res) => {
  const company = String(req.query["company"] || "").trim();
  const industry = String(req.query["industry"] || "").trim();
  const contactTitle = String(req.query["contactTitle"] || "").trim();

  if (!company) {
    res.json({ summary: "" });
    return;
  }

  try {
    // Run two searches in parallel: company overview + recent AI/tech initiatives
    const queries = [
      `${company} company overview business model ${industry}`,
      `${company} AI digital transformation technology strategy 2024 2025`,
    ];

    const fetchSearch = async (query: string): Promise<string> => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": getRandomUserAgent(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return "";
      return response.text();
    };

    const [overviewHtml, techHtml] = await Promise.all(queries.map(fetchSearch));

    // Extract meaningful text snippets from DDG result snippets
    const extractSnippets = (html: string, maxSnippets = 5): string[] => {
      const snippets: string[] = [];
      // DDG result snippets live in <a class="result__snippet"> or .result__body
      const snippetRegex = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = snippetRegex.exec(html)) !== null && snippets.length < maxSnippets) {
        const text = match[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ").trim();
        if (text.length > 60) snippets.push(text);
      }
      // Also grab result__body paragraphs as fallback
      if (snippets.length < 2) {
        const bodyRegex = /<div[^>]+class="[^"]*result__body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        while ((match = bodyRegex.exec(html)) !== null && snippets.length < maxSnippets) {
          const text = match[1]
            .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (text.length > 60) snippets.push(text);
        }
      }
      return snippets;
    };

    const overviewSnippets = extractSnippets(overviewHtml, 5);
    const techSnippets = extractSnippets(techHtml, 4);

    // Build a structured research block to inject into the LLM prompt
    const researchText = [
      overviewSnippets.length ? `Company Overview (from web):\n${overviewSnippets.join("\n")}` : "",
      techSnippets.length ? `Technology & AI Initiatives (from web):\n${techSnippets.join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    if (!researchText) {
      req.log.warn({ company }, "Company research: no snippets extracted");
      res.json({ summary: "" });
      return;
    }

    req.log.info(
      { company, overviewCount: overviewSnippets.length, techCount: techSnippets.length },
      "Company research fetched successfully"
    );

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({ summary: researchText });
  } catch (err) {
    req.log.error({ err, company }, "Company research failed");
    res.json({ summary: "" });
  }
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
    let jobTitle = "";
    
    // Demo mode: hardcoded profiles for testing
    const DEMO_PROFILES: Record<string, { name: string; company: string; title: string }> = {
      "lisbeth-dereaux-90912622": {
        name: "Lisbeth Dereaux",
        company: "Griffitts LLP",
        title: "Vice President, Legal Operations"
      },
      "jamiedimon": {
        name: "Jamie Dimon",
        company: "JP Morgan Chase",
        title: "Chairman & CEO"
      }
    };
    
    // Check if this is a demo profile
    if (DEMO_PROFILES[slug]) {
      const demo = DEMO_PROFILES[slug];
      name = demo.name;
      companyName = demo.company;
      jobTitle = demo.title;
      req.log.info({ slug, name, companyName, jobTitle }, "Using demo profile data");
    }
    
    // Try to fetch actual LinkedIn profile data if not a demo profile
    if (!name) {
      try {
      const profileUrl = `https://www.linkedin.com/in/${slug}`;
      const response = await fetch(profileUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          'Referer': 'https://www.google.com/'
        },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        const html = await response.text();

        // LinkedIn almost always redirects server-side fetches to an auth wall.
        // Detect this and bail out immediately so we fall through to web search.
        const isAuthWall = (
          html.includes('id="sign-in-modal"') ||
          html.includes('authwall') ||
          html.includes('join-linkedin') ||
          html.includes('login?session_redirect') ||
          html.includes('"showLoginMethods"') ||
          // Auth wall title is exactly "LinkedIn" or "LinkedIn: Log In or Sign Up"
          /<title>\s*LinkedIn[\s:]/i.test(html)
        );

        if (isAuthWall) {
          req.log.info({ slug }, "LinkedIn returned auth wall, falling through to web search");
        } else {
        // ── Only run HTML extraction if we got a real profile page ──────────

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
        
        // ── Extract title and company from HTML (multiple methods) ──────────

        // Method T1: <title> tag — format "Name - Title - Company | LinkedIn"
        // Handle titles with internal hyphens by only splitting on the LAST two dashes
        // e.g. "Lisbeth Dereaux - Attorney-at-Law - Griffitts LLP | LinkedIn"
        //       parts: ["Lisbeth Dereaux", "Attorney-at-Law", "Griffitts LLP"]
        const titleTagRaw = html.match(/<title>([^|<]+)/i)?.[1] || "";
        if (titleTagRaw) {
          // Strip trailing "| LinkedIn" noise
          const cleanTag = titleTagRaw.replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
          // Split on " - " (space-hyphen-space) to avoid breaking hyphenated words
          const parts = cleanTag.split(/\s+-\s+/).map(p => p.trim());
          if (parts.length >= 3) {
            // Title = everything between first and last segment
            const titleCandidate = parts.slice(1, -1).join(" - "); // rejoin if title itself had " - "
            if (!jobTitle && titleCandidate.length > 1 && titleCandidate.length < 150) {
              jobTitle = titleCandidate;
            }
            // Company = last segment
            if (!companyName) {
              const potential = parts[parts.length - 1];
              if (potential.length > 2 && potential.length < 100 && !potential.includes('&')) {
                companyName = potential;
              }
            }
          } else if (parts.length === 2) {
            // Some profiles: "Name - Company" with no title shown
            if (!companyName) {
              const potential = parts[1];
              if (potential.length > 2 && potential.length < 100) companyName = potential;
            }
          }
        }

        // Method T2: og:description — LinkedIn often includes "Title at Company" here
        if (!jobTitle) {
          const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/i)?.[1] || "";
          if (ogDesc) {
            // Format: "View Name's profile... Title at Company"
            const titleAtMatch = ogDesc.match(/^([^.•·|]+?)\s+at\s+/i);
            if (titleAtMatch?.[1]) {
              const candidate = titleAtMatch[1].replace(/^View\s+\S+(?:'s)?\s+profile[^.]*\.\s*/i, "").trim();
              if (candidate.length > 1 && candidate.length < 150 && !/linkedin/i.test(candidate)) {
                jobTitle = candidate;
              }
            }
          }
        }

        // Method T3: JSON-LD Person schema — jobTitle field
        if (!jobTitle) {
          const jsonLdBlocks = html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/gi);
          for (const block of jsonLdBlocks) {
            try {
              const jsonData = JSON.parse(block[1]);
              if (jsonData["@type"] === "Person") {
                if (jsonData.jobTitle) {
                  jobTitle = String(jsonData.jobTitle).trim();
                  break;
                }
                // hasCredential or description sometimes carries title info
                if (!jobTitle && jsonData.description) {
                  const descMatch = String(jsonData.description).match(/^([^.•·|@]{3,100}?)\s+at\s+/i);
                  if (descMatch?.[1]) jobTitle = descMatch[1].trim();
                }
              }
            } catch { /* ignore */ }
          }
        }

        // Method T4: headline meta — some LinkedIn pages expose it
        if (!jobTitle) {
          const headlineMeta = html.match(/name="description"\s+content="([^"]{5,200})"/i)?.[1] || "";
          if (headlineMeta) {
            const headlineMatch = headlineMeta.match(/^([^.|•·]{3,120}?)\s+at\s+/i);
            if (headlineMatch?.[1] && !/linkedin/i.test(headlineMatch[1])) {
              jobTitle = headlineMatch[1].trim();
            }
          }
        }
        
        // Fallback: Extract company using multiple methods
        // Method 1: Look for company in title tag - most reliable (e.g., "Name - Title - Company | LinkedIn")
        const titleCompanyMatch = html.match(/<title>[^-|]+-[^-|]+-\s*([^|<]+)/i);
        if (!companyName && titleCompanyMatch && titleCompanyMatch[1]) {
          const potential = titleCompanyMatch[1].trim().replace(/\s*-?\s*LinkedIn.*$/i, '').trim();
          // Clean up common suffixes and validate
          const cleaned = potential.replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
          if (cleaned && cleaned.length > 2 && cleaned.length < 100 && !cleaned.includes('&')) {
            companyName = cleaned;
          }
        }
        
        // Method 2: og:description with "at [Company]" pattern (fallback)
        if (!companyName) {
          let companyMatch = html.match(/property="og:description"\s+content="[^"]*\bat\s+([^"|•·\n]+)/i);
          if (companyMatch && companyMatch[1]) {
            const potential = companyMatch[1].trim().split(/[•·|]/)[0].trim();
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

        } // end else (not auth wall)
      } else {
        req.log.warn({ slug, status: response.status }, "LinkedIn profile fetch returned non-OK status");
      }
      } catch (fetchErr) {
        req.log.warn({ err: fetchErr, slug }, "Failed to fetch LinkedIn profile, falling back to slug parsing");
      }
    } // end if (!name)
    
    // Fallback: parse name from slug if fetch failed
    if (!name) {
      // Handle cases like "jamiedimon" by detecting capital letters as word boundaries
      let parsedName = slug
        .replace(/[-_]/g, " ")
        .replace(/\d+/g, "")
        .replace(/\b(iii|ii|iv|vi|vii|viii|jr|sr)\b/gi, match => match.toUpperCase())
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, " ")
        .trim();
      
      // If no spaces found (all lowercase like "jamiedimon"), try common name patterns
      if (!parsedName.includes(" ") && parsedName.length > 4) {
        const commonFirstNames = ['aaron','adam','alan','albert','alex','alfred','allen','amanda','amber','andrew',
          'anthony','ashley','barbara','blake','bradley','brandon','brett','brian','brittany','carlos',
          'casey','charles','chelsea','chris','christopher','daniel','dante','darius','david','dennis',
          'derek','dexter','dominic','donald','douglas','drew','elizabeth','emily','hannah','heather',
          'jacob','jake','james','jared','jarrett','jarrod','jason','jeffrey','jennifer','jeremy',
          'jerome','jerry','jesse','jimmy','joel','joey','john','jonathan','jonah','jordan','jorge',
          'jose','joseph','joshua','juan','julian','julius','justin','karen','karl','katherine',
          'keith','kenneth','kevin','kyle','lance','larry','lauren','lawrence','leon','leonard',
          'leroy','lewis','liam','linda','logan','louis','lucas','luke','marcus','mark','mary',
          'mason','matthew','max','megan','melissa','michael','miles','mitchell','morgan','nathan',
          'neil','nelson','nicholas','nicole','noah','omar','oscar','owen','parker','patricia',
          'patrick','paul','perry','peter','phillip','pierce','preston','quentin','rachel','randy',
          'raymond','reed','reginald','rex','richard','rick','riley','robert','robin','rodney',
          'roger','roland','ronald','ross','roy','ruben','russell','ryan','sam','sarah','scott',
          'sean','seth','shane','shawn','simon','spencer','stanley','stephanie','steven','stephen',
          'susan','tanner','taylor','ted','terry','theo','thomas','timothy','travis','trevor',
          'troy','tucker','tyler','victor','vincent','walter','warren','wayne','wesley','weston',
          'william','zach','zachary'];
        
        // Try longest matching first name first to avoid "al" matching "alex"
        const sorted = [...commonFirstNames].sort((a, b) => b.length - a.length);
        for (const firstName of sorted) {
          if (parsedName.toLowerCase().startsWith(firstName)) {
            parsedName = firstName + ' ' + parsedName.slice(firstName.length);
            break;
          }
        }
      }
      
      name = parsedName
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

    // If we couldn't extract company OR title from LinkedIn, try web search.
    // Guard only requires the slug — runs even when name is still empty (auth wall case).
    if (!companyName || !jobTitle) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

        // Derive a best-effort display name from the slug for search queries
        const nameForSearch = name || slug
          .replace(/-[a-z0-9]{4,}$/i, '')   // strip trailing LinkedIn ID suffix
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

        // Primary: slug-anchored search surfaces the cached "Name - Title - Company | LinkedIn" snippet
        const searchQuery = encodeURIComponent(`"${nameForSearch}" linkedin title company`);
        const fallbackQuery = encodeURIComponent(`linkedin.com/in/${slug}`);

        const doSearch = async (q: string): Promise<string> => {
          const url = `https://html.duckduckgo.com/html/?q=${q}`;
          const resp = await fetch(url, {
            headers: {
              'User-Agent': getRandomUserAgent(),
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Referer': 'https://www.google.com/',
              'Cache-Control': 'max-age=0',
            },
            signal: AbortSignal.timeout(8000),
          });
          return resp.ok ? resp.text() : "";
        };

        // Returns { name, company, title } extracted from a DDG results page
        const tryExtract = (searchHtml: string): { name: string; company: string; title: string } => {
          const empty = { name: "", company: "", title: "" };
          if (!searchHtml) return empty;
          if ((searchHtml.includes('DuckDuckGo') && searchHtml.includes('challenge')) ||
              searchHtml.includes('anomaly') || searchHtml.includes('Select all squares')) return empty;

          let foundName = "";
          let foundCompany = "";
          let foundTitle = "";

          // Pattern 1: LinkedIn cached snippet "Name - Title - Company | LinkedIn"
          // This is the most reliable source — DDG caches the LinkedIn title tag verbatim.
          // Split on " - " (space-dash-space) to preserve hyphenated words in titles.
          const liTitleSnippet = searchHtml.match(/([A-Z][^<]{2,180}?)\s*\|\s*LinkedIn/i);
          if (liTitleSnippet?.[1]) {
            const parts = liTitleSnippet[1].split(/\s+-\s+/).map(p => p.trim()).filter(Boolean);
            if (parts.length >= 3) {
              foundName    = parts[0];
              foundTitle   = parts.slice(1, -1).join(" - ");
              foundCompany = parts[parts.length - 1];
            } else if (parts.length === 2) {
              foundName    = parts[0];
              foundCompany = parts[1];
            } else if (parts.length === 1) {
              foundName    = parts[0];
            }
          }

          // Pattern 2: "Title at Company" anywhere in result snippets
          if (!foundTitle || !foundCompany) {
            const firstNameToken = (foundName || nameForSearch).split(' ')[0];
            const titleAtCompany = searchHtml.match(
              new RegExp(`${firstNameToken}[^<]{0,30}?([A-Z][A-Za-z &'.,/-]{2,100})\\s+at\\s+([A-Z][A-Za-z0-9 &'.,]{2,80})`, 'i')
            );
            if (titleAtCompany) {
              if (!foundTitle) foundTitle   = titleAtCompany[1].trim().replace(/^[-–]\s*/, '');
              if (!foundCompany) foundCompany = titleAtCompany[2].trim().replace(/\s*[-–|].*$/, '').trim();
            }
          }

          // Pattern 3: "works/working/employed at Company" — company only
          if (!foundCompany) {
            const worksAt = searchHtml.match(/(?:works|working|employed)\s+at\s+([A-Z][A-Za-z0-9 &'.,]{2,60})/i);
            if (worksAt?.[1]) foundCompany = worksAt[1].trim().replace(/\s*[-–|].*$/, '').trim();
          }

          // Sanitize — never leak "DuckDuckGo" or "LinkedIn" as field values
          const sanitize = (s: string) => /duckduckgo|^linkedin$/i.test(s.trim()) ? "" : s;

          return {
            name:    sanitize(foundName),
            company: sanitize(foundCompany),
            title:   sanitize(foundTitle),
          };
        };

        let searchHtml = await doSearch(searchQuery);
        let extracted = tryExtract(searchHtml);

        if (!extracted.company && !extracted.title && !extracted.name) {
          searchHtml = await doSearch(fallbackQuery);
          extracted = tryExtract(searchHtml);
        }

        if (!name && extracted.name) {
          name = extracted.name;
          req.log.info({ slug, name, method: 'web-search' }, 'Found name via web search');
        }
        if (!companyName && extracted.company) {
          companyName = extracted.company;
          req.log.info({ name, companyName, method: 'web-search' }, 'Found company via web search');
        }
        if (!jobTitle && extracted.title) {
          jobTitle = extracted.title;
          req.log.info({ name, jobTitle, method: 'web-search' }, 'Found title via web search');
        }
      } catch (searchErr) {
        req.log.warn({ err: searchErr, name }, 'Web search for company/title failed');
      }
    }

    // Derive industry from company name using the existing maps
    let detectedIndustry = "";
    if (companyName) {
      const compLower = companyName.toLowerCase().trim();
      const directHit = INDUSTRY_MAP[compLower];
      if (directHit) {
        detectedIndustry = directHit;
      } else {
        for (const [mapKey, mapIndustry] of Object.entries(INDUSTRY_MAP)) {
          if (compLower.includes(mapKey) || mapKey.includes(compLower)) {
            detectedIndustry = mapIndustry;
            break;
          }
        }
        if (!detectedIndustry) {
          for (const [mapIndustry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
            if (keywords.some(kw => compLower.includes(kw))) {
              detectedIndustry = mapIndustry;
              break;
            }
          }
        }
      }
    }
    
    // If we have a company name, try to find their website
    let companyWebsite = "";
    if (companyName) {
      try {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
        const searchQuery = encodeURIComponent(`${companyName} official website`);
        const searchUrl = `https://html.duckduckgo.com/html/?q=${searchQuery}`;
        
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          signal: AbortSignal.timeout(6000)
        });
        
        if (searchResponse.ok) {
          const searchHtml = await searchResponse.text();
          
          // Extract first result URL
          const urlMatch = searchHtml.match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"/i);
          if (urlMatch && urlMatch[1]) {
            try {
              const url = new URL(urlMatch[1]);
              // Clean up the domain
              companyWebsite = `${url.protocol}//${url.hostname}`;
              req.log.info({ companyName, companyWebsite }, 'Found company website via search');
            } catch (e) {
              // Invalid URL, skip
            }
          }
        }
      } catch (err) {
        req.log.warn({ err, companyName }, 'Failed to search for company website');
      }
    }
    
    req.log.info({ slug, name, jobTitle, companyName, detectedIndustry, companyWebsite }, `LinkedIn parse result for ${slug}`);
    res.json({
      name: name || contact,
      photoUrl,
      company: companyName,
      title: jobTitle,
      industry: detectedIndustry,
      website: companyWebsite,
    });
  } catch (err) {
    req.log.error({ err, contact }, "Contact parsing failed");
    res.json({ name: contact, photoUrl: "", company: "" });
  }
});

export default router;

// Made with Bob
