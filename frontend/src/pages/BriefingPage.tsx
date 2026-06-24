import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useGetBriefingNews, useGetBriefingLogo, useGetBriefingIndustry, useGetPulseNews, getBaseUrl } from "@/lib/api-client";

/* ─── User Info Hook ─── */
function useUserInfo() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("userName") || "";
    const role = localStorage.getItem("userRole") || "";
    const picture = localStorage.getItem("userProfilePicture");
    setUserName(name);
    setUserRole(role);
    if (picture) setUserProfilePicture(picture);
  }, []);

  return { userName, userRole, userProfilePicture };
}

/* ─── Types ─── */
type Theme = "dark" | "light";

interface SavedBriefing {
  co: string; ct: string; ti: string; ind: string;
  callType: string; text: string; logoUrl: string;
  contactPhotoUrl?: string;
  date: string; ts: number;
}

const MEETING_TYPES = ["Discovery", "Renewal", "Competitive", "EBC"] as const;
type MeetingType = typeof MEETING_TYPES[number];

/* ─── Theme tokens ─── */
const DARK = {
  bodyBg: "linear-gradient(160deg,#2a2a2a 0%,#1e1e1e 35%,#252528 65%,#1a1a1c 100%)",
  sidebar: "rgba(255,255,255,0.04)", sidebarBorder: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.05)", cardBorder: "rgba(255,255,255,0.09)",
  cardShadow: "inset 0 1px 0 rgba(255,255,255,0.10),0 2px 12px rgba(0,0,0,0.2)",
  input: "rgba(255,255,255,0.05)", inputBorder: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.85)", textSub: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.35)", textDim: "rgba(255,255,255,0.22)",
  divider: "rgba(255,255,255,0.07)",
  btn: "rgba(200,200,215,0.12)", btnBorder: "rgba(255,255,255,0.16)", btnText: "rgba(255,255,255,0.82)",
  btnSm: "rgba(255,255,255,0.06)", btnSmBorder: "rgba(255,255,255,0.12)", btnSmText: "rgba(255,255,255,0.65)",
  pill: "rgba(255,255,255,0.06)", pillBorder: "rgba(255,255,255,0.11)",
  chipBg: "rgba(255,255,255,0.05)", chipBorder: "rgba(255,255,255,0.09)",
  accent: "#6ee7b7", accentGlow: "rgba(110,231,183,0.7)",
  mtActive: "rgba(210,210,225,0.16)", mtActiveBorder: "rgba(210,210,225,0.32)", mtActiveText: "rgba(225,225,240,0.9)",
  mtInactive: "rgba(255,255,255,0.05)", mtInactiveBorder: "rgba(255,255,255,0.10)", mtInactiveText: "rgba(255,255,255,0.42)",
  sectionCard: "rgba(255,255,255,0.05)", sectionCardBorder: "rgba(255,255,255,0.09)",
  sectionHeaderBorder: "rgba(255,255,255,0.06)",
  sectionText: "rgba(255,255,255,0.60)", sectionBullet: "rgba(255,255,255,0.65)",
  overlay: "rgba(26,26,28,0.96)",
  toggleBg: "rgba(255,255,255,0.08)", toggleBorder: "rgba(255,255,255,0.14)", toggleIcon: "rgba(255,255,255,0.6)",
  progressBar: "rgba(110,231,183,0.6)",
  badgeBg: "rgba(180,200,220,0.10)", badgeBorder: "rgba(180,200,220,0.16)", badgeText: "rgba(180,200,220,0.65)",
  nameLine: "rgba(255,255,255,0.85)", dateText: "rgba(255,255,255,0.20)",
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
  accent: "#059669", accentGlow: "rgba(5,150,105,0.4)",
  mtActive: "rgba(10,80,200,0.10)", mtActiveBorder: "rgba(10,80,200,0.30)", mtActiveText: "rgba(10,80,200,0.85)",
  mtInactive: "rgba(0,0,0,0.04)", mtInactiveBorder: "rgba(0,0,0,0.10)", mtInactiveText: "rgba(0,0,0,0.55)",
  sectionCard: "rgba(255,255,255,0.95)", sectionCardBorder: "rgba(0,0,0,0.09)",
  sectionHeaderBorder: "rgba(0,0,0,0.06)",
  sectionText: "rgba(0,0,0,0.60)", sectionBullet: "rgba(0,0,0,0.65)",
  overlay: "rgba(240,240,245,0.96)",
  toggleBg: "rgba(0,0,0,0.06)", toggleBorder: "rgba(0,0,0,0.12)", toggleIcon: "rgba(0,0,0,0.6)",
  progressBar: "rgba(5,150,105,0.7)",
  badgeBg: "rgba(10,80,200,0.08)", badgeBorder: "rgba(10,80,200,0.18)", badgeText: "rgba(10,80,200,0.80)",
  nameLine: "rgba(0,0,0,0.85)", dateText: "rgba(0,0,0,0.30)",
  topBar: "rgba(0,0,0,0.05)",
};

