import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useGetBriefingLogo, useGetBriefingIndustry, getBaseUrl } from "@/lib/api-client";

/* ─── User Info Hook ─── */
function useUserInfo() {
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");
  const [userRole, setUserRole] = useState(() => localStorage.getItem("userRole") || "");
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(() => localStorage.getItem("userProfilePicture"));

  useEffect(() => {
    const name = localStorage.getItem("userName") || "";
    const role = localStorage.getItem("userRole") || "";
    const picture = localStorage.getItem("userProfilePicture");
    setUserName(name);
    setUserRole(role);
    setUserProfilePicture(picture);
  }, []);

  return { userName, userRole, userProfilePicture };
}

/* ─── Types ─── */
type Theme = "dark" | "light";

interface SavedBriefing {
  co: string; ct: string; ti: string; ind: string;
  callType: string; text: string; logoUrl: string;
  contactPhotoUrl?: string;
  prospectStep1?: string;
  prospectStep2?: string;
  architectureDiagram?: string;
  date: string; ts: number;
}

const MEETING_TYPES = ["Discovery", "Renewal", "Competitive"] as const;
type MeetingType = typeof MEETING_TYPES[number];

// Rotating placeholder examples for the account field (cycles while empty).
const ACCOUNT_PLACEHOLDERS = [
  'Company name — try "JPMorgan Chase"',
  'Company name — try "Nike"',
  'Company name — try "HSBC"',
  'Company name — try "Celonis"',
];

// One-click sample chips: company name + call type
const SAMPLE_CHIPS: { label: string; company: string; type: "Discovery"|"Renewal"|"Competitive" }[] = [
  { label: "Celonis", company: "Celonis", type: "Discovery" },
  { label: "HSBC", company: "HSBC", type: "Discovery" },
  { label: "Conduent", company: "Conduent", type: "Competitive" },
];

// Curated industry hints for well-known accounts. Only used to surface a real,
// known value — unknown companies simply show no industry line (never guessed).
const KNOWN_INDUSTRIES: [string, string][] = [
  ["celonis", "Process Intelligence"],
  ["jpmorgan", "Financial Services"], ["jp morgan", "Financial Services"], ["jpmc", "Financial Services"], ["chase", "Financial Services"],
  ["goldman", "Financial Services"], ["citi", "Financial Services"], ["morgan stanley", "Financial Services"], ["capital one", "Financial Services"],
  ["nike", "Retail & Apparel"], ["walmart", "Retail"], ["target", "Retail"], ["cvs", "Healthcare & Retail"],
  ["salesforce", "CRM / SaaS"], ["snowflake", "Data Cloud"], ["databricks", "Data & AI Platform"],
  ["microsoft", "Enterprise Software"], ["oracle", "Enterprise Software"], ["sap", "Enterprise Software"], ["servicenow", "Enterprise Software"],
  ["aws", "Cloud Infrastructure"], ["amazon", "E-commerce & Cloud"], ["google", "Technology"], ["meta", "Technology"],
  ["pfizer", "Pharmaceuticals"], ["merck", "Pharmaceuticals"], ["unitedhealth", "Healthcare"],
  ["delta", "Airlines"], ["united airlines", "Airlines"], ["american airlines", "Airlines"],
  ["exxon", "Oil & Gas"], ["chevron", "Oil & Gas"], ["shell", "Oil & Gas"],
];
function detectIndustry(name: string): string {
  const n = name.trim().toLowerCase();
  if (!n) return "";
  for (const [k, v] of KNOWN_INDUSTRIES) if (n.includes(k)) return v;
  return "";
}

/* ─── Theme tokens ─── */
const DARK = {
  // True IBM Carbon dark: near-black canvas, surfaces by elevation, high-contrast text.
  bodyBg: "radial-gradient(900px circle at 50% -8%, rgba(69,137,255,0.07), transparent 55%), linear-gradient(160deg,#0d0d0d 0%,#161616 45%,#0a0a0a 100%)",
  sidebar: "#161616", sidebarBorder: "rgba(255,255,255,0.08)",
  card: "#1c1c1c", cardBorder: "rgba(255,255,255,0.08)",
  cardShadow: "inset 0 1px 0 rgba(255,255,255,0.05),0 2px 16px rgba(0,0,0,0.4)",
  input: "#161616", inputBorder: "rgba(255,255,255,0.12)",
  text: "#f4f4f4", textSub: "#c6c6c6",
  textMuted: "#8d8d8d", textDim: "#6f6f6f",
  divider: "rgba(255,255,255,0.08)",
  btn: "rgba(255,255,255,0.10)", btnBorder: "rgba(255,255,255,0.16)", btnText: "#e0e0e0",
  btnSm: "rgba(255,255,255,0.05)", btnSmBorder: "rgba(255,255,255,0.12)", btnSmText: "#8d8d8d",
  pill: "#1c1c1c", pillBorder: "rgba(255,255,255,0.08)",
  chipBg: "#1c1c1c", chipBorder: "rgba(255,255,255,0.08)",
  accent: "#4589ff", accentGlow: "rgba(69,137,255,0.7)",
  mtActive: "rgba(15,98,254,0.18)", mtActiveBorder: "rgba(15,98,254,0.55)", mtActiveText: "#78a9ff",
  mtInactive: "rgba(255,255,255,0.05)", mtInactiveBorder: "rgba(255,255,255,0.10)", mtInactiveText: "#8d8d8d",
  sectionCard: "#1c1c1c", sectionCardBorder: "rgba(255,255,255,0.08)",
  sectionHeaderBorder: "rgba(255,255,255,0.07)",
  sectionText: "#c6c6c6", sectionBullet: "#a8a8a8",
  overlay: "rgba(13,13,13,0.97)",
  toggleBg: "rgba(255,255,255,0.08)", toggleBorder: "rgba(255,255,255,0.14)", toggleIcon: "#c6c6c6",
  progressBar: "rgba(69,137,255,0.7)",
  badgeBg: "rgba(69,137,255,0.10)", badgeBorder: "rgba(69,137,255,0.20)", badgeText: "#78a9ff",
  nameLine: "#f4f4f4", dateText: "#6f6f6f",
  topBar: "rgba(255,255,255,0.07)",
};

const LIGHT = {
  bodyBg: "linear-gradient(160deg,#f4f4f8 0%,#ffffff 35%,#f0f0f5 65%,#ebebf0 100%)",
  sidebar: "rgba(0,0,0,0.03)", sidebarBorder: "rgba(0,0,0,0.08)",
  card: "rgba(255,255,255,0.95)", cardBorder: "rgba(0,0,0,0.09)",
  cardShadow: "0 1px 4px rgba(0,0,0,0.05),0 2px 12px rgba(0,0,0,0.04)",
  input: "rgba(255,255,255,0.85)", inputBorder: "rgba(0,0,0,0.12)",
  text: "rgba(0,0,0,0.85)", textSub: "rgba(0,0,0,0.60)",
  textMuted: "rgba(0,0,0,0.42)", textDim: "rgba(0,0,0,0.28)",
  divider: "rgba(0,0,0,0.07)",
  btn: "rgba(0,0,0,0.07)", btnBorder: "rgba(0,0,0,0.13)", btnText: "rgba(0,0,0,0.78)",
  btnSm: "rgba(0,0,0,0.05)", btnSmBorder: "rgba(0,0,0,0.10)", btnSmText: "rgba(0,0,0,0.60)",
  pill: "rgba(0,0,0,0.05)", pillBorder: "rgba(0,0,0,0.09)",
  chipBg: "rgba(0,0,0,0.04)", chipBorder: "rgba(0,0,0,0.08)",
  accent: "#0f62fe", accentGlow: "rgba(15,98,254,0.4)",
  mtActive: "rgba(10,80,200,0.10)", mtActiveBorder: "rgba(10,80,200,0.30)", mtActiveText: "rgba(10,80,200,0.85)",
  mtInactive: "rgba(0,0,0,0.04)", mtInactiveBorder: "rgba(0,0,0,0.10)", mtInactiveText: "rgba(0,0,0,0.55)",
  sectionCard: "rgba(255,255,255,0.95)", sectionCardBorder: "rgba(0,0,0,0.09)",
  sectionHeaderBorder: "rgba(0,0,0,0.06)",
  sectionText: "rgba(0,0,0,0.60)", sectionBullet: "rgba(0,0,0,0.65)",
  overlay: "rgba(240,240,245,0.96)",
  toggleBg: "rgba(0,0,0,0.06)", toggleBorder: "rgba(0,0,0,0.12)", toggleIcon: "rgba(0,0,0,0.6)",
  progressBar: "rgba(15,98,254,0.7)",
  badgeBg: "rgba(10,80,200,0.08)", badgeBorder: "rgba(10,80,200,0.18)", badgeText: "rgba(10,80,200,0.80)",
  nameLine: "rgba(0,0,0,0.85)", dateText: "rgba(0,0,0,0.30)",
  topBar: "rgba(0,0,0,0.05)",
};


