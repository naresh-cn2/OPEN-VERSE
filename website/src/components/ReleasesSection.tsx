import React from "react";
import { Tag, Check, ExternalLink } from "lucide-react";

export const ReleasesSection: React.FC = () => {
  const GITHUB_RELEASES_URL = "https://github.com/naresh-cn2/cline/releases";

  const releases = [
    {
      version: "v0.0.49 (Desktop Pipeline Ready)",
      date: "October 2026",
      tag: "Active Desktop Release",
      badgeClass: "badge-green",
      changes: [
        "Brand Identity: Official robot icon and interactive OPEN-VERSE wordmark with cursor-tracking pixel illumination.",
        "Cross-Platform Release Automation: GitHub Actions CI workflow for Windows (NSIS .exe), macOS (Universal .app.tar.gz), and Linux (.deb / .rpm).",
        "Cryptographic Auto-Updater: Dedicated OPEN-VERSE Minisign public key verification embedded into the Tauri engine.",
        "Model Catalog: Unified provider router supporting Claude 3.7 Sonnet, OpenAI, DeepSeek, and local Ollama/LM Studio models.",
        "Mobile Companion Status: Dedicated companion apps for Android and iOS currently in active development.",
      ],
      note: "Release binaries and cryptographic Minisign signatures (.sig) are generated via CI upon workflow dispatch.",
    },
    {
      version: "v0.0.48",
      date: "October 2026",
      tag: "Core Engine Foundation",
      badgeClass: "badge-purple",
      changes: [
        "Headless hub daemon with WebSocket JSON-RPC protocol on port 26736.",
        "Local SQLite session store with persistent conversation history.",
        "Tool approval promise map and streaming reasoning tokens.",
      ],
      note: "",
    },
  ];

  return (
    <section id="releases" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Changelog & Integrity</div>
          <h2 className="section-title">Release History & Verified Architecture</h2>
          <p className="section-subtitle">
            Every OPEN-VERSE release is cryptographically signed and published with public Minisign signatures.
          </p>
        </div>

        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
          {releases.map((rel, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Tag size={18} style={{ color: "var(--accent-light)" }} />
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ffffff" }}>{rel.version}</h3>
                  <span className={`badge ${rel.badgeClass}`}>{rel.tag}</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{rel.date}</span>
              </div>

              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {rel.changes.map((ch, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.92rem", color: "var(--text-secondary)" }}>
                    <Check size={16} style={{ color: "var(--emerald)", marginTop: 4, flexShrink: 0 }} />
                    <span>{ch}</span>
                  </li>
                ))}
              </ul>

              {rel.note && (
                <div style={{ background: "#0a0a0e", borderRadius: 10, padding: 16, border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {rel.note}
                  </div>
                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.82rem", color: "var(--accent-light)", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                  >
                    <span>Inspect GitHub Releases</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