const SECTION_ACCENTS_DARK: Record<string, { accent: string; bg: string }> = {
  "Company & Contact Background":       { accent: "rgba(160,180,210,0.65)", bg: "rgba(160,180,210,0.07)" },
  "Account Health & Risk":              { accent: "rgba(160,180,210,0.65)", bg: "rgba(160,180,210,0.07)" },
  "Competitive Landscape":              { accent: "rgba(160,180,210,0.65)", bg: "rgba(160,180,210,0.07)" },
  "Executive Profile & Strategic Agenda": { accent: "rgba(160,180,210,0.65)", bg: "rgba(160,180,210,0.07)" },
  "Discovery Questions":                { accent: "rgba(130,190,155,0.65)", bg: "rgba(130,190,155,0.07)" },
  "Renewal & Expansion Questions":      { accent: "rgba(130,190,155,0.65)", bg: "rgba(130,190,155,0.07)" },
  "Competitive Discovery Questions":    { accent: "rgba(130,190,155,0.65)", bg: "rgba(130,190,155,0.07)" },
  "Executive Engagement Questions":     { accent: "rgba(130,190,155,0.65)", bg: "rgba(130,190,155,0.07)" },
  "Opportunity Qualification":          { accent: "rgba(200,170,120,0.65)", bg: "rgba(200,170,120,0.07)" },
  "Expansion Qualification":            { accent: "rgba(200,170,120,0.65)", bg: "rgba(200,170,120,0.07)" },
  "Win/Loss Qualification":             { accent: "rgba(200,170,120,0.65)", bg: "rgba(200,170,120,0.07)" },
  "Business Case Qualification":        { accent: "rgba(200,170,120,0.65)", bg: "rgba(200,170,120,0.07)" },
  "Product Recommendations":            { accent: "rgba(100,160,230,0.70)", bg: "rgba(100,160,230,0.07)" },
  "Retention & Upsell Positioning":     { accent: "rgba(100,160,230,0.70)", bg: "rgba(100,160,230,0.07)" },
  "IBM Differentiation":                { accent: "rgba(100,160,230,0.70)", bg: "rgba(100,160,230,0.07)" },
  "Strategic Investment Themes":        { accent: "rgba(100,160,230,0.70)", bg: "rgba(100,160,230,0.07)" },
};

const SECTION_ACCENTS_LIGHT: Record<string, { accent: string; bg: string }> = {
  "Company & Contact Background":       { accent: "#3a5f9a", bg: "#eef3ff" },
  "Account Health & Risk":              { accent: "#3a5f9a", bg: "#eef3ff" },
  "Competitive Landscape":              { accent: "#3a5f9a", bg: "#eef3ff" },
  "Executive Profile & Strategic Agenda": { accent: "#3a5f9a", bg: "#eef3ff" },
  "Discovery Questions":                { accent: "#2d7a50", bg: "#edfaf3" },
  "Renewal & Expansion Questions":      { accent: "#2d7a50", bg: "#edfaf3" },
  "Competitive Discovery Questions":    { accent: "#2d7a50", bg: "#edfaf3" },
  "Executive Engagement Questions":     { accent: "#2d7a50", bg: "#edfaf3" },
  "Opportunity Qualification":          { accent: "#8a5a1a", bg: "#fdf5e8" },
  "Expansion Qualification":            { accent: "#8a5a1a", bg: "#fdf5e8" },
  "Win/Loss Qualification":             { accent: "#8a5a1a", bg: "#fdf5e8" },
  "Business Case Qualification":        { accent: "#8a5a1a", bg: "#fdf5e8" },
  "Product Recommendations":            { accent: "#0f62fe", bg: "#ebf2ff" },
  "Retention & Upsell Positioning":     { accent: "#0f62fe", bg: "#ebf2ff" },
  "IBM Differentiation":                { accent: "#0f62fe", bg: "#ebf2ff" },
  "Strategic Investment Themes":        { accent: "#0f62fe", bg: "#ebf2ff" },
};