/* ─── Prospect Loading Screen ─── */
function ProspectLoadingScreen({ t, companyName }: { t: any; companyName: string }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState(0);

  const messages = [
    `Researching ${companyName || "company"}…`,
    "Scanning industry landscape…",
    "Mapping IBM product fit…",
    "Identifying key buyer personas…",
    "Building use cases…",
    "Drafting sales play…",
    "Finalizing recommendations…",
  ];

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length);
    }, 2800);
    const dotTimer = setInterval(() => {
      setDots(d => (d + 1) % 4);
    }, 500);
    return () => { clearInterval(msgTimer); clearInterval(dotTimer); };
  }, []);

  const dotStr = ".".repeat(dots);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:32}}>
      {/* Spinning ring */}
      <div style={{position:"relative",width:56,height:56}}>
        <div style={{
          position:"absolute",inset:0,borderRadius:"50%",
          border:`3px solid ${t.divider}`,
        }}/>
        <div style={{
          position:"absolute",inset:0,borderRadius:"50%",
          border:"3px solid transparent",
          borderTopColor:t.accent,
          animation:"spin 0.9s linear infinite",
        }}/>
        <div style={{
          position:"absolute",inset:8,borderRadius:"50%",
          background:"rgba(69,137,255,0.08)",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <span style={{fontSize:16}}>🔍</span>
        </div>
      </div>

      {/* Status message */}
      <div style={{textAlign:"center",maxWidth:340}}>
        <p style={{fontSize:15,fontWeight:500,color:t.text,margin:"0 0 8px",minHeight:24}}>
          {messages[msgIndex]}{dotStr}
        </p>
        <p style={{fontSize:12,color:t.textMuted,margin:0}}>
          Generating your IBM prospecting report — usually takes 15–30 seconds
        </p>
      </div>

      {/* Progress bar */}
      <div style={{width:280,height:3,borderRadius:2,background:t.divider,overflow:"hidden"}}>
        <div style={{
          height:"100%",borderRadius:2,background:t.accent,
          animation:"progress-slide 1.4s ease-in-out infinite",
        }}/>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
// Map a DB row (snake_case) to the frontend SavedBriefing shape
function dbRowToBriefing(row: any): SavedBriefing {
  // Drizzle returns camelCase keys; accept both for safety.
  return {
    co:   row.company                                    ?? "",
    ct:   (row.contactName   ?? row.contact_name)        ?? "",
    ti:   (row.contactTitle  ?? row.contact_title)       ?? "",
    ind:  row.industry                                   ?? "",
    callType:            (row.callType    ?? row.call_type)              ?? "Discovery",
    text:                row.text                                        ?? "",
    logoUrl:             (row.logoUrl     ?? row.logo_url)               ?? "",
    contactPhotoUrl:     (row.contactPhotoUrl ?? row.contact_photo_url)  ?? "",
    prospectStep1:       (row.prospectStep1   ?? row.prospect_step1)     ?? "",
    prospectStep2:       (row.prospectStep2   ?? row.prospect_step2)     ?? "",
    architectureDiagram: (row.architectureDiagram ?? row.architecture_diagram) ?? "",
    date: row.createdAt ?? row.created_at
      ? new Date(typeof (row.createdAt ?? row.created_at) === "number"
          ? (row.createdAt ?? row.created_at) * 1000
          : (row.createdAt ?? row.created_at))
          .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
    ts: (() => { const v = row.createdAt ?? row.created_at; return typeof v === "number" ? v * 1000 : Date.parse(v); })(),
    _id: row.id,
  } as SavedBriefing & { _id?: number };
}

async function loadSavedFromApi(): Promise<SavedBriefing[]> {
  try {
    const r = await fetch("/api/history/briefings");
    if (!r.ok) return [];
    const rows = await r.json();
    return (rows as any[]).map(dbRowToBriefing);
  } catch { return []; }
}
function fmtDate() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── PDF Builder (unused — export replaced by window.print) ─── */
// @ts-ignore -- retained for git history; not called at runtime
async function buildPDF(text: string, co: string, ct: string, ind: string, contactPhotoUrl?: string, logoUrl?: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = 10;
  
  const IBM_BLUE = [15, 98, 254];
  const DARK_GRAY = [31, 41, 55];
  const MED_GRAY = [107, 114, 128];
  
  // Strip ALL asterisks from text before parsing - same as HTML rendering
  const cleanText = text.replace(/\*\*\*/g, "").replace(/\*\*/g, "").replace(/\*/g, "");
  
  // Parse sections
  const sections: Record<string, string[]> = {};
  for (const sec of cleanText.split("##").slice(1)) {
    const lines = sec.trim().split("\n");
    const title = lines[0].trim();
    const bullets: string[] = [];
    for (const line of lines.slice(1)) {
      const l = line.trim();
      if (l.match(/^[-*•] /)) bullets.push(l.slice(2).trim());
      else if (l.match(/^\d[.)]/)) bullets.push(l.slice(2).trim());
      else if (l && !l.endsWith(":") && l.length > 10) bullets.push(l);
    }
    if (bullets.length > 0) sections[title] = bullets;
  }
  
  // ═══ HEADER ═══
  doc.setFillColor(IBM_BLUE[0], IBM_BLUE[1], IBM_BLUE[2]);
  doc.rect(0, 0, W, 35, "F");
  
  // Helper function to load image via proxy
  const loadImageViaProxy = async (url: string): Promise<string | null> => {
    try {
      const proxyUrl = `${getBaseUrl()}/api/briefing/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to load image via proxy:", err);
      return null;
    }
  };
  
  // Try to load profile photo, fallback to company logo
  let headerImageData: string | null = null;
  if (contactPhotoUrl) {
    headerImageData = await loadImageViaProxy(contactPhotoUrl);
  }
  if (!headerImageData && logoUrl) {
    headerImageData = await loadImageViaProxy(logoUrl);
  }
  
  // Add image to header — contact photo at 24mm, company logo smaller at 16mm
  const isLogo = !contactPhotoUrl && !!logoUrl;
  const imageSize = isLogo ? 16 : 24;
  const imageX = m;
  const imageY = isLogo ? 9.5 : 5.5;
  
  if (headerImageData) {
    try {
      doc.addImage(headerImageData, "PNG", imageX, imageY, imageSize, imageSize);
    } catch (err) {
      console.error("Failed to add image to PDF:", err);
    }
  }
  
  // Text stacked vertically, positioned to the right of the image
  const titleX = headerImageData ? (m + imageSize + 4) : (m + 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(ct || co, titleX, 14);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(co, titleX, 20);
  
  // Add job title if available
  if (ind) {
    doc.setFontSize(8);
    doc.setTextColor(220, 235, 255);
    doc.text(ind, titleX, 25);
  }
  
  doc.setFontSize(7);
  doc.setTextColor(200, 220, 255);
  doc.text(`${new Date().toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"})}`, titleX, ind ? 30 : 26);
  
  // ═══ DYNAMIC CONTENT ═══
  let y = 38;
  const colW = (W - m * 2 - 3) / 2;
  const availableH = H - y - 8; // Space available for content (footer is 8mm)
  
  // Prepare content with fallbacks
  const companyInfo = sections["Company Background"] || sections["Company & Contact Background"] || [];
  const discoveryQs = [
    ...(sections["Discovery Questions"] || []),
    ...(sections["Renewal & Expansion Questions"] || []),
    ...(sections["Competitive Discovery Questions"] || []),
    ...(sections["Executive Engagement Questions"] || []),
    "Where is your data currently stored? (cloud, on-premises, hybrid)",
    "What systems and platforms are you currently using for data management?",
    "What are your biggest challenges with your current data infrastructure?",
    "How do you currently handle data governance and compliance?"
  ].slice(0, 8).map((q, i) => `${i + 1}. ${q.replace(/^[•\-]\s*/, '')}`); // Number questions 1-8
  const qualInfo = [
    ...(sections["Opportunity Qualification"] || []),
    ...(sections["Account Health & Risk"] || []),
    ...(sections["Business Case Qualification"] || []),
    ...(sections["Win/Loss Qualification"] || [])
  ];
  const salesInfo = [
    ...(sections["Executive Profile & Strategic Agenda"] || []),
    ...(sections["Competitive Landscape"] || []),
    "Lead with business outcomes and measurable ROI",
    "Emphasize IBM's enterprise AI governance and compliance",
    "Highlight hybrid cloud flexibility and data sovereignty",
    "Reference industry-specific success stories and case studies",
    "Position watsonx.ai as strategic platform for AI transformation",
    "Discuss integration with existing enterprise systems"
  ];
  // Get product recommendations — use the exact same parseProductRecs logic as the HTML page
  const rawProductContent = [
    ...(sections["Product Recommendations"] || []),
    ...(sections["Retention & Upsell Positioning"] || []),
  ].join("\n");
  const products = parseProductRecs(rawProductContent, ind);
  // Flat strings for height-calculation helpers (name + desc)
  const productInfo = products.map(p => `${p.name}: ${p.desc}`);
  const talkingPoints = [
    ...(sections["Strategic Investment Themes"] || []),
    "Enterprise-grade AI with built-in governance and explainability",
    "Foundation models: IBM Granite, Meta Llama, Mistral Mixtral",
    "Proven ROI: 3-6 month time to value for most deployments",
    "24/7 enterprise support with dedicated success managers",
    "Seamless integration with IBM Cloud Pak and Red Hat OpenShift",
    "Industry compliance: GDPR, HIPAA, SOC 2, ISO 27001 certified",
    "Hybrid deployment: cloud, on-premises, or edge computing",
    "No vendor lock-in: open standards and portable AI models"
  ];
  
  // Calculate dynamic heights based on content
  const contentSets = [
    { title: "Company & Contact Background", items: companyInfo },
    { title: "Discovery Questions", items: discoveryQs },
    { title: "Opportunity Qualification", items: qualInfo },
    { title: "Sales Strategy & Approach", items: salesInfo },
    { title: "IBM Product Recommendations", items: productInfo },
    { title: "Key Talking Points", items: talkingPoints }
  ];
  
  // Calculate minimum content height needed
  const calculateMinHeight = (items: string[], width: number, fontSize: number = 7, usePrefix: boolean = true): number => {
    const lineHeight = fontSize * 0.4; // Dynamic line height based on font size
    const padding = 14 + 2;
    let totalHeight = padding;
    
    doc.setFontSize(fontSize);
    for (const item of items) {
      const prefix = usePrefix ? "• " : "";
      const wrapped = doc.splitTextToSize(`${prefix}${item}`, width - 7);
      totalHeight += wrapped.length * lineHeight + (fontSize * 0.15);
    }
    
    return totalHeight;
  };
  
  // Render box with paragraph text (for Company Background)
  const renderParagraphBox = (x: number, yPos: number, width: number, height: number, title: string, paragraphText: string): void => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yPos, width, height, 1.5, 1.5, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
    doc.text(title, x + 3, yPos + 6);
    
    doc.setDrawColor(IBM_BLUE[0], IBM_BLUE[1], IBM_BLUE[2]);
    doc.setLineWidth(0.5);
    doc.line(x + 3, yPos + 9, x + width - 3, yPos + 9);
    
    // Binary-search: largest font whose wrapped text fills but doesn't overflow the box
    const contentH = height - 16;
    const LH_RATIO = 0.42; // must match renderBox below
    let lo = 6.5, hi = 11, bestSize = 7;
    while (hi - lo > 0.05) {
      const mid = (lo + hi) / 2;
      doc.setFontSize(mid);
      const lines = doc.splitTextToSize(paragraphText, width - 8);
      if (lines.length * (mid * LH_RATIO) <= contentH) { bestSize = mid; lo = mid; }
      else { hi = mid; }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(bestSize);
    doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
    const wrapped = doc.splitTextToSize(paragraphText, width - 8);
    doc.text(wrapped, x + 4, yPos + 14);
  };
  
  // Render box with specified height and optimal font size
  const renderBox = (x: number, yPos: number, width: number, height: number, title: string, items: string[], usePrefix: boolean = true, maxFontSize: number = 10): void => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yPos, width, height, 1.5, 1.5, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
    doc.text(title, x + 3, yPos + 6);
    
    doc.setDrawColor(IBM_BLUE[0], IBM_BLUE[1], IBM_BLUE[2]);
    doc.setLineWidth(0.5);
    doc.line(x + 3, yPos + 9, x + width - 3, yPos + 9);
    
    // Binary-search: largest font whose items fill but don't overflow the box
    const contentHeight = height - 16;
    const LH_RATIO = 0.42;
    const SPACING_RATIO = 0.13;
    let minSize = 6, maxSize = maxFontSize, bestSize = 6;
    while (maxSize - minSize > 0.05) {
      const testSize = (minSize + maxSize) / 2;
      const lh = testSize * LH_RATIO;
      const sp = testSize * SPACING_RATIO;
      doc.setFontSize(testSize);
      let needed = 0;
      for (const item of items) {
        const prefix = usePrefix ? "• " : "";
        const w = doc.splitTextToSize(`${prefix}${item}`, width - 8);
        needed += w.length * lh + sp;
      }
      if (needed <= contentHeight) { bestSize = testSize; minSize = testSize; }
      else { maxSize = testSize; }
    }
    const lineHeight = bestSize * LH_RATIO;
    const spacing = bestSize * SPACING_RATIO;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(bestSize);
    doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
    let itemY = yPos + 14;
    
    for (const item of items) {
      const prefix = usePrefix ? "• " : "";
      const wrapped = doc.splitTextToSize(`${prefix}${item}`, width - 8);
      const itemHeight = wrapped.length * lineHeight + spacing;
      
      // Check if this item would overflow the box
      if (itemY + itemHeight > yPos + height - 2) {
        // Stop rendering if we run out of space
        break;
      }
      
      doc.text(wrapped, x + 4, itemY);
      itemY += itemHeight;
    }
  };
  
  // Render qualification box with bold labels (Budget:, Authority:, etc.)
  const renderQualBox = (x: number, yPos: number, width: number, height: number, title: string, items: string[]): void => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yPos, width, height, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
    doc.text(title, x + 3, yPos + 6);

    doc.setDrawColor(IBM_BLUE[0], IBM_BLUE[1], IBM_BLUE[2]);
    doc.setLineWidth(0.5);
    doc.line(x + 3, yPos + 9, x + width - 3, yPos + 9);

    const fontSize = 7;
    const lineHeight = fontSize * 0.42;
    const spacing = fontSize * 0.13;
    let itemY = yPos + 14;

    for (const item of items) {
      if (itemY > yPos + height - 3) break;
      // Split on first colon to bold the label
      const colonIdx = item.indexOf(":");
      if (colonIdx > 0) {
        const label = item.slice(0, colonIdx + 1);
        const rest = item.slice(colonIdx + 1);
        const fullLine = `${label}${rest}`;
        const wrapped = doc.splitTextToSize(fullLine, width - 8);
        // First line: bold label + normal rest
        doc.setFontSize(fontSize);
        const labelWidth = doc.getTextWidth(label);
        doc.setFont("helvetica", "bold");
        doc.text(label, x + 4, itemY);
        doc.setFont("helvetica", "normal");
        // remaining text on first line after label
        const firstLineText = doc.splitTextToSize(rest.trim(), width - 8 - labelWidth)[0] || "";
        if (firstLineText) doc.text(firstLineText, x + 4 + labelWidth + 0.5, itemY);
        // remaining wrapped lines (if any)
        if (wrapped.length > 1) {
          const remainingText = rest.trim().slice(firstLineText.length).trim();
          if (remainingText) {
            const moreLines = doc.splitTextToSize(remainingText, width - 8);
            for (const line of moreLines) {
              itemY += lineHeight;
              if (itemY > yPos + height - 3) break;
              doc.text(line, x + 4, itemY);
            }
          }
        }
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize);
        const wrapped = doc.splitTextToSize(`• ${item}`, width - 8);
        doc.text(wrapped[0], x + 4, itemY);
      }
      doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
      itemY += lineHeight + spacing;
    }
  };

  // Use the EXACT same companyInfo that HTML uses - just format as paragraph instead of bullets
  const companyBackgroundParagraph = companyInfo.length > 0
    ? companyInfo.join(" ")
    : `${co} operates in the ${ind} sector, focusing on innovation and digital transformation. The company prioritizes operational efficiency, customer experience, and technology modernization. Current strategic initiatives include AI adoption, cloud migration, and data-driven decision making. Key business drivers include revenue growth, cost optimization, and competitive differentiation.`;
  
  const fullW = W - m * 2;
  const gap = 1.5;
  
  // Extract "Who is [Name]?" content from AI-generated sections
  const whoIsKey = `Who is ${ct}?`;
  const whoIsContent = sections[whoIsKey] || [];
  
  // Fallback to generic content if AI didn't generate this section
  const contactInfo = whoIsContent.length > 0 ? whoIsContent.slice(0, 5) : [
    `${ct} is a key decision-maker at ${co} with responsibility for strategic technology initiatives.`,
    `Focuses on driving business value through innovation, digital transformation, and operational excellence.`,
    `Active in industry thought leadership and stays current with emerging technology trends.`,
    `Key priorities include modernizing infrastructure, improving data capabilities, and enabling AI/ML initiatives.`
  ];
  
  // ── Layout: compute all heights bottom-up from actual content ──────────────
  // Company box: exact text height, no inflation
  const HEADER_H = 14; // title + divider overhead inside each box
  const companyTextH = (() => {
    doc.setFontSize(7);
    const wrapped = doc.splitTextToSize(companyBackgroundParagraph, fullW - 7);
    return HEADER_H + wrapped.length * (7 * 0.45) + 4;
  })();
  const companyH = Math.max(companyTextH, 22); // tight — minimum 22mm

  // Contact box: actual content height
  const contactH = calculateMinHeight(contactInfo, fullW, 7, false);

  // Discovery: must fit ALL 8 questions — calculate exact height needed
  const discoveryNeeded = calculateMinHeight(discoveryQs, colW, 7, false);
  // Qual: actual content height
  const qualNeeded = calculateMinHeight(qualInfo, colW, 7, true);
  // Row 3 height: whichever column needs more space
  const row3H = Math.max(discoveryNeeded, qualNeeded);

  // How much space remains for the product recommendations box
  const usedH = companyH + contactH + row3H + (gap * 4);
  void Math.max(availableH - usedH, 30); // productsH — kept for layout reference
  
  // Row 1 - Company Background (tight box, sized to text)
  renderParagraphBox(m, y, fullW, companyH, "Company Background", companyBackgroundParagraph);
  
  // Row 2 - Who is [Name]?
  y += companyH + gap;
  renderBox(m, y, fullW, contactH, `Who is ${ct}?`, contactInfo, false);
  
  // Row 3 - Discovery Questions (left) + Opportunity Qualification (right), same height
  y += contactH + gap;
  renderBox(m, y, colW, row3H, "Discovery Questions", discoveryQs, false);
  renderQualBox(m + colW + 3, y, colW, row3H, contentSets[2].title, qualInfo);
  
  // Row 4 - IBM Product Recommendations
  y += row3H + gap;

  // Each product card needs at least 22mm to look good
  const MIN_CARD_H = 22;
  const cardGap = 2.5;
  const neededProductsH = 13 + products.length * MIN_CARD_H + (products.length - 1) * cardGap + 3;

  // If not enough room on this page, add a new page
  if (y + neededProductsH > H - 8) {
    doc.addPage();
    y = 10;
  }

  const availableBottomHeight = Math.min(Math.max(H - 8 - y, neededProductsH), H - 8 - y + 1);
  const cardH = Math.max((availableBottomHeight - 13 - (products.length - 1) * cardGap - 3) / products.length, MIN_CARD_H);
  const totalProductBoxH = 13 + products.length * cardH + (products.length - 1) * cardGap + 3;

  // Draw outer container
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(m, y, fullW, totalProductBoxH, 1.5, 1.5, "FD");

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
  doc.text("IBM Product Recommendations", m + 3, y + 6);
  doc.setDrawColor(IBM_BLUE[0], IBM_BLUE[1], IBM_BLUE[2]);
  doc.setLineWidth(0.5);
  doc.line(m + 3, y + 9, m + fullW - 3, y + 9);

  // Render each product as a mini card
  const cardStartY = y + 13;

  products.forEach((p, idx) => {
    const cardY = cardStartY + idx * (cardH + cardGap);
    const cardX = m + 2.5;
    const cardW = fullW - 5;

    // Card background (light blue tint — IBM-aligned)
    doc.setFillColor(235, 244, 255);
    doc.setDrawColor(150, 190, 235);
    doc.setLineWidth(0.25);
    doc.roundedRect(cardX, cardY, cardW, cardH, 1, 1, "FD");

    // Left accent bar (IBM blue)
    doc.setFillColor(IBM_BLUE[0], IBM_BLUE[1], IBM_BLUE[2]);
    doc.rect(cardX, cardY, 1.2, cardH, "F");

    const textX = cardX + 4;
    let textY = cardY + 4.5;

    // Product name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(31, 41, 55);
    doc.text(p.name, textX, textY);

    // Tag pill — draw inline after name
    const nameWidth = doc.getTextWidth(p.name);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(15, 98, 254);
    const tagText = p.tag.toUpperCase();
    const tagW = doc.getTextWidth(tagText) + 4;
    const tagX = textX + nameWidth + 3;
    doc.setFillColor(210, 228, 255);
    doc.setDrawColor(130, 175, 230);
    doc.setLineWidth(0.2);
    doc.roundedRect(tagX, cardY + 2, tagW, 4, 0.8, 0.8, "FD");
    doc.text(tagText, tagX + 2, cardY + 5.3);

    // Description — binary-search for largest font that fits remaining card height
    const descY = textY + 5;
    const descMaxH = cardY + cardH - descY - 2; // available vertical space, 2mm bottom margin
    let dLo = 5, dHi = 7.5, dBest = 5.5;
    while (dHi - dLo > 0.1) {
      const mid = (dLo + dHi) / 2;
      doc.setFontSize(mid);
      const lines = doc.splitTextToSize(p.desc, cardW - 8);
      if (lines.length * (mid * 0.42) <= descMaxH) { dBest = mid; dLo = mid; }
      else { dHi = mid; }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(dBest);
    doc.setTextColor(75, 85, 99);
    const allDescLines = doc.splitTextToSize(p.desc, cardW - 8);
    // Hard-clamp: only render lines that actually fit within the card
    const lineH = dBest * 0.42;
    const maxLines = Math.floor(descMaxH / lineH);
    const descLines = allDescLines.slice(0, maxLines);
    doc.text(descLines, textX, descY);
  });
  
  // ═══ FOOTER ═══
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(MED_GRAY[0], MED_GRAY[1], MED_GRAY[2]);
  doc.text("CONFIDENTIAL & PROPRIETARY", m, H - 6);
  doc.text(`© ${new Date().getFullYear()} IBM Corporation`, W / 2, H - 6, { align: "center" });
  doc.text(fmtDate(), W - m, H - 6, { align: "right" });
  
  doc.save(`${co.replace(/\s+/g,"_")}_Briefing_${new Date().toISOString().split('T')[0]}.pdf`);
}

/* ─── IBM Data & AI product catalogue (fallback) ─── */
const IBM_PRODUCTS: Record<string, { tag: string; desc: string }> = {
  "watsonx.ai":         { tag: "Foundation Models & AI Studio",    desc: "Build, tune, and deploy AI with IBM Granite and open-source foundation models on a governed enterprise platform. Supports RAG, fine-tuning, and prompt engineering with built-in AI factsheets for full model lineage tracking." },
  "watsonx.data":       { tag: "Open Lakehouse",                   desc: "Access governed data across hybrid cloud with an open lakehouse architecture, cutting warehouse costs by up to 50%. Integrates with Presto, Spark, and existing data warehouses without requiring data migration." },
  "watsonx.governance": { tag: "AI Risk & Compliance",             desc: "Detect bias, drift, and compliance risk across AI models in production with automated policy enforcement. Provides end-to-end audit trails and aligns with EU AI Act, NIST AI RMF, and internal governance requirements." },
  "IBM OpenPages":      { tag: "GRC & Risk Management",            desc: "Centralise governance, risk, and compliance workflows with AI-assisted risk identification and reporting. Embeds watsonx AI to surface high-priority risks and automate control testing across the enterprise." },
  "IBM DataStage":      { tag: "Data Integration & ETL",           desc: "High-volume data integration and transformation pipelines for hybrid cloud and on-prem environments. Connects 100+ data sources with parallel processing and native IBM Cloud Pak for Data integration." },
  "IBM Knowledge Catalog": { tag: "Data Governance",               desc: "Discover, catalog, and govern data assets enterprise-wide with automated metadata and policy management. Enforces data access policies in real time and integrates with watsonx.data for unified data governance." },
  "IBM Db2":            { tag: "Hybrid Data Engine",              desc: "Enterprise SQL engine for mission-critical transactional and analytical workloads across hybrid cloud. Db2 AI Advanced Edition adds in-engine ML and federation, so teams query data where it lives without migration." },
  "IBM Guardium":       { tag: "Data Security & Compliance",      desc: "Discover, classify, and protect sensitive data with real-time activity monitoring and automated compliance controls. Enforces policy at the data source across on-prem and multicloud, closing audit gaps before they surface." },
  "watsonx Orchestrate":{ tag: "AI Agents & Automation",         desc: "Build and run AI agents that automate repetitive cross-application work through natural language. Governed deployment and pre-built skills let business teams ship automations without heavy engineering." },
  "watsonx Code Assistant": { tag: "AI Code Generation",         desc: "Accelerate development and app modernization with IBM Granite code models. Specialized for enterprise languages and COBOL-to-Java modernization, with code that stays auditable and governed." },
  "IBM Netezza":        { tag: "Cloud Data Warehouse",           desc: "High-performance warehouse for large-scale analytics with in-database machine learning. Runs the same engine on-prem and across clouds, scaling query performance without lock-in." },
  "IBM Informix":       { tag: "Embedded Database",              desc: "Low-footprint database optimized for IoT, edge, and time-series workloads. Runs autonomously with minimal administration where compute and connectivity are constrained." },
  "IBM Cognos Analytics": { tag: "BI & Analytics",              desc: "AI-assisted business intelligence that turns governed data into dashboards, reports, and natural-language insight. Embeds into watsonx.data so analytics inherit enterprise governance." },
  "IBM Planning Analytics": { tag: "Planning & FP&A",           desc: "Integrated financial and operational planning, budgeting, and forecasting at scale. The TM1 engine handles complex what-if modeling far beyond spreadsheet limits." },
  "IBM SPSS":           { tag: "Statistical Analysis",           desc: "Advanced statistical modeling and predictive analytics for research and operational decisions. A visual workflow makes sophisticated techniques accessible without coding." },
  "IBM Decision Optimization": { tag: "Prescriptive Optimization", desc: "Solves complex scheduling, allocation, and supply-chain problems with mathematical optimization. Integrates with watsonx.ai to pair predictions with optimal actions." },
  "IBM Data Replication": { tag: "Real-Time Data Sync",          desc: "Low-latency change-data-capture replication keeps systems and the lakehouse continuously in sync. Feeds real-time analytics and AI without straining source systems." },
  "IBM FileNet":        { tag: "Enterprise Content Mgmt",        desc: "Manage high-volume enterprise content and documents with governed workflow and retention. Surfaces unstructured content to AI pipelines under full compliance control." },
};

/** Parse AI-generated product section into structured {name, desc} pairs.
 *  Handles lines like "- IBM watsonx.ai: description" or "1. watsonx.data — reason"
 *  Falls back to catalogue if fewer than 2 products parsed.
 */
function parseProductRecs(raw: string, industry: string): { name: string; tag: string; desc: string }[] {
  const clean = raw.replace(/\*\*\*/g,"").replace(/\*\*/g,"").replace(/\*/g,"").trim();
  const results: { name: string; tag: string; desc: string }[] = [];

  // Match lines that look like a product entry
  const productLineRe = /^(?:[-•*]\s*|\d[.)]\s*)?(.{3,60}?)(?:[:—–-]\s*)(.+)$/;
  for (const line of clean.split("\n")) {
    const l = line.trim();
    if (!l || l.length < 8) continue;
    // Skip pure sub-bullets that are continuations
    if (l.startsWith("  ") || l.startsWith("\t")) continue;

    const m = l.match(productLineRe);
    if (m) {
      const rawName = m[1].trim();
      const rawDesc = m[2].trim();
      // Only keep if name contains a recognisable IBM/product keyword
      if (rawName.length < 3 || rawName.length > 70) continue;
      // Try to match against catalogue for a nice tag
      const catalogueKey = Object.keys(IBM_PRODUCTS).find(k =>
        rawName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(rawName.toLowerCase())
      );
      if (catalogueKey) {
        if (!results.find(r => r.name === catalogueKey)) {
          // Use AI desc as first sentence, append catalogue second sentence for context
          const aiDesc = rawDesc || IBM_PRODUCTS[catalogueKey].desc;
          const catalogueDesc = IBM_PRODUCTS[catalogueKey].desc;
          // Extract the second sentence from catalogue desc (after first period)
          const secondSentence = catalogueDesc.includes(". ") ? catalogueDesc.split(". ").slice(1).join(". ") : "";
          const fullDesc = secondSentence && !aiDesc.toLowerCase().includes(secondSentence.slice(0, 20).toLowerCase())
            ? `${aiDesc.replace(/\.?\s*$/, "")}. ${secondSentence}`
            : aiDesc;
          results.push({ name: catalogueKey, tag: IBM_PRODUCTS[catalogueKey].tag, desc: fullDesc });
        }
      } else if (rawName.toLowerCase().includes("ibm") || rawName.toLowerCase().includes("watson") || rawName.toLowerCase().includes("watsonx")) {
        if (!results.find(r => r.name === rawName)) {
          results.push({ name: rawName, tag: "IBM Data & AI", desc: rawDesc });
        }
      }
    }
    if (results.length >= 3) break;
  }

  // Fallback: pick 2-3 contextually relevant products from catalogue
  if (results.length < 2) {
    const ind = (industry || "").toLowerCase();
    const priority = ind.includes("financ") || ind.includes("bank") || ind.includes("insur")
      ? ["watsonx.data","IBM Guardium","watsonx.ai"]
      : ind.includes("health") || ind.includes("pharma") || ind.includes("life")
      ? ["watsonx.data","IBM Guardium","watsonx.ai"]
      : ind.includes("retail") || ind.includes("consumer")
      ? ["watsonx.data","IBM DataStage","watsonx.ai"]
      : ["watsonx.data","watsonx.governance","watsonx.ai"];

    for (const key of priority) {
      if (!results.find(r => r.name === key)) {
        results.push({ name: key, tag: IBM_PRODUCTS[key].tag, desc: IBM_PRODUCTS[key].desc });
      }
      if (results.length >= 3) break;
    }
  }

  return results.slice(0, 3);
}

/* ─── Product Recommendations Card ─── */
function ProductRecsCard({ content, industry, t, accent, bg }: {
  content: string; industry: string; t: typeof DARK;
  accent: string; bg: string;
}) {
  const products = parseProductRecs(content, industry);

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
      {products.map((p, i) => {
        // Truncate description to first sentence only
        const shortDesc = p.desc.includes(". ") ? p.desc.split(". ")[0] + "." : p.desc.slice(0, 100) + (p.desc.length > 100 ? "…" : "");
        return (
          <div key={i} style={{
            background: bg,
            border:`1px solid ${accent.replace(/[\d.]+\)$/, "0.22)")}`,
            borderRadius:10,
            padding:"11px 13px",
            display:"flex",flexDirection:"column",gap:6,
          }}>
            <div style={{display:"flex",alignItems:"flex-start",gap:7,flexDirection:"column"}}>
              <span style={{fontSize:12,fontWeight:600,color:t.text,letterSpacing:"-0.2px",lineHeight:1.3}}>{p.name}</span>
              <span style={{
                fontSize:8.5,fontWeight:500,letterSpacing:"0.5px",textTransform:"uppercase",
                color:t.text,background:`${accent.replace(/[\d.]+\)$/, "0.12)")}`,
                border:`1px solid ${accent.replace(/[\d.]+\)$/, "0.25)")}`,
                borderRadius:4,padding:"2px 6px",flexShrink:0,
              }}>{p.tag}</span>
            </div>
            <p style={{margin:0,fontSize:10.5,color:t.sectionText,lineHeight:1.55}}>{shortDesc}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Section Card ─── */
/* Render inline **bold** spans (clarity from structure, consistent UI+PDF). */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/);
    return m
      ? <strong key={i} style={{ fontWeight: 700 }}>{m[1]}</strong>
      : <span key={i}>{p}</span>;
  });
}

/* Render a markdown body: bullets, numbered lists, and clean tables, with
   inline bold. Used by the merged research/sales-play sections. */
function MarkdownBody({ body, t, accent }: { body: string; t: typeof DARK; accent: string }) {
  const lines = body.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i].trim();
    const lead = (lines[i].match(/^[ \t]+/)?.[0].length) || 0;
    const indentPx = Math.min(Math.floor(lead / 2), 4) * 16;

    // Table block: consecutive lines that look like | a | b | c |
    if (l.includes("|") && l.split("|").length >= 3) {
      const tbl: string[] = [];
      while (i < lines.length && lines[i].trim().includes("|")) { tbl.push(lines[i].trim()); i++; }
      const rows = tbl
        .map(r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim()))
        .filter(cells => !cells.every(c => /^:?-{2,}:?$|^$/.test(c)));
      if (rows.length) {
        const [head, ...rest] = rows;
        out.push(
          <table key={`tbl${i}`} style={{ width: "100%", borderCollapse: "collapse", margin: "6px 0 12px", fontSize: 12.5 }}>
            <thead><tr>{head.map((h, hi) => (
              <th key={hi} style={{ textAlign: "left", padding: "6px 10px", borderBottom: `1.5px solid ${accent}`, color: t.textSub, fontWeight: 600 }}>{renderInline(h)}</th>
            ))}</tr></thead>
            <tbody>{rest.map((r, ri) => (
              <tr key={ri}>{r.map((c, ci) => (
                <td key={ci} style={{ padding: "6px 10px", borderBottom: `1px solid ${t.sectionHeaderBorder}`, color: t.sectionText, verticalAlign: "top" }}>{renderInline(c)}</td>
              ))}</tr>
            ))}</tbody>
          </table>
        );
      }
      continue;
    }

    if (!l) { out.push(<div key={i} style={{ height: 4 }} />); i++; continue; }
    if (/^#{1,3}\s/.test(l)) {
      const level = (l.match(/^(#{1,3})/)?.[1].length) ?? 2;
      const text = l.replace(/^#{1,3}\s*/, "");
      const fs = level === 1 ? 15 : level === 2 ? 13.5 : 12.5;
      out.push(
        <p key={i} style={{ margin: "10px 0 4px", fontSize: fs, fontWeight: 700, color: t.textSub, letterSpacing: level >= 3 ? "0.06em" : "0.02em", textTransform: level >= 3 ? "uppercase" : "none" as any }}>
          {renderInline(text)}
        </p>
      );
      i++; continue;
    }
    if (/^[-*•]\s/.test(l)) {
      out.push(
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start", marginLeft: indentPx }}>
          <span style={{ color: accent, flexShrink: 0, lineHeight: 1.6 }}>–</span>
          <span style={{ color: t.sectionBullet, lineHeight: 1.6 }}>{renderInline(l.replace(/^[-*•]\s/, ""))}</span>
        </div>
      );
      i++; continue;
    }
    if (/^\d[.)]\s/.test(l)) {
      out.push(
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start", marginLeft: indentPx }}>
          <span style={{ color: accent, fontWeight: 600, flexShrink: 0 }}>{l.match(/^\d+/)?.[0]}.</span>
          <span style={{ color: t.sectionBullet, lineHeight: 1.6 }}>{renderInline(l.replace(/^\d[.)]\s/, ""))}</span>
        </div>
      );
      i++; continue;
    }
    out.push(<p key={i} style={{ margin: "0 0 6px", color: t.sectionText, lineHeight: 1.6, marginLeft: indentPx }}>{renderInline(l)}</p>);
    i++;
  }
  return <>{out}</>;
}

/* Whitelisted prospect section keywords (lowercased substring match). Anything
   the model emits outside these is dropped — no hallucinated "Key Messages",
   "Next Steps", or stray tables. */
const STEP1_KEYWORDS = ["solution mapping", "contract vehicle", "contacts"];
const STEP2_KEYWORDS = ["best-fit use case", "best fit use case", "sales play", "competitive wedge", "why act now", "sales card", "elevator pitch", "what to do next"];

// Briefing product section titles — hoisted here so JSX outside useMemo can reference them
const PRODUCT_TITLES = ["Product Recommendations","Retention & Upsell Positioning","IBM Differentiation","Strategic Investment Themes"];

/* Person-input helpers. We deliberately do NOT fetch LinkedIn (it blocks scraping),
   so from a profile URL we can only derive a best-effort display name from the slug
   and never a title/company. Concatenated slugs ("lornejones") can't be split into
   first/last and stay single-token; delimited slugs ("lorne-jones-9b2") clean up. */
const isLinkedInProfileUrl = (s: string): boolean => /linkedin\.com\/in\//i.test(s || "");
function personNameFromLinkedIn(url: string): string {
  const m = (url || "").match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (!m?.[1]) return "";
  const slug = m[1].replace(/-[a-z0-9]*\d[a-z0-9]*$/i, ""); // drop trailing id hash
  return slug
    .replace(/[-_]/g, " ").replace(/\d+/g, "").replace(/\s+/g, " ").trim()
    .split(" ").filter(w => w.length > 1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
/* Clean a company label for DISPLAY only. If the seller pasted a URL (often with
   tracking query params), show just the hostname (crs.org) instead of the raw string.
   The full input is still sent to the backend — the path/params help the model ID the
   account (e.g. "save-lives" on crs.org → Catholic Relief Services). Plain typed names
   pass through untouched. */
function cleanCompanyLabel(input: string): string {
  const v = (input || "").trim();
  if (!v) return "";
  const m = v.match(/^(?:https?:\/\/)?(?:www\.)?([^/?#\s]+)/i);
  if (m && /\.[a-z]{2,}$/i.test(m[1])) return m[1].toLowerCase();
  return v;
}

/* Sanitize a prospect markdown blob: keep only whitelisted sections, each once
   (first wins), strip any leaked model commentary. Returns clean markdown. */
function cleanProspectMarkdown(raw: string, keywords: string[]): string {
  const chunks = raw.split(/\n(?=##?\s)/);
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const c of chunks) {
    const t = c.trim();
    if (!t.startsWith("#")) continue;
    const firstLine = t.split("\n")[0].replace(/^#+\s*/, "").replace(/\*\*/g, "").trim().toLowerCase();
    const k = keywords.find(kw => firstLine.includes(kw));
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const cleaned = t.replace(
      /(\n|^)\s*(please let me know|i revised nothing|i revised|i did not revise|in conclusion|to reiterate|however, since i am being|however, since there|however, i (will|need|had)|given the constraints|given the lack of|therefore, without explicit|thus, in the absence|note that|note:|in real[- ]world|for actual sales|here is the (revised|rewritten)|the above response|the response (generated|provided))[\s\S]*$/i,
      ""
    ).trim();
    // Drop any individual leaked instruction lines (e.g. "STOP NOW", "Do NOT repeat…").
    const lineFiltered = cleaned.split("\n").filter(line => {
      const lc = line.trim().toLowerCase();
      if (!lc) return true;
      if (/^(stop\b|stop rules|stop now)/.test(lc)) return false;
      if (/\bstop (immediately|now)\b/.test(lc)) return false;
      if (/^(do not (repeat|invent|add|output)|output only|produce each section|as an ai|i (cannot|can't|will not)|here is the (revised|rewritten))/.test(lc)) return false;
      return true;
    }).join("\n").trim();
    kept.push(lineFiltered);
  }
  return kept.join("\n\n");
}

/* Rotating wireframe globe — pure canvas 2D, no dependencies. Depth-shaded
   (front lines brighter, back faint) with a slight axial tilt and a few data
   nodes. Color is theme-driven via the rgb prop. */
const GLOBE_NODES = [
  { lat: 0.62, lon: 0.4 }, { lat: -0.3, lon: 2.1 }, { lat: 0.18, lon: 3.6 },
  { lat: 0.92, lon: 5.0 }, { lat: -0.66, lon: 1.2 }, { lat: 0.08, lon: 4.4 },
  { lat: -0.5, lon: 5.7 }, { lat: 0.42, lon: 2.9 },
];
// @ts-ignore -- retained for future globe visualisation; not rendered at runtime
function WireframeGlobe({ rgb, size = 300 }: { rgb: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);
    const R = size * 0.40, cx = size / 2, cy = size / 2;
    const LAT = 9, LONG = 18, SEG = 54;
    const tilt = -0.32, ct = Math.cos(tilt), st = Math.sin(tilt);
    const proj = (lat: number, lon: number, rot: number) => {
      const x = Math.cos(lat) * Math.sin(lon + rot);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lon + rot);
      return { sx: cx + x * R, sy: cy - (y * ct - z * st) * R, z: y * st + z * ct };
    };
    let raf = 0;
    const t0 = performance.now();
    const seg = (a: { sx: number; sy: number; z: number }, b: { sx: number; sy: number; z: number }) => {
      const d = ((a.z + b.z) / 2 + 1) / 2;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = `rgba(${rgb},${(0.05 + 0.30 * d).toFixed(3)})`;
      ctx.lineWidth = 0.5 + 0.6 * d;
      ctx.stroke();
    };
    const draw = (now: number) => {
      const rot = (now - t0) * 0.00016;
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb},0.10)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let i = 1; i < LAT; i++) {
        const lat = -Math.PI / 2 + (i / LAT) * Math.PI;
        let prev = proj(lat, 0, rot);
        for (let s = 1; s <= SEG; s++) { const cur = proj(lat, (s / SEG) * Math.PI * 2, rot); seg(prev, cur); prev = cur; }
      }
      for (let j = 0; j < LONG; j++) {
        const lon = (j / LONG) * Math.PI * 2;
        let prev = proj(-Math.PI / 2, lon, rot);
        for (let s = 1; s <= SEG; s++) { const cur = proj(-Math.PI / 2 + (s / SEG) * Math.PI, lon, rot); seg(prev, cur); prev = cur; }
      }
      for (const n of GLOBE_NODES) {
        const p = proj(n.lat, n.lon, rot);
        if (p.z < -0.1) continue;
        const d = (p.z + 1) / 2;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 1.5 + 1.4 * d, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${(0.25 + 0.55 * d).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [rgb, size]);
  return <canvas ref={ref} aria-hidden="true" style={{ display: "block" }} />;
}

/* ─── Sales Play Flow — horizontal pipeline of step cards ─── */
const PLAY_STAGES: { label: string; icon: React.ReactNode }[] = [
  { label: "Engage",   icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/> },
  { label: "Discover", icon: <><circle cx="11" cy="11" r="6"/><path d="M20.5 20.5 16.5 16.5"/></> },
  { label: "Prove",    icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></> },
  { label: "Land",     icon: <path d="M4 22V4l13 4-13 4"/> },
  { label: "Realize",  icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></> },
  { label: "Expand",   icon: <path d="M7 17 17 7M8 7h9v9"/> },
];

function parseSalesPlay(body: string): { title: string; do: string; say: string; outcome: string }[] {
  const lines = body.split("\n");
  const steps: { title: string; do: string; say: string; outcome: string }[] = [];
  let cur: { title: string; do: string; say: string; outcome: string } | null = null;
  const assign = (step: { [k: string]: string }, raw: string) => {
    const cleaned = raw.replace(/^[-–•*\s]+/, "");
    const m = cleaned.match(/^\*{0,2}\s*(title|do|say|outcome)\s*\*{0,2}\s*:\s*(.*)$/i);
    if (!m) return;
    step[m[1].toLowerCase()] = m[2].replace(/\*\*/g, "").trim();
  };
  for (const raw of lines) {
    const line = raw.trim().replace(/^\*+\s*/, "");
    if (!line) continue;
    const num = line.match(/^(\d+)[.)]\s*(.*)$/);
    if (num) {
      if (cur) steps.push(cur);
      cur = { title: "", do: "", say: "", outcome: "" };
      if (num[2]) assign(cur, num[2]);
    } else if (cur) {
      assign(cur, line);
    }
  }
  if (cur) steps.push(cur);
  return steps.filter(s => s.title || s.do || s.say || s.outcome);
}

function SalesPlayFlow({ body, t }: { body: string; t: typeof DARK }) {
  const steps = parseSalesPlay(body);
  // Fallback: if the model didn't produce parseable steps, render the original markdown.
  if (steps.length < 2) return <div style={{fontSize:13,color:t.textSub,lineHeight:1.7}}><MarkdownBody body={body} t={t} accent={t.accent}/></div>;
  return (
    <div className="sales-play-flow" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
      {steps.map((s, i) => {
        const stage = PLAY_STAGES[i] || PLAY_STAGES[PLAY_STAGES.length - 1];
        return (
          <div key={i} className="sales-play-step">
            <div style={{
              background:t.input,border:`1px solid ${t.inputBorder}`,
              borderTop:`2px solid ${t.accent}`,borderRadius:10,padding:"11px 12px",
              display:"flex",flexDirection:"column",gap:6,
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{width:18,height:18,borderRadius:"50%",background:t.accent,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</span>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:t.accent}}>{stage.label}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{stage.icon}</svg>
              </div>
              {s.title && <div style={{fontSize:12.5,fontWeight:600,color:t.text,lineHeight:1.25}}>{s.title}</div>}
              {s.do && <div style={{fontSize:11,color:t.textSub,lineHeight:1.4}}><span style={{fontWeight:700,color:t.text}}>Do </span>{s.do}</div>}
              {s.say && <div style={{fontSize:11,color:t.textSub,lineHeight:1.4,fontStyle:"italic"}}><span style={{fontWeight:700,color:t.text,fontStyle:"normal"}}>Say </span>“{s.say.replace(/^["“]|["”]$/g, "")}”</div>}
              {s.outcome && <div style={{fontSize:11,color:t.textSub,lineHeight:1.4,marginTop:"auto"}}><span style={{fontWeight:700,color:t.accent}}>→ </span>{s.outcome}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Sales Card ─── */
function SalesCard({ body, t, accent }: { body: string; t: typeof DARK; accent: string }) {
  const [copied, setCopied] = useState(false);

  // Parse "**Label:** value" lines
  const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
  const fields: { label: string; value: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^\*{1,2}([^*:]+):\*{0,2}\s*(.+)$/);
    if (m) fields.push({ label: m[1].trim(), value: m[2].trim() });
  }

  // Fall back to plain markdown if parsing fails
  if (fields.length < 3) {
    return (
      <div style={{background:t.sectionCard,border:`1px solid ${t.sectionCardBorder}`,borderRadius:12,padding:"14px 18px",marginBottom:12}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:accent,marginBottom:10}}>Sales Card</div>
        <div style={{fontSize:12,color:t.textSub,lineHeight:1.6}}><MarkdownBody body={body} t={t} accent={accent}/></div>
      </div>
    );
  }

  const sayThis = fields.find(f => /say this/i.test(f.label));
  const metaFields = fields.filter(f => !/say this/i.test(f.label));
  const isProofPoint = (label: string) => /proof point/i.test(label);

  const handleCopy = () => {
    if (sayThis) {
      navigator.clipboard.writeText(sayThis.value.replace(/^[""]|[""]$/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Split meta fields into two columns
  const mid = Math.ceil(metaFields.length / 2);
  const leftCol = metaFields.slice(0, mid);
  const rightCol = metaFields.slice(mid);

  return (
    <div className="dash-card" style={{
      background: t.sectionCard,
      border: `1px solid ${t.sectionCardBorder}`,
      borderRadius: 12,
      padding: "14px 18px 16px",
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${t.sectionHeaderBorder}`}}>
        <div style={{width:20,height:20,background:"rgba(255,255,255,0.05)",borderRadius:5,flexShrink:0,border:`1px solid ${t.sectionCardBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:accent,opacity:0.85}}/>
        </div>
        <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:accent}}>Sales Card</span>
      </div>

      {/* Key-value grid — 2 columns on wide, stacked on narrow */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:"8px 20px",marginBottom:sayThis?14:0}}>
        {[leftCol, rightCol].map((col, ci) => (
          <div key={ci}>
            {col.map((f, i) => (
              <div key={i} style={{marginBottom:8}}>
                <span style={{display:"block",fontSize:9,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:t.textMuted,marginBottom:2}}>{f.label}</span>
                <span style={{fontSize:12.5,color:isProofPoint(f.label)?accent:t.text,lineHeight:1.5,fontWeight:isProofPoint(f.label)?500:400}}>{f.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Say This — hero quote block */}
      {sayThis && (
        <div style={{
          borderLeft:`3px solid ${accent}`,
          paddingLeft:12,
          paddingTop:2,
          paddingBottom:2,
          display:"flex",
          alignItems:"flex-start",
          justifyContent:"space-between",
          gap:10,
        }}>
          <div>
            <span style={{display:"block",fontSize:9,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:t.textMuted,marginBottom:4}}>Say This</span>
            <span style={{fontSize:13.5,color:t.text,lineHeight:1.6,fontStyle:"italic"}}>
              "{sayThis.value.replace(/^[""]|[""]$/g,"")}"
            </span>
          </div>
          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            style={{
              flexShrink:0,marginTop:18,background:"transparent",border:"none",
              cursor:"pointer",padding:4,borderRadius:6,color:copied?accent:t.textMuted,
              transition:"color 0.15s, background 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color=accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=copied?accent:t.textMuted;}}
          >
            {copied
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            }
          </button>
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, content, industry, t, streaming }: {
  title: string; content: string; industry?: string;
  t: typeof DARK; streaming?: boolean;
}) {
  const isDark = t === DARK;

  // Unified accent — one consistent treatment across every card, no per-section rainbow
  const accent = t.accent;
  const bg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  const isProductRecs = ["Product Recommendations","Retention & Upsell Positioning","IBM Differentiation","Strategic Investment Themes"].includes(title);

  const rows: React.ReactNode[] = [];
  if (!isProductRecs) {
    // Strip ALL asterisks - no markdown rendering
    const lines = content.replace(/\*\*\*/g,"**").replace(/^--$/gm,"").split("\n");
    // Count real content lines to adjust font sizing
    const contentLines = lines.filter(l => l.trim().length > 0).length;
    // Use slightly larger text if fewer lines (less content = more space to fill)
    const bodyFontSize = contentLines <= 4 ? 14 : contentLines <= 7 ? 13.5 : 13;

    lines.forEach((line, i) => {
      const l = line.trim();
      const lead = (line.match(/^[ \t]+/)?.[0].length) || 0;
      const indentPx = Math.min(Math.floor(lead / 2), 4) * 16;
      if (!l) { rows.push(<div key={i} style={{height:2}} />); return; }
      if (l.endsWith(":") && l.length < 60) {
        rows.push(<p key={i} style={{margin:"10px 0 4px",fontSize:10,fontWeight:600,letterSpacing:"0.7px",textTransform:"uppercase",color:accent}}>{l.slice(0,-1)}</p>);
      } else if (l.match(/^[-*•] /)) {
        rows.push(
          <div key={i} style={{display:"flex",gap:10,marginBottom:6,alignItems:"flex-start",marginLeft:indentPx}}>
            <span style={{color:accent,fontSize:13,lineHeight:"1.5",flexShrink:0}}>–</span>
            <span style={{color:t.sectionBullet,fontSize:bodyFontSize,lineHeight:1.65}}>{renderInline(l.slice(2))}</span>
          </div>
        );
      } else if (l.match(/^\d[.)]/)) {
        rows.push(
          <div key={i} style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start",marginLeft:indentPx}}>
            <span style={{color:accent,fontSize:11,fontWeight:600,flexShrink:0,minWidth:16,paddingTop:2}}>{l[0]}.</span>
            <span style={{color:t.sectionBullet,fontSize:bodyFontSize,lineHeight:1.7}}>{renderInline(l.slice(2).trim())}</span>
          </div>
        );
      } else {
        const labelMatch = l.match(/^([A-Za-z][A-Za-z ]{0,28}): (.+)$/);
        if (labelMatch) {
          rows.push(
            <p key={i} style={{margin:"0 0 8px",fontSize:bodyFontSize,lineHeight:1.65}}>
              <strong style={{color:t.textSub,fontWeight:600}}>{labelMatch[1]}:</strong>
              <span style={{color:t.sectionText}}>{" "}{renderInline(labelMatch[2])}</span>
            </p>
          );
        } else {
          rows.push(<p key={i} style={{margin:"0 0 7px",color:t.sectionText,fontSize:bodyFontSize,lineHeight:1.65}}>{renderInline(l)}</p>);
        }
      }
    });
  }

  return (
    <div className="animate-fade-in dash-card" style={{
      background: t.sectionCard, backdropFilter:"blur(28px) saturate(150%)",
      WebkitBackdropFilter:"blur(28px) saturate(150%)",
      border:`1px solid ${t.sectionCardBorder}`, borderRadius:12,
      marginBottom:12, boxShadow: t.cardShadow,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 20px 10px",borderBottom:`1px solid ${t.sectionHeaderBorder}`}}>
        <div style={{width:20,height:20,background:bg,borderRadius:5,flexShrink:0,border:`1px solid ${t.sectionCardBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:accent,opacity:0.85}} />
        </div>
        <span style={{fontSize:11.5,fontWeight:500,color:t.textSub}}>{title || "…"}</span>
        {streaming && <span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:accent,opacity:0.7}} className="animate-pulse-dot" />}
      </div>
      <div style={{padding:"16px 20px 20px"}}>
        {isProductRecs
          ? <ProductRecsCard content={content} industry={industry||""} t={t} accent={accent} bg={bg}/>
          : rows
        }
      </div>
    </div>
  );
}

/* ─── Glass Input ─── */
function GlassInput({ label, textarea, t, ...props }: {
  label: string; textarea?: boolean; t: typeof DARK;
} & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const base: React.CSSProperties = {
    width:"100%", background:t.input, border:`1px solid ${t.inputBorder}`,
    borderRadius:9, fontSize:13, color:t.text, fontFamily:"var(--app-font-sans)",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)", outline:"none", padding:"10px 12px",
  };
  return (
    <div style={{marginBottom:12}}>
      <label style={{display:"block",fontSize:11,fontWeight:500,color:t.textDim,letterSpacing:"0.7px",textTransform:"uppercase",marginBottom:6}}>{label}</label>
      {textarea
        ? <textarea {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} rows={2} style={{...base,resize:"none"}} />
        : <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} style={base} />
      }
    </div>
  );
}

/* ─── Theme toggle icon ─── */
function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "dark") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Main Page ─── */
export default function BriefingPage() {
  const greeting = getGreeting();
  const { userName } = useUserInfo();
  const displayName = userName.trim() ? userName.trim().split(" ")[0] : "IBMer";
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "dark");
  const t = theme === "dark" ? DARK : LIGHT;

  const [company, setCompany]   = useState("");
  const [industry, setIndustry] = useState("");
  const [contact, setContact]   = useState("");
  const [contactName2, setContactName2] = useState("");
  const [title, setTitle]       = useState("");
  const [context, setContext]   = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("Discovery");
  const [generating, setGenerating]   = useState(false);
  const [briefingText, setBriefingText] = useState("");
  const [briefingReady, setBriefingReady] = useState(false);
  const [currentBriefing, setCurrentBriefing] = useState<SavedBriefing | null>(null);
  // Ref mirrors currentBriefing so async closures always read the latest _id synchronously.
  // useEffect syncs too late (after commit) so we update both via this helper everywhere.
  const currentBriefingRef = useRef<(SavedBriefing & { _id?: number }) | null>(null);
  const setCurrentBriefingAndRef = (
    next: ((SavedBriefing & { _id?: number }) | null) |
          ((prev: (SavedBriefing & { _id?: number }) | null) => (SavedBriefing & { _id?: number }) | null)
  ) => {
    if (typeof next === "function") {
      setCurrentBriefing((prev) => {
        const result = next(prev as any);
        currentBriefingRef.current = result;
        return result as SavedBriefing | null;
      });
    } else {
      currentBriefingRef.current = next;
      setCurrentBriefing(next as SavedBriefing | null);
    }
  };
  const [pendingBriefing, setPendingBriefing] = useState<Partial<SavedBriefing> | null>(null);
  const [saved, setSaved]       = useState<SavedBriefing[]>([]);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [_error, setError]       = useState("");
  const textRef = useRef("");
  const pdfRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  // Load briefing history from the API on mount
  useEffect(() => {
    loadSavedFromApi().then(setSaved);
  }, []);

  // Auto-focus the company input when the hero is visible
  useEffect(() => {
    if (!briefingReady && !generating) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [briefingReady, generating]);

  const debouncedCompany = useDebounce(company, 600);

  const { data: logoData }     = useGetBriefingLogo({ company: debouncedCompany }, { query: { enabled: debouncedCompany.length > 1 } as any });
  useGetBriefingIndustry({ company: debouncedCompany }, { query: { enabled: debouncedCompany.length > 1 } as any });

  useEffect(() => { if (company !== debouncedCompany) return; if (!company) setIndustry(""); }, [company]);

  // State for parsed contact name and photo only
  const [parsedContactName, setParsedContactName] = useState("");
  const [contactPhotoUrl, setContactPhotoUrl] = useState("");

  // Prospect state
  const [prospectUrl, setProspectUrl] = useState("");
  const [prospectGenerating, setProspectGenerating] = useState(false);
  const [_prospectStep, setProspectStep] = useState<1|2|null>(null);
  const [prospectResult, setProspectResult] = useState<{companyName:string;websiteUrl:string;step1:string;step2:string;generatedAt:string}|null>(null);
  // Ref mirrors prospectResult so the generate callback (useCallback) always reads the latest value
  const prospectResultRef = useRef<{companyName:string;websiteUrl:string;step1:string;step2:string;generatedAt:string}|null>(null);
  useEffect(() => { prospectResultRef.current = prospectResult; }, [prospectResult]);
  const [_prospectError, setProspectError] = useState("");
  const [openRefs, setOpenRefs] = useState<Record<string, boolean>>({});
  const [showMore, setShowMore] = useState(false);

  // Smart Account field: detect a LinkedIn URL or bare domain and mirror it into the
  // matching field — but only when that field is empty, so manual entry always wins.
  // `company` always tracks the raw value the seller typed.
  const handleAccountInput = (raw: string) => {
    const v = raw.trim();
    if (/linkedin\.com\/in\//i.test(v)) {
      setCompany(raw);
      if (!contact) setContact(v);
      const name = personNameFromLinkedIn(v);
      if (name && !contactName2) setContactName2(name);
    } else if (/^https?:\/\//i.test(v)) {
      // Full URL pasted — extract hostname as company name and store as prospectUrl
      try {
        const hostname = new URL(v).hostname.replace(/^www\./, "");
        const extracted = hostname.split(".")[0];
        const name = extracted.charAt(0).toUpperCase() + extracted.slice(1);
        setCompany(name);
        if (!prospectUrl) setProspectUrl(v);
      } catch {
        setCompany(raw);
      }
    } else if (/^[a-z0-9-]+\.[a-z]{2,}(\.[a-z]{2,})?$/i.test(v.replace(/\/$/, ""))) {
      // Bare domain (e.g. meta.com) — extract name and set URL
      const name = v.split(".")[0];
      setCompany(name.charAt(0).toUpperCase() + name.slice(1));
      if (!prospectUrl) setProspectUrl(`https://${v}`);
    } else {
      setCompany(raw);
    }
  };
  const briefReady = company.trim().length >= 2;
  const detectedIndustry = detectIndustry(company);

  // Rotate the account-field placeholder while the field is empty.
  const [phIdx, setPhIdx] = useState(0);
  useEffect(() => {
    if (company) return;
    const id = setInterval(() => setPhIdx(i => (i + 1) % ACCOUNT_PLACEHOLDERS.length), 2800);
    return () => clearInterval(id);
  }, [company]);
  
  // Debounce contact input
  const debouncedContact = useDebounce(contact, 600);
  
  // Extract name from LinkedIn URL slug only — no API calls, no auto-fill
  useEffect(() => {
    if (!debouncedContact.trim()) {
      setParsedContactName("");
      setContactName2("");
      setContactPhotoUrl("");
      
      return;
    }
    
    if (debouncedContact.toLowerCase().includes("linkedin.com/in/")) {
      const match = debouncedContact.match(/linkedin\.com\/in\/([^/?]+)/i);
      if (match?.[1]) {
        const slug = match[1];
        const cleanSlug = slug.replace(/-[a-z0-9]*\d[a-z0-9]*$/i, "");
        const name = cleanSlug
          .replace(/[-_]/g, " ")
          .replace(/\d+/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .filter(w => w.length > 1)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        if (name.includes(" ")) setParsedContactName(name);
        setContactPhotoUrl(`https://unavatar.io/linkedin/${slug}`);
      }
    } else {
      // Plain name entered directly
      setParsedContactName(debouncedContact);
      setContactPhotoUrl("");
    }
  }, [debouncedContact]);
  
  const contactName = (() => {
    if (contactName2.trim()) return contactName2.trim();
    if (parsedContactName) return parsedContactName;
    if (contact.toLowerCase().includes("linkedin.com/in/")) {
      const slugMatch = contact.match(/linkedin\.com\/in\/([^/?]+)/i);
      if (slugMatch?.[1]) {
        let slug = slugMatch[1]
          .replace(/\d+$/, "") // remove trailing numbers first (e.g. ebell1906 -> ebell)
          .replace(/[-_]/g, " ")
          .replace(/\d+/g, "")
          .trim();
        // If no spaces, try to split on known first names
        if (!slug.includes(" ") && slug.length > 4) {
          const firstNames = ["james","john","robert","michael","william","david","richard","joseph","thomas","charles",
            "mary","patricia","jennifer","linda","barbara","elizabeth","susan","jessica","sarah","karen",
            "jamie","chris","alex","sam","taylor","jordan","morgan","casey","drew","justin","jason","jeffrey",
            "brandon","brian","kevin","keith","daniel","dennis","donald","douglas","derek","dexter","marcus",
            "anthony","andrew","aaron","adam","peter","paul","patrick","ryan","scott","sean","steven","timothy",
            "travis","tyler","victor","walter","wayne","ashley","amanda","amber","brittany","chelsea","emily",
            "hannah","heather","jessica","katherine","lauren","megan","melissa","nicole","rachel","stephanie"];
          for (const fn of firstNames) {
            if (slug.toLowerCase().startsWith(fn)) {
              slug = fn + " " + slug.slice(fn.length);
              break;
            }
          }
        }
        return slug.split(" ").filter(w => w.length > 1)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ") || contact;
      }
    }
    return contact;
  })();

  /* ─── Stream sections parser ─── */
  const streamingSections = useMemo(() => {
    if (!briefingText) return [];

    const IBM_PRODUCT_NAMES = ["watsonx.ai","watsonx.data","watsonx.governance","IBM OpenPages","IBM DataStage","IBM Knowledge Catalog"];
    const QUAL_TITLES = ["Opportunity Qualification","Expansion Qualification","Win/Loss Qualification","Business Case Qualification"];
    const BANT_LABELS = ["Budget","Authority","Need","Timeline","Champion","Political Blockers"];

    const parts = briefingText.split("##").slice(1);
    const seen = new Set<string>();
    const extractedProducts: string[] = [];

    const sections = parts
      .map((sec, i) => {
        const lines = sec.trim().split("\n");
        const title = lines[0].trim() || "…";
        let content = lines.slice(1).join("\n").trim();

        // Strip hallucinated meta-commentary
        const STRIP_RE = /^(I am |Note[:\s]|adhering|since the response|the above|here is the revised|without the label|as it seems|extraneous|removed last|starting fresh|as per your request|word limit|however i had|nothing is mentioned|so i am|i had to keep|i will|let me|i need to|i'm going to|here is the rewritten|the rewritten response|based on the feedback|note i removed|i removed|please note)/i;

        // For qualification sections: strip product names, cut at repeated BANT labels, strip commentary
        if (QUAL_TITLES.some(q => title.includes(q))) {
          const contentLines = content.split("\n");
          const bantSeen = new Set<string>();
          const cleaned: string[] = [];
          let cutOff = false;
          let afterPoliticalBlockers = false;
          let politicalBlockersLineCount = 0;

          for (const line of contentLines) {
            if (cutOff) break;
            const trimmed = line.trim();

            // Detect BANT labels FIRST — a BANT line must never be dropped, even if it names a product
            const bantMatch = BANT_LABELS.find(b => trimmed.startsWith(`***${b}`) || trimmed.startsWith(`**${b}`) || trimmed.startsWith(`${b}:`));

            // Extract + remove ONLY standalone product lines (a lone "watsonx.data" entry),
            // never a BANT line that merely mentions a product mid-sentence.
            if (!bantMatch) {
              const bare = trimmed.replace(/^[-*\s]+/, "").toLowerCase();
              const loneProduct = IBM_PRODUCT_NAMES.find(p => bare.startsWith(p.toLowerCase()));
              if (loneProduct) {
                if (!extractedProducts.includes(loneProduct)) extractedProducts.push(loneProduct);
                continue;
              }
            }

            if (bantMatch) {
              if (bantSeen.has(bantMatch)) { cutOff = true; break; }
              bantSeen.add(bantMatch);
              if (bantMatch === "Political Blockers") {
                afterPoliticalBlockers = true;
                politicalBlockersLineCount = 0;
              }
            }

            // After Political Blockers, allow only 3 lines of content then cut
            if (afterPoliticalBlockers && !bantMatch) {
              politicalBlockersLineCount++;
              if (politicalBlockersLineCount > 3) { cutOff = true; break; }
            }

            if (STRIP_RE.test(trimmed)) { cutOff = true; break; }
            cleaned.push(line);
          }
          content = cleaned.join("\n").trim();
        } else {
          // For all other sections: just strip commentary lines
          content = content.split("\n").reduce((acc: string, line: string) => {
            if (STRIP_RE.test(line.trim())) return acc;
            return acc + "\n" + line;
          }, "").trim();
        }

        return {
          title,
          content,
          isStreaming: generating && i === parts.length - 1,
        };
      })
      .filter(sec => {
        const key = sec.title.toLowerCase().replace(/[^a-z]/g, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);

    return sections;
  }, [briefingText, generating]);

  // Hide the contact section when the user gave no contact name and no LinkedIn.
  const hasContact = Boolean(contactName2.trim() || contact.trim());
  // visibleSections / PRODUCT_SECTION_TITLES removed — filtering moved to dashboard accessors

  // ── Dashboard accessors: pull named sections from the brief + sanitized prospect blobs ──
  const prospectMap = useMemo(() => {
    const map: Record<string, { title: string; body: string }> = {};
    if (!prospectResult) return map;
    const add = (raw: string) => {
      (raw || "").split(/\n(?=##?\s)/).forEach((chunk) => {
        const tc = chunk.trim();
        if (!tc.startsWith("#")) return;
        const lines = tc.split("\n");
        const secTitle = lines[0].replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
        const body = lines.slice(1).join("\n").trim().replace(/\*\*\*/g, "**");
        const key = secTitle.toLowerCase();
        if (!map[key]) map[key] = { title: secTitle, body };
      });
    };
    add(prospectResult.step1);
    add(prospectResult.step2);
    return map;
  }, [prospectResult]);
  const getProspect = (kw: string) => {
    const k = Object.keys(prospectMap).find((key) => key.includes(kw));
    return k ? prospectMap[k] : null;
  };
  const getBrief = (kw: string) =>
    streamingSections.find((s) => s.title.toLowerCase().includes(kw)) || null;

  const dashKeyTakeaways = getBrief("key takeaway");
  const dashBackground = getBrief("background") || getBrief("account health") || getBrief("competitive landscape") || getBrief("strategic agenda");
  const dashQual = getBrief("qualification");
  const dashDiscovery = getBrief("question");
  const dashWhoIs = getBrief("who is");
  const dashPitch = getProspect("elevator pitch");
  const dashWedge = getProspect("competitive wedge");
  const dashCard = getProspect("sales card");
  const dashUseCase = getProspect("use case");
  const dashPlay = getProspect("sales play");
  const dashMapping = getProspect("solution mapping");
  const dashContract = getProspect("contract vehicle");
  const dashContacts = getProspect("contacts");
  const dashWhyNow = getProspect("why act now");
  // dashNextSteps removed — "What To Do Next" section deleted from UI and prompt

  const toggleRef = (k: string) => setOpenRefs((p) => ({ ...p, [k]: !p[k] }));
  const dashCardBase: React.CSSProperties = { background: t.sectionCard, border: `1px solid ${t.sectionCardBorder}`, borderRadius: 12, padding: "16px 18px" };
  const dashCardAccent: React.CSSProperties = { ...dashCardBase, border: `1.5px solid ${t.accent}` };
  const dashLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: t.accent, marginBottom: 8 };
  const dashTier = (txt: string, sub?: string) => (
    <div className="dash-tier" data-tier={txt} style={{ margin: "24px 0 11px 2px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.textDim, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="dash-tier-title">{txt}</span>
        <span style={{ flex: 1, height: 1, background: t.sectionCardBorder }} />
      </div>
      {sub && <div className="dash-tier-sub" style={{ fontSize: 11, color: t.textDim, marginTop: 3, fontStyle: "italic" }}>{sub}</div>}
    </div>
  );
  const dashRefRow = (key: string, refTitle: string, body: React.ReactNode) => (
    <div className="dash-ref" style={{ background: t.sectionCard, border: `1px solid ${t.sectionCardBorder}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <button onClick={() => toggleRef(key)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", padding: "12px 16px", cursor: "pointer", fontFamily: "inherit" }}>
        <span className="dash-ref-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: t.textSub }}>{refTitle}</span>
        <span className="ref-chevron" style={{ color: t.textDim, fontSize: 10, transform: openRefs[key] ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▼</span>
      </button>
      <div className="ref-body" style={{ display: openRefs[key] ? "block" : "none", padding: "0 16px 14px", fontSize: 13, color: t.textSub, lineHeight: 1.7 }}>{body}</div>
    </div>
  );

  const generate = useCallback(async () => {
    const effectiveCompany = company.trim();
    
    if (!effectiveCompany) {
      setError("Please enter a company name in the Company field.");
      return;
    }
    setError("");
    setGenerating(true);
    setBriefingText("");
    setBriefingReady(false);
    setAlreadySaved(false);
    textRef.current = "";

    // ── Kick off the prospect report (9 elements) concurrently — non-blocking ──
    // Result renders beneath the brief sections once it resolves. If it fails,
    // the brief is unaffected.
    setProspectResult(null);
    setProspectError("");
    setProspectGenerating(true);
    (async () => {
      try {
        const pr = await fetch(`${getBaseUrl()}/api/prospect/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: effectiveCompany,
            websiteUrl: prospectUrl.trim() || undefined,
            context: context.trim(),
          }),
        });
        if (pr.ok) {
          const pdata = await pr.json();
          const step1 = cleanProspectMarkdown(pdata.step1 || "", STEP1_KEYWORDS);
          const step2 = cleanProspectMarkdown(pdata.step2 || "", STEP2_KEYWORDS);
          setProspectResult({
            companyName: pdata.companyName || effectiveCompany,
            websiteUrl: pdata.websiteUrl || prospectUrl.trim(),
            step1,
            step2,
            generatedAt: pdata.generatedAt || new Date().toISOString(),
          });
          // Merge prospect data into currentBriefing so Save / PATCH always has latest values
          setCurrentBriefingAndRef(prev => prev ? { ...prev, prospectStep1: step1, prospectStep2: step2 } : prev);
          // Persist to DB if the briefing was already auto-saved
          const dbId = currentBriefingRef.current?._id;
          if (dbId) {
            fetch(`/api/history/briefings/${dbId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prospectStep1: step1, prospectStep2: step2 }),
            }).catch(() => { /* non-fatal */ });
          }
        }
      } catch {
        /* non-fatal — brief still renders */
      } finally {
        setProspectGenerating(false);
      }
    })();

    setPendingBriefing({
      co: effectiveCompany, ct: contactName.trim(), ti: title.trim(),
      ind: industry.trim(), callType: meetingType,
      logoUrl: logoData?.url || "",
      contactPhotoUrl: contactPhotoUrl || "",
      date: fmtDate(), ts: Date.now(),
    });

    // ── Fetch live company research via Perplexity (backend) + news in parallel ──
    // Hard timeout keeps generation from being blocked if Perplexity is slow.
    let companyContext = "";
    try {
      const RESEARCH_TIMEOUT = 25000; // sonar-pro grounded search takes 10-20s; give it room
      const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
        Promise.race([p, new Promise<null>(res => setTimeout(() => res(null), ms))]);

      const params = new URLSearchParams({ company: effectiveCompany });
      if (industry.trim()) params.set("industry", industry.trim());
      if (title.trim()) params.set("contactTitle", title.trim());

      const [perplexityRes, newsRes] = await Promise.all([
        withTimeout(
          fetch(`${getBaseUrl()}/api/briefing/company-research?${params.toString()}`)
            .then(r => r.ok ? r.json() : null).catch(() => null),
          RESEARCH_TIMEOUT
        ),
        withTimeout(
          fetch(`${getBaseUrl()}/api/briefing/news?company=${encodeURIComponent(effectiveCompany)}`)
            .then(r => r.ok ? r.json() : []).catch(() => []),
          RESEARCH_TIMEOUT
        ),
      ]);

      const parts: string[] = [];
      if (perplexityRes && (perplexityRes as any)?.summary) {
        parts.push((perplexityRes as any).summary as string);
      }
      if (Array.isArray(newsRes) && newsRes.length > 0) {
        const headlines = (newsRes as { title: string; source?: string; date?: string }[])
          .slice(0, 5)
          .map(n => `- ${n.title}${n.source ? ` (${n.source})` : ""}${n.date ? `, ${n.date}` : ""}`)
          .join("\n");
        parts.push(`Recent news:\n${headlines}`);
      }
      companyContext = parts.join("\n\n");
    } catch {
      // Non-fatal — generation continues without enrichment
    }

    try {
      const res = await fetch(`${getBaseUrl()}/api/briefing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: effectiveCompany, industry: industry.trim(),
          contactName: contactName.trim(), contactTitle: title.trim(),
          context: context.trim(), callType: meetingType,
          companyContext: companyContext || undefined,
          websiteUrl: prospectUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", res.status, errorText);
        throw new Error(`Request failed with status ${res.status}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream available");
      const decoder = new TextDecoder();
      let streamDone = false;
      let savedDbId: number | null = null;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        const events = decoder.decode(value).split("\n\n").filter(Boolean);
        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const data = JSON.parse(event.slice(6));
          if (data.done) { savedDbId = data.briefingId ?? null; streamDone = true; break; }
          if (data.error) throw new Error(data.error);
          if (data.replace) { textRef.current = data.replace; setBriefingText(data.replace); }
          else if (data.content) { textRef.current += data.content; setBriefingText(textRef.current); }
        }
      }
      const entry: SavedBriefing = {
        co: effectiveCompany, ct: contactName.trim(), ti: title.trim(),
        ind: industry.trim(), callType: meetingType,
        text: textRef.current, logoUrl: logoData?.url || "",
        contactPhotoUrl: contactPhotoUrl || "",
        date: fmtDate(), ts: Date.now(),
        // Snapshot prospect data so it persists with the saved briefing
        prospectStep1: prospectResultRef.current?.step1 || "",
        prospectStep2: prospectResultRef.current?.step2 || "",
        _id: savedDbId ?? undefined,
      } as SavedBriefing & { _id?: number };
      // Update the ref immediately so any concurrent async closures (prospect, architecture)
      // can read the correct _id without waiting for React to process the state update.
      currentBriefingRef.current = entry;
      setCurrentBriefingAndRef(entry);
      setBriefingReady(true);
    } catch (err) {
      console.error("Briefing generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      setBriefingReady(false);
      setPendingBriefing(null);
    } finally {
      setGenerating(false);
    }
  }, [company, industry, contactName, title, context, meetingType, logoData, contactPhotoUrl, prospectUrl]);

  const saveBriefing = async () => {
    if (!currentBriefing) return;
    try {
      const existingId = (currentBriefing as any)._id as number | undefined;
      const r = existingId
        // Already auto-saved — just patch the fields that may have updated since
        ? await fetch(`/api/history/briefings/${existingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              logoUrl:            currentBriefing.logoUrl,
              contactPhotoUrl:    currentBriefing.contactPhotoUrl,
              prospectStep1:      currentBriefing.prospectStep1      || "",
              prospectStep2:      currentBriefing.prospectStep2      || "",
              architectureDiagram:currentBriefing.architectureDiagram|| "",
            }),
          })
        // No auto-save id — insert a fresh row (fallback / edge case)
        : await fetch("/api/history/briefings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              company:            currentBriefing.co,
              contactName:        currentBriefing.ct,
              contactTitle:       currentBriefing.ti,
              industry:           currentBriefing.ind,
              callType:           currentBriefing.callType,
              text:               currentBriefing.text,
              logoUrl:            currentBriefing.logoUrl,
              contactPhotoUrl:    currentBriefing.contactPhotoUrl,
              prospectStep1:      currentBriefing.prospectStep1      || "",
              prospectStep2:      currentBriefing.prospectStep2      || "",
              architectureDiagram:currentBriefing.architectureDiagram|| "",
            }),
          });
      if (!r.ok) {
        const body = await r.text();
        console.error("Save failed:", r.status, body);
        return;
      }
      const updated = await loadSavedFromApi();
      setSaved(updated);
      setAlreadySaved(true);
    } catch (err) { console.error("Save error:", err); }
  };

  const deleteSaved = async (ts: number) => {
    const target = saved.find(b => b.ts === ts) as any;
    if (target?._id) {
      try {
        await fetch(`/api/history/briefings/${target._id}`, { method: "DELETE" });
      } catch { /* non-fatal */ }
    }
    setSaved(prev => prev.filter(b => b.ts !== ts));
  };
  const loadBriefing = (b: SavedBriefing) => {
    // Reset all in-progress state first so nothing bleeds in from a prior run
    setGenerating(false);
    setProspectGenerating(false);
    setPendingBriefing(null);
    textRef.current = b.text;
    // Populate fields
    setCompany(b.co); setIndustry(b.ind); setContact(b.ct); setTitle(b.ti);
    setContactName2(b.ct);
    setMeetingType(b.callType as MeetingType);
    setBriefingText(b.text);
    setContactPhotoUrl(b.contactPhotoUrl || "");
    setCurrentBriefingAndRef(b as any);
    setBriefingReady(true);
    setAlreadySaved(true);
    // Restore prospect data so dashboard cards (Why IBM Wins, Elevator Pitch, etc.) re-render
    if (b.prospectStep1 || b.prospectStep2) {
      setProspectResult({
        companyName: b.co,
        websiteUrl: "",
        step1: b.prospectStep1 || "",
        step2: b.prospectStep2 || "",
        generatedAt: "",
      });
    } else {
      setProspectResult(null);
    }
    // architectureDiagram is passed directly via currentBriefing into ArchitectureDiagram
  };
  const newBriefing = () => {
    setBriefingReady(false); setBriefingText(""); setCurrentBriefingAndRef(null);
    setPendingBriefing(null); setAlreadySaved(false); setGenerating(false); textRef.current = "";
    setProspectResult(null); setProspectError(""); setProspectGenerating(false); setProspectStep(null);
  };
  // Export to PDF via the browser's print engine. It renders the real DOM (so the
  // PDF is identical to the UI), correctly handles modern CSS like oklch (which
  // html2canvas cannot), produces selectable text, and the print stylesheet
  // (index.css @media print) yields a clean white, client-ready document.
  const exportPDF = () => {
    window.print();
  };

  const [historyOpen, setHistoryOpen] = useState(false);
  const showResult = generating || briefingReady;
  const displayBriefing = briefingReady ? currentBriefing : pendingBriefing;
  // For person (LinkedIn) inputs, never surface the raw URL as the "company" — show the name.
  const displayCo = isLinkedInProfileUrl(displayBriefing?.co || "")
    ? (personNameFromLinkedIn(displayBriefing?.co || "") || "this profile")
    : cleanCompanyLabel(displayBriefing?.co || "");
  return (
    <div className="app-shell" style={{display:"flex",height:"100vh",overflow:"hidden",fontFamily:"var(--app-font-sans)",background:t.bodyBg,color:t.text}}>

      {/* ─── History Sidebar ─── */}
      {saved.length > 0 && (
        <>
          {/* Backdrop — click to close */}
          {historyOpen && (
            <div
              className="no-print"
              onClick={() => setHistoryOpen(false)}
              style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,0.35)"}}
            />
          )}
          <div
            className="no-print"
            style={{
              position:"fixed",top:0,right:0,bottom:0,zIndex:50,
              width: historyOpen ? 280 : 0,
              overflow:"hidden",
              transition:"width 0.22s ease",
              background: t.topBar,
              borderLeft: `1px solid ${t.sectionCardBorder}`,
              display:"flex",flexDirection:"column",
            }}
          >
            {historyOpen && (
              <>
                <div style={{padding:"16px 16px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${t.sectionCardBorder}`}}>
                  <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:t.textDim}}>Recent Briefings</span>
                  <button onClick={()=>setHistoryOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:t.textMuted,fontSize:18,lineHeight:1,padding:2}}>×</button>
                </div>
                <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  {saved.map(b=>(
                    <button
                      key={b.ts}
                      onClick={()=>{ loadBriefing(b); setHistoryOpen(false); }}
                      style={{
                        textAlign:"left",background:t.sectionCard,border:`1px solid ${t.sectionCardBorder}`,
                        borderRadius:8,padding:"10px 12px",cursor:"pointer",fontFamily:"var(--app-font-sans)",
                        transition:"all 0.15s",width:"100%",
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.sectionCardBorder;}}
                    >
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:600,color:t.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.co}</span>
                        <span style={{flexShrink:0,fontSize:9,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",
                          color:t.badgeText,background:t.badgeBg,border:`1px solid ${t.badgeBorder}`,borderRadius:3,padding:"1px 4px"}}>
                          {b.callType}
                        </span>
                      </div>
                      <div style={{fontSize:10.5,color:t.textDim}}>{b.date}{b.ct ? ` · ${b.ct}` : ""}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ─── Main ─── */}
      <main className="app-main" style={{flex:1,overflowY:"auto",position:"relative"}}>
        {prospectResult && !showResult ? (
          /* ─── Prospect Result ─── */
          <div style={{padding:"24px 40px 48px",overflowY:"auto",height:"100%"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#0f62fe",marginBottom:4}}>Prospect Report</div>
                <div style={{fontSize:20,fontWeight:600,color:t.text}}>{isLinkedInProfileUrl(prospectResult.companyName) ? (personNameFromLinkedIn(prospectResult.companyName) || "LinkedIn profile") : cleanCompanyLabel(prospectResult.companyName)}</div>
                <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{(isLinkedInProfileUrl(prospectResult.websiteUrl) || /^https?:\/\//i.test(prospectResult.websiteUrl)) ? "" : prospectResult.websiteUrl}</div>
              </div>
              <button
                onClick={async () => {
                  const m = await import("@/pages/ProspectPage");
                  (m as any).buildProspectPDF(prospectResult);
                }}
                style={{background:"#0f62fe",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}
              >↓ Download PDF</button>
            </div>

            {/* Step 1 */}
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#0f62fe",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
              <span style={{background:"#0f62fe",color:"#fff",width:18,height:18,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>1</span>
              Company Research & IBM Product Mapping
            </div>
            {prospectResult.step1.split(/\n(?=##?\s)/).filter(sec => sec.trim().startsWith("#")).map((sec,i) => {
              const lines = sec.trim().split("\n");
              const title = lines[0].replace(/^#+\s*/,"").replace(/\*\*/g,"").trim();
              const body = lines.slice(1).join("\n").trim().replace(/\*\*\*/g,"**");
              return (
                <div key={i} style={{background:t.sectionCard,border:`1px solid ${t.sectionCardBorder}`,borderRadius:10,padding:"16px 18px",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:t.accent,marginBottom:8}}>{title}</div>
                  <div style={{fontSize:13,color:t.textSub,lineHeight:1.7}}><MarkdownBody body={body} t={t} accent={t.accent}/></div>
                </div>
              );
            })}

            {/* Step 2 */}
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:"#0f62fe",marginBottom:12,marginTop:20,display:"flex",alignItems:"center",gap:8}}>
              <span style={{background:"#0f62fe",color:"#fff",width:18,height:18,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>2</span>
              Best Fit Use Case & Sales Play
            </div>
            {prospectResult.step2.split(/\n(?=##?\s)/).filter(sec => sec.trim().startsWith("#")).map((sec,i) => {
              const lines = sec.trim().split("\n");
              const title = lines[0].replace(/^#+\s*/,"").replace(/\*\*/g,"").trim();
              const body = lines.slice(1).join("\n").trim().replace(/\*\*\*/g,"**");
              return (
                <div key={i} style={{background:t.sectionCard,border:`1px solid ${t.sectionCardBorder}`,borderRadius:10,padding:"16px 18px",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:t.accent,marginBottom:8}}>{title}</div>
                  <div style={{fontSize:13,color:t.textSub,lineHeight:1.7}}><MarkdownBody body={body} t={t} accent={t.accent}/></div>
                </div>
              );
            })}
          </div>
        ) : prospectGenerating && !showResult && !generating ? (
          /* ─── Prospect Loading ─── */
          <ProspectLoadingScreen t={t} companyName={company.startsWith("http") ? prospectUrl : company} />
        ) : !showResult ? (
          /* ─── Hero ─── */
          <div style={{padding:"24px 40px 48px",height:"100%",display:"flex",flexDirection:"column",overflowY:"auto"}}>

            {/* Top bar: theme toggle + history hamburger */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8,marginBottom:6}}>
              {saved.length > 0 && (
                <button
                  onClick={() => setHistoryOpen(v => !v)}
                  title="Recent briefings"
                  style={{
                    display:"inline-flex",alignItems:"center",gap:6,
                    background: historyOpen ? t.btn : t.pill,
                    backdropFilter:"blur(28px)",
                    border:`1px solid ${historyOpen ? t.accent : t.pillBorder}`,
                    color: historyOpen ? t.accent : t.textSub,
                    borderRadius:100,height:38,padding:"0 14px",
                    cursor:"pointer",fontFamily:"var(--app-font-sans)",
                    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.12)",transition:"all 0.2s",
                    fontSize:12,fontWeight:500,
                  }}
                  onMouseEnter={(e)=>{e.currentTarget.style.background=t.btn;e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.color=t.accent;}}
                  onMouseLeave={(e)=>{e.currentTarget.style.background=historyOpen?t.btn:t.pill;e.currentTarget.style.borderColor=historyOpen?t.accent:t.pillBorder;e.currentTarget.style.color=historyOpen?t.accent:t.textSub;}}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                  History
                </button>
              )}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme==="dark"?"light":"dark"} mode`}
                style={{
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  background:t.pill,backdropFilter:"blur(28px)",border:`1px solid ${t.pillBorder}`,
                  color:t.textSub,borderRadius:100,width:38,height:38,
                  cursor:"pointer",fontFamily:"var(--app-font-sans)",
                  boxShadow:"inset 0 1px 0 rgba(255,255,255,0.12)",transition:"all 0.2s",
                }}
                onMouseEnter={(e)=>{e.currentTarget.style.background=t.btn;}}
                onMouseLeave={(e)=>{e.currentTarget.style.background=t.pill;}}
              >
                <ThemeIcon theme={theme}/>
              </button>
            </div>

            {/* ─── Central column ─── */}
            <div style={{maxWidth:600,margin:"8px auto 0",width:"100%"}}>

              {/* Greeting — integrated into the narrative */}
              <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                <div style={{
                  display:"inline-flex",alignItems:"center",gap:8,
                  background:t.pill,backdropFilter:"blur(28px)",border:`1px solid ${t.pillBorder}`,
                  borderRadius:100,padding:"8px 16px",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.12)",
                }}>
                  <div className="animate-pulse-dot" style={{width:6,height:6,borderRadius:"50%",background:t.accent,flexShrink:0,boxShadow:`0 0 8px ${t.accentGlow}`}} />
                  <span style={{fontSize:12.5,color:t.textSub,fontWeight:400}}>
                    {greeting}, <span style={{fontWeight:600,color:t.text}}>{displayName}</span> — who are we prepping for?
                  </span>
                </div>
              </div>

              <h1 style={{fontSize:44,fontWeight:200,letterSpacing:"-2px",color:t.text,lineHeight:1.05,margin:"0 0 10px",textAlign:"center"}}>
                Sales Intelligence<br/>Simplified
              </h1>
              <p style={{fontSize:14.5,fontWeight:300,color:t.textMuted,lineHeight:1.6,margin:"0 auto 24px",textAlign:"center",maxWidth:400}}>
                Drop in a company name. Get a full IBM briefing in under 30 seconds.
              </p>

              {/* Account input */}
              <div style={{position:"relative"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={company?"#4589ff":t.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  style={{position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke 0.2s"}}>
                  <circle cx="11" cy="11" r="6"/><path d="M20.5 20.5 16.5 16.5"/>
                </svg>
                <input
                  ref={inputRef}
                  value={company}
                  onChange={e=>handleAccountInput((e.target as HTMLInputElement).value)}
                  onKeyDown={e=>{ if(e.key==="Enter" && !generating) generate(); }}
                  placeholder={ACCOUNT_PLACEHOLDERS[phIdx]}
                  autoComplete="off"
                  onFocus={e=>{ e.currentTarget.style.boxShadow="0 0 0 3px rgba(69,137,255,0.18)"; }}
                  onBlur={e=>{ if(!company) e.currentTarget.style.boxShadow="inset 0 1px 0 rgba(255,255,255,0.06)"; }}
                  style={{width:"100%",background:t.input,border:`1px solid ${company?"#0f62fe":t.inputBorder}`,
                    borderRadius:13,fontSize:16,color:t.text,fontFamily:"var(--app-font-sans)",padding:"17px 18px 17px 46px",outline:"none",
                    boxShadow:company?"0 0 0 3px rgba(69,137,255,0.18)":"inset 0 1px 0 rgba(255,255,255,0.06)",transition:"all 0.2s"}}
                />
              </div>

              {/* Detection indicators or sample chips */}
              {company.trim() ? (
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px 16px",marginTop:12,justifyContent:"center"}}>
                  {[
                    isLinkedInProfileUrl(company)
                      ? `LinkedIn profile detected: ${personNameFromLinkedIn(company) || "profile"}`
                      : `Company detected: ${cleanCompanyLabel(company)}`,
                    ...(prospectUrl?["Website added"]:[]),
                    ...(detectedIndustry && !isLinkedInProfileUrl(company)?[`Industry: ${detectedIndustry}`]:[])
                  ].map((line,i)=>(
                    <span key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:t.textSub}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#42be65" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>{line}
                    </span>
                  ))}
                </div>
              ) : (
                /* Sample chips — one click populates + generates */
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:t.textDim}}>Try:</span>
                  {SAMPLE_CHIPS.map(chip=>(
                    <button
                      key={chip.label}
                      onClick={()=>{ setCompany(chip.company); setMeetingType(chip.type); setTimeout(()=>generate(),0); }}
                      style={{
                        fontSize:12,fontWeight:500,padding:"5px 13px",borderRadius:20,cursor:"pointer",
                        fontFamily:"var(--app-font-sans)",transition:"all 0.15s",
                        background:t.btnSm,border:`1px solid ${t.btnSmBorder}`,color:t.textSub,
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.background=t.btn;e.currentTarget.style.color=t.text;e.currentTarget.style.borderColor=t.accent;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=t.btnSm;e.currentTarget.style.color=t.textSub;e.currentTarget.style.borderColor=t.btnSmBorder;}}
                    >{chip.label}</button>
                  ))}
                </div>
              )}

              {/* LinkedIn name field */}
              {company.trim() && isLinkedInProfileUrl(company) && (
                <div style={{maxWidth:420,margin:"14px auto 0",textAlign:"left"}}>
                  <GlassInput t={t} label="Name (edit if needed)"
                    value={contactName2}
                    onChange={e=>setContactName2((e.target as HTMLInputElement).value)}
                    placeholder="First Last" autoComplete="off"/>
                  <p style={{fontSize:11,color:t.textDim,margin:"5px 2px 0"}}>Parsed from the profile URL — adjust if the split isn't right.</p>
                </div>
              )}

              {/* Call type — ABOVE the generate button */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:20,flexWrap:"wrap"}}>
                <span style={{fontSize:10.5,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:t.textDim}}>Call type</span>
                {(["Discovery","Renewal","Competitive"] as const).map(mt=>(
                  <button key={mt} onClick={()=>setMeetingType(mt)}
                    style={{fontSize:12,padding:"5px 13px",borderRadius:8,cursor:"pointer",fontFamily:"var(--app-font-sans)",transition:"all 0.15s",
                      background:meetingType===mt?"rgba(15,98,254,0.18)":t.btnSm,
                      border:`1px solid ${meetingType===mt?"rgba(15,98,254,0.6)":t.btnSmBorder}`,
                      color:meetingType===mt?"#78a9ff":t.btnSmText,fontWeight:meetingType===mt?600:500}}>{mt}</button>
                ))}
              </div>

              {/* "Add details" link — benefit copy, ABOVE generate */}
              <div style={{marginTop:12,textAlign:"center"}}>
                <button onClick={()=>setShowMore(v=>!v)}
                  style={{display:"inline-flex",alignItems:"center",gap:7,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"var(--app-font-sans)"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{transform:showMore?"rotate(180deg)":"none",transition:"transform 0.2s"}}><path d="M6 9l6 6 6-6"/></svg>
                  <span style={{fontSize:12,fontWeight:500,color:t.accent}}>Add a LinkedIn URL to get named contacts in your brief</span>
                </button>
                {showMore && (
                  <div style={{marginTop:14,textAlign:"left"}}>
                    <GlassInput t={t} label="Website" value={prospectUrl} onChange={e=>setProspectUrl((e.target as HTMLInputElement).value)} placeholder="https://celonis.com" autoComplete="off"/>
                    <GlassInput t={t} label="LinkedIn URL" value={contact} onChange={e=>setContact((e.target as HTMLInputElement).value)} placeholder="linkedin.com/in/username" autoComplete="off"/>
                    <GlassInput t={t} label="Contact name" value={contactName2} onChange={e=>setContactName2((e.target as HTMLInputElement).value)} placeholder="First Last" autoComplete="off"/>
                    <GlassInput t={t} label="Contact title" value={title} onChange={e=>setTitle((e.target as HTMLInputElement).value)} placeholder="e.g. VP of Data & Analytics" autoComplete="off"/>
                    <GlassInput t={t} label="Intel to include" textarea value={context} onChange={e=>setContext((e.target as HTMLTextAreaElement).value)} placeholder="Evaluating Snowflake, budget unlocked Q3…" autoComplete="off"/>
                  </div>
                )}
              </div>

              {/* Primary CTA — vivid blue when active, intentional even when empty */}
              <button
                onClick={generate}
                disabled={generating}
                onMouseEnter={e=>{ if(!generating){ e.currentTarget.style.background=briefReady?"#1f6dff":"rgba(15,98,254,0.22)"; e.currentTarget.style.transform="translateY(-1px)"; } }}
                onMouseLeave={e=>{ if(!generating){ e.currentTarget.style.background=briefReady?"#0f62fe":"rgba(15,98,254,0.13)"; e.currentTarget.style.transform="none"; } }}
                style={{
                  width:"100%",marginTop:18,
                  background: briefReady ? "#0f62fe" : "rgba(15,98,254,0.13)",
                  border: briefReady ? "none" : "1px solid rgba(15,98,254,0.35)",
                  color: briefReady ? "#fff" : "rgba(69,137,255,0.75)",
                  fontSize:15.5,fontWeight:700,
                  borderRadius:13,padding:"17px",
                  cursor: generating ? "default" : "pointer",
                  fontFamily:"var(--app-font-sans)",
                  opacity: generating ? 0.85 : 1,
                  transition:"all 0.2s",
                  boxShadow: briefReady ? "0 6px 24px rgba(15,98,254,0.45)" : "none",
                  transform:"translateY(0)",
                }}>
                {generating
                  ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span className="animate-pulse-dot" style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}}/>Analyzing account…</span>
                  : "Generate My Call Brief  →"}
              </button>

              {/* Trust line with watsonx badge */}
              {!generating && (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:13,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:t.textMuted}}>Takes ~30 seconds</span>
                  <span style={{color:t.textDim}}>·</span>
                  <span style={{fontSize:11,color:t.textMuted}}>No setup required</span>
                  <span style={{color:t.textDim}}>·</span>
                  <span style={{
                    display:"inline-flex",alignItems:"center",gap:4,
                    fontSize:10.5,fontWeight:600,letterSpacing:"0.04em",
                    color:t.accent,background:t.badgeBg,
                    border:`1px solid ${t.badgeBorder}`,
                    borderRadius:6,padding:"2px 7px",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                    watsonx
                  </span>
                </div>
              )}
              {generating && (
                <p style={{fontSize:11.5,color:t.textMuted,margin:"10px 0 0",textAlign:"center"}}>Mapping IBM solutions…</p>
              )}
            </div>

            {/* Recent Briefings moved to sidebar — accessible via History button in action bar */}

            {/* ─── Value strip ─── */}
            <div style={{maxWidth:600,margin:"32px auto 40px",textAlign:"center",width:"100%"}}>
              <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:t.textDim,marginBottom:14}}>What you'll get in 30 seconds</div>
              <div style={{display:"flex",justifyContent:"center",gap:"10px 28px",flexWrap:"wrap"}}>
                {["Know the account instantly","Ask smarter questions","Qualify the deal quickly","Lead with the right IBM solution"].map(it=>(
                  <span key={it} style={{display:"flex",alignItems:"center",gap:7,fontSize:12.5,fontWeight:500,color:t.textSub}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#42be65" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M20 6 9 17l-5-5"/></svg>{it}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Briefing Result (also shown during streaming) ─── */
          <div style={{padding:"0 32px 64px",maxWidth:1400,margin:"0 auto"}}>
            {/* Progress bar while generating */}
            {generating && (
              <div className="no-print" style={{position:"sticky",top:0,zIndex:10,background:"transparent",paddingTop:8,paddingBottom:4,marginBottom:4}}>
                <div style={{height:2,borderRadius:1,background:t.topBar,overflow:"hidden"}}>
                  <div className="animate-progress-bar" style={{height:"100%",background:t.progressBar,borderRadius:1,animation:"progress-slide 1.4s ease-in-out infinite"}}/>
                </div>
                <p style={{fontSize:11,color:t.textDim,margin:"6px 0 0",fontWeight:300}}>Generating briefing for {displayCo}…</p>
              </div>
            )}

            {/* Action bar */}
            <div className="no-print" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,paddingTop:40,flexWrap:"wrap",gap:8}}>
              {/* Left: action buttons */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                {[
                  {label:"← New Briefing",onClick:newBriefing,title:"Start a new briefing"},
                  {label:alreadySaved?"✓ Saved":"Save",onClick:saveBriefing,disabled:alreadySaved||generating,title:alreadySaved?"Already saved":"Save this briefing"},
                  {label:"↓ Export PDF",onClick:exportPDF,disabled:generating,title:"Download as PDF"},
                ].map(btn=>(
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    title={btn.title}
                    style={{
                      padding:"9px 18px",fontSize:12,fontWeight:500,
                      background:t.btnSm, border:`1px solid ${t.btnSmBorder}`, borderRadius:8,
                      color:t.btnSmText, cursor:btn.disabled?"default":"pointer",
                      opacity:btn.disabled?0.45:1, fontFamily:"var(--app-font-sans)",
                      transition:"all 0.2s", transform:"scale(1)",
                    }}
                    onMouseEnter={(e) => { if (!btn.disabled) { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.background = t.btn; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = t.btnSm; }}
                  >{btn.label}</button>
                ))}
              </div>
              {/* Right: history toggle */}
              {saved.length > 0 && (
                <button
                  onClick={() => setHistoryOpen(v => !v)}
                  title="Recent briefings"
                  style={{
                    display:"flex",alignItems:"center",gap:7,
                    padding:"9px 14px",fontSize:12,fontWeight:500,
                    background: historyOpen ? t.btn : t.btnSm,
                    border:`1px solid ${historyOpen ? t.accent : t.btnSmBorder}`,
                    borderRadius:8, color: historyOpen ? t.accent : t.btnSmText,
                    cursor:"pointer", fontFamily:"var(--app-font-sans)", transition:"all 0.2s",
                  }}
                >
                  {/* Hamburger icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                  History ({saved.length})
                </button>
              )}
            </div>

            {/* PDF capture region — seamless: background matches page */}
            <div ref={pdfRef} className="pdf-capture" style={{background:"transparent",padding:"4px 0 8px"}}>
            <div className="print-brand">IBM · Pre-Call Intelligence Briefing</div>
            {/* Briefing header */}
            <div style={{marginBottom:24,display:"flex",alignItems:"center",gap:14}}>
              {/* Contact photo on the LEFT - only show if there's a contact name */}
              {displayBriefing?.ct && (
                <div style={{flexShrink:0,width:58,height:58,borderRadius:"50%",background:t.card,border:`1.5px solid ${t.cardBorder}`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>
                  {(contactPhotoUrl || displayBriefing?.contactPhotoUrl) ? (
                    <img
                      src={contactPhotoUrl || displayBriefing?.contactPhotoUrl || ""}
                      alt={displayBriefing?.ct || ""}
                      style={{width:"100%",height:"100%",objectFit:"cover"}}
                      onError={e=>{
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={{fontSize:17,fontWeight:500,color:t.textMuted}}>
                      {(displayBriefing?.ct||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontSize:10,fontWeight:500,letterSpacing:"1px",textTransform:"uppercase",color:t.textDim}}>Pre-Call Intelligence</span>
                  <span style={{fontSize:10,fontWeight:500,textTransform:"uppercase",color:t.badgeText,background:t.badgeBg,borderRadius:4,padding:"2px 7px",border:`1px solid ${t.badgeBorder}`,boxShadow:"0 1px 2px rgba(0,0,0,0.05)"}}>
                    {displayBriefing?.callType}
                  </span>
                </div>
                <h1 style={{fontSize:24,fontWeight:500,letterSpacing:"-0.4px",color:t.nameLine,margin:"0 0 3px",lineHeight:1.15}}>
                  {displayBriefing?.ct || displayCo || "…"}
                </h1>
                <p style={{fontSize:12,color:t.textMuted,margin:"0 0 2px"}}>{[displayBriefing?.ct ? (isLinkedInProfileUrl(displayBriefing?.co||"") ? "" : cleanCompanyLabel(displayBriefing?.co||"")) : "",displayBriefing?.ti,displayBriefing?.ind].filter(Boolean).join("  ·  ")}</p>
                <p style={{fontSize:11,color:t.dateText,margin:0}}>Generated {displayBriefing?.date}</p>
              </div>

            </div>

            {/* ════════ SALES CARD — first in content column, above Elevator Pitch ════════ */}
            {dashCard && <SalesCard body={dashCard.body} t={t} accent={t.accent}/>}

            {/* ════════ ELEVATOR PITCH — first card, full width ════════ */}
            {dashPitch && (
              <div className="dash-card dash-primary" style={{...dashCardAccent,background:t.badgeBg,marginBottom:16}}>
                <div className="dash-label" style={dashLabel}>Elevator Pitch</div>
                <div style={{fontSize:14,color:t.text,lineHeight:1.65,fontStyle:"italic"}}><MarkdownBody body={dashPitch.body} t={t} accent={t.accent}/></div>
              </div>
            )}

            {/* ════════ TIER 1 · SNAPSHOT — above the fold ════════ */}
            {dashTier("Snapshot", "The 30-second read before your meeting")}
            <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:12,marginBottom:12,alignItems:"stretch"}}>
              <div className="dash-card dash-primary" style={dashCardAccent}>
                <div className="dash-label" style={dashLabel}>Start Here</div>
                {dashKeyTakeaways && dashKeyTakeaways.content
                  ? <div style={{fontSize:14,color:t.text,lineHeight:1.75}}><MarkdownBody body={dashKeyTakeaways.content} t={t} accent={t.accent}/></div>
                  : <div style={{fontSize:13,color:t.textDim}}>Generating…</div>}
              </div>
              {dashWedge
                ? <div className="dash-card" style={dashCardBase}>
                    <div className="dash-label" style={dashLabel}>Why IBM Wins</div>
                    <div style={{fontSize:13,color:t.textSub,lineHeight:1.7}}><MarkdownBody body={dashWedge.body} t={t} accent={t.accent}/></div>
                  </div>
                : <div className="dash-card" style={{...dashCardBase,display:"flex",alignItems:"center",justifyContent:"center",color:t.textDim,fontSize:12}}>Why IBM wins — loading…</div>}
            </div>
            {/* ════════ TIER 2 · INSIGHTS ════════ */}
            {(dashBackground || dashQual || dashWhyNow) && dashTier("Strategy", "Who they are → why now")}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignItems:"stretch"}}>
              {dashBackground && <SectionCard key={dashBackground.title} title={dashBackground.title} content={dashBackground.content} industry={displayBriefing?.ind} t={t} streaming={dashBackground.isStreaming}/>}
              {dashQual && <SectionCard key={dashQual.title} title={dashQual.title} content={dashQual.content} industry={displayBriefing?.ind} t={t} streaming={dashQual.isStreaming}/>}
            </div>
            {dashWhyNow && (
              <div className="dash-card dash-primary" style={{...dashCardAccent,marginTop:12}}>
                <div className="dash-label" style={dashLabel}>Why Act Now</div>
                <div style={{fontSize:13,color:t.textSub,lineHeight:1.7}}><MarkdownBody body={dashWhyNow.body} t={t} accent={t.accent}/></div>
              </div>
            )}

            {(dashMapping || briefingReady || generating) && dashTier("Mapping", "Where IBM fits")}
            {dashMapping && (
              <div className="dash-card" style={{...dashCardBase,marginBottom:12}}>
                <div className="dash-label" style={dashLabel}>Solution Mapping</div>
                <div style={{fontSize:13,color:t.textSub,lineHeight:1.7}}><MarkdownBody body={dashMapping.body} t={t} accent={t.accent}/></div>
              </div>
            )}
            {streamingSections.filter(s => PRODUCT_TITLES.includes(s.title)).map(s => (
              <SectionCard key={s.title} title={s.title} content={s.content} industry={displayBriefing?.ind || ""} t={t} streaming={s.isStreaming}/>
            ))}

            {(dashUseCase || dashPlay) && dashTier("Execution", "How to win the deal")}
            {dashUseCase && (
              <div className="dash-card" style={{...dashCardBase,marginBottom:12}}>
                <div className="dash-label" style={dashLabel}>Best-Fit Use Cases</div>
                <div style={{fontSize:13,color:t.textSub,lineHeight:1.7}}><MarkdownBody body={dashUseCase.body} t={t} accent={t.accent}/></div>
              </div>
            )}
            {dashPlay && (
              <div className="dash-card" style={dashCardBase}>
                <div className="dash-label" style={dashLabel}>6-Step Sales Play</div>
                <SalesPlayFlow body={dashPlay.body} t={t}/>
              </div>
            )}
            {prospectGenerating && !prospectResult && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0",color:t.textDim}}>
                <div className="animate-pulse-dot" style={{width:6,height:6,borderRadius:"50%",background:t.accent,boxShadow:`0 0 6px ${t.accentGlow}`}}/>
                <span style={{fontSize:13,fontWeight:300}}>Building product mapping & sales play…</span>
              </div>
            )}

            {/* ════════ TIER 3 · REFERENCE ════════ */}
            {/* Discovery Questions always expanded — no accordion */}
            {((hasContact && dashWhoIs) || dashDiscovery || dashContract || dashContacts) && dashTier("Reference", "Detail on demand")}
            {hasContact && dashWhoIs && dashRefRow("whois", dashWhoIs.title, <MarkdownBody body={dashWhoIs.content} t={t} accent={t.accent}/>)}
            {dashDiscovery && (
              <div className="dash-card" style={{...dashCardBase,marginBottom:8}}>
                <div className="dash-label" style={dashLabel}>{dashDiscovery.title}</div>
                <div style={{fontSize:13,color:t.textSub,lineHeight:1.8}}><MarkdownBody body={dashDiscovery.content} t={t} accent={t.accent}/></div>
              </div>
            )}
            {dashContract && dashRefRow("contract", dashContract.title, <MarkdownBody body={dashContract.body} t={t} accent={t.accent}/>)}
            {dashContacts && dashRefRow("contacts", "Contacts", <MarkdownBody body={dashContacts.body} t={t} accent={t.accent}/>)}

            </div>
            {/* /PDF capture region */}

            {/* ════════ CHAT ════════ */}
            {briefingReady && (
              <BriefingChat
                briefingText={currentBriefing?.text || briefingText}
                companyName={displayCo}
                t={t}
              />
            )}

            {/* ════════ ARCHITECTURE DIAGRAM ════════ */}
            {briefingReady && (
              <ArchitectureDiagram
                companyName={displayCo}
                briefingText={currentBriefing?.text || briefingText}
                prospectStep1={currentBriefing?.prospectStep1 || prospectResult?.step1 || ""}
                prospectStep2={currentBriefing?.prospectStep2 || prospectResult?.step2 || ""}
                initialDiagram={currentBriefing?.architectureDiagram || ""}
                onGenerated={(raw) => {
                  setCurrentBriefingAndRef(prev => prev ? { ...prev, architectureDiagram: raw } : prev);
                  const dbId = currentBriefingRef.current?._id;
                  if (dbId) {
                    fetch(`/api/history/briefings/${dbId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ architectureDiagram: raw }),
                    }).catch(() => { /* non-fatal */ });
                  }
                }}
                t={t}
              />
            )}

            {/* Waiting for first chunk */}
            {generating && streamingSections.length===0 && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"20px 0",color:t.textDim}}>
                <div className="animate-pulse-dot" style={{width:6,height:6,borderRadius:"50%",background:t.accent,boxShadow:`0 0 6px ${t.accentGlow}`}}/>
                <span style={{fontSize:13,fontWeight:300}}>Thinking…</span>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes progress-slide {
          0%   { transform: translateX(-100%); width: 40%; }
          50%  { transform: translateX(60%);  width: 60%; }
          100% { transform: translateX(200%); width: 40%; }
        }
      `}</style>
    </div>
  );
}

/* ─── Briefing Chat ──────────────────────────────────────────────────────────
   Contextual Q&A panel shown below a completed briefing.
   Sends the full briefing markdown as context so every answer is account-specific.
*/
interface ChatMessage { role: "user" | "assistant"; content: string; }

function BriefingChat({ briefingText, companyName, t }: {
  briefingText: string;
  companyName: string;
  t: typeof DARK;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const accent = t.accent;

  const SUGGESTIONS = [
    "What's the strongest IBM opening for this account?",
    "Draft a follow-up email after the discovery call",
    "What objections should I prepare for?",
    "Summarise the top 3 risks if we don't act this quarter",
  ];

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || streaming) return;
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setStreaming(true);

    // Placeholder assistant message we'll fill in via streaming
    setMessages(m => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          briefingContext: briefingText,
          companyName,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.done) break;
          if (data.content) {
            assembled += data.content;
            setMessages(m => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: assembled };
              return copy;
            });
          }
        }
      }
    } catch {
      setMessages(m => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <div className="no-print" style={{
      borderTop: `1px solid ${t.sectionCardBorder}`,
      marginTop: 32,
      paddingTop: 24,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.textDim }}>
          Ask about {companyName || "this account"}
        </span>
      </div>

      {/* Suggestion chips — only when no messages yet */}
      {messages.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{
                fontSize: 12, padding: "6px 13px", borderRadius: 20, cursor: "pointer",
                background: t.btnSm, border: `1px solid ${t.btnSmBorder}`, color: t.textSub,
                fontFamily: "var(--app-font-sans)", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = t.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.btnSmBorder; e.currentTarget.style.color = t.textSub; }}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Message history */}
      {messages.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, maxHeight: 480, overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                background: m.role === "user"
                  ? "rgba(15,98,254,0.18)"
                  : t.sectionCard,
                border: `1px solid ${m.role === "user" ? "rgba(15,98,254,0.35)" : t.sectionCardBorder}`,
                fontSize: 13,
                lineHeight: 1.65,
                color: t.text,
              }}>
                {m.content
                  ? <MarkdownBody body={m.content} t={t} accent={accent} />
                  : <span className="animate-pulse-dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: accent }} />
                }
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.currentTarget.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask a follow-up question about this account…"
          rows={2}
          style={{
            flex: 1, background: t.input, border: `1px solid ${t.inputBorder}`,
            borderRadius: 10, padding: "10px 14px", fontSize: 13, color: t.text,
            fontFamily: "var(--app-font-sans)", resize: "none", outline: "none",
            lineHeight: 1.5,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = accent; }}
          onBlur={e => { e.currentTarget.style.borderColor = t.inputBorder; }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || streaming}
          style={{
            padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: input.trim() && !streaming ? "#0f62fe" : t.btnSm,
            color: input.trim() && !streaming ? "#fff" : t.textDim,
            border: "none", cursor: input.trim() && !streaming ? "pointer" : "default",
            fontFamily: "var(--app-font-sans)", transition: "all 0.15s", flexShrink: 0,
          }}
        >
          {streaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

/* ─── Mermaid sanitizer ───────────────────────────────────────────────────────
   Fixes the most common LLM mistakes before handing source to Mermaid:
   - strips %% inline comments (break the parser in most positions)
   - removes edges that were placed inside a subgraph block
   - collapses multi-line node labels into single lines
   - ensures the diagram type line is "graph TD"
*/
function sanitizeMermaid(src: string): string {
  const lines = src.split("\n");
  const out: string[] = [];
  let inSubgraph = false;
  // Collect edges found inside subgraphs so we can re-append them after
  const hoistedEdges: string[] = [];
  // Edge pattern: anything with --> or --- between identifiers
  const EDGE_RE = /^\s*\w[\w-]*\s*(-->|---|-\.-?>?|==?>?)/;
  // Subgraph open/close
  const SUB_OPEN = /^\s*subgraph\s/;
  const SUB_CLOSE = /^\s*end\b/;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Strip %% comments (keep line if content remains before the %%)
    line = line.replace(/%%.*$/, "").trimEnd();

    // Collapse multi-line label continuations: a label line that has an
    // unmatched opening quote but no closing bracket — skip (the next line
    // is usually a continuation, already handled by stripping newlines in labels)
    // Simpler: remove literal \n inside quoted strings
    line = line.replace(/"([^"]*?)\\n([^"]*?)"/g, (_, a, b) => `"${a} ${b}"`);

    // Ensure first content line is "graph TD"
    if (i === 0 || (i <= 2 && /^\s*(graph|flowchart)\s/i.test(line))) {
      out.push("graph TD");
      continue;
    }

    if (SUB_OPEN.test(line)) { inSubgraph = true; out.push(line); continue; }
    if (SUB_CLOSE.test(line)) { inSubgraph = false; out.push(line); continue; }

    if (inSubgraph && EDGE_RE.test(line)) {
      // Edge inside subgraph — hoist it to after the last end
      hoistedEdges.push(line.trim());
      continue;
    }

    if (line.trim()) out.push(line);
  }

  // Re-append hoisted edges (deduped)
  const seen = new Set<string>();
  for (const e of hoistedEdges) {
    if (!seen.has(e)) { seen.add(e); out.push("    " + e); }
  }

  return out.join("\n");
}

/* ─── Architecture Diagram ────────────────────────────────────────────────────
   Optionally triggered panel at the bottom of a completed briefing.
   Streams a Mermaid flowchart from Claude Sonnet + IBM upgrade path.
*/
function ArchitectureDiagram({
  companyName, briefingText, prospectStep1, prospectStep2, initialDiagram, onGenerated, t,
}: {
  companyName: string;
  briefingText: string;
  prospectStep1: string;
  prospectStep2: string;
  initialDiagram?: string;
  onGenerated?: (raw: string) => void;
  t: typeof DARK;
}) {
  const [triggered, setTriggered] = useState(Boolean(initialDiagram));
  const [streaming, setStreaming] = useState(false);
  const [raw, setRaw] = useState(initialDiagram || "");
  const [error, setError] = useState("");
  const diagramRef = useRef<HTMLDivElement>(null);
  const accent = t.accent;

  // Parse raw output into mermaid source + upgrade path prose.
  // Only extract when streaming is done so we render exactly once.
  const parsed = useMemo(() => {
    const fenceMatch = raw.match(/```mermaid\s*([\s\S]*?)```/);
    const rawSrc = fenceMatch ? fenceMatch[1].trim() : "";
    const mermaidSrc = rawSrc ? sanitizeMermaid(rawSrc) : "";
    const afterFence = fenceMatch
      ? raw.slice(raw.indexOf("```", raw.indexOf(fenceMatch[1]) + fenceMatch[1].length) + 3)
      : raw;
    const upgradeMatch = afterFence.match(/###\s*IBM Upgrade Path([\s\S]*)/i);
    const upgradePath = upgradeMatch ? upgradeMatch[1].trim() : "";
    return { mermaidSrc, upgradePath, hasDiagram: Boolean(mermaidSrc) };
  }, [raw]);

  // Render Mermaid only once — when streaming finishes and we have complete source.
  const renderedSrc = useRef("");
  useEffect(() => {
    // Only render after stream done, and only if source changed
    if (streaming || !parsed.mermaidSrc || parsed.mermaidSrc === renderedSrc.current || !diagramRef.current) return;
    renderedSrc.current = parsed.mermaidSrc;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: t === DARK ? "dark" : "default",
          themeVariables: t === DARK ? {
            primaryColor: "#1c1c1c",
            primaryTextColor: "#f4f4f4",
            primaryBorderColor: "rgba(255,255,255,0.12)",
            lineColor: "#4589ff",
            background: "#161616",
            nodeBorder: "rgba(255,255,255,0.12)",
            clusterBkg: "#1c1c1c",
            titleColor: "#f4f4f4",
            edgeLabelBackground: "#1c1c1c",
          } : {},
        });
        // Unique ID so Mermaid's internal cache doesn't collide on regenerate
        const id = `arch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const { svg } = await mermaid.render(id, parsed.mermaidSrc);
        if (!cancelled && diagramRef.current) {
          diagramRef.current.innerHTML = svg;
          const svgEl = diagramRef.current.querySelector("svg");
          if (svgEl) { svgEl.style.maxWidth = "100%"; svgEl.style.height = "auto"; }
        }
      } catch {
        if (!cancelled && diagramRef.current) {
          diagramRef.current.innerHTML = `<pre style="font-size:11px;color:${t.textDim};overflow:auto;white-space:pre-wrap">${parsed.mermaidSrc}</pre>`;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [streaming, parsed.mermaidSrc, t]);

  const generate = async () => {
    setTriggered(true);
    setStreaming(true);
    setRaw("");
    setError("");
    renderedSrc.current = "";
    if (diagramRef.current) diagramRef.current.innerHTML = "";
    try {
      const res = await fetch("/api/architecture/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, briefingText, prospectStep1, prospectStep2 }),
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assembled = "";
      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.done) { streamDone = true; break; }
          if (data.content) { assembled += data.content; setRaw(assembled); }
        }
      }
      // Lift final result to parent so it can be included in Save
      onGenerated?.(assembled);
    } catch {
      setError("Failed to generate diagram. Please try again.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="no-print" style={{
      borderTop: `1px solid ${t.sectionCardBorder}`,
      marginTop: 32,
      paddingTop: 24,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: triggered ? 16 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/>
            <rect x="9" y="15" width="6" height="6" rx="1"/>
            <path d="M5 9v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M12 14v1"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.textDim }}>
            Architecture Diagram
          </span>
          {streaming && (
            <span className="animate-pulse-dot" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: accent, marginLeft: 4 }} />
          )}
        </div>
        {!triggered && (
          <button
            onClick={generate}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, padding: "7px 16px", borderRadius: 8,
              background: "rgba(15,98,254,0.13)", border: "1px solid rgba(15,98,254,0.35)",
              color: "rgba(69,137,255,0.9)", cursor: "pointer",
              fontFamily: "var(--app-font-sans)", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0f62fe"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#0f62fe"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(15,98,254,0.13)"; e.currentTarget.style.color = "rgba(69,137,255,0.9)"; e.currentTarget.style.borderColor = "rgba(15,98,254,0.35)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Generate
          </button>
        )}
        {triggered && !streaming && (
          <button
            onClick={generate}
            style={{
              fontSize: 11, padding: "5px 12px", borderRadius: 6,
              background: t.btnSm, border: `1px solid ${t.btnSmBorder}`,
              color: t.textDim, cursor: "pointer", fontFamily: "var(--app-font-sans)",
            }}
          >↺ Regenerate</button>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 12, color: "#ff6b6b", marginTop: 8 }}>{error}</p>
      )}

      {triggered && (
        <>
          {/* Mermaid diagram */}
          {parsed.hasDiagram || streaming ? (
            <div style={{
              background: t.sectionCard, border: `1px solid ${t.sectionCardBorder}`,
              borderRadius: 12, padding: "16px 20px", marginBottom: 16, overflowX: "auto",
            }}>
              {streaming && !parsed.hasDiagram && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.textDim, fontSize: 12 }}>
                  <span className="animate-pulse-dot" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: accent }} />
                  Building diagram…
                </div>
              )}
              <div ref={diagramRef} style={{ lineHeight: 1 }} />
            </div>
          ) : null}

          {/* Upgrade path */}
          {parsed.upgradePath && (
            <div style={{
              background: t.sectionCard, border: `1px solid ${t.sectionCardBorder}`,
              borderRadius: 12, padding: "16px 20px",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: accent, marginBottom: 12,
              }}>IBM Upgrade Path</div>
              <MarkdownBody body={parsed.upgradePath} t={t} accent={accent} />
            </div>
          )}

          {/* Still streaming — show raw text as fallback while no fence yet */}
          {streaming && !parsed.hasDiagram && raw && (
            <pre style={{
              fontSize: 11, color: t.textDim, background: t.sectionCard,
              border: `1px solid ${t.sectionCardBorder}`, borderRadius: 8,
              padding: "12px 16px", overflowX: "auto", whiteSpace: "pre-wrap",
            }}>{raw}</pre>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Debounce ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(()=>setDebounced(value), delay);
    return ()=>clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
// Made with Bob

// Made with Bob
