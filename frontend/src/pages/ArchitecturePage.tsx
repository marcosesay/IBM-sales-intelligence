import { useState } from "react";

type Theme = "dark" | "light";

const DARK = {
  bodyBg: "linear-gradient(160deg,#2a2a2a 0%,#1e1e1e 35%,#252528 65%,#1a1a1c 100%)",
  card: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.09)",
  text: "rgba(255,255,255,0.85)",
  textSub: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.35)",
  accent: "#6ee7b7",
  accentGlow: "rgba(110,231,183,0.7)",
  divider: "rgba(255,255,255,0.07)",
  codeBg: "rgba(255,255,255,0.03)",
  codeBorder: "rgba(255,255,255,0.08)",
};

const LIGHT = {
  bodyBg: "linear-gradient(160deg,#f4f4f8 0%,#ffffff 35%,#f0f0f5 65%,#ebebf0 100%)",
  card: "rgba(255,255,255,0.95)",
  cardBorder: "rgba(0,0,0,0.09)",
  text: "rgba(0,0,0,0.85)",
  textSub: "rgba(0,0,0,0.60)",
  textMuted: "rgba(0,0,0,0.42)",
  accent: "#059669",
  accentGlow: "rgba(5,150,105,0.4)",
  divider: "rgba(0,0,0,0.07)",
  codeBg: "rgba(0,0,0,0.03)",
  codeBorder: "rgba(0,0,0,0.08)",
};

const FLOW_STEPS = [
  {
    emoji: "👤",
    gradient: ["#60a5fa", "#3b82f6"],
    w: 320, h: 70,
    title: "User Input",
    sub: "Company, contact, meeting type",
    phase: "START"
  },
  {
    emoji: "⚡",
    gradient: ["#a78bfa", "#8b5cf6"],
    w: 380, h: 70,
    title: "Frontend Processing",
    sub: "Validate · fetch logo · industry news",
    phase: "PREPARE"
  },
  {
    emoji: "🔌",
    gradient: ["#c084fc", "#a855f7"],
    w: 340, h: 70,
    title: "API Request",
    sub: "POST /api/briefing/generate",
    phase: "CONNECT"
  },
  {
    emoji: "📝",
    gradient: ["#34d399", "#10b981"],
    w: 400, h: 70,
    title: "Prompt Construction",
    sub: "Context-aware with IBM products",
    phase: "BUILD"
  },
  {
    emoji: "🤖",
    gradient: ["#6ee7b7", "#34d399"],
    w: 480, h: 90,
    title: "IBM watsonx.ai",
    sub: "Granite 13B · Enterprise governance",
    phase: "GENERATE",
    highlight: true
  },
  {
    emoji: "📡",
    gradient: ["#5eead4", "#2dd4bf"],
    w: 340, h: 70,
    title: "Real-time Streaming",
    sub: "Server-Sent Events",
    phase: "STREAM"
  },
  {
    emoji: "📄",
    gradient: ["#60a5fa", "#3b82f6"],
    w: 320, h: 70,
    title: "Display & Export",
    sub: "Render briefing · PDF export",
    phase: "COMPLETE"
  },
];

