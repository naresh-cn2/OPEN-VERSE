import React, { useState } from "react";
import { Monitor, Smartphone, Terminal, Check, Copy, Download, Clock, GitBranch, ShieldCheck, AlertCircle } from "lucide-react";

export const DownloadCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"windows" | "mac" | "linux" | "mobile">("windows");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const DESKTOP_VERSION = "0.0.49";
  const RELEASE_TAG = `desktop-v${DESKTOP_VERSION}`;
  const GITHUB_REPO_URL = "https://github.com/naresh-cn2/OPEN-VERSE";
  const GITHUB_RELEASES_URL = `https://github.com/naresh-cn2/OPEN-VERSE/releases/tag/${RELEASE_TAG}`;

  // Direct published installer assets
  const ASSETS = {
    windows: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/${RELEASE_TAG}/OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
    mac: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/${RELEASE_TAG}/OPEN-VERSE_${DESKTOP_VERSION}_universal.app.tar.gz`,
    linuxDeb: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/${RELEASE_TAG}/open-verse_${DESKTOP_VERSION}_amd64.deb`,
    linuxRpm: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/${RELEASE_TAG}/open-verse-${DESKTOP_VERSION}-1.x86_64.rpm`,
  };

  return (
    <section id="download" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Official Release Portal</div>
          <h2 className="section-title">Download & Install OPEN-VERSE</h2>
          <p className="section-subtitle">
            Get the official desktop application for Windows, macOS, or Linux. Cryptographically verified with automated background updates.
          </p>
        </div>

        {/* Platform Selection Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 36,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setActiveTab("windows")}
            className={activeTab === "windows" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "10px 22px", fontSize: "0.9rem" }}
          >
            <Monitor size={16} />
            <span>Windows (10 / 11)</span>
          </button>

          <button
            onClick={() => setActiveTab("mac")}
            className={activeTab === "mac" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "10px 22px", fontSize: "0.9rem" }}
          >
            <Monitor size={16} />
            <span>macOS</span>
          </button>

          <button
            onClick={() => setActiveTab("linux")}
            className={activeTab === "linux" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "10px 22px", fontSize: "0.9rem" }}
          >
            <Monitor size={16} />
            <span>Linux</span>
          </button>

          <button
            onClick={() => setActiveTab("mobile")}
            className={activeTab === "mobile" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "10px 22px", fontSize: "0.9rem" }}
          >
            <Smartphone size={16} />
            <span>Mobile Companion</span>
          </button>
        </div>

        {/* Tab 1: Windows */}
        {activeTab === "windows" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-windows">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for Windows</h3>
                  <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ShieldCheck size={14} style={{ color: "var(--emerald)" }} />
                    <span>v{DESKTOP_VERSION} Release</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native 64-bit NSIS installer (.exe) for Windows 10 & 11 with built-in agent runtime, Minisign signature verification, and automated background update service.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={ASSETS.windows}
                  className="btn-primary"
                  style={{ padding: "12px 26px", fontSize: "0.95rem", gap: 8 }}
                  download={`OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`}
                >
                  <Download size={18} />
                  <span>Download for Windows (.exe)</span>
                </a>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: "var(--accent-light)" }} />
                <span>Asset: <code>OPEN-VERSE_{DESKTOP_VERSION}_x64-setup.exe</code> (x86_64)</span>
              </div>
              <a
                href={GITHUB_RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.82rem", color: "var(--accent-light)", textDecoration: "none" }}
              >
                Inspect GitHub Release & Signatures →
              </a>
            </div>

            {/* Run from Source Fallback */}
            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Terminal size={15} style={{ color: "var(--accent-light)" }} />
                <span>Developer option — Run locally on Windows from source:</span>
              </div>
              <div className="code-box">
                <span>git clone {GITHUB_REPO_URL}.git && cd cline && bun install && bun run dev:headless</span>
                <button
                  onClick={() => copyToClipboard(`git clone ${GITHUB_REPO_URL}.git && cd cline && bun install && bun run dev:headless`, "win-source")}
                  className="copy-btn"
                  title="Copy command"
                >
                  {copiedKey === "win-source" ? <Check size={16} style={{ color: "var(--emerald)" }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Operating System: Windows 10 (1903+) or Windows 11</div>
              <div>• Architecture: 64-bit Intel / AMD (x86_64)</div>
              <div>• Updater: Verified Minisign public key cryptography</div>
            </div>
          </div>
        )}

        {/* Tab 2: macOS */}
        {activeTab === "mac" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-mac">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for macOS</h3>
                  <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ShieldCheck size={14} style={{ color: "var(--emerald)" }} />
                    <span>v{DESKTOP_VERSION} Release</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Universal binary package natively compiled for Apple Silicon (M1/M2/M3/M4) and Intel Macs with built-in auto-updater.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={ASSETS.mac}
                  className="btn-primary"
                  style={{ padding: "12px 26px", fontSize: "0.95rem", gap: 8 }}
                  download={`OPEN-VERSE_${DESKTOP_VERSION}_universal.app.tar.gz`}
                >
                  <Download size={18} />
                  <span>Download for macOS (Universal)</span>
                </a>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: "var(--accent-light)" }} />
                <span>Asset: <code>OPEN-VERSE_{DESKTOP_VERSION}_universal.app.tar.gz</code></span>
              </div>
              <a
                href={GITHUB_RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.82rem", color: "var(--accent-light)", textDecoration: "none" }}
              >
                Inspect GitHub Release & Signatures →
              </a>
            </div>

            {/* Run from Source Fallback */}
            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Terminal size={15} style={{ color: "var(--accent-light)" }} />
                <span>Developer option — Run locally on macOS from source:</span>
              </div>
              <div className="code-box">
                <span>git clone {GITHUB_REPO_URL}.git && cd cline && bun install && bun run dev:headless</span>
                <button
                  onClick={() => copyToClipboard(`git clone ${GITHUB_REPO_URL}.git && cd cline && bun install && bun run dev:headless`, "mac-source")}
                  className="copy-btn"
                  title="Copy command"
                >
                  {copiedKey === "mac-source" ? <Check size={16} style={{ color: "var(--emerald)" }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Minimum OS: macOS 12.0 (Monterey) or later</div>
              <div>• Architecture: Universal Binary (Apple Silicon + Intel x86_64)</div>
              <div>• Package: Application archive with automated updater</div>
            </div>
          </div>
        )}

        {/* Tab 3: Linux */}
        {activeTab === "linux" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-linux">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for Linux</h3>
                  <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ShieldCheck size={14} style={{ color: "var(--emerald)" }} />
                    <span>v{DESKTOP_VERSION} Release</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native packages for Linux distributions. Choose Debian/Ubuntu (.deb) or Fedora/RHEL (.rpm).
                </p>
              </div>

              {/* Separate DEB and RPM Buttons */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={ASSETS.linuxDeb}
                  className="btn-primary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8 }}
                  download={`open-verse_${DESKTOP_VERSION}_amd64.deb`}
                >
                  <Download size={17} />
                  <span>Download .deb (Ubuntu / Debian)</span>
                </a>
                <a
                  href={ASSETS.linuxRpm}
                  className="btn-secondary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8, borderColor: "var(--border-active)" }}
                  download={`open-verse-${DESKTOP_VERSION}-1.x86_64.rpm`}
                >
                  <Download size={17} />
                  <span>Download .rpm (Fedora / RHEL)</span>
                </a>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: "var(--accent-light)" }} />
                <span>Assets: <code>.deb</code> (x86_64) and <code>.rpm</code> (x86_64)</span>
              </div>
              <a
                href={GITHUB_RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.82rem", color: "var(--accent-light)", textDecoration: "none" }}
              >
                Inspect GitHub Release & Signatures →
              </a>
            </div>

            {/* Run from Source Fallback */}
            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Terminal size={15} style={{ color: "var(--accent-light)" }} />
                <span>Developer option — Run locally on Linux from source:</span>
              </div>
              <div className="code-box">
                <span>git clone {GITHUB_REPO_URL}.git && cd cline && bun install && bun run dev:headless</span>
                <button
                  onClick={() => copyToClipboard(`git clone ${GITHUB_REPO_URL}.git && cd cline && bun install && bun run dev:headless`, "linux-source")}
                  className="copy-btn"
                  title="Copy command"
                >
                  {copiedKey === "linux-source" ? <Check size={16} style={{ color: "var(--emerald)" }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• glibc 2.31+ supported</div>
              <div>• Package formats: .deb (dpkg/apt) and .rpm (rpm/dnf)</div>
              <div>• Daemon: Headless background agent mode supported</div>
            </div>
          </div>
        )}

        {/* Tab 4: Mobile (Android & iOS) */}
        {activeTab === "mobile" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-mobile">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
              {/* Android Card */}
              <div style={{ background: "#0d0d12", borderRadius: 16, padding: 24, border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Smartphone size={22} style={{ color: "var(--emerald)" }} />
                  <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>Android Companion</h4>
                  <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>In Development</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 20 }}>
                  Controls your desktop agent securely over TLS relay. The native Android companion application is currently in development.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <div
                    style={{
                      padding: "12px 18px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      justifyContent: "center"
                    }}
                  >
                    <AlertCircle size={16} style={{ color: "var(--accent-light)" }} />
                    <span>Coming Soon — APK Not Yet Released</span>
                  </div>
                  <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    No fake or mock packages are distributed. Genuine APK will be published once mobile build completes.
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: 16, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  ✓ Native speech dictation • ✓ Background task push alerts • ✓ Secure QR pairing
                </div>
              </div>

              {/* iOS Card */}
              <div style={{ background: "#0d0d12", borderRadius: 16, padding: 24, border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Smartphone size={22} style={{ color: "var(--sky)" }} />
                  <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>iOS / iPhone Companion</h4>
                  <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>In Development</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 20 }}>
                  Controls your running desktop agent from iPhone and iPad. Apple TestFlight beta access is currently in preparation.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <div
                    style={{
                      padding: "12px 18px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      justifyContent: "center"
                    }}
                  >
                    <AlertCircle size={16} style={{ color: "var(--sky)" }} />
                    <span>Coming Soon — TestFlight In Preparation</span>
                  </div>
                  <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Requires iOS 16.0 or later on iPhone / iPad.
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: 16, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  ✓ Siri Shortcuts integration • ✓ Live activity streaming • ✓ FaceID protection
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
