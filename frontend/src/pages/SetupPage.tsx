import { useState, useEffect, useRef } from "react";

/* ─── Theme tokens (matching BriefingPage) ─── */
type Theme = "dark" | "light";

const DARK = {
  bodyBg: "linear-gradient(160deg,#2a2a2a 0%,#1e1e1e 35%,#252528 65%,#1a1a1c 100%)",
  card: "rgba(255,255,255,0.05)", cardBorder: "rgba(255,255,255,0.09)",
  cardShadow: "inset 0 1px 0 rgba(255,255,255,0.10),0 2px 12px rgba(0,0,0,0.2)",
  input: "rgba(255,255,255,0.05)", inputBorder: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.85)", textSub: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.35)",
  btn: "rgba(200,200,215,0.12)", btnBorder: "rgba(255,255,255,0.16)", btnText: "rgba(255,255,255,0.82)",
  btnSm: "rgba(255,255,255,0.06)", btnSmBorder: "rgba(255,255,255,0.12)", btnSmText: "rgba(255,255,255,0.65)",
  accent: "#6ee7b7", accentGlow: "rgba(110,231,183,0.7)",
  pill: "rgba(255,255,255,0.06)", pillBorder: "rgba(255,255,255,0.11)",
};

const LIGHT = {
  bodyBg: "linear-gradient(160deg,#f4f4f8 0%,#ffffff 35%,#f0f0f5 65%,#ebebf0 100%)",
  card: "rgba(255,255,255,0.95)", cardBorder: "rgba(0,0,0,0.09)",
  cardShadow: "0 1px 4px rgba(0,0,0,0.05),0 2px 12px rgba(0,0,0,0.04)",
  input: "rgba(255,255,255,0.85)", inputBorder: "rgba(0,0,0,0.12)",
  text: "rgba(0,0,0,0.85)", textSub: "rgba(0,0,0,0.60)",
  textMuted: "rgba(0,0,0,0.42)",
  btn: "rgba(0,0,0,0.07)", btnBorder: "rgba(0,0,0,0.13)", btnText: "rgba(0,0,0,0.78)",
  btnSm: "rgba(0,0,0,0.05)", btnSmBorder: "rgba(0,0,0,0.10)", btnSmText: "rgba(0,0,0,0.60)",
  accent: "#059669", accentGlow: "rgba(5,150,105,0.4)",
  pill: "rgba(0,0,0,0.05)", pillBorder: "rgba(0,0,0,0.09)",
};

export default function SetupPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user info already exists
    const savedName = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("userRole");
    const savedPicture = localStorage.getItem("userProfilePicture");
    const savedTheme = (localStorage.getItem("theme") as Theme) || "dark";
    
    setTheme(savedTheme);
    if (savedName && savedRole) {
      setName(savedName);
      setRole(savedRole);
    }
    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  }, []);

  const t = theme === "dark" ? DARK : LIGHT;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (name.trim() && role.trim()) {
      localStorage.setItem("userName", name.trim());
      localStorage.setItem("userRole", role.trim());
      if (profilePicture) {
        localStorage.setItem("userProfilePicture", profilePicture);
      } else {
        localStorage.removeItem("userProfilePicture");
      }
      window.location.href = "/";
    }
  };

  const handleSkip = () => {
    window.location.href = "/";
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Theme icon component
  const ThemeIcon = ({ theme }: { theme: Theme }) => (
    theme === "dark" ? (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v1m0 12v1m7-7h-1M4 10H3m13.66 3.66l-.71-.71M5.05 5.05l-.71-.71m11.32 0l-.71.71M5.05 14.95l-.71.71M14 10a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: t.bodyBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "var(--app-font-sans)",
      color: t.text,
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        background: t.card,
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
        border: `1px solid ${t.cardBorder}`,
        borderRadius: "16px",
        boxShadow: t.cardShadow,
        padding: "40px",
      }}>
        {/* Theme toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{
              background: t.btnSm,
              border: `1px solid ${t.btnSmBorder}`,
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: t.textSub,
            }}
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            background: t.pill,
            backdropFilter: "blur(28px)",
            border: `1px solid ${t.pillBorder}`,
            borderRadius: "100px",
            padding: "9px 16px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}>
            <div style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: t.accent,
              flexShrink: 0,
              boxShadow: `0 0 8px ${t.accentGlow}`,
            }} />
            <span style={{ fontSize: "13px", color: t.textSub, fontWeight: 400 }}>
              Sales Intelligence Powered by <span style={{ color: "#0f62fe", fontWeight: 500 }}>IBM</span>
            </span>
          </div>
          
          <h1 style={{
            fontSize: "48px",
            fontWeight: 200,
            letterSpacing: "-2px",
            color: t.text,
            lineHeight: 1.1,
            margin: "0 0 12px",
          }}>
            Let's Get Started
          </h1>
          
          <p style={{
            fontSize: "15px",
            fontWeight: 300,
            color: t.textMuted,
            lineHeight: 1.6,
            margin: 0,
          }}>
            Personalize your experience by adding your details below
          </p>
        </div>

        {/* Profile Picture Upload */}
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <label style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 500,
            color: t.textSub,
            marginBottom: "12px",
          }}>
            Profile Picture (Optional)
          </label>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            {/* Profile picture preview */}
            <div style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              background: t.input,
              border: `2px solid ${t.inputBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
            }}>
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>

            {/* Upload/Remove buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="profile-picture-input"
              />
              <label
                htmlFor="profile-picture-input"
                style={{
                  padding: "8px 14px",
                  background: t.btnSm,
                  border: `1px solid ${t.btnSmBorder}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: t.btnSmText,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {profilePicture ? "Change" : "Upload"}
              </label>
              {profilePicture && (
                <button
                  onClick={handleRemovePicture}
                  style={{
                    padding: "8px 14px",
                    background: t.btnSm,
                    border: `1px solid ${t.btnSmBorder}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: t.btnSmText,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            <p style={{
              fontSize: "11px",
              color: t.textMuted,
              margin: 0,
            }}>
              Max 2MB • JPG, PNG, or GIF
            </p>
          </div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: t.textSub,
              marginBottom: "8px",
            }}>
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marco Sesay"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && role.trim()) {
                  handleSave();
                }
              }}
              style={{
                width: "100%",
                padding: "11px 14px",
                background: t.input,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: "10px",
                fontSize: "14px",
                color: t.text,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: t.textSub,
              marginBottom: "8px",
            }}>
              Your Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Solutions Engineer"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && role.trim()) {
                  handleSave();
                }
              }}
              style={{
                width: "100%",
                padding: "11px 14px",
                background: t.input,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: "10px",
                fontSize: "14px",
                color: t.text,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <button
            onClick={handleSkip}
            style={{
              flex: 1,
              padding: "11px 16px",
              background: t.btnSm,
              border: `1px solid ${t.btnSmBorder}`,
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 500,
              color: t.btnSmText,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Skip for Now
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !role.trim()}
            style={{
              flex: 1,
              padding: "11px 16px",
              background: t.btn,
              border: `1px solid ${t.btnBorder}`,
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 500,
              color: t.btnText,
              cursor: name.trim() && role.trim() ? "pointer" : "not-allowed",
              opacity: name.trim() && role.trim() ? 1 : 0.5,
              fontFamily: "inherit",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10),0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            Save & Continue
          </button>
        </div>

        {/* Footer */}
        <p style={{
          fontSize: "12px",
          color: t.textMuted,
          textAlign: "center",
          margin: 0,
        }}>
          You can update this information anytime from the settings menu
        </p>
      </div>
    </div>
  );
}

// Made with Bob