function FlowDiagram({ theme }: { theme: Theme }) {
  const GAP = 24;
  const SVG_W = 700;
  const FONT = "system-ui,-apple-system,sans-serif";
  const isDark = theme === "dark";
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  let cursor = 30;
  const laid = FLOW_STEPS.map((s) => {
    const y = cursor;
    cursor += s.h + GAP;
    return { ...s, y, x: (SVG_W - s.w) / 2 };
  });
  const svgH = cursor + 20;

  return (
    <svg width="100%" viewBox={`0 0 ${SVG_W} ${svgH}`} role="img" aria-label="Briefing generation flow">
      <defs>
        {/* Gradient definitions for each step */}
        {laid.map((s, i) => (
          <linearGradient key={`grad-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={s.gradient[0]} stopOpacity={isDark ? 0.25 : 0.20} />
            <stop offset="100%" stopColor={s.gradient[1]} stopOpacity={isDark ? 0.15 : 0.12} />
          </linearGradient>
        ))}
        
        {/* Glow filter for highlight */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Arrow marker */}
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={isDark ? "#6ee7b7" : "#10b981"} opacity="0.6" />
        </marker>
      </defs>

      {laid.map((s, i) => {
        const isHovered = hoveredIndex === i;
        const scale = isHovered ? 1.05 : 1;
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        const emojiY = cy - 16;
        const titleY = cy + 4;
        const subY = cy + 20;

        return (
          <g
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Card background with gradient */}
            <rect
              x={s.x} y={s.y} width={s.w} height={s.h} rx={12}
              fill={`url(#gradient-${i})`}
              stroke={s.gradient[1]}
              strokeWidth={s.highlight ? 2 : 1}
              opacity={isHovered ? 1 : (s.highlight ? 1 : 0.9)}
              filter={isHovered || s.highlight ? "url(#glow)" : "none"}
              style={{
                transition: "all 0.3s ease",
                transform: `scale(${scale})`,
                transformOrigin: `${cx}px ${cy}px`
              }}
            />

            {/* Emoji */}
            <text
              x={cx} y={emojiY}
              textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: 24 }}>
              {s.emoji}
            </text>

            {/* Title */}
            <text
              x={cx} y={titleY}
              textAnchor="middle" dominantBaseline="central"
              style={{
                fontSize: s.highlight ? 16 : 15,
                fontWeight: s.highlight ? 600 : 500,
                fill: isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.90)",
                fontFamily: FONT
              }}>
              {s.title}
            </text>

            {/* Subtitle */}
            <text
              x={cx} y={subY}
              textAnchor="middle" dominantBaseline="central"
              style={{
                fontSize: 12,
                fontWeight: 400,
                fill: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.60)",
                fontFamily: FONT
              }}>
              {s.sub}
            </text>

            {/* Connecting arrow */}
            {i < laid.length - 1 && (
              <g>
                <line
                  x1={SVG_W / 2} y1={s.y + s.h + 2}
                  x2={SVG_W / 2} y2={s.y + s.h + GAP - 2}
                  stroke={isDark ? "#6ee7b7" : "#10b981"}
                  strokeWidth={2}
                  opacity={0.4}
                  strokeDasharray="4,4"
                  markerEnd="url(#arrow)"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="8"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </line>
              </g>
            )}
          </g>
        );
      })}

      {/* Time indicator */}
      <text
        x={SVG_W / 2} y={svgH - 5}
        textAnchor="middle"
        style={{
          fontSize: 11,
          fontWeight: 400,
          fill: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
          fontFamily: FONT,
          fontStyle: "italic"
        }}>
        ⚡ Complete flow in under 2 seconds
      </text>
    </svg>
  );
}