/* ─── Helpers ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function loadSaved(): SavedBriefing[] {
  try { return JSON.parse(localStorage.getItem("briefings") || "[]"); } catch { return []; }
}
function persistSaved(list: SavedBriefing[]) {
  localStorage.setItem("briefings", JSON.stringify(list));
}
function fmtDate() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── PDF Builder ─── */
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
      const proxyUrl = `http://localhost:3000/api/briefing/proxy-image?url=${encodeURIComponent(url)}`;
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
  const productsH = Math.max(availableH - usedH, 30); // at least 30mm
  
  // Row 1 - Company Background (tight box, sized to text)
  renderParagraphBox(m, y, fullW, companyH, "Company Background", companyBackgroundParagraph);
  
  // Row 2 - Who is [Name]?
  y += companyH + gap;
  renderBox(m, y, fullW, contactH, `Who is ${ct}?`, contactInfo, false);
  
  // Row 3 - Discovery Questions (left) + Opportunity Qualification (right), same height
  y += contactH + gap;
  renderBox(m, y, colW, row3H, "Discovery Questions", discoveryQs, false);
  renderQualBox(m + colW + 3, y, colW, row3H, contentSets[2].title, qualInfo);
  
  // Row 4 - IBM Product Recommendations (full width, fills remaining space)
  y += row3H + gap;

  const maxBottomY = H - 10;
  const availableBottomHeight = Math.min(productsH, maxBottomY - y);

  // Draw outer container
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(m, y, fullW, availableBottomHeight, 1.5, 1.5, "FD");

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
  doc.text("IBM Product Recommendations", m + 3, y + 6);
  doc.setDrawColor(IBM_BLUE[0], IBM_BLUE[1], IBM_BLUE[2]);
  doc.setLineWidth(0.5);
  doc.line(m + 3, y + 9, m + fullW - 3, y + 9);

  // Render each product as a mini card
  const cardGap = 2;
  const cardStartY = y + 13;
  const totalCardGaps = (products.length - 1) * cardGap;
  const cardH = (availableBottomHeight - 13 - totalCardGaps - 3) / products.length;

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
      ? ["watsonx.ai","watsonx.governance","IBM OpenPages"]
      : ind.includes("health") || ind.includes("pharma") || ind.includes("life")
      ? ["watsonx.ai","watsonx.governance","watsonx.data"]
      : ind.includes("retail") || ind.includes("consumer")
      ? ["watsonx.ai","watsonx.data","IBM Knowledge Catalog"]
      : ["watsonx.ai","watsonx.data","watsonx.governance"];

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
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {products.map((p, i) => (
        <div key={i} style={{
          background: bg,
          border:`1px solid ${accent.replace(/[\d.]+\)$/, "0.22)")}`,
          borderRadius:10,
          padding:"13px 16px",
          display:"flex",flexDirection:"column",gap:5,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:13,fontWeight:600,color:t.text,letterSpacing:"-0.2px"}}>{p.name}</span>
            <span style={{
              fontSize:9.5,fontWeight:500,letterSpacing:"0.5px",textTransform:"uppercase",
              color:accent,background:`${accent.replace(/[\d.]+\)$/, "0.12)")}`,
              border:`1px solid ${accent.replace(/[\d.]+\)$/, "0.25)")}`,
              borderRadius:4,padding:"2px 7px",
            }}>{p.tag}</span>
          </div>
          <p style={{margin:0,fontSize:12,color:t.sectionText,lineHeight:1.6}}>{p.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ title, content, industry, t, streaming }: {
  title: string; content: string; industry?: string;
  t: typeof DARK; streaming?: boolean;
}) {
  const isDark = t === DARK;
  const map = isDark ? SECTION_ACCENTS_DARK : SECTION_ACCENTS_LIGHT;
  const { accent, bg } = map[title] ?? { accent: isDark ? "rgba(200,200,210,0.55)" : "#666", bg: isDark ? "rgba(200,200,210,0.06)" : "#f5f5f7" };

  const isProductRecs = ["Product Recommendations","Retention & Upsell Positioning","IBM Differentiation","Strategic Investment Themes"].includes(title);

  const rows: React.ReactNode[] = [];
  if (!isProductRecs) {
    // Strip ALL asterisks - no markdown rendering
    const lines = content.replace(/\*\*\*/g,"").replace(/\*\*/g,"").replace(/\*/g,"").replace(/^--$/gm,"").split("\n");
    // Count real content lines to adjust font sizing
    const contentLines = lines.filter(l => l.trim().length > 0).length;
    // Use slightly larger text if fewer lines (less content = more space to fill)
    const bodyFontSize = contentLines <= 4 ? 14 : contentLines <= 7 ? 13.5 : 13;

    lines.forEach((line, i) => {
      const l = line.trim();
      if (!l) { rows.push(<div key={i} style={{height:2}} />); return; }
      if (l.endsWith(":") && l.length < 60) {
        rows.push(<p key={i} style={{margin:"10px 0 4px",fontSize:10,fontWeight:600,letterSpacing:"0.7px",textTransform:"uppercase",color:accent}}>{l.slice(0,-1)}</p>);
      } else if (l.match(/^[-*•] /)) {
        rows.push(
          <div key={i} style={{display:"flex",gap:10,marginBottom:6,alignItems:"flex-start"}}>
            <span style={{color:accent,fontSize:13,lineHeight:"1.5",flexShrink:0}}>–</span>
            <span style={{color:t.sectionBullet,fontSize:bodyFontSize,lineHeight:1.65}}>{l.slice(2)}</span>
          </div>
        );
      } else if (l.match(/^\d[.)]/)) {
        rows.push(
          <div key={i} style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start"}}>
            <span style={{color:accent,fontSize:11,fontWeight:600,flexShrink:0,minWidth:16,paddingTop:2}}>{l[0]}.</span>
            <span style={{color:t.sectionBullet,fontSize:bodyFontSize,lineHeight:1.7}}>{l.slice(2).trim()}</span>
          </div>
        );
      } else {
        const labelMatch = l.match(/^([A-Za-z][A-Za-z ]{0,28}): (.+)$/);
        if (labelMatch) {
          rows.push(
            <p key={i} style={{margin:"0 0 8px",fontSize:bodyFontSize,lineHeight:1.65}}>
              <strong style={{color:t.textSub,fontWeight:600}}>{labelMatch[1]}:</strong>
              <span style={{color:t.sectionText}}>{" "}{labelMatch[2]}</span>
            </p>
          );
        } else {
          rows.push(<p key={i} style={{margin:"0 0 7px",color:t.sectionText,fontSize:bodyFontSize,lineHeight:1.65}}>{l}</p>);
        }
      }
    });
  }

  return (
    <div className="animate-fade-in" style={{
      background: t.sectionCard, backdropFilter:"blur(28px) saturate(150%)",
      WebkitBackdropFilter:"blur(28px) saturate(150%)",
      border:`1px solid ${t.sectionCardBorder}`, borderRadius:14,
      marginBottom:12, overflow:"hidden", boxShadow: t.cardShadow,
    }}>
      <div style={{height:2,background:accent,width:"100%",opacity:0.6}} />
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 20px 10px",borderBottom:`1px solid ${t.sectionHeaderBorder}`}}>
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
  const { userName, userRole, userProfilePicture } = useUserInfo();
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "dark");
  const t = theme === "dark" ? DARK : LIGHT;

  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [pendingBriefing, setPendingBriefing] = useState<Partial<SavedBriefing> | null>(null);
  const [saved, setSaved]       = useState<SavedBriefing[]>(() => loadSaved());
  const [showHistory, setShowHistory] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [error, setError]       = useState("");
  const textRef = useRef("");

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  const debouncedCompany = useDebounce(company, 600);

  // Fetch general tech news for home page (only when on home page)
  const shouldFetchGeneralNews = !briefingReady && !generating && !company;
  const { data: generalNewsData } = useGetPulseNews(
    { query: { enabled: shouldFetchGeneralNews } as any }
  );
  
  const { data: newsData }     = useGetBriefingNews({ company: debouncedCompany }, { query: { enabled: debouncedCompany.length > 1 && !briefingReady && !generating } as any });
  const { data: logoData }     = useGetBriefingLogo({ company: debouncedCompany }, { query: { enabled: debouncedCompany.length > 1 } as any });
  const { data: industryData } = useGetBriefingIndustry({ company: debouncedCompany }, { query: { enabled: debouncedCompany.length > 1 } as any });

  useEffect(() => { if (industryData?.industry && !industry) setIndustry(industryData.industry); }, [industryData]);
  useEffect(() => { if (company !== debouncedCompany) return; if (!company) setIndustry(""); }, [company]);

  // State for parsed contact name, photo, company, and title
  const [parsedContactName, setParsedContactName] = useState("");
  const [contactPhotoUrl, setContactPhotoUrl] = useState("");
  const [parsedCompanyName, setParsedCompanyName] = useState("");
  const [, setParsedTitle] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  
  // Debounce contact input for API call
  const debouncedContact = useDebounce(contact, 600);
  
  // Fetch parsed contact name, photo, and company from API when contact changes
  useEffect(() => {
    if (!debouncedContact.trim()) {
      setParsedContactName("");
      setContactName2("");
      setContactPhotoUrl("");
      setParsedCompanyName("");
      setParsedTitle("");
      setTitle("");
      setContactLoading(false);
      return;
    }
    
    // Check if it's a LinkedIn URL
    if (debouncedContact.toLowerCase().includes("linkedin.com/in/")) {
      // DEMO MODE: Auto-populate for Jamie Dimon
      if (debouncedContact.toLowerCase().includes("jamiedimon")) {
        console.log('Demo mode: Jamie Dimon detected');
        setParsedContactName("Jamie Dimon");
        setParsedCompanyName("JP Morgan Chase");
        setIndustry("Finance");
        setParsedTitle("Chairman & CEO");
        return;
      }

      setContactLoading(true);
      
      // Add cache-busting parameter to force fresh data
      fetch(`${getBaseUrl()}/api/briefing/parse-contact?contact=${encodeURIComponent(debouncedContact)}&_t=${Date.now()}`)
        .then(res => res.json())
        .then(async (data) => {
          console.log('Parse contact API response:', data);
          if (data.name) {
            // Sanitize: strip trailing tokens that look like LinkedIn ID fragments
            // e.g. "Sean Krepp Ab" (from slug "sean-krepp-29ab52395") → "Sean Krepp"
            const sanitizeName = (raw: string) =>
              raw.trim()
                .split(/\s+/)
                .filter((word, idx, arr) => {
                  if (idx === 0) return true;
                  const isLastWord = idx === arr.length - 1;
                  if (!isLastWord) return true;
                  const isTiny = word.length <= 3;
                  const isMixedAlphaNum = /[a-zA-Z]/.test(word) && /\d/.test(word);
                  return !isTiny && !isMixedAlphaNum;
                })
                .join(" ");
            const sanitized = sanitizeName(data.name);
            // Only use name if it has at least 2 words (first + last)
            // Single word names are likely just the slug, not a real name
            if (sanitized.includes(" ")) {
              setParsedContactName(sanitized);
            } else {
              setParsedContactName("");
            }
          }
          if (data.photoUrl) {
            setContactPhotoUrl(data.photoUrl);
          }

          // Track company internally for generation but do NOT fill the input box
          let resolvedCompany = data.company || "";
          if (resolvedCompany) {
            setParsedCompanyName(resolvedCompany);
          }

          // Populate industry — use API result first
          if (data.industry && !industry.trim()) {
            setIndustry(data.industry);
          }

          // If company still unknown, fire company-research as a second pass
          if (!resolvedCompany && data.name) {
            try {
              const researchRes = await fetch(
                `${getBaseUrl()}/api/briefing/company-research?company=${encodeURIComponent(data.name)}&contactTitle=${encodeURIComponent(data.title || "")}`
              );
              const researchData = await researchRes.json();
              // Try to extract a company name from the research snippet
              if (researchData.summary) {
                // Look for "works at X", "at X", or "Name - Title - X" patterns
                const nameFirst = (data.name || "").split(" ")[0];
                const patterns = [
                  researchData.summary.match(/(?:works|working|employed)\s+at\s+([A-Z][A-Za-z0-9 &'.,]{2,60})/i),
                  researchData.summary.match(new RegExp(`${nameFirst}[^\\n]{0,60}?\\bat\\s+([A-Z][A-Za-z0-9 &'.,]{2,60})`, 'i')),
                ];
                for (const m of patterns) {
                  if (m?.[1]) {
                    const candidate = m[1].trim().replace(/\s*[-–|].*$/, '').trim();
                    if (candidate.length > 2 && candidate.length < 80) {
                      setParsedCompanyName(candidate);
                      resolvedCompany = candidate;
                      break;
                    }
                  }
                }
              }
            } catch { /* silent — best effort */ }
          }

          // Re-run industry detection once company is known
          if (resolvedCompany && !industry.trim()) {
            try {
              const indRes = await fetch(`${getBaseUrl()}/api/briefing/industry?company=${encodeURIComponent(resolvedCompany)}`);
              const indData = await indRes.json();
              if (indData.industry) setIndustry(indData.industry);
            } catch { /* silent */ }
          }

          if (data.title) {
            setParsedTitle(data.title);
            if (!title.trim() && data.title && !data.title.toLowerCase().includes("linkedin")) setTitle(data.title);
          }
        })
        .catch(() => {
          // Fallback to basic parsing if API fails
          const match = debouncedContact.match(/linkedin\.com\/in\/([^/?]+)/i);
          if (match && match[1]) {
            const slug = match[1];
            const cleanSlug = slug.replace(/-[a-z0-9]*\d[a-z0-9]*$/i, "");
            const name = cleanSlug
              .replace(/[-_]/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .split(" ")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");
            setParsedContactName(name || debouncedContact);
            setContactPhotoUrl(`https://unavatar.io/linkedin/${slug}`);
            setParsedCompanyName("");
            setParsedTitle("");
          }
        })
        .finally(() => setContactLoading(false));
    } else {
      // Not a LinkedIn URL, use as-is
      setParsedContactName(debouncedContact);
      setContactPhotoUrl("");
      setParsedCompanyName("");
      setParsedTitle("");
      setContactLoading(false);
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
    const parts = briefingText.split("##").slice(1);
    const seen = new Set<string>();
    return parts
      .map((sec, i) => {
        const lines = sec.trim().split("\n");
        const title = lines[0].trim() || "…";
        return {
          title,
          content: lines.slice(1).join("\n").trim(),
          isStreaming: generating && i === parts.length - 1,
        };
      })
      .filter(sec => {
        const key = sec.title.toLowerCase().replace(/[^a-z]/g, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5); // max 5 sections (4 main + Product Recommendations)
  }, [briefingText, generating]);

  const generate = useCallback(async () => {
    // Use parsedCompanyName as fallback if company field is empty
    const effectiveCompany = company.trim() || parsedCompanyName.trim();
    
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
    setPendingBriefing({
      co: effectiveCompany, ct: contactName.trim(), ti: title.trim(),
      ind: industry.trim(), callType: meetingType,
      logoUrl: logoData?.url || "",
      contactPhotoUrl: contactPhotoUrl || "",
      date: fmtDate(), ts: Date.now(),
    });

    // ── Fetch live company research with a hard timeout — don't block generation ──
    let companyContext = "";
    try {
      const RESEARCH_TIMEOUT = 1500; // max 1.5s wait before we just start generating
      const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T | null> =>
        Promise.race([p, new Promise<null>(res => setTimeout(() => res(null), ms))]);

      const [wikiRes, newsRes] = await Promise.all([
        withTimeout(
          fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(effectiveCompany)}`)
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
      if (wikiRes && (wikiRes as any)?.extract) {
        parts.push(`Wikipedia: ${(wikiRes as any).extract}`);
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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const events = decoder.decode(value).split("\n\n").filter(Boolean);
        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const data = JSON.parse(event.slice(6));
          if (data.done) break;
          if (data.error) throw new Error(data.error);
          if (data.content) { textRef.current += data.content; setBriefingText(textRef.current); }
        }
      }
      const entry: SavedBriefing = {
        co: effectiveCompany, ct: contactName.trim(), ti: title.trim(),
        ind: industry.trim(), callType: meetingType,
        text: textRef.current, logoUrl: logoData?.url || "",
        contactPhotoUrl: contactPhotoUrl || "",
        date: fmtDate(), ts: Date.now(),
      };
      setCurrentBriefing(entry);
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
  }, [company, industry, contactName, title, context, meetingType, logoData, parsedCompanyName, contactPhotoUrl]);

  const saveBriefing = () => {
    if (!currentBriefing) return;
    const filtered = saved.filter(b => !(b.co === currentBriefing.co && b.ct === currentBriefing.ct));
    const updated = [currentBriefing, ...filtered].slice(0, 20);
    setSaved(updated); persistSaved(updated); setAlreadySaved(true);
  };
  const deleteSaved = (ts: number) => { const u = saved.filter(b => b.ts !== ts); setSaved(u); persistSaved(u); };
  const loadBriefing = (b: SavedBriefing) => {
    setCompany(b.co); setIndustry(b.ind); setContact(b.ct); setTitle(b.ti);
    setMeetingType(b.callType as MeetingType); setBriefingText(b.text);
    setContactPhotoUrl(b.contactPhotoUrl || "");
    setCurrentBriefing(b); setBriefingReady(true); setAlreadySaved(true); setShowHistory(false);
  };
  const newBriefing = () => {
    setBriefingReady(false); setBriefingText(""); setCurrentBriefing(null);
    setPendingBriefing(null); setAlreadySaved(false); setGenerating(false); textRef.current = "";
  };
  const exportPDF = () => {
    if (!currentBriefing) return;
    buildPDF(currentBriefing.text, currentBriefing.co, currentBriefing.ct, currentBriefing.ind, currentBriefing.contactPhotoUrl, currentBriefing.logoUrl);
  };

  const showResult = generating || briefingReady;
  const displayBriefing = briefingReady ? currentBriefing : pendingBriefing;
  const logoUrl = displayBriefing?.logoUrl || (briefingReady ? undefined : logoData?.url);

  /* ─── Button styles ─── */
  const glassBtn: React.CSSProperties = {
    width:"100%", background:t.btn, color:t.btnText, border:`1px solid ${t.btnBorder}`,
    borderRadius:10, padding:"11px 16px", fontSize:13, fontWeight:500,
    fontFamily:"var(--app-font-sans)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.10),0 2px 10px rgba(0,0,0,0.1)",
    cursor:"pointer", marginTop:4,
  };

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",fontFamily:"var(--app-font-sans)",background:t.bodyBg,color:t.text}}>

      {/* ─── Sidebar toggle ─── */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar" style={{
        position:"fixed",top:"50%",left:sidebarOpen?264:8,transform:"translateY(-50%)",zIndex:50,
        width:28,height:28,
        background:sidebarOpen?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.05)",
        border:`1px solid ${sidebarOpen?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.12)"}`,
        borderRadius:6,
        display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
        color:t.textMuted, transition:"all 0.2s ease",
        backdropFilter:"blur(8px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = t.text;
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = t.textMuted;
        e.currentTarget.style.background = sidebarOpen?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.05)";
        e.currentTarget.style.borderColor = sidebarOpen?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.12)";
      }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {sidebarOpen ? (
            <path d="M15 18l-6-6 6-6"/>
          ) : (
            <path d="M9 18l6-6-6-6"/>
          )}
        </svg>
      </button>

      {/* ─── Sidebar ─── */}
      <aside style={{
        flexShrink:0, width:sidebarOpen?280:0, minWidth:sidebarOpen?280:0,
        overflowY:"hidden", overflowX:"hidden",
        transition:"width 0.2s,min-width 0.2s",
        background:t.sidebar, backdropFilter:"blur(40px) saturate(160%)",
        WebkitBackdropFilter:"blur(40px) saturate(160%)",
        borderRight:`1px solid ${t.sidebarBorder}`,
        display:"flex", flexDirection:"column", height:"100vh",
      }}>
        {sidebarOpen && (
          <div style={{display:"flex",flexDirection:"column",height:"100%",paddingTop:56}}>
            {/* Profile row */}
            <div style={{padding:"0 18px",paddingBottom:14,marginBottom:12,borderBottom:`1px solid ${t.divider}`,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <>
                  {userProfilePicture && (
                    <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:`1.5px solid ${t.toggleBorder}`}}>
                      <img src={userProfilePicture} alt={userName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                  )}
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:500,color:t.text,margin:"0 0 1px"}}>
                      {userName || "User"}
                    </p>
                    <p style={{fontSize:10,color:t.textMuted,margin:0,fontWeight:300}}>
                      {userRole || "Sales Professional"}
                    </p>
                  </div>
                </>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div className="animate-pulse-dot" style={{width:6,height:6,borderRadius:"50%",background:t.accent,boxShadow:`0 0 7px ${t.accentGlow}`}} />
                  <button onClick={toggleTheme} title={`Switch to ${theme==="dark"?"light":"dark"} mode`} style={{
                    background:t.toggleBg, border:`1px solid ${t.toggleBorder}`, borderRadius:6,
                    width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",color:t.toggleIcon,flexShrink:0,
                  }}>
                    <ThemeIcon theme={theme}/>
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable content area */}
            <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"0 18px"}}>
              {/* History */}
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <button onClick={() => saved.length>0 && setShowHistory(!showHistory)} disabled={saved.length===0} style={{
                    flex:1,textAlign:"left",background:"none",border:"none",
                    color:t.textMuted,fontSize:12,cursor:saved.length>0?"pointer":"default",
                    padding:"4px 0",fontFamily:"var(--app-font-sans)",
                  }}>
                    Reports ({saved.length}) {saved.length>0?(showHistory?"▾":"▸"):""}
                  </button>
                  <button
                    onClick={() => {
                      setContact("");
                      setCompany("");
                      setIndustry("");
                      setTitle("");
                      setContext("");
                      setMeetingType("Discovery");
                      setParsedContactName("");
                      setContactPhotoUrl("");
                      setParsedCompanyName("");
                      setSaved(loadSaved());
                    }}
                    title="Clear form and refresh"
                    style={{
                      background:t.toggleBg, border:`1px solid ${t.toggleBorder}`, borderRadius:6,
                      width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",
                      cursor:"pointer",color:t.toggleIcon,flexShrink:0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                  </button>
                </div>
                {showHistory && saved.length>0 && (
                  <div style={{marginTop:6}}>
                    {saved.map(b=>(
                      <div key={b.ts} style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>
                        <button onClick={()=>loadBriefing(b)} style={{
                          flex:1,textAlign:"left",background:t.btnSm,border:`1px solid ${t.btnSmBorder}`,
                          borderRadius:8,color:t.btnSmText,fontSize:12,fontWeight:400,
                          padding:"8px 10px",lineHeight:1.4,cursor:"pointer",fontFamily:"var(--app-font-sans)",
                        }}>
                          <span style={{display:"block",fontWeight:500}}>{b.co}</span>
                          <span style={{display:"block",fontSize:11,color:t.textDim}}>{[b.ct,b.callType,b.date].filter(Boolean).join("  ·  ")}</span>
                        </button>
                        <button onClick={()=>deleteSaved(b.ts)} style={{background:"none",border:"none",color:t.textDim,fontSize:13,padding:"4px 6px",cursor:"pointer",fontFamily:"var(--app-font-sans)"}}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inputs */}
              <div>
                <GlassInput t={t} label="LinkedIn URL" value={contact} onChange={e=>setContact((e.target as HTMLInputElement).value)} placeholder="linkedin.com/in/username"/>
                {contact.toLowerCase().includes("linkedin.com/in/") && (
                  <GlassInput t={t} label="Name" value={contactName2} onChange={e=>setContactName2((e.target as HTMLInputElement).value)} placeholder="First Last"/>
                )}
                <div>
                  <GlassInput t={t} label="Company" value={company} onChange={e=>setCompany((e.target as HTMLInputElement).value)} placeholder="e.g. JPMorgan Chase"/>
                </div>
                <GlassInput t={t} label="Title (Optional)" value={title} onChange={e=>setTitle((e.target as HTMLInputElement).value)} placeholder="e.g. VP of Data & Analytics"/>
                <GlassInput t={t} label="Industry (Optional)" value={industry} onChange={e=>setIndustry((e.target as HTMLInputElement).value)} placeholder="Auto-detected — or type your own"/>
                <GlassInput t={t} label="Context (Optional)" textarea value={context} onChange={e=>setContext((e.target as HTMLTextAreaElement).value)} placeholder="Anything you already know…"/>

                <button
                  onClick={generate}
                  disabled={generating}
                  style={{
                    ...glassBtn,
                    opacity:generating?0.6:1,
                    marginTop:8,
                    position:"relative",
                    overflow:"hidden",
                    transform:"scale(1)",
                    transition:"all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!generating) {
                      e.currentTarget.style.transform = "scale(1.01)";
                      e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15),0 4px 16px rgba(0,0,0,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.10),0 2px 10px rgba(0,0,0,0.1)";
                  }}
                >
                  {generating ? (
                    <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <span className="animate-pulse-dot" style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}}/>
                      Generating…
                    </span>
                  ) : (
                    "Generate Briefing"
                  )}
                </button>

                {briefingReady && (
                  <button onClick={exportPDF} style={{
                    width:"100%",background:t.btnSm,color:t.btnSmText,border:`1px solid ${t.btnSmBorder}`,
                    borderRadius:10,padding:"9px 14px",fontSize:12,fontWeight:400,cursor:"pointer",marginTop:4,fontFamily:"var(--app-font-sans)",
                  }}>↓ Export PDF</button>
                )}

                {error && <p style={{fontSize:12,color:"rgba(255,100,100,0.9)",marginTop:8}}>{error}</p>}
              </div>
            </div>

            {/* Pinned footer */}
            <div style={{flexShrink:0,padding:"12px 18px",borderTop:`1px solid ${t.divider}`}}>
              <p style={{fontSize:11,color:t.textDim,lineHeight:1.6,margin:"0 0 6px"}}>
                <span style={{fontWeight:500}}>Powered by</span> IBM Bob & watson<span style={{color:"#0f62fe"}}>x</span><br/>
                <span style={{opacity:0.7}}>Built by Marco Sesay</span>
              </p>
              <img src="/ibm-logo.png" alt="IBM" style={{width:"60px",height:"auto",opacity:theme==="dark"?0.6:0.4,filter:theme==="dark"?"brightness(0) invert(1)":"brightness(0)"}}/>
            </div>
          </div>
        )}
      </aside>

      {/* ─── Main ─── */}
      <main style={{flex:1,overflowY:"auto",position:"relative"}}>
        {!showResult ? (
          /* ─── Hero ─── */
          <div style={{padding:"24px 40px 48px",height:"100%",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{
                display:"inline-flex",alignItems:"center",gap:8,margin:"24px 0 0",
                background:t.pill,backdropFilter:"blur(28px)",border:`1px solid ${t.pillBorder}`,
                borderRadius:100,padding:"9px 16px",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.12)",
              }}>
                <div className="animate-pulse-dot" style={{width:7,height:7,borderRadius:"50%",background:t.accent,flexShrink:0,boxShadow:`0 0 8px ${t.accentGlow}`}} />
                <span style={{fontSize:13,color:t.textSub,fontWeight:400}}>
                  {greeting}, {userName && userName !== "Guest" ? <span style={{fontWeight:500}}>{userName.split(' ')[0]}</span> : <span style={{fontWeight:500}}>IBMer</span>} — Your pre-call assistant is ready
                </span>
              </div>
              <button
                onClick={() => window.location.href = "/setup"}
                style={{
                  background:t.btnSm,
                  border:`1px solid ${t.btnSmBorder}`,
                  color:t.btnSmText,
                  borderRadius:8,
                  padding:"6px 12px",
                  fontSize:11,
                  fontWeight:500,
                  cursor:"pointer",
                  fontFamily:"var(--app-font-sans)",
                  transition:"all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = t.btn;
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = t.btnSm;
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Update your name and role"
              >
                ⚙️ Settings
              </button>
            </div>

            <div>
              <h1 style={{fontSize:64,fontWeight:200,letterSpacing:"-2.6px",color:t.text,lineHeight:1.04,margin:"16px 0 12px"}}>
                Sales Intelligence<br/>Simplified
              </h1>
              <p style={{fontSize:16,fontWeight:300,color:t.textMuted,lineHeight:1.65,maxWidth:520,margin:"0 0 12px"}}>
                Enter your prospect's details and receive a precise, research-backed briefing in seconds — powered by AI-driven insights.
              </p>
              <a
                href="/architecture"
                style={{
                  display:'inline-block',
                  fontSize:13,
                  color:t.accent,
                  textDecoration:'none',
                  opacity:0.8,
                  transition:'opacity 0.2s',
                  cursor:'pointer',
                  marginBottom:16,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
              >
                → See How It Works
              </a>
            </div>

            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:32}}>
              {[{dot:true,label:"IBM watsonx"},{label:"Live Research"},{label:"BANT + MEDDIC"},{label:"PDF Export"}].map(pill=>(
                <div key={pill.label} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 13px",borderRadius:100,background:t.chipBg,border:`1px solid ${t.chipBorder}`}}>
                  {pill.dot && <div style={{width:5,height:5,borderRadius:"50%",background:t.accent,boxShadow:`0 0 5px ${t.accentGlow}`}}/>}
                  <span style={{fontSize:11,color:t.textMuted,fontWeight:500}}>{pill.label}</span>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:40}}>
              {[
                {title:"Company Background",sub:"Strategic context and AI maturity assessment"},
                {title:"Discovery Questions",sub:"8 strategic, targeted questions"},
                {title:"Opportunity Qualification",sub:"BANT + MEDDIC framework analysis"},
                {title:"Product Fit",sub:"Recommended solutions & value proposition"},
              ].map(f=>(
                <div key={f.title} style={{
                  borderRadius:10,padding:"10px 12px",
                  background:t.card,backdropFilter:"blur(28px) saturate(160%)",
                  WebkitBackdropFilter:"blur(28px) saturate(160%)",
                  border:`1px solid ${t.cardBorder}`,boxShadow:t.cardShadow,minHeight:65,
                  transition:"transform 0.2s, box-shadow 0.2s",
                  cursor:"default",
                }}>
                  <p style={{fontSize:10.5,fontWeight:600,color:t.text,margin:"0 0 3px",letterSpacing:"-0.2px"}}>{f.title}</p>
                  <p style={{fontSize:9,color:t.textMuted,margin:0,lineHeight:1.35}}>{f.sub}</p>
                </div>
              ))}
            </div>
            {/* Industry News Section - Dynamic from last 24 hours */}
            {generalNewsData && generalNewsData.length > 0 && (
              <div style={{maxWidth:760,marginBottom:40}}>
                <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                  <p className="animate-heartbeat" style={{fontSize:13,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",color:"#ef4444",margin:0}}>Intelligence Pulse</p>
<div style={{height:1,flex:1,background:"#ef4444",opacity:0.3,marginLeft:8}}/>
                </div>
                {generalNewsData.map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"13px 0",borderBottom:`1px solid ${t.divider}`}}>
                    <span style={{color:t.textDim,fontSize:15,flexShrink:0,lineHeight:1.4}}>+</span>
                    <div style={{flex:1}}>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            margin:0,
                            fontSize:15,
                            fontWeight:500,
                            color:t.textSub,
                            lineHeight:1.5,
                            textDecoration:"none",
                            display:"block",
                            cursor:"pointer",
                            transition:"color 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = t.accent}
                          onMouseLeave={(e) => e.currentTarget.style.color = t.textSub}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <p style={{margin:0,fontSize:15,fontWeight:500,color:t.textSub,lineHeight:1.5}}>{item.title}</p>
                      )}
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                        <span style={{fontSize:12,color:t.textDim}}>{item.source}</span>
                        {item.date && (
                          <>
                            <span style={{fontSize:12,color:t.textDim}}>•</span>
                            <span style={{fontSize:12,color:t.textDim}}>{item.date}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}


            {newsData && newsData.length>0 && (
              <div style={{maxWidth:760,marginTop:32}}>
                <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                  <p style={{fontSize:13,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",color:t.textSub,margin:0}}>Recent News — {company}</p>
                  <div style={{height:1,flex:1,background:t.divider,opacity:0.5}}/>
                </div>
                {newsData.map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"11px 0",borderBottom:`1px solid ${t.divider}`}}>
                    <span style={{color:t.textDim,fontSize:13,flexShrink:0,lineHeight:1.4}}>+</span>
                    <div style={{flex:1}}>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            margin:0,
                            fontSize:13,
                            color:t.textSub,
                            lineHeight:1.5,
                            textDecoration:"none",
                            display:"block",
                            cursor:"pointer",
                            transition:"color 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = t.accent}
                          onMouseLeave={(e) => e.currentTarget.style.color = t.textSub}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <p style={{margin:0,fontSize:13,color:t.textSub,lineHeight:1.5}}>{item.title}</p>
                      )}
                      <p style={{margin:"3px 0 0",fontSize:11,color:t.textDim}}>{item.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ─── Briefing Result (also shown during streaming) ─── */
          <div style={{padding:"0 32px 64px",maxWidth:1400,margin:"0 auto"}}>
            {/* Progress bar while generating */}
            {generating && (
              <div style={{position:"sticky",top:0,zIndex:10,background:t.bodyBg,paddingTop:8,paddingBottom:4,marginBottom:4}}>
                <div style={{height:2,borderRadius:1,background:t.topBar,overflow:"hidden"}}>
                  <div className="animate-progress-bar" style={{height:"100%",background:t.progressBar,borderRadius:1,animation:"progress-slide 1.4s ease-in-out infinite"}}/>
                </div>
                <p style={{fontSize:11,color:t.textDim,margin:"6px 0 0",fontWeight:300}}>Generating briefing for {displayBriefing?.co}…</p>
              </div>
            )}

            {/* Top bar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0",borderBottom:`1px solid ${t.divider}`,marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:t.textMuted}}>{displayBriefing?.co}</span>
                <span style={{color:t.textDim}}>·</span>
                <span style={{fontSize:12,color:t.textMuted}}>{displayBriefing?.ind}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <>
                  <span style={{fontSize:12,color:t.textSub,fontWeight:400}}>{userName || "User"}</span>
                  {userProfilePicture && (
                    <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",border:`1.5px solid ${t.toggleBorder}`,flexShrink:0}}>
                      <img src={userProfilePicture} alt={userName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                  )}
                </>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
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
                    transition:"all 0.2s",
                    transform:"scale(1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!btn.disabled) {
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.background = t.btn;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background = t.btnSm;
                  }}
                >{btn.label}</button>
              ))}
            </div>

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
                  {displayBriefing?.ct || displayBriefing?.co || "…"}
                </h1>
                <p style={{fontSize:12,color:t.textMuted,margin:"0 0 2px"}}>{[displayBriefing?.co,displayBriefing?.ti,displayBriefing?.ind].filter(Boolean).join("  ·  ")}</p>
                <p style={{fontSize:11,color:t.dateText,margin:0}}>Generated {displayBriefing?.date}</p>
              </div>

            </div>

            {/* Streaming sections - first two full width, last two side-by-side */}
            {streamingSections.slice(0, 2).map(sec=>(
              <SectionCard key={sec.title} title={sec.title} content={sec.content} industry={displayBriefing?.ind} t={t} streaming={sec.isStreaming}/>
            ))}
            
            {/* Last two sections in a grid with equal heights */}
            {streamingSections.length > 2 && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignItems:"stretch"}}>
                {streamingSections.slice(2, 4).map(sec=>(
                  <SectionCard key={sec.title} title={sec.title} content={sec.content} industry={displayBriefing?.ind} t={t} streaming={sec.isStreaming}/>
                ))}
              </div>
            )}
            
            {/* 5th section — Product Recommendations (full width) */}
            {streamingSections.length > 4 && streamingSections.slice(4).map(sec=>(
              <SectionCard key={sec.title} title={sec.title} content={sec.content} industry={displayBriefing?.ind} t={t} streaming={sec.isStreaming}/>
            ))}

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

/* ─── Debounce ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(()=>setDebounced(value), delay);
    return ()=>clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
