import React, { useState } from "react";
import { Monitor, Smartphone, Terminal, Check, Copy, ExternalLink, Clock, GitBranch, Shield, Sparkles } from "lucide-react";

export const DownloadCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"windows" | "mac" | "linux" | "mobile">("windows");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const GITHUB_REPO_URL = "https://github.com/naresh-cn2/OPEN-VERSE";
  const GITHUB_RELEASES_URL = "https://github.com/naresh-cn2/OPEN-VERSE/releases";

  return (
    <section id="download" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Official Release Hub</div>
          <h2 className="section-title">Download & Install OPEN-VERSE</h2>
          <p className="section-subtitle">
            OPEN-VERSE runs locally on your computer with remote access from mobile. Pre-compiled installers for v0.1.0
            are actively being packaged. In the meantime, you can run the full agent locally from source today.
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
                    <Clock size={13} />
                    <span>v0.1.0 Build in Progress</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  Native 64-bit installer with background agent service, auto-updater, and local model bindings. Pre-compiled binaries will be available with the v0.1.0 release tag.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ padding: "12px 24px" }}
                >
                  <ExternalLink size={17} />
                  <span>View GitHub Releases</span>
                </a>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: "12px 20px" }}
                >
                  <GitBranch size={17} />
                  <span>GitHub Repository</span>
                </a>
              </div>
            </div>

            {/* Run from Source via Terminal */}
            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Terminal size={15} style={{ color: "var(--accent-light)" }} />
                <span>Run locally on Windows right now (from source):</span>
              </div>
              <div className="code-box">
                <span>git clone {GITHUB_REPO_URL}.git && cd OPEN-VERSE/cline && bun install && bun run dev:headless</span>
                <button
                  onClick={() => copyToClipboard(`git clone ${GITHUB_REPO_URL}.git && cd OPEN-VERSE/cline && bun install && bun run dev:headless`, "win-source")}
                  className="copy-btn"
                  title="Copy command"
                >
                  {copiedKey === "win-source" ? <Check size={16} style={{ color: "var(--emerald)" }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Minimum OS: Windows 10 (1903+) or Windows 11</div>
              <div>• Architecture: x86_64 / x64</div>
              <div>• Status: Packaged installer in progress • Local runtime operational</div>
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
                    <Clock size={13} />
                    <span>v0.1.0 Build in Progress</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  Universal binary optimized natively for Apple Silicon (M1/M2/M3/M4) and Intel Macs.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ padding: "12px 24px" }}
                >
                  <ExternalLink size={17} />
                  <span>View GitHub Releases</span>
                </a>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: "12px 20px" }}
                >
                  <GitBranch size={17} />
                  <span>GitHub Repository</span>
                </a>
              </div>
            </div>

            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Terminal size={15} style={{ color: "var(--accent-light)" }} />
                <span>Run locally on macOS right now (from source):</span>
              </div>
              <div className="code-box">
                <span>git clone {GITHUB_REPO_URL}.git && cd OPEN-VERSE/cline && bun install && bun run dev:headless</span>
                <button
                  onClick={() => copyToClipboard(`git clone ${GITHUB_REPO_URL}.git && cd OPEN-VERSE/cline && bun install && bun run dev:headless`, "mac-source")}
                  className="copy-btn"
                  title="Copy command"
                >
                  {copiedKey === "mac-source" ? <Check size={16} style={{ color: "var(--emerald)" }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Minimum OS: macOS 12.0 (Monterey) or later</div>
              <div>• Architecture: Universal Binary (Apple Silicon + Intel)</div>
              <div>• Status: DMG packaging in progress • Source build supported</div>
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
                    <Clock size={13} />
                    <span>v0.1.0 Build in Progress</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  Native packages for Debian, Ubuntu, Fedora, Arch, and RHEL with systemd daemon integration.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ padding: "12px 24px" }}
                >
                  <ExternalLink size={17} />
                  <span>View GitHub Releases</span>
                </a>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: "12px 20px" }}
                >
                  <GitBranch size={17} />
                  <span>GitHub Repository</span>
                </a>
              </div>
            </div>

            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Terminal size={15} style={{ color: "var(--accent-light)" }} />
                <span>Run locally on Linux right now (from source):</span>
              </div>
              <div className="code-box">
                <span>git clone {GITHUB_REPO_URL}.git && cd OPEN-VERSE/cline && bun install && bun run dev:headless</span>
                <button
                  onClick={() => copyToClipboard(`git clone ${GITHUB_REPO_URL}.git && cd OPEN-VERSE/cline && bun install && bun run dev:headless`, "linux-source")}
                  className="copy-btn"
                  title="Copy command"
                >
                  {copiedKey === "linux-source" ? <Check size={16} style={{ color: "var(--emerald)" }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• glibc 2.31+ supported</div>
              <div>• Headless daemon mode supported for servers</div>
              <div>• Status: .deb / .rpm packages compiling in CI</div>
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
                  Controls your running laptop agent securely. The Android APK is currently in development and will be published to GitHub Releases and Google Play.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ width: "100%", justifyContent: "center", borderColor: "var(--border-active)" }}
                  >
                    <ExternalLink size={16} />
                    <span>Follow Release on GitHub</span>
                  </a>
                  <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Direct APK download will be available at v0.1.0
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
                  <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>TestFlight Planned</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 20 }}>
                  Apple TestFlight beta invites will open alongside the v0.1.0 public launch. Join the repository watchers to be notified when slots open.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ width: "100%", justifyContent: "center", borderColor: "var(--border-active)" }}
                  >
                    <ExternalLink size={16} />
                    <span>Watch Repository for Invites</span>
                  </a>
                  <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Requires iOS 16.0 or later on iPhone / iPad
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