export default function ArchitecturePage() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  const t = theme === "dark" ? DARK : LIGHT;

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: t.bodyBg,
      color: t.text,
      fontFamily: "system-ui,-apple-system,sans-serif",
      padding: "32px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated Background Orbs */}
      <div style={{
        position: "absolute", top: "10%", left: "5%",
        width: "400px", height: "400px",
        background: `radial-gradient(circle, ${t.accentGlow}, transparent 70%)`,
        borderRadius: "50%", filter: "blur(80px)", opacity: 0.4,
        animation: "float 20s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "5%",
        width: "500px", height: "500px",
        background: `radial-gradient(circle, ${theme === "dark" ? "rgba(168,85,247,0.3)" : "rgba(147,51,234,0.2)"}, transparent 70%)`,
        borderRadius: "50%", filter: "blur(90px)", opacity: 0.3,
        animation: "float 25s ease-in-out infinite reverse",
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%       { transform: translate(30px,-30px) scale(1.1); }
          66%       { transform: translate(-20px,20px) scale(0.9); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px ${t.accentGlow}, 0 0 40px ${t.accentGlow}; }
          50%       { box-shadow: 0 0 30px ${t.accentGlow}, 0 0 60px ${t.accentGlow}; }
        }
        @keyframes shimmer {
          0%   { left: -100%; }
          100% { left:  100%; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 48, animation: "slideIn 0.6s ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <a href="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "12px 24px", background: t.card, border: `1px solid ${t.cardBorder}`,
                borderRadius: 12, color: t.accent, textDecoration: "none",
                fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: `0 4px 12px ${theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(-8px) scale(1.05)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${t.accentGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0) scale(1)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`;
              }}
            >
              <span style={{ fontSize: 18 }}>←</span> Back to Briefing Tool
            </a>
            <button onClick={toggleTheme}
              style={{
                padding: "12px 24px", background: t.card, border: `1px solid ${t.cardBorder}`,
                borderRadius: 12, color: t.text, cursor: "pointer",
                fontSize: 15, fontWeight: 500, transition: "all 0.3s",
                boxShadow: `0 4px 12px ${theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${t.accentGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`;
              }}
            >
              {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

          {/* Hero Title */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h1 style={{
              fontSize: 64, fontWeight: 200, margin: 0, marginBottom: 16,
              background: `linear-gradient(135deg, ${t.accent}, ${theme === "dark" ? "#93c5fd" : "#2563eb"})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              letterSpacing: "-2.6px",
            }}>
              Architecture Overview
            </h1>
            <p style={{ fontSize: 20, color: t.textSub, margin: 0, fontWeight: 400 }}>
              IBM Technologies Powering the Sales Intelligence Platform
            </p>
          </div>

        </div>

        {/* ── Architecture Diagram ── */}
        <div style={{
          background: t.card, border: `2px solid ${t.cardBorder}`, borderRadius: 20, padding: 40,
          marginBottom: 40,
          boxShadow: `0 20px 60px ${theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}`,
          animation: "slideIn 0.8s ease-out 0.2s backwards", backdropFilter: "blur(10px)",
        }}>
          <h2 style={{
            fontSize: 32, fontWeight: 500, marginTop: 0, marginBottom: 32, textAlign: "center",
            background: `linear-gradient(135deg, ${t.text}, ${t.textSub})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            System Architecture
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Platform Header */}
            <div style={{
              background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}11)`,
              border: `3px solid ${t.accent}`, borderRadius: 16, padding: 24,
              textAlign: "center", position: "relative", overflow: "hidden",
              animation: "glow 3s ease-in-out infinite",
            }}>
              <div style={{
                position: "absolute", top: 0, left: "-100%", width: "100%", height: "100%",
                background: `linear-gradient(90deg, transparent, ${t.accentGlow}, transparent)`,
                animation: "shimmer 3s infinite",
              }} />
              <div style={{ fontSize: 24, fontWeight: 500, color: t.text, marginBottom: 6, position: "relative" }}>
                🚀 Sales Intelligence Platform
              </div>
              <div style={{ fontSize: 15, color: t.textSub, fontWeight: 400, position: "relative" }}>
                Built with IBM Bob & IBM watsonx.ai
              </div>
            </div>

            {/* Frontend Layer */}
            {[
              {
                bg: theme === "dark" ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.15)",
                bgEnd: theme === "dark" ? "rgba(59,130,246,0.05)" : "rgba(59,130,246,0.08)",
                border: theme === "dark" ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.4)",
                shadow: theme === "dark" ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.15)",
                shadowHover: theme === "dark" ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.3)",
                titleColor: theme === "dark" ? "#60a5fa" : "#1d4ed8",
                tagBg: theme === "dark" ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.08)",
                icon: "💻", title: "Frontend Layer", sub: "React 18 + TypeScript + Vite",
                tags: ["✨ Modern UI with themes", "⚡ Real-time streaming", "📄 PDF export", "📚 History management"],
              },
            ].map((layer, i) => (
              <div key={i}
                style={{
                  background: `linear-gradient(135deg, ${layer.bg} 0%, ${layer.bgEnd} 100%)`,
                  border: `3px solid ${layer.border}`, borderRadius: 16, padding: 28,
                  textAlign: "center", transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)", cursor: "pointer",
                  boxShadow: `0 8px 24px ${layer.shadow}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = `0 16px 48px ${layer.shadowHover}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${layer.shadow}`;
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 500, color: layer.titleColor, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{layer.icon}</span> {layer.title}
                </div>
                <div style={{ fontSize: 15, color: t.textSub, marginBottom: 16, fontWeight: 400 }}>{layer.sub}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, fontSize: 13, color: t.textSub }}>
                  {layer.tags.map((tag, ti) => (
                    <div key={ti} style={{ padding: "8px 12px", background: layer.tagBg, borderRadius: 8, fontWeight: 400 }}>{tag}</div>
                  ))}
                </div>
              </div>
            ))}

            {/* Arrow */}
            <div style={{ textAlign: "center", color: t.textMuted, padding: "8px 0" }}>
              <div style={{ fontSize: 32, animation: "pulse 2s ease-in-out infinite" }}>↓</div>
              <div style={{ fontSize: 13, letterSpacing: "0.05em" }}>HTTPS / REST API</div>
            </div>

            {/* API Server Layer */}
            <div style={{
              background: `linear-gradient(135deg, ${theme === "dark" ? "rgba(168,85,247,0.2)" : "rgba(147,51,234,0.15)"} 0%, ${theme === "dark" ? "rgba(168,85,247,0.05)" : "rgba(147,51,234,0.08)"} 100%)`,
              border: `3px solid ${theme === "dark" ? "rgba(168,85,247,0.5)" : "rgba(147,51,234,0.4)"}`,
              borderRadius: 16, padding: 28, textAlign: "center",
              transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)", cursor: "pointer",
              boxShadow: `0 8px 24px ${theme === "dark" ? "rgba(168,85,247,0.2)" : "rgba(147,51,234,0.15)"}`,
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = `0 16px 48px ${theme === "dark" ? "rgba(168,85,247,0.4)" : "rgba(147,51,234,0.3)"}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${theme === "dark" ? "rgba(168,85,247,0.2)" : "rgba(147,51,234,0.15)"}`;
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 500, color: theme === "dark" ? "#c084fc" : "#7c3aed", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 24 }}>⚙️</span> API Server Layer
              </div>
              <div style={{ fontSize: 15, color: t.textSub, marginBottom: 16, fontWeight: 400 }}>Node.js + Express + TypeScript</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, fontSize: 13, color: t.textSub }}>
                {["🎯 /api/briefing/generate", "📰 /api/briefing/news", "🎨 /api/briefing/logo", "🏢 /api/briefing/industry"].map((tag, i) => (
                  <div key={i} style={{ padding: "8px 12px", background: theme === "dark" ? "rgba(168,85,247,0.1)" : "rgba(147,51,234,0.08)", borderRadius: 8, fontWeight: 400 }}>{tag}</div>
                ))}
              </div>
            </div>

            {/* Multi arrows */}
            <div style={{ display: "flex", justifyContent: "space-around", color: t.textMuted, fontSize: 32, padding: "8px 0" }}>
              {[0.2, 0.4, 0.6].map((d, i) => (
                <div key={i} style={{ animation: `pulse 2s ease-in-out infinite ${d}s` }}>↓</div>
              ))}
            </div>

            {/* Bottom 3 services */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                {
                  icon: "🤖", title: "IBM watsonx.ai",
                  titleColor: theme === "dark" ? "#34d399" : "#059669",
                  bg: `linear-gradient(135deg, ${theme === "dark" ? "rgba(16,185,129,0.2)" : "rgba(5,150,105,0.15)"} 0%, ${theme === "dark" ? "rgba(16,185,129,0.05)" : "rgba(5,150,105,0.08)"} 100%)`,
                  border: theme === "dark" ? "rgba(16,185,129,0.6)" : "rgba(5,150,105,0.5)",
                  shadow: theme === "dark" ? "rgba(16,185,129,0.2)" : "rgba(5,150,105,0.15)",
                  shadowHover: theme === "dark" ? "rgba(16,185,129,0.5)" : "rgba(5,150,105,0.4)",
                  tagBg: theme === "dark" ? "rgba(16,185,129,0.1)" : "rgba(5,150,105,0.08)",
                  tags: ["💎 Granite 13B", "🦙 Llama 3 70B", "🌟 Mixtral 8x7B"],
                  footer: "⚡ Streaming API",
                  footerColor: theme === "dark" ? "#6ee7b7" : "#059669",
                },
                {
                  icon: "🌐", title: "External APIs",
                  titleColor: theme === "dark" ? "#fb923c" : "#ea580c",
                  bg: `linear-gradient(135deg, ${theme === "dark" ? "rgba(251,146,60,0.2)" : "rgba(249,115,22,0.15)"} 0%, ${theme === "dark" ? "rgba(251,146,60,0.05)" : "rgba(249,115,22,0.08)"} 100%)`,
                  border: theme === "dark" ? "rgba(251,146,60,0.5)" : "rgba(249,115,22,0.4)",
                  shadow: theme === "dark" ? "rgba(251,146,60,0.2)" : "rgba(249,115,22,0.15)",
                  shadowHover: theme === "dark" ? "rgba(251,146,60,0.5)" : "rgba(249,115,22,0.4)",
                  tagBg: theme === "dark" ? "rgba(251,146,60,0.1)" : "rgba(249,115,22,0.08)",
                  tags: ["📰 Google News", "🎨 Clearbit Logo", "👤 Unavatar"],
                  footer: "🔌 REST APIs",
                  footerColor: theme === "dark" ? "#fb923c" : "#ea580c",
                },
                {
                  icon: "💾", title: "Data Layer",
                  titleColor: theme === "dark" ? "#f472b6" : "#be185d",
                  bg: `linear-gradient(135deg, ${theme === "dark" ? "rgba(236,72,153,0.2)" : "rgba(219,39,119,0.15)"} 0%, ${theme === "dark" ? "rgba(236,72,153,0.05)" : "rgba(219,39,119,0.08)"} 100%)`,
                  border: theme === "dark" ? "rgba(236,72,153,0.5)" : "rgba(219,39,119,0.4)",
                  shadow: theme === "dark" ? "rgba(236,72,153,0.2)" : "rgba(219,39,119,0.15)",
                  shadowHover: theme === "dark" ? "rgba(236,72,153,0.5)" : "rgba(219,39,119,0.4)",
                  tagBg: theme === "dark" ? "rgba(236,72,153,0.1)" : "rgba(219,39,119,0.08)",
                  tags: ["🗄️ SQLite DB", "🔧 Drizzle ORM"],
                  footer: "📦 Local Store",
                  footerColor: theme === "dark" ? "#f472b6" : "#be185d",
                },
              ].map((svc, i) => (
                <div key={i}
                  style={{
                    background: svc.bg, border: `3px solid ${svc.border}`, borderRadius: 16, padding: 24,
                    textAlign: "center", transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)", cursor: "pointer",
                    boxShadow: `0 8px 24px ${svc.shadow}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-12px) scale(1.05)";
                    e.currentTarget.style.boxShadow = `0 20px 60px ${svc.shadowHover}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = `0 8px 24px ${svc.shadow}`;
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 500, color: svc.titleColor, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{svc.icon}</span> {svc.title}
                  </div>
                  <div style={{ fontSize: 13, color: t.textSub, lineHeight: 2, fontWeight: 400 }}>
                    {svc.tags.map((tag, ti) => (
                      <div key={ti} style={{ padding: "6px 10px", background: svc.tagBg, borderRadius: 6, marginBottom: 6, fontWeight: 400 }}>{tag}</div>
                    ))}
                    <div style={{ marginTop: 10, fontStyle: "italic", fontSize: 12, fontWeight: 400, color: svc.footerColor }}>{svc.footer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── IBM Technology at Work ── */}
        <div style={{
          background: t.card, border: `2px solid ${t.cardBorder}`, borderRadius: 20, padding: 40,
          marginBottom: 40,
          boxShadow: `0 20px 60px ${theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}`,
          animation: "slideIn 1s ease-out 0.4s backwards", backdropFilter: "blur(10px)",
        }}>
          <h2 style={{
            fontSize: 32, fontWeight: 500, marginTop: 0, marginBottom: 32, textAlign: "center",
            background: `linear-gradient(135deg, ${t.accent}, ${theme === "dark" ? "#c084fc" : "#7c3aed"})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            IBM Technology at Work
          </h2>
          <div style={{ display: "grid", gap: 28 }}>
            {[
              {
                icon: "🤖", num: "1", title: "IBM watsonx.ai - AI Foundation",
                color: t.accent,
                bg: theme === "dark" ? "rgba(16,185,129,0.1)" : "rgba(5,150,105,0.08)",
                border: theme === "dark" ? "rgba(16,185,129,0.3)" : "rgba(5,150,105,0.25)",
                borderHover: t.accent,
                shadowHover: t.accentGlow,
                desc: "Powers intelligent briefing generation with enterprise-grade AI",
                bullets: [
                  ["Foundation Models:", "IBM Granite, Meta Llama, Mistral"],
                  ["Streaming Generation:", "Real-time text with Server-Sent Events"],
                  ["Enterprise Governance:", "Built-in compliance and risk management"],
                  ["Hybrid Deployment:", "Cloud or on-premises via IBM Cloud Pak for Data"],
                ],
              },
              {
                icon: "👨‍💻", num: "2", title: "IBM Bob - Development Assistant",
                color: theme === "dark" ? "#60a5fa" : "#2563eb",
                bg: theme === "dark" ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.08)",
                border: theme === "dark" ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.25)",
                borderHover: theme === "dark" ? "#60a5fa" : "#2563eb",
                shadowHover: theme === "dark" ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.2)",
                desc: "AI-powered development assistant that helped build this platform",
                bullets: [
                  ["Code Generation:", "Automated TypeScript components and APIs"],
                  ["Architecture Design:", "Designed the monorepo structure"],
                  ["Best Practices:", "Enforced type safety and modern patterns"],
                  ["Documentation:", "Generated comprehensive documentation"],
                ],
              },
              {
                icon: "☁️", num: "3", title: "IBM Cloud Infrastructure",
                color: theme === "dark" ? "#c084fc" : "#7c3aed",
                bg: theme === "dark" ? "rgba(168,85,247,0.1)" : "rgba(147,51,234,0.08)",
                border: theme === "dark" ? "rgba(168,85,247,0.3)" : "rgba(147,51,234,0.25)",
                borderHover: theme === "dark" ? "#c084fc" : "#7c3aed",
                shadowHover: theme === "dark" ? "rgba(168,85,247,0.3)" : "rgba(147,51,234,0.2)",
                desc: "Hosting and deployment platform",
                bullets: [
                  ["IBM Cloud IAM:", "Authentication and API key management"],
                  ["IBM watsonx.ai Service:", "AI model hosting and inference"],
                  ["Multi-Region:", "US South, EU Germany, Japan Tokyo"],
                ],
              },
            ].map((card, i) => (
              <div key={i}
                style={{
                  background: `linear-gradient(135deg, ${card.bg}, transparent)`,
                  border: `2px solid ${card.border}`, borderRadius: 16, padding: 28,
                  transition: "all 0.3s", cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(8px)";
                  e.currentTarget.style.borderColor = card.borderHover;
                  e.currentTarget.style.boxShadow = `0 12px 32px ${card.shadowHover}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.borderColor = card.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <h3 style={{ fontSize: 22, fontWeight: 500, color: card.color, marginTop: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{card.icon}</span> {card.num}. {card.title}
                </h3>
                <p style={{ color: t.textSub, marginBottom: 16, fontSize: 15, lineHeight: 1.7 }}>{card.desc}</p>
                <ul style={{ color: t.textSub, lineHeight: 2, fontSize: 14, margin: 0 }}>
                  {card.bullets.map(([label, val], bi) => (
                    <li key={bi}><strong style={{ color: t.text }}>{label}</strong> {val}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Briefing Generation Flow (SVG diagram) ── */}
        <div style={{
          background: t.card, border: `2px solid ${t.cardBorder}`, borderRadius: 20, padding: 40,
          boxShadow: `0 20px 60px ${theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}`,
          animation: "slideIn 1.2s ease-out 0.6s backwards", backdropFilter: "blur(10px)",
        }}>
          <h2 style={{
            fontSize: 32, fontWeight: 500, marginTop: 0, marginBottom: 12, textAlign: "center",
            background: `linear-gradient(135deg, ${theme === "dark" ? "#fb923c" : "#ea580c"}, ${theme === "dark" ? "#f472b6" : "#be185d"})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Briefing Generation Flow
          </h2>
          <FlowDiagram theme={theme} />
        </div>

      </div>
    </div>
  );
}

// Made with Bob
