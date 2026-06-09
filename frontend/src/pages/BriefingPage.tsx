import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useGetBriefingNews, useGetBriefingLogo, useGetBriefingIndustry } from "@workspace/api-client-react";

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
  "Product Recommendations":            { accent: "rgba(170,145,200,0.65)", bg: "rgba(170,145,200,0.07)" },
  "Retention & Upsell Positioning":     { accent: "rgba(170,145,200,0.65)", bg: "rgba(170,145,200,0.07)" },
  "IBM Differentiation":                { accent: "rgba(170,145,200,0.65)", bg: "rgba(170,145,200,0.07)" },
  "Strategic Investment Themes":        { accent: "rgba(170,145,200,0.65)", bg: "rgba(170,145,200,0.07)" },
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
  "Product Recommendations":            { accent: "#6b3fa5", bg: "#f4eeff" },
  "Retention & Upsell Positioning":     { accent: "#6b3fa5", bg: "#f4eeff" },
  "IBM Differentiation":                { accent: "#6b3fa5", bg: "#f4eeff" },
  "Strategic Investment Themes":        { accent: "#6b3fa5", bg: "#f4eeff" },
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
  
  // Parse sections
  const sections: Record<string, string[]> = {};
  for (const sec of text.split("##").slice(1)) {
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
  
  // Add image to header on the left if available
  const imageSize = 24;
  const imageX = m;
  const imageY = 5.5;
  
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
  
  doc.setFontSize(7);
  doc.setTextColor(200, 220, 255);
  doc.text(`${new Date().toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"})}`, titleX, 26);
  
  // ═══ DYNAMIC CONTENT ═══
  let y = 38;
  const colW = (W - m * 2 - 3) / 2;
  const availableH = H - y - 8; // Space available for content (footer is 8mm)
  
  // Prepare content with fallbacks
  const companyInfo = sections["Company & Contact Background"] || [];
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
  // Get product recommendations from AI-generated sections
  let productInfo = [
    ...(sections["Product Recommendations"] || []),
    ...(sections["Retention & Upsell Positioning"] || [])
  ];
  
  // Ensure we have exactly 3 products
  if (productInfo.length === 0) {
    productInfo = [
      "IBM watsonx.ai: Foundation models, prompt engineering, and AI governance for enterprise AI deployment",
      "IBM watsonx.data: Open lakehouse for governed data access across hybrid cloud environments",
      "IBM Cloud Pak for Data: Unified data and AI platform for analytics and governance"
    ];
  } else if (productInfo.length === 1) {
    productInfo.push("IBM Cloud Pak for Data: Unified data and AI platform for analytics and governance");
    productInfo.push("IBM watsonx.governance: AI governance, risk management, and compliance automation");
  } else if (productInfo.length === 2) {
    productInfo.push("IBM watsonx.governance: AI governance, risk management, and compliance automation");
  } else if (productInfo.length > 3) {
    productInfo = productInfo.slice(0, 3);
  }
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
  
  // Render box with specified height and optimal font size
  const renderBox = (x: number, yPos: number, width: number, height: number, title: string, items: string[], usePrefix: boolean = true): void => {
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
    
    // Find optimal font size to fill the box
    const contentHeight = height - 16;
    let fontSize = 6; // Start with smaller minimum
    
    // Binary search for optimal font size that maximizes space usage
    let minSize = 6;
    let maxSize = 10;
    let bestSize = 6;
    
    while (maxSize - minSize > 0.1) {
      const testSize = (minSize + maxSize) / 2;
      const minHeight = calculateMinHeight(items, width, testSize, usePrefix);
      const requiredHeight = minHeight - 16;
      
      if (requiredHeight <= contentHeight) {
        // Content fits, try larger
        bestSize = testSize;
        minSize = testSize;
      } else {
        // Content too large, try smaller
        maxSize = testSize;
      }
    }
    
    fontSize = bestSize;
    
    const lineHeight = fontSize * 0.4;
    const spacing = fontSize * 0.15;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
    let itemY = yPos + 14;
    
    for (const item of items) {
      const prefix = usePrefix ? "• " : "";
      const wrapped = doc.splitTextToSize(`${prefix}${item}`, width - 7);
      if (itemY + wrapped.length * lineHeight > yPos + height - 2) break;
      doc.text(wrapped, x + 4, itemY);
      itemY += wrapped.length * lineHeight + spacing;
    }
  };
  
  // Extract and enhance company info
  const companyBackground = sections["Company & Contact Background"] || [];
  const companyOnly = companyBackground.filter(item =>
    !item.toLowerCase().includes("contact") &&
    !item.toLowerCase().includes("role") &&
    !item.toLowerCase().includes("title")
  );
  
  // Enhanced company background with more context - limit to prevent overflow
  const enhancedCompanyInfo = companyOnly.length > 0 ? companyOnly.slice(0, 4) : [
    `${co} operates in the ${ind} sector, focusing on innovation and digital transformation.`,
    `The company prioritizes operational efficiency, customer experience, and technology modernization.`,
    `Current strategic initiatives include AI adoption, cloud migration, and data-driven decision making.`,
    `Key business drivers: revenue growth, cost optimization, and competitive differentiation.`
  ];
  
  const fullW = W - m * 2;
  const gap = 1.5;
  
  // Calculate minimum heights for all sections
  const minHeights = {
    company: calculateMinHeight(enhancedCompanyInfo, fullW, 7, false),
    contact: calculateMinHeight([
      `${ct} is a key decision-maker at ${co} with responsibility for strategic technology initiatives.`,
      `Focuses on driving business value through innovation, digital transformation, and operational excellence.`,
      `Active in industry thought leadership and stays current with emerging technology trends.`,
      `Key priorities include modernizing infrastructure, improving data capabilities, and enabling AI/ML initiatives.`
    ], fullW, 7, false),
    discovery: calculateMinHeight(discoveryQs, colW, 7, false),
    qual: calculateMinHeight(qualInfo, colW, 7, true),
    products: calculateMinHeight(productInfo, colW, 7, false),
    sales: calculateMinHeight(salesInfo, colW, 7, true),
  };
  
  // Calculate total minimum height needed
  const totalMinHeight = minHeights.company + minHeights.contact +
    Math.max(minHeights.discovery + minHeights.products, minHeights.qual + minHeights.sales) +
    (gap * 5); // 5 gaps between sections
  
  // Distribute extra space proportionally
  const extraSpace = availableH - totalMinHeight;
  const scaleFactor = extraSpace > 0 ? 1 + (extraSpace / totalMinHeight) : 1;
  
  // Calculate final heights
  const companyH = Math.max(minHeights.company * scaleFactor, minHeights.company);
  const contactH = Math.max(minHeights.contact * scaleFactor, minHeights.contact);
  const leftColH = Math.max((minHeights.discovery + minHeights.products + gap) * scaleFactor, minHeights.discovery + minHeights.products + gap);
  const rightColH = Math.max((minHeights.qual + minHeights.sales + gap) * scaleFactor, minHeights.qual + minHeights.sales + gap);
  const maxColH = Math.max(leftColH, rightColH);
  
  // Make Discovery Questions and Opportunity Qualification the same height
  const topRowHeight = Math.max(minHeights.discovery, minHeights.qual);
  const discoveryH = topRowHeight;
  const qualH = topRowHeight;
  
  // Distribute remaining space to bottom boxes
  const productsH = maxColH - discoveryH - gap;
  const salesH = maxColH - qualH - gap;
  
  // Ensure bottom row boxes have equal height (use the larger of the two)
  const bottomRowHeight = Math.max(productsH, salesH);
  
  // Row 1 - Company Background
  renderBox(m, y, fullW, companyH, "Company Background", enhancedCompanyInfo, false);
  
  // Row 2 - Who is [Name]?
  y += companyH + gap;
  renderBox(m, y, fullW, contactH, `Who is ${ct}?`, [
    `${ct} is a key decision-maker at ${co} with responsibility for strategic technology initiatives.`,
    `Focuses on driving business value through innovation, digital transformation, and operational excellence.`,
    `Active in industry thought leadership and stays current with emerging technology trends.`,
    `Key priorities include modernizing infrastructure, improving data capabilities, and enabling AI/ML initiatives.`
  ], false);
  
  // Row 3 - Discovery Questions (left) + Opportunity Qualification (right)
  y += contactH + gap;
  const discoveryStartY = y;
  renderBox(m, y, colW, discoveryH, "Discovery Questions", discoveryQs, false);
  
  // Opportunity Qualification (right column)
  renderBox(m + colW + 3, y, colW, qualH, contentSets[2].title, qualInfo, true);
  
  // Row 4 - Products (left) + Sales Strategy (right)
  // Use the same height for both boxes so they end at the same point
  y += Math.max(discoveryH, qualH) + gap;
  
  // Ensure bottom boxes don't overlap with footer (footer starts at H - 8)
  const maxBottomY = H - 10; // Leave 10mm for footer (8mm + 2mm buffer)
  const availableBottomHeight = maxBottomY - y;
  const finalBottomRowHeight = Math.min(bottomRowHeight, availableBottomHeight);
  
  renderBox(m, y, colW, finalBottomRowHeight, contentSets[4].title, productInfo, false);
  renderBox(m + colW + 3, y, colW, finalBottomRowHeight, contentSets[3].title, salesInfo, true);
  
  // ═══ FOOTER ═══
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(MED_GRAY[0], MED_GRAY[1], MED_GRAY[2]);
  doc.text("CONFIDENTIAL & PROPRIETARY", m, H - 6);
  doc.text(`© ${new Date().getFullYear()} IBM Corporation`, W / 2, H - 6, { align: "center" });
  doc.text(fmtDate(), W - m, H - 6, { align: "right" });
  
  doc.save(`${co.replace(/\s+/g,"_")}_Briefing_${new Date().toISOString().split('T')[0]}.pdf`);
}

