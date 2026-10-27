import React, { useState, useEffect, useRef } from "react";
import { Download, Smartphone, Terminal, Check, Copy, Laptop, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [detectedOS, setDetectedOS] = useState<"windows" | "mac" | "linux" | "android" | "ios">("windows");
  const [hoveredLetter, setHoveredLetter] = useState<number | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) setDetectedOS("windows");
    else if (userAgent.includes("mac")) setDetectedOS("mac");
    else if (userAgent.includes("linux") && !userAgent.includes("android")) setDetectedOS("linux");
    else if (userAgent.includes("android")) setDetectedOS("android");
    else if (userAgent.includes("iphone") || userAgent.includes("ipad")) setDetectedOS("ios");
  }, []);

  const copyCommand = () => {
    navigator.clipboard.writeText("winget install open-verse");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const wordmarkLetters = [
    { char: "O", side: "left" },
    { char: "P", side: "left" },
    { char: "E", side: "left" },
    { char: "N", side: "left" },
    { char: "-", side: "center" },
    { char: "V", side: "right" },
    { char: "E", side: "right" },
    { char: "R", side: "right" },
    { char: "S", side: "right" },
    { char: "E", side: "right" },
  ];

  const getOSDownloadInfo = () => {
    switch (detectedOS) {
      case "windows":
        return { label: "Get for Windows (x64)", sub: "v0.1.0 Packaging • Run from Source Today", href: "#download" };
      case "mac":
        return { label: "Get for macOS (Universal)", sub: "v0.1.0 Packaging • Run from Source Today", href: "#download" };
      case "linux":
        return { label: "Get for Linux (.deb / .rpm)", sub: "v0.1.0 Packaging • Run from Source Today", href: "#download" };
      case "android":
        return { label: "OPEN-VERSE Android Companion", sub: "Companion in Progress • Local Pairing", href: "#download" };
      case "ios":
        return { label: "OPEN-VERSE iOS Companion", sub: "Apple TestFlight Planned", href: "#download" };
    }
  };

  const osInfo = getOSDownloadInfo();

  return (
    <section style={{ paddingTop: 140, paddingBottom: 80, position: "relative", textAlign: "center" }}>
      <div className="container">
        {/* Release Tag */}
        <div style={{ display: "inline-flex", marginBottom: 24 }}>
          <a
            href="#releases"
            className="badge badge-purple"
            style={{ textDecoration: "none", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Sparkles size={14} />
            <span>OPEN-VERSE v0.1.0 Cross-Platform Release</span>
            <ArrowRight size={13} />
          </a>
        </div>

        {/* Floating Robot Brand Mark */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div className="animate-float" style={{ position: "relative" }}>
            <div
              className="animate-glow"
              style={{
                position: "absolute",
                inset: -20,
                background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
                borderRadius: "50%",
                zIndex: -1,
              }}
            />
            <svg
              width="140"
              height="140"
              viewBox="0 0 1024 1024"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 12px 30px rgba(139, 92, 246, 0.35))" }}
            >
              <rect width="1024" height="1024" rx="256" fill="#181822" stroke="#2d2d3a" strokeWidth="12" />
              <g transform="translate(120 96) scale(6.92)">
                <path
                  d="M56.4998 8.99805L56.4999 5.29805H56.4998V8.99805ZM68.4998 20.708L72.1998 20.7081V20.708H68.4998ZM67.9929 25L64.3662 24.2671L63.4704 28.7H67.9929V25ZM84.4998 25L84.4998 21.3H84.4998V25ZM95.7 49.7998H92V51.2066L92.9346 52.258L95.7 49.7998ZM108.027 63.667L110.793 61.2088L110.792 61.2088L108.027 63.667ZM108.027 64.7305L110.792 67.1887L110.793 67.1883L108.027 64.7305ZM95.7 78.5977L92.9346 76.1394L92 77.1909V78.5977H95.7ZM95.7 92.2002L99.3999 92.2002V92.2002H95.7ZM84.4998 103.4V107.1H84.4998L84.4998 103.4ZM17.2996 92.2002H13.5996V92.2002L17.2996 92.2002ZM17.2996 78.5986H20.9996V77.1918L20.0649 76.1404L17.2996 78.5986ZM4.97144 64.7305L2.20602 67.1886L2.20611 67.1887L4.97144 64.7305ZM4.97144 63.667L7.73685 66.1251L7.73685 66.1251L4.97144 63.667ZM17.2996 49.7979L20.065 52.256L20.9996 51.2046V49.7979H17.2996ZM45.0066 25V28.7H49.5292L48.6333 24.267L45.0066 25ZM44.4998 20.708H40.7998V20.7081L44.4998 20.708ZM56.4998 8.99805L56.4996 12.698C61.1812 12.6982 64.7998 16.3247 64.7998 20.708H68.4998H72.1998C72.1998 12.0452 65.0728 5.29829 56.4999 5.29805L56.4998 8.99805ZM68.4998 20.708L64.7998 20.7079C64.7997 21.6154 64.6614 22.8066 64.3662 24.2671L67.9929 25L71.6196 25.7329C71.969 24.004 72.1997 22.2864 72.1998 20.7081L68.4998 20.708ZM67.9929 25V28.7H84.4998V25V21.3H67.9929V25ZM84.4998 25L84.4997 28.7C88.6419 28.7001 92 32.0582 92 36.2002H95.7H99.3999C99.3999 27.9712 92.7287 21.3001 84.4998 21.3L84.4998 25ZM95.7 36.2002H92V49.7998H95.7H99.3999V36.2002H95.7ZM95.7 49.7998L92.9346 52.258L105.262 66.1252L108.027 63.667L110.792 61.2088L98.4653 47.3416L95.7 49.7998ZM108.027 63.667L105.262 66.1251C104.285 65.026 104.285 63.371 105.261 62.2727L108.027 64.7305L110.793 67.1883C112.308 65.4837 112.308 62.9141 110.793 61.2088L108.027 63.667ZM108.027 64.7305L105.262 62.2722L92.9346 76.1394L95.7 78.5977L98.4653 81.0559L110.792 67.1887L108.027 64.7305ZM95.7 78.5977H92V92.2002H95.7H99.3999V78.5977H95.7ZM95.7 92.2002L92 92.2002C91.9999 96.3422 88.6418 99.7003 84.4997 99.7004L84.4998 103.4L84.4998 107.1C92.7287 107.1 99.3999 100.429 99.3999 92.2002L95.7 92.2002ZM84.4998 103.4V99.7004H28.4998V103.4V107.1H84.4998V103.4ZM28.4998 103.4V99.7004C24.3577 99.7004 20.9996 96.3423 20.9996 92.2002L17.2996 92.2002L13.5996 92.2002C13.5996 100.429 20.2707 107.1 28.4998 107.1V103.4ZM17.2996 92.2002H20.9996V78.5986H17.2996H13.5996V92.2002H17.2996ZM17.2996 78.5986L20.0649 76.1404L7.73676 62.2722L4.97144 64.7305L2.20611 67.1887L14.5342 81.0569L17.2996 78.5986ZM4.97144 64.7305L7.73685 62.2723C8.71353 63.3711 8.71353 65.0264 7.73685 66.1251L4.97144 63.667L2.20602 61.2088C0.690476 62.9138 0.690476 65.4836 2.20602 67.1886L4.97144 64.7305ZM4.97144 63.667L7.73685 66.1251L20.065 52.256L17.2996 49.7979L14.5341 47.3397L2.20602 61.2088L4.97144 63.667ZM17.2996 49.7979H20.9996V36.2002H17.2996H13.5996V49.7979H17.2996ZM17.2996 36.2002H20.9996C20.9996 32.0581 24.3576 28.7 28.4998 28.7V25V21.3C20.2707 21.3 13.5996 27.9712 13.5996 36.2002H17.2996ZM28.4998 25V28.7H45.0066V25V21.3H28.4998V25ZM45.0066 25L48.6333 24.267C48.3381 22.8066 48.1998 21.6154 48.1998 20.7079L44.4998 20.708L40.7998 20.7081C40.7998 22.2864 41.0305 24.0039 41.3799 25.733L45.0066 25ZM44.4998 20.708H48.1998C48.1998 16.3244 51.8182 12.698 56.4998 12.698V8.99805V5.29805C47.9264 5.29805 40.7998 12.0451 40.7998 20.708H44.4998Z"
                  fill="#f4f4f5"
                />
                <rect x="66.1001" y="49.8008" width="9.6" height="28.8" rx="4.8" fill="#a78bfa" />
                <rect x="37.3" y="49.8008" width="9.6" height="28.8" rx="4.8" fill="#a78bfa" />
              </g>
            </svg>
          </div>
        </div>

        {/* Dynamic Interactive OPEN-VERSE Wordmark */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 6.5vw, 4.5rem)",
              letterSpacing: "0.18em",
              userSelect: "none",
            }}
          >
            {wordmarkLetters.map((item, index) => {
              const isHovered = hoveredLetter === index;
              const isNeighbor = hoveredLetter !== null && Math.abs(hoveredLetter - index) === 1;
              return (
                <span
                  key={index}
                  onMouseEnter={() => setHoveredLetter(index)}
                  onMouseLeave={() => setHoveredLetter(null)}
                  style={{
                    display: "inline-block",
                    transition: "all 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    color: isHovered
                      ? "#ffffff"
                      : isNeighbor
                      ? "#c4b5fd"
                      : item.char === "-"
                      ? "#a78bfa"
                      : "rgba(244, 244, 245, 0.55)",
                    textShadow: isHovered
                      ? "0 0 24px rgba(167, 139, 250, 0.9), 0 0 40px rgba(139, 92, 246, 0.6)"
                      : isNeighbor
                      ? "0 0 16px rgba(167, 139, 250, 0.4)"
                      : "none",
                    transform: isHovered
                      ? "translateY(-4px) scale(1.08)"
                      : isNeighbor
                      ? "translateY(-2px) scale(1.03)"
                      : "translateY(0) scale(1)",
                    cursor: "pointer",
                  }}
                >
                  {item.char}
                </span>
              );
            })}
          </div>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.25rem, 4.5vw, 3.6rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            maxWidth: 880,
            margin: "0 auto 20px auto",
            color: "#ffffff",
          }}
        >
          Your Laptop Runs the Agent. <br />
          <span
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Phone Drives the Code.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
            color: "var(--text-secondary)",
            maxWidth: 720,
            margin: "0 auto 36px auto",
            lineHeight: 1.6,
          }}
        >
          The genuine cross-platform AI coding product. Leave your laptop powered on at home,
          open OPEN-VERSE on your phone while away, and watch tasks execute autonomously on your repositories.
        </p>

        {/* Primary CTAs */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginBottom: 32 }}>
          <a href={osInfo.href} className="btn-primary" style={{ padding: "16px 32px", fontSize: "1.05rem" }}>
            <Download size={20} />
            <div style={{ textAlign: "left", lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>{osInfo.label}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.85, fontWeight: 400 }}>{osInfo.sub}</div>
            </div>
          </a>

          <a href="#download-mobile" className="btn-secondary" style={{ padding: "16px 28px", fontSize: "1.05rem" }}>
            <Smartphone size={20} style={{ color: "var(--accent-light)" }} />
            <div style={{ textAlign: "left", lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>Mobile Companion</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.75, fontWeight: 400 }}>Android APK & iOS App</div>
            </div>
          </a>
        </div>

        {/* Quick CLI Install box */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <div className="code-box" style={{ maxWidth: 440, width: "100%" }}>
            <span style={{ color: "var(--text-muted)" }}>$</span>
            <span style={{ flex: 1, textAlign: "left" }}>winget install open-verse</span>
            <button onClick={copyCommand} className="copy-btn" title="Copy CLI Command">
              {copied ? <Check size={16} style={{ color: "var(--emerald)" }} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Guarantee Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 28,
            marginTop: 40,
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={16} style={{ color: "var(--emerald)" }} />
            <span>End-to-End Encrypted Relay</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Laptop size={16} style={{ color: "var(--sky)" }} />
            <span>Code Never Leaves Your Laptop</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={16} style={{ color: "var(--accent-light)" }} />
            <span>Apache 2.0 Open Source Core</span>
          </div>
        </div>
      </div>
    </section>
  );
};
