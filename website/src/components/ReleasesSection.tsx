import React from "react";
import { Tag, Check, ExternalLink } from "lucide-react";

export const ReleasesSection: React.FC = () => {
  const GITHUB_RELEASES_URL = "https://github.com/naresh-cn2/OPEN-VERSE/releases";

  const releases = [
    {
      version: "v0.2.3",
      date: "November 2026",
      tag: "Current Stable Release",
      badgeClass: "badge-green",
      changes: [
        "Native Android PackageInstaller Intent Bridge: Instant in-app APK installation via Android PackageInstaller activity (v0.2.3 / versionCode 5).",
        "Reactive In-App Update Lifecycle: Fixed update-check resolution state in About view so updates immediately display with action buttons.",
        "Secure Internal Cache APK Downloader: Direct streaming into isolated app cache with streaming SHA-256 integrity verification.",
        "Desktop Tauri 0.2.3 Suite: Verified NSIS installer and signed updater bundle with Minisign cryptographic verification.",
        "Full Cross-Device Synchronization: Instant bi-directional chat, identity, and preference sync across Windows and Android.",
      ],
      note: "Release binaries and cryptographic Minisign signatures (.sig) are verified and published across all supported platforms.",
    },
    {
      version: "v0.2.2",
      date: "November 2026",
      tag: "Previous Stable Release",
      badgeClass: "badge-purple",
      changes: [
        "Native Android Package Manager Bridge: Dynamic live version detection (v0.2.2 / versionCode 4) permanently breaking all update loops.",
        "Secure Internal Cache APK Downloader: Direct streaming into isolated app cache with streaming SHA-256 integrity verification.",
        "Automatic Installer Permissions: Added Unknown Sources intent flow and auto-resuming package installation upon grant.",
        "Desktop Tauri 0.2.2 Suite: Verified NSIS installer and signed updater bundle with Minisign cryptographic verification.",
        "Full Cross-Device Synchronization: Instant bi-directional chat, identity, and preference sync across Windows and Android.",
      ],
      note: "",
    },
    {
      version: "v0.2.1",
      date: "November 2026",
      tag: "Previous Stable Release",
      badgeClass: "badge-purple",
      changes: [
        "Unified Identity: Google and GitHub primary authentication across Windows, Android, Web, macOS, Linux, and iOS.",
        "Cloud Conversation Sync: Turn-by-turn conversation messages, sessions, and settings synchronizing in real time across all authenticated devices.",
        "Strict Account Isolation: Secure per-account cloud storage; logging out wipes local session cache while preserving cloud history for reconnection.",
        "Automatic In-App Updates: End-to-end update notification, verification, and one-click delivery for Windows, Android, and Desktop platforms.",
        "Direct Mobile APK Delivery: Optimized Android mobile APK served directly with native package installer headers.",
      ],
      note: "",
    },
    {
      version: "v0.2.0",
      date: "November 2026",
      tag: "Cross-Platform Foundation",
      badgeClass: "badge-purple",
      changes: [
        "Multi-Device Architecture: Synchronized personal AI assistant across desktop and mobile companion.",
        "WorkOS & Cloud Sync Gateway: Serverless sync API with persistent distributed cloud storage backend.",
        "First-Class Google Gemini: Autonomous execution runtime prioritizing Gemini 2.5/3.0 with optional BYOK providers.",
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