/* ─── Section Card ─── */
function SectionCard({ title, content, t, streaming }: {
  title: string; content: string;
  t: typeof DARK; streaming?: boolean;
}) {
  const isDark = t === DARK;
  const map = isDark ? SECTION_ACCENTS_DARK : SECTION_ACCENTS_LIGHT;
  const { accent, bg } = map[title] ?? { accent: isDark ? "rgba(200,200,210,0.55)" : "#666", bg: isDark ? "rgba(200,200,210,0.06)" : "#f5f5f7" };

  const rows: React.ReactNode[] = [];
  const lines = content.replace(/\*\*/g,"").replace(/^--$/gm,"").split("\n");
  lines.forEach((line, i) => {
    const l = line.trim();
    if (!l) { rows.push(<div key={i} style={{height:4}} />); return; }
    if (l.endsWith(":") && l.length < 60) {
      rows.push(<p key={i} style={{margin:"14px 0 5px",fontSize:10,fontWeight:600,letterSpacing:"0.7px",textTransform:"uppercase",color:accent}}>{l.slice(0,-1)}</p>);
    } else if (l.match(/^[-*•] /)) {
      rows.push(
        <div key={i} style={{display:"flex",gap:11,marginBottom:8,alignItems:"flex-start"}}>
          <span style={{color:accent,fontSize:14,lineHeight:"1.5",flexShrink:0}}>–</span>
          <span style={{color:t.sectionBullet,fontSize:13,lineHeight:1.7}}>{l.slice(2)}</span>
        </div>
      );
    } else if (l.match(/^\d[.)]/)) {
      rows.push(
        <div key={i} style={{display:"flex",gap:11,marginBottom:9,alignItems:"flex-start"}}>
          <span style={{color:accent,fontSize:11,fontWeight:600,flexShrink:0,minWidth:16,paddingTop:2}}>{l[0]}.</span>
          <span style={{color:t.sectionBullet,fontSize:13,lineHeight:1.7}}>{l.slice(2).trim()}</span>
        </div>
      );
    } else {
      const labelMatch = l.match(/^([A-Za-z][A-Za-z ]{0,28}): (.+)$/);
      if (labelMatch) {
        rows.push(
          <p key={i} style={{margin:"0 0 10px",fontSize:13,lineHeight:1.72}}>
            <strong style={{color:t.textSub,fontWeight:600}}>{labelMatch[1]}:</strong>
            <span style={{color:t.sectionText}}>{" "}{labelMatch[2]}</span>
          </p>
        );
      } else {
        rows.push(<p key={i} style={{margin:"0 0 8px",color:t.sectionText,fontSize:13,lineHeight:1.72}}>{l}</p>);
      }
    }
  });

  return (
    <div className="animate-fade-in" style={{
      background: t.sectionCard, backdropFilter:"blur(28px) saturate(150%)",
      WebkitBackdropFilter:"blur(28px) saturate(150%)",
      border:`1px solid ${t.sectionCardBorder}`, borderRadius:14,
      marginBottom:12, overflow:"hidden", boxShadow: t.cardShadow,
    }}>
      <div style={{height:2,background:accent,width:"100%",opacity:0.6}} />
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"15px 22px 11px",borderBottom:`1px solid ${t.sectionHeaderBorder}`}}>
        <div style={{width:22,height:22,background:bg,borderRadius:6,flexShrink:0,border:`1px solid ${t.sectionCardBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:accent,opacity:0.85}} />
        </div>
        <span style={{fontSize:12,fontWeight:500,color:t.textSub}}>{title || "…"}</span>
        {streaming && <span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:accent,opacity:0.7}} className="animate-pulse-dot" />}
      </div>
      <div style={{padding:"17px 22px 20px"}}>{rows}</div>
    </div>
  );
}

/* ─── Glass Input ─── */
function GlassInput({ label, textarea, t, ...props }: {
  label: string; textarea?: boolean; t: typeof DARK;
} & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const base: React.CSSProperties = {
    width:"100%", background:t.input, border:`1px solid ${t.inputBorder}`,
    borderRadius:9, fontSize:15, color:t.text, fontFamily:"var(--app-font-sans)",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)", outline:"none", padding:"14px 16px",
  };
  return (
    <div style={{marginBottom:18}}>
      <label style={{display:"block",fontSize:12,fontWeight:500,color:t.textDim,letterSpacing:"0.7px",textTransform:"uppercase",marginBottom:8}}>{label}</label>
      {textarea
        ? <textarea {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} rows={4} style={{...base,resize:"none"}} />
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
  const { data: generalNewsData } = useGetBriefingNews(
    { company: "AI technology" },
    { query: { enabled: shouldFetchGeneralNews } as any }
  );
  
  const { data: newsData }     = useGetBriefingNews({ company: debouncedCompany }, { query: { enabled: debouncedCompany.length > 1 && !briefingReady && !generating } as any });
  const { data: logoData }     = useGetBriefingLogo({ company: debouncedCompany }, { query: { enabled: debouncedCompany.length > 1 } as any });
  const { data: industryData } = useGetBriefingIndustry({ company: debouncedCompany }, { query: { enabled: debouncedCompany.length > 1 } as any });

  useEffect(() => { if (industryData?.industry && !industry) setIndustry(industryData.industry); }, [industryData]);
  useEffect(() => { if (company !== debouncedCompany) return; if (!company) setIndustry(""); }, [company]);

  // State for parsed contact name, photo, and company
  const [parsedContactName, setParsedContactName] = useState("");
  const [contactPhotoUrl, setContactPhotoUrl] = useState("");
  const [parsedCompanyName, setParsedCompanyName] = useState("");
  
  // Debounce contact input for API call
  const debouncedContact = useDebounce(contact, 600);
  
  // Fetch parsed contact name, photo, and company from API when contact changes
  useEffect(() => {
    if (!debouncedContact.trim()) {
      setParsedContactName("");
      setContactPhotoUrl("");
      setParsedCompanyName("");
      return;
    }
    
    // Check if it's a LinkedIn URL
    if (debouncedContact.toLowerCase().includes("linkedin.com/in/")) {
      // Add cache-busting parameter to force fresh data
      fetch(`/api/briefing/parse-contact?contact=${encodeURIComponent(debouncedContact)}&_t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          console.log('Parse contact API response:', data);
          if (data.name) {
            setParsedContactName(data.name);
          }
          if (data.photoUrl) {
            console.log('Setting contact photo URL:', data.photoUrl);
            setContactPhotoUrl(data.photoUrl);
          }
          if (data.company) {
            setParsedCompanyName(data.company);
            // Don't auto-populate company field - let it be used as fallback
            // Only set if company field is currently empty
            if (!company.trim()) {
              setCompany(data.company);
            }
          }
        })
        .catch(() => {
          // Fallback to basic parsing if API fails
          const match = debouncedContact.match(/linkedin\.com\/in\/([^/?]+)/i);
          if (match && match[1]) {
            const slug = match[1];
            const name = slug
              .replace(/[-_]/g, " ")
              .replace(/\d+/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .split(" ")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");
            setParsedContactName(name || debouncedContact);
            setContactPhotoUrl(`https://unavatar.io/linkedin/${slug}`);
            setParsedCompanyName("");
          }
        });
    } else {
      // Not a LinkedIn URL, use as-is
      setParsedContactName(debouncedContact);
      setContactPhotoUrl("");
      setParsedCompanyName("");
    }
  }, [debouncedContact, company]);
  
  const contactName = parsedContactName || contact;

  /* ─── Stream sections parser ─── */
  const streamingSections = useMemo(() => {
    if (!briefingText) return [];
    const parts = briefingText.split("##").slice(1);
    return parts.map((sec, i) => {
      const lines = sec.trim().split("\n");
      return {
        title: lines[0].trim() || "…",
        content: lines.slice(1).join("\n").trim(),
        isStreaming: generating && i === parts.length - 1,
      };
    });
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

    try {
      const res = await fetch("/api/briefing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: effectiveCompany, industry: industry.trim(),
          contactName: contactName.trim(), contactTitle: title.trim(),
          context: context.trim(), callType: meetingType,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
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
    } catch {
      setError("Something went wrong. Please try again.");
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
        overflowY:sidebarOpen?"auto":"hidden", overflowX:"hidden",
        transition:"width 0.2s,min-width 0.2s",
        background:t.sidebar, backdropFilter:"blur(40px) saturate(160%)",
        WebkitBackdropFilter:"blur(40px) saturate(160%)",
        borderRight:`1px solid ${t.sidebarBorder}`,
      }}>
        {sidebarOpen && (
          <div style={{padding:"22px 18px 28px",paddingTop:56}}>
            {/* Profile row */}
            <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:18,marginBottom:16,borderBottom:`1px solid ${t.divider}`}}>
              <>
                {userProfilePicture && (
                  <div style={{width:38,height:38,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:`1.5px solid ${t.toggleBorder}`}}>
                    <img src={userProfilePicture} alt={userName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  </div>
                )}
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,color:t.text,margin:"0 0 2px"}}>
                    {userName || "User"}
                  </p>
                  <p style={{fontSize:11,color:t.textMuted,margin:0,fontWeight:300}}>
                    {userRole || "Sales Professional"}
                  </p>
                </div>
              </>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div className="animate-pulse-dot" style={{width:6,height:6,borderRadius:"50%",background:t.accent,boxShadow:`0 0 7px ${t.accentGlow}`}} />
                {/* Theme toggle */}
                <button onClick={toggleTheme} title={`Switch to ${theme==="dark"?"light":"dark"} mode`} style={{
                  background:t.toggleBg, border:`1px solid ${t.toggleBorder}`, borderRadius:6,
                  width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",color:t.toggleIcon,flexShrink:0,
                }}>
                  <ThemeIcon theme={theme}/>
                </button>
              </div>
            </div>

            {/* History */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <button onClick={() => saved.length>0 && setShowHistory(!showHistory)} disabled={saved.length===0} style={{
                  flex:1,textAlign:"left",background:"none",border:"none",
                  color:t.textMuted,fontSize:12,cursor:saved.length>0?"pointer":"default",
                  padding:"6px 0",fontFamily:"var(--app-font-sans)",
                }}>
                  Reports ({saved.length}) {saved.length>0?(showHistory?"▾":"▸"):""}
                </button>
                <button
                  onClick={() => {
                    // Clear all input fields
                    setContact("");
                    setCompany("");
                    setIndustry("");
                    setTitle("");
                    setContext("");
                    setMeetingType("Discovery");
                    setParsedContactName("");
                    setContactPhotoUrl("");
                    setParsedCompanyName("");
                    // Also refresh the saved list
                    setSaved(loadSaved());
                  }}
                  title="Clear form and refresh"
                  style={{
                    background:t.toggleBg,
                    border:`1px solid ${t.toggleBorder}`,
                    borderRadius:6,
                    width:24,
                    height:24,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    cursor:"pointer",
                    color:t.toggleIcon,
                    flexShrink:0,
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
                        padding:"9px 11px",lineHeight:1.4,cursor:"pointer",fontFamily:"var(--app-font-sans)",
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
              <GlassInput t={t} label="Contact" value={contact} onChange={e=>setContact((e.target as HTMLInputElement).value)} placeholder="Name or linkedin.com/in/…"/>
              <p style={{fontSize:10,color:t.textDim,margin:"-12px 0 12px 0",fontStyle:"italic"}}>Paste LinkedIn URL to auto-fill details</p>
            </div>
            
            <div>
              <GlassInput t={t} label="Company (Optional)" value={company} onChange={e=>setCompany((e.target as HTMLInputElement).value)} placeholder="e.g. JPMorgan Chase"/>
            </div>
            
            <GlassInput t={t} label="Industry" value={industry} onChange={e=>setIndustry((e.target as HTMLInputElement).value)} placeholder="Auto-detected — or type your own"/>
            <GlassInput t={t} label="Title" value={title} onChange={e=>setTitle((e.target as HTMLInputElement).value)} placeholder="e.g. VP of Data & Analytics"/>
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

            <div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${t.divider}`}}>
              <p style={{fontSize:12,color:t.textDim,lineHeight:1.7,margin:0}}>
                <span style={{fontWeight:500}}>Powered by</span> IBM Bob & watsonx<br/>
                <span style={{opacity:0.7}}>Built by Marco Sesay</span>
              </p>
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
                  {greeting}, {userName ? <span style={{fontWeight:500}}>{userName.split(' ')[0]}</span> : "there"} — Your pre-call assistant is ready
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
                  <div style={{height:1,flex:1,background:t.divider,opacity:0.5}}/>
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
                        console.log('Contact photo failed to load, using fallback');
                        // Hide the failed image and show initials instead
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent && !parent.querySelector('span')) {
                          const initials = (displayBriefing?.ct||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                          const span = document.createElement('span');
                          span.style.fontSize = "17px";
                          span.style.fontWeight = "500";
                          span.style.color = t.textMuted;
                          span.textContent = initials;
                          parent.appendChild(span);
                        }
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
                <p style={{fontSize:12,color:t.textMuted,margin:"0 0 2px"}}>{[displayBriefing?.co,displayBriefing?.ind].filter(Boolean).join("  ·  ")}</p>
                <p style={{fontSize:11,color:t.dateText,margin:0}}>Generated {displayBriefing?.date}</p>
              </div>
              {/* Company logo on the RIGHT */}
              <div style={{flexShrink:0,width:48,height:48,borderRadius:10,background:t.card,border:`1px solid ${t.cardBorder}`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",marginTop:4,boxShadow:"0 2px 4px rgba(0,0,0,0.05)"}}>
                {logoUrl
                  ? <img src={logoUrl} alt={`${displayBriefing?.co} logo`} style={{width:"100%",height:"100%",objectFit:"contain",padding:"4px"}} onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                  : <span style={{fontSize:18,fontWeight:500,color:t.textMuted}}>{(displayBriefing?.co||"?")[0].toUpperCase()}</span>
                }
              </div>
            </div>

            {/* Streaming sections - first two full width, last two side-by-side */}
            {streamingSections.slice(0, 2).map(sec=>(
              <SectionCard key={sec.title} title={sec.title} content={sec.content} t={t} streaming={sec.isStreaming}/>
            ))}
            
            {/* Last two sections in a grid with equal heights */}
            {streamingSections.length > 2 && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignItems:"stretch"}}>
                {streamingSections.slice(2, 4).map(sec=>(
                  <SectionCard key={sec.title} title={sec.title} content={sec.content} t={t} streaming={sec.isStreaming}/>
                ))}
              </div>
            )}
            
            {/* Any additional sections beyond 4 (shouldn't happen but handle gracefully) */}
            {streamingSections.slice(4).map(sec=>(
              <SectionCard key={sec.title} title={sec.title} content={sec.content} t={t} streaming={sec.isStreaming}/>
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
