import React from "react";
import { GitCommit, Tag, Check, Download, ExternalLink } from "lucide-react";

export const ReleasesSection: React.FC = () => {
  const releases = [
    {
      version: "v0.1.0",
      date: "October 2026",
      tag: "Latest Public Release",
      badgeClass: "badge-green",
      changes: [
        "Brand Identity: Official elevated robot icon and interactive OPEN-VERSE wordmark with cursor-tracking pixel illumination.",
        "Remote Control Architecture: Outbound TLS relay support for controlling home laptops from mobile phones.",
        "Mobile Companion Release: Companion app for Android (.apk) and iOS TestFlight beta.",
        "Windows Desktop Installer: NSIS 64-bit installer (.exe) with automatic background daemon mode.",
        "Model Catalog: Unified provider router supporting Claude 3.7 Sonnet, OpenAI, DeepSeek, and local Ollama/LM Studio models.",
      ],
      checksums: [
        { file: "OPEN-VERSE-0.1.0-setup.exe", sha: "e8b9a14d59f3c7b20468ae39db7f01c8419ad22e34bf782c5a01bcde9124f24a" },
        { file: "OPEN-VERSE-0.1.0-macos-universal.dmg", sha: "72c05f8841a129d490bbfa6c8845e227d81a95a120bfbc6719dc183921bf3021" },
        { file: "open-verse-companion-v0.1.0.apk", sha: "5f8a02d8471b6e4e09ccf2105e49b88231a409ef120dc6b51a029381bf418042" },
      ],
    },
    {
      version: "v0.0.49",
      date: "October 2026",
      tag: "Core Engine Foundation",
      badgeClass: "badge-purple",
      changes: [
        "Headless hub daemon with WebSocket JSON-RPC protocol on port 26736.",
        "Local SQLite session store (~/.openverse) with persistent conversation history.",
        "Tool approval promise map and streaming reasoning tokens.",
      ],
      checksums: [],
    },
  ];

  return (
    <section id="releases" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Changelog & Integrity</div>
          <h2 className="section-title">Release History & Verified Checksums</h2>
          <p className="section-subtitle">
            Every OPEN-VERSE release is cryptographically signed and published with public SHA-256 checksums.
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

              {rel.checksums.length > 0 && (
                <div style={{ background: "#0a0a0e", borderRadius: 10, padding: 16, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                    SHA-256 Checksums
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.76rem", fontFamily: "var(--font-mono)" }}>
                    {rel.checksums.map((cs, k) => (
                      <div key={k} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, color: "var(--text-muted)" }}>
                        <span style={{ color: "var(--sky)" }}>{cs.file}</span>
                        <span style={{ wordBreak: "break-all" }}>{cs.sha}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
