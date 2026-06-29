import { useState } from "react";
import { getBaseUrl } from "@/lib/api-client";

/* ─── Types ─── */
interface ProspectResult {
  companyName: string;
  websiteUrl: string;
  step1: string;
  step2: string;
  generatedAt: string;
}

/* ─── Theme (mirrors BriefingPage dark theme) ─── */
const t = {
  bodyBg: "linear-gradient(160deg,#2a2a2a 0%,#1e1e1e 35%,#252528 65%,#1a1a1c 100%)",
  card: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.09)",
  input: "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.85)",
  textSub: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.35)",
  divider: "rgba(255,255,255,0.07)",
  accent: "#6ee7b7",
  topBar: "rgba(255,255,255,0.07)",
  sectionCard: "rgba(255,255,255,0.05)",
  sectionCardBorder: "rgba(255,255,255,0.09)",
};

/* ─── Markdown-to-plain renderer (strips ** * ##) ─── */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^#{1,3}\s+/gm, "");
}

/* ─── Section parser ─── */
function parseSections(text: string): { title: string; body: string }[] {
  const cleaned = stripMarkdown(text);
  const parts = cleaned.split(/\n(?=##?\s)/);
  const sections: { title: string; body: string }[] = [];
  for (const part of parts) {
    const lines = part.trim().split("\n");
    const title = lines[0].replace(/^#+\s*/, "").trim();
    const body = lines.slice(1).join("\n").trim();
    if (title && body) sections.push({ title, body });
  }
  return sections;
}

/* ─── Section Card ─── */
function SectionCard({ title, body }: { title: string; body: string }) {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Detect table rows (contain |)
  const isTable = lines.some((l) => l.startsWith("|"));

  return (
    <div
      style={{
        background: t.sectionCard,
        border: `1px solid ${t.sectionCardBorder}`,
        borderRadius: 10,
        padding: "18px 20px",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: t.accent,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      {isTable ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: t.text }}>
            <tbody>
              {lines
                .filter((l) => l.startsWith("|") && !l.match(/^\|[-| ]+\|$/))
                .map((row, i) => {
                  const cells = row
                    .split("|")
                    .map((c) => c.trim())
                    .filter(Boolean);
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.divider}` }}>
                      {cells.map((cell, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "6px 10px",
                            fontWeight: i === 0 ? 600 : 400,
                            color: i === 0 ? t.text : t.textSub,
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {body}
        </div>
      )}
    </div>
  );
}

/* ─── PDF Builder ─── */
export async function buildProspectPDF(result: ProspectResult) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = 14;
  const IBM_BLUE: [number, number, number] = [15, 98, 254];
  const DARK: [number, number, number] = [31, 41, 55];
  const MED: [number, number, number] = [100, 116, 139];
  const WHITE: [number, number, number] = [255, 255, 255];
  const LIGHT_BG: [number, number, number] = [248, 250, 252];
  const BORDER: [number, number, number] = [226, 232, 240];

  const contentW = W - m * 2;
  let y = 0;

  function checkPageBreak(needed: number) {
    if (y + needed > H - 16) {
      doc.addPage();
      // Mini header on continuation pages
      doc.setFillColor(...IBM_BLUE);
      doc.rect(0, 0, W, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...WHITE);
      doc.text(`${result.companyName} — AI Prospecting Report`, m, 5.5);
      doc.setTextColor(...MED);
      doc.text(new Date(result.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), W - m, 5.5, { align: "right" });
      y = 13;
    }
  }

  function drawSectionHeader(title: string) {
    checkPageBreak(14);
    doc.setFillColor(...IBM_BLUE);
    doc.rect(m, y, 3, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(title.toUpperCase(), m + 6, y + 5.5);
    y += 12;
  }

  function drawBodyText(text: string, indent = 0) {
    const clean = text.replace(/\*\*\*/g, "").replace(/\*\*/g, "").replace(/\*/g, "");
    const lines = doc.splitTextToSize(clean, contentW - indent - 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    for (const line of lines) {
      checkPageBreak(5);
      doc.text(line, m + indent, y);
      y += 4.5;
    }
    y += 1;
  }

  function drawBullet(text: string) {
    const clean = text.replace(/\*\*\*/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/^[-•*]\s*/, "");
    const lines = doc.splitTextToSize(clean, contentW - 8);
    checkPageBreak(5);
    doc.setFillColor(...IBM_BLUE);
    doc.circle(m + 2, y - 1, 0.8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(lines[0], m + 5, y);
    y += 4.5;
    for (let i = 1; i < lines.length; i++) {
      checkPageBreak(5);
      doc.text(lines[i], m + 5, y);
      y += 4.5;
    }
  }

  function drawTable(rows: string[][]) {
    if (!rows.length) return;
    const colCount = rows[0].length;
    const colW = contentW / colCount;

    for (let r = 0; r < rows.length; r++) {
      const isHeader = r === 0;
      const rowH = 7;
      checkPageBreak(rowH + 2);

      // Row background
      doc.setFillColor(...(isHeader ? IBM_BLUE : r % 2 === 0 ? WHITE : LIGHT_BG));
      doc.rect(m, y - 5, contentW, rowH, "F");
      // Row border
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.rect(m, y - 5, contentW, rowH, "S");

      doc.setFont("helvetica", isHeader ? "bold" : "normal");
      doc.setFontSize(8);
      doc.setTextColor(...(isHeader ? WHITE : DARK));

      for (let c = 0; c < rows[r].length; c++) {
        doc.text(rows[r][c] || "", m + c * colW + 3, y);
      }
      y += rowH;
    }
    y += 4;
  }

  function renderMarkdownBlock(text: string) {
    const clean = text.replace(/\*\*\*/g, "").replace(/\*\*/g, "").replace(/\*/g, "");
    const lines = clean.split("\n");

    // Detect table
    const tableLines = lines.filter((l) => l.trim().startsWith("|"));
    if (tableLines.length > 1) {
      const rows = tableLines
        .filter((l) => !l.match(/^\|[-| ]+\|$/))
        .map((l) =>
          l
            .split("|")
            .map((c) => c.trim())
            .filter(Boolean)
        );
      drawTable(rows);
      return;
    }

    for (const line of lines) {
      const l = line.trim();
      if (!l) { y += 2; continue; }
      if (l.startsWith("### ")) {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...IBM_BLUE);
        doc.text(l.replace(/^###\s*/, ""), m, y);
        y += 6;
      } else if (l.startsWith("**Step ") || l.startsWith("**")) {
        checkPageBreak(6);
        const label = l.replace(/\*\*/g, "");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);
        doc.text(label, m, y);
        y += 5;
      } else if (l.match(/^[-•*]\s+/) || l.match(/^\d+[.)]\s+/)) {
        drawBullet(l);
      } else if (l.startsWith("|")) {
        // handled above
      } else {
        drawBodyText(l);
      }
    }
  }

  // ══════════════════════════════════════════════════
  // COVER HEADER
  // ══════════════════════════════════════════════════
  doc.setFillColor(...IBM_BLUE);
  doc.rect(0, 0, W, 42, "F");

  // IBM badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(m, 8, 16, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...IBM_BLUE);
  doc.text("IBM", m + 5, 13);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text(result.companyName, m, 27);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(180, 210, 255);
  doc.text("AI Productivity Prospecting Report", m, 34);

  doc.setFontSize(8);
  doc.setTextColor(150, 190, 255);
  const dateStr = new Date(result.generatedAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  doc.text(`Generated ${dateStr}  •  ${result.websiteUrl}`, m, 39.5);

  y = 50;

  // ══════════════════════════════════════════════════
  // STEP 1 SECTIONS
  // ══════════════════════════════════════════════════
  const step1Sections = parseSections(result.step1);
  for (const sec of step1Sections) {
    drawSectionHeader(sec.title);
    renderMarkdownBlock(sec.body);
    y += 3;
  }

  // Page break before Step 2
  doc.addPage();
  doc.setFillColor(...IBM_BLUE);
  doc.rect(0, 0, W, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(`${result.companyName} — AI Prospecting Report`, m, 5.5);
  y = 13;

  // Step 2 divider label
  doc.setFillColor(...LIGHT_BG);
  doc.rect(m, y, contentW, 10, "F");
  doc.setDrawColor(...IBM_BLUE);
  doc.setLineWidth(0.5);
  doc.rect(m, y, contentW, 10, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...IBM_BLUE);
  doc.text("BEST FIT USE CASE & SALES PLAY", m + 5, y + 6.5);
  y += 17;

  // ══════════════════════════════════════════════════
  // STEP 2 SECTIONS
  // ══════════════════════════════════════════════════
  const step2Sections = parseSections(result.step2);
  for (const sec of step2Sections) {
    drawSectionHeader(sec.title);
    renderMarkdownBlock(sec.body);
    y += 3;
  }

  // ══════════════════════════════════════════════════
  // FOOTER on all pages
  // ══════════════════════════════════════════════════
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...LIGHT_BG);
    doc.rect(0, H - 10, W, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MED);
    doc.text("IBM Confidential — For Internal Use Only", m, H - 4);
    doc.text(`Page ${p} of ${totalPages}`, W - m, H - 4, { align: "right" });
  }

  doc.save(`${result.companyName.replace(/\s+/g, "_")}_IBM_Prospect.pdf`);
}

/* ─── Main Component ─── */
export default function ProspectPage() {
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<1 | 2 | null>(null);
  const [result, setResult] = useState<ProspectResult | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!companyName.trim() || !websiteUrl.trim()) {
      setError("Please enter both a company name and website URL.");
      return;
    }
    setError("");
    setLoading(true);
    setLoadingStep(1);
    setResult(null);

    try {
      const base = getBaseUrl();
      // Step 1 takes a moment — show step indicator briefly before step 2
      const res = await fetch(`${base}/api/prospect/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), websiteUrl: websiteUrl.trim() }),
      });

      setLoadingStep(2);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Generation failed");
      }

      const data: ProspectResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  }

  const step1Sections = result ? parseSections(result.step1) : [];
  const step2Sections = result ? parseSections(result.step2) : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bodyBg,
        fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif",
        color: t.text,
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          background: t.topBar,
          borderBottom: `1px solid ${t.divider}`,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <a
          href="/"
          style={{
            color: t.textMuted,
            textDecoration: "none",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Briefing
        </a>
        <span style={{ color: t.divider }}>|</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
          Prospect
        </span>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px 60px" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "inline-block",
              background: "#0f62fe",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              padding: "2px 8px",
              borderRadius: 3,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            IBM
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: t.text }}>
            AI Productivity Prospecting
          </h1>
          <p style={{ fontSize: 13, color: t.textSub, margin: 0 }}>
            Enter a client company and website to generate an IBM product mapping and sales play PDF.
          </p>
        </div>

        {/* ── Input card ── */}
        <div
          style={{
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 12,
            padding: "24px 24px 20px",
            marginBottom: 24,
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 }}>
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="e.g. Lockheed Martin"
              autoComplete="off"
              style={{
                width: "100%",
                background: t.input,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 7,
                padding: "10px 12px",
                fontSize: 14,
                color: t.text,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 }}>
              Company Website URL
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="e.g. https://www.lockheedmartin.com"
              autoComplete="off"
              style={{
                width: "100%",
                background: t.input,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 7,
                padding: "10px 12px",
                fontSize: 14,
                color: t.text,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#f87171", marginBottom: 14 }}>{error}</div>
          )}

          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "rgba(15,98,254,0.4)" : "#0f62fe",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "11px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading
              ? loadingStep === 1
                ? "Step 1 — Researching company & mapping IBM products…"
                : "Step 2 — Building use cases & sales play…"
              : "Generate Prospecting Report"}
          </button>
        </div>

        {/* ── Results ── */}
        {result && (
          <>
            {/* Download bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(110,231,183,0.07)",
                border: "1px solid rgba(110,231,183,0.18)",
                borderRadius: 10,
                padding: "12px 18px",
                marginBottom: 24,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.accent }}>
                  {result.companyName} — Report Ready
                </div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                  {step1Sections.length + step2Sections.length} sections generated
                </div>
              </div>
              <button
                onClick={() => buildProspectPDF(result)}
                style={{
                  background: "#0f62fe",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ↓ Download PDF
              </button>
            </div>

            {/* Step 1 */}
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#0f62fe",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    background: "#0f62fe",
                    color: "#fff",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  1
                </span>
                Company Research & IBM Product Mapping
              </div>
              {step1Sections.map((sec, i) => (
                <SectionCard key={i} title={sec.title} body={sec.body} />
              ))}
            </div>

            {/* Step 2 */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#0f62fe",
                  marginBottom: 12,
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    background: "#0f62fe",
                    color: "#fff",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                Best Fit Use Case & Sales Play
              </div>
              {step2Sections.map((sec, i) => (
                <SectionCard key={i} title={sec.title} body={sec.body} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
