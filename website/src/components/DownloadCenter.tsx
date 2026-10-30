import React, { useState, useEffect } from "react";
import {
	Monitor,
	Smartphone,
	Terminal,
	Check,
	Copy,
	Download,
	Clock,
	ShieldCheck,
	AlertCircle,
	Info,
} from "lucide-react";

export const DownloadCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"windows" | "mac" | "linux" | "mobile">("windows");
  const [detectedOS, setDetectedOS] = useState<"windows" | "mac" | "linux" | "mobile" | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) setDetectedOS("windows");
    else if (ua.includes("mac")) setDetectedOS("mac");
    else if (ua.includes("linux") && !ua.includes("android")) setDetectedOS("linux");
    else if (ua.includes("android") || ua.includes("iphone") || ua.includes("ipad")) setDetectedOS("mobile");
  }, []);

  // Release versions — updated via release automation
  const DESKTOP_VERSION = "0.1.0";
  const GITHUB_RELEASES_ORG = "naresh-cn2/OPEN-VERSE";

  // Direct download assets hosted on GitHub Releases (backend binary host only)
  const ASSETS = {
    windows: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
    mac: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_universal.app.tar.gz`,
    linuxDeb: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_amd64.deb`,
    linuxRpm: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-v${DESKTOP_VERSION}/OPEN-VERSE-${DESKTOP_VERSION}-1.x86_64.rpm`,
  };

  // File metadata (size + checksum) — updated via release automation
  const FILE_META = {
    windows: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
      size: "~180 MB",
      sha256: "pending-production-release",
    },
    mac: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_universal.app.tar.gz`,
      size: "~220 MB",
      sha256: "pending-production-release",
    },
    linuxDeb: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_amd64.deb`,
      size: "229 MB",
      sha256: "e76d587f66eee955ccb6c8a0e442eb1e501f7abda5458097c87852df2536f6cf",
    },
    linuxRpm: {
      name: `OPEN-VERSE-${DESKTOP_VERSION}-1.x86_64.rpm`,
      size: "229 MB",
      sha256: "bd07fbab78ab922c865fc6ba0b29367a9a0d0af18abc76c31ae68ed55427abdc",
    },
  };

  const isDefaultTab = detectedOS ? detectedOS : "windows";
  const [initialTabSet, setInitialTabSet] = useState(false);

  useEffect(() => {
    if (!initialTabSet && isDefaultTab) {
      setActiveTab(isDefaultTab);
      setInitialTabSet(true);
    }
  }, [isDefaultTab, initialTabSet]);

  const copySourceCommand = () => {
    const cmd = `git clone https://github.com/${GITHUB_RELEASES_ORG}.git && cd OPEN-VERSE && bun install`;
    copyToClipboard(cmd, "source");
  };

  return (
    <section id="download" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Official Release Portal</div>
          <h2 className="section-title">Download & Install OPEN-VERSE</h2>
          <p className="section-subtitle">
            Get the official desktop application for Windows, macOS, or Linux. All downloads are
            cryptographically verified with Minisign signatures and receive automatic in-app updates.
          </p>
        </div>

        {/* Platform Detection Notice */}
        {detectedOS && detectedOS !== activeTab && !initialTabSet ? null : null}

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
                  download={FILE_META.windows.name}
                >
                  <Download size={18} />
                  <span>Download for Windows (.exe)</span>
                </a>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: "var(--accent-light)" }} />
                <span>Asset: <code>{FILE_META.windows.name}</code> (x86_64) • {FILE_META.windows.size}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span style={{ fontFamily: "var(--font-mono)" }}>SHA-256:</span>
                <code style={{ color: "var(--accent-light)", wordBreak: "break-all" }}>{FILE_META.windows.sha256}</code>
              </div>
            </div>

            {/* Installation Instructions */}
            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Installation Instructions</span>
              </div>
              <div className="code-box">
                <span>1. Download OPEN-VERSE_0.1.0_x64-setup.exe</span>
                <span>2. Run the installer and follow the prompts</span>
                <span>3. Launch OPEN-VERSE from your Start menu</span>
                <button onClick={copySourceCommand} className="copy-btn" title="Copy install steps">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Operating System: Windows 10 (1903+) or Windows 11</div>
              <div>• Architecture: 64-bit Intel / AMD (x86_64)</div>
              <div>• Updater: Verified Minisign public key cryptography</div>
              <div>• Auto-updates: In-app, automatic</div>
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
                  Universal application package for Apple Silicon (M1/M2/M3/M4) and Intel Macs with built-in auto-updater.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={ASSETS.mac}
                  className="btn-primary"
                  style={{ padding: "12px 26px", fontSize: "0.95rem", gap: 8 }}
                  download={FILE_META.mac.name}
                >
                  <Download size={18} />
                  <span>Download for macOS (Universal)</span>
                </a>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: "var(--accent-light)" }} />
                <span>Asset: <code>{FILE_META.mac.name}</code> • {FILE_META.mac.size}</span>
              </div>
            </div>

            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Installation Instructions</span>
              </div>
              <div className="code-box">
                <span>1. Download OPEN-VERSE_0.1.0_universal.app.tar.gz</span>
                <span>2. Extract and drag OPEN-VERSE.app to /Applications</span>
                <span>3. Launch from Applications or Spotlight</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Minimum OS: macOS 12.0 (Monterey) or later</div>
              <div>• Architecture: Universal Binary (Apple Silicon + Intel x86_64)</div>
              <div>• Auto-updates: In-app, automatic</div>
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

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={ASSETS.linuxDeb}
                  className="btn-primary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8 }}
                  download={FILE_META.linuxDeb.name}
                >
                  <Download size={17} />
                  <span>Download .deb (Ubuntu / Debian)</span>
                </a>
                <a
                  href={ASSETS.linuxRpm}
                  className="btn-secondary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8, borderColor: "var(--border-active)" }}
                  download={FILE_META.linuxRpm.name}
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
            </div>

            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Installation Instructions</span>
              </div>
              <div className="code-box">
                <span>Debian/Ubuntu: sudo dpkg -i OPEN-VERSE_0.1.0_amd64.deb</span>
                <span>Fedora/RHEL: sudo rpm -i OPEN-VERSE-0.1.0-1.x86_64.rpm</span>
                <span>Launch from your application menu</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• glibc 2.31+ supported</div>
              <div>• Package formats: .deb (dpkg/apt) and .rpm (rpm/dnf)</div>
              <div>• Architecture: x86_64</div>
              <div>• Auto-updates: In-app, automatic</div>
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
                  <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>Not Available</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 20 }}>
                  The native Android companion application is not yet available. Mobile build pipeline is not implemented.
                </p>

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
                  <span>No APK Available</span>
                </div>
                <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  No fake or mock packages are distributed. Genuine APK will be published once the mobile build completes.
                </div>
              </div>

              {/* iOS Card */}
              <div style={{ background: "#0d0d12", borderRadius: 16, padding: 24, border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Smartphone size={22} style={{ color: "var(--sky)" }} />
                  <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>iOS / iPhone Companion</h4>
                  <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>Not Available</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 20 }}>
                  The native iOS companion application is not yet available. TestFlight build is not yet prepared.
                </p>

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
                  <span>No TestFlight Build</span>
                </div>
                <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Requires iOS 16.0 or later on iPhone / iPad when available.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
