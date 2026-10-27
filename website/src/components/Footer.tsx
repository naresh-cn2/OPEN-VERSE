import React from "react";
import { Github, Twitter, ShieldCheck, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "#08080a",
        padding: "60px 0 36px 0",
        position: "relative",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Col 1: Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src="/robot-icon.svg" alt="OPEN-VERSE" style={{ width: 28, height: 28, borderRadius: 6 }} />
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 900, fontSize: "1.1rem", color: "#ffffff", letterSpacing: "0.12em" }}>
                OPEN-VERSE
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, maxWidth: 280, marginBottom: 16 }}>
              Cross-platform autonomous AI coding. Control your laptop's agent from anywhere with native mobile & desktop clients.
            </p>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Apache License 2.0 • Open Source
            </div>
          </div>

          {/* Col 2: Downloads */}
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Downloads
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, fontSize: "0.88rem" }}>
              <li><a href="#download-windows" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Windows (10 / 11)</a></li>
              <li><a href="#download-mac" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>macOS (Apple Silicon & Intel)</a></li>
              <li><a href="#download-linux" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Linux (.deb / .rpm)</a></li>
              <li><a href="#download-mobile" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Android Companion (APK)</a></li>
              <li><a href="#download-mobile" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>iOS Companion (TestFlight)</a></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Product & Docs
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, fontSize: "0.88rem" }}>
              <li><a href="#how-it-works" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Remote Workflow Guide</a></li>
              <li><a href="#security" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Security Architecture (E2EE)</a></li>
              <li><a href="#docs" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>QR Pairing in 60s</a></li>
              <li><a href="#releases" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Release Notes & Checksums</a></li>
            </ul>
          </div>

          {/* Col 4: Community */}
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Project
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 14 }}>
              Autonomous pair programming that gives developers freedom of movement without sacrificing local machine power.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a
                href="https://github.com/cline/cline"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ padding: "8px 12px", fontSize: "0.8rem" }}
              >
                <Github size={15} />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontSize: "0.8rem",
            color: "var(--text-muted)",
          }}
        >
          <div>© 2026 OPEN-VERSE Project. Licensed under Apache License 2.0.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>Built for developers on the move</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
