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
  const DESKTOP_VERSION = "0.2.0";
  const GITHUB_RELEASES_ORG = "naresh-cn2/OPEN-VERSE";

  // Direct download assets hosted on GitHub Releases (backend binary host only)
  // Tag format: vX.Y.Z (set by desktop-release.yml workflow)
  const ASSETS = {
    windows: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
    windowsSig: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe.sig`,
    mac: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_aarch64.dmg`,
    linuxDeb: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_amd64.deb`,
    linuxDebSig: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_amd64.deb.sig`,
    linuxRpm: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE-${DESKTOP_VERSION}-1.x86_64.rpm`,
    linuxRpmSig: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE-${DESKTOP_VERSION}-1.x86_64.rpm.sig`,
    androidApk: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/open-verse-mobile.apk`,
  };

  // File metadata (size + checksum) — updated via release automation
  const FILE_META = {
    windows: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
      size: "128 MB",
      sha256: "935da9840a0316e62bd1f569b4494250a3a0edc8a93b23974b932538af528f8f",
      available: true,
    },
    mac: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_aarch64.dmg`,
      size: "165 MB",
      sha256: "0ac01302a129a4a1676ea7d81b749355cdd8cdb52a898ec014a15ebe006e0e2c",
      available: true,
    },
    linuxDeb: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_amd64.deb`,
      size: "228 MB",
      sha256: "ab5777a7c5716bbaf9b2e4dd2eebadec3f5244092cb1ee116fedb0fdbb311dc8",
      available: true,
    },
    linuxRpm: {
      name: `OPEN-VERSE-${DESKTOP_VERSION}-1.x86_64.rpm`,
      size: "228 MB",
      sha256: "90dd67b89c31254c9b8f6edc9f45acd2a760bf20698e59539a82f0eca751bfb9",
      available: true,
    },
    android: {
      name: `open-verse-mobile.apk`,
      size: "5.9 MB",
      sha256: "28262d7d9c83be83a8a8ec4e11d65ed68ed21917f78e30d7f0f72111e3255d6c",
      available: true,
    },
    ios: {
      name: `open-verse-ios-simulator.zip`,
      size: "Xcode Project",
      sha256: "Build via Xcode (mobile/ios) or GitHub Actions CI",
      available: true,
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

  const platformBadge = (available: boolean) => (
    <span className={`badge ${available ? "badge-green" : "badge-purple"}`} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      {available ? <Check size={14} style={{ color: "var(--emerald)" }} /> : <AlertCircle size={14} style={{ color: "var(--accent-light)" }} />}
      <span>{available ? "Available" : "Not Available"}</span>
    </span>
  );

  return (
    <section id="download" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Official Release Portal</div>
          <h2 className="section-title">Download & Install OPEN-VERSE</h2>
          <p className="section-subtitle">
            Get the official desktop application. All downloads are cryptographically verified
            with Minisign signatures and receive automatic in-app updates.
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
            {activeTab === "windows" && <span style={{ marginLeft: 6, fontSize: "0.8rem" }}>✓</span>}
          </button>

          <button
            onClick={() => setActiveTab("mac")}
            className={activeTab === "mac" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "10px 22px", fontSize: "0.9rem", opacity: FILE_META.mac.available ? 1 : 0.5 }}
            disabled={!FILE_META.mac.available}
          >
            <Monitor size={16} />
            <span>macOS</span>
          </button>

          <button
            onClick={() => setActiveTab("linux")}
            className={activeTab === "linux" ? "btn-primary" : "btn-secondary"}
            style={{ padding: "10px 22px", fontSize: "0.9rem", opacity: FILE_META.linuxDeb.available ? 1 : 0.5 }}
            disabled={!FILE_META.linuxDeb.available}
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
                  {platformBadge(FILE_META.windows.available)}
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

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              <a
                href={ASSETS.windowsSig}
                className="btn-secondary"
                style={{ padding: "10px 22px", fontSize: "0.85rem", gap: 8 }}
              >
                <Download size={16} />
                <span>Minisign Signature (.sig)</span>
              </a>
            </div>

            {/* Installation Instructions */}
            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Installation Instructions</span>
              </div>
              <div className="code-box">
                <span>1. Download OPEN-VERSE_0.2.0_x64-setup.exe</span>
                <span>2. Run the installer and follow the prompts</span>
                <span>3. Launch OPEN-VERSE from your Start menu</span>
                <span>4. The app will auto-check for updates on future launches</span>
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
                  {platformBadge(FILE_META.mac.available)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native Apple Silicon disk image (.dmg) built on GitHub-hosted macOS runners with ad-hoc signing. Includes embedded runtime and standalone AI assistant.
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
                  <span>Download for macOS (.dmg)</span>
                </a>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: "var(--accent-light)" }} />
                <span>Asset: <code>{FILE_META.mac.name}</code> (Apple Silicon / ARM64) • {FILE_META.mac.size}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span style={{ fontFamily: "var(--font-mono)" }}>SHA-256:</span>
                <code style={{ color: "var(--accent-light)", wordBreak: "break-all" }}>{FILE_META.mac.sha256}</code>
              </div>
            </div>

            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Installation Instructions</span>
              </div>
              <div className="code-box">
                <span>1. Download OPEN-VERSE_0.2.0_aarch64.dmg</span>
                <span>2. Open the disk image and drag OPEN-VERSE to your Applications folder</span>
                <span>3. Ad-hoc build: If prompted by macOS Gatekeeper, run:</span>
                <span>   sudo xattr -cr /Applications/OPEN-VERSE.app</span>
                <span>4. Launch OPEN-VERSE</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Architecture: Apple Silicon (M1/M2/M3/M4, ARM64)</div>
              <div>• macOS version: macOS 11.0 Big Sur or later</div>
              <div>• Signing: Ad-hoc signed (Apple Developer ID notarization requires team credentials)</div>
              <div>• In-app updates: Enabled</div>
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
                  {platformBadge(FILE_META.linuxDeb.available)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native packages for 64-bit Linux distributions (Ubuntu, Debian, Fedora, RHEL).
                  Includes Minisign signature verification and automated in-app update service.
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
                  className="btn-primary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8 }}
                  download={FILE_META.linuxRpm.name}
                >
                  <Download size={17} />
                  <span>Download .rpm (Fedora / RHEL)</span>
                </a>
              </div>
            </div>

            {/* Asset Details */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={15} style={{ color: "var(--accent-light)" }} />
                  <span>Debian / Ubuntu Package (.deb)</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 4 }}>
                  Size: <code>{FILE_META.linuxDeb.size}</code>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                  SHA-256: <code style={{ color: "var(--accent-light)" }}>{FILE_META.linuxDeb.sha256}</code>
                </div>
                <div style={{ marginTop: 10 }}>
                  <a href={ASSETS.linuxDebSig} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.78rem", gap: 6 }}>
                    <Download size={13} />
                    <span>Download .deb.sig</span>
                  </a>
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={15} style={{ color: "var(--accent-light)" }} />
                  <span>Fedora / RHEL Package (.rpm)</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 4 }}>
                  Size: <code>{FILE_META.linuxRpm.size}</code>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                  SHA-256: <code style={{ color: "var(--accent-light)" }}>{FILE_META.linuxRpm.sha256}</code>
                </div>
                <div style={{ marginTop: 10 }}>
                  <a href={ASSETS.linuxRpmSig} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.78rem", gap: 6 }}>
                    <Download size={13} />
                    <span>Download .rpm.sig</span>
                  </a>
                </div>
              </div>
            </div>

            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Installation Instructions</span>
              </div>
              <div className="code-box">
                <span>Debian/Ubuntu: sudo dpkg -i OPEN-VERSE_0.2.0_amd64.deb</span>
                <span>Fedora/RHEL: sudo rpm -i OPEN-VERSE-0.2.0-1.x86_64.rpm</span>
                <span>Launch: cline-app (or select OPEN-VERSE in application launcher)</span>
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Smartphone size={22} style={{ color: "var(--emerald)" }} />
                    <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>Android APK</h4>
                  </div>
                  {platformBadge(FILE_META.android.available)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 16 }}>
                  Native Android application with Direct AI Streaming (Gemini, Claude, OpenAI, Ollama) and OPEN-VERSE Desktop Hub companion pairing.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  <a
                    href={ASSETS.androidApk}
                    className="btn btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: "100%",
                      padding: "12px 20px",
                      fontWeight: 600,
                      borderRadius: 10,
                      textDecoration: "none",
                    }}
                  >
                    <Download size={18} />
                    <span>Download Android APK (v{DESKTOP_VERSION})</span>
                  </a>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <span>Size: {FILE_META.android.size}</span>
                    <button
                      onClick={() => copyToClipboard(FILE_META.android.sha256, "android-sha")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-light)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.78rem",
                      }}
                      title="Copy SHA-256 Checksum"
                    >
                      {copiedKey === "android-sha" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey === "android-sha" ? "Copied" : "Copy SHA-256"}</span>
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Installation Instructions:</div>
                  <div>1. Download the APK file directly to your Android device.</div>
                  <div>2. Tap to install (enable "Install unknown apps" if prompted).</div>
                  <div>3. Launch OPEN-VERSE. Requires Android 7.0+ (API 24 to 34).</div>
                </div>
              </div>

              {/* iOS Card */}
              <div style={{ background: "#0d0d12", borderRadius: 16, padding: 24, border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Smartphone size={22} style={{ color: "var(--sky)" }} />
                    <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>iOS / iPhone App</h4>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} style={{ color: "var(--emerald)" }} />
                    <span>Ready</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 16 }}>
                  Native iOS project with WKWebView container, deep-link OAuth callbacks, and Desktop Hub pairing.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      padding: "12px 18px",
                      borderRadius: 10,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      justifyContent: "center",
                    }}
                  >
                    <Info size={16} style={{ color: "var(--sky)" }} />
                    <span>Build via Xcode (`mobile/ios`)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <span>Target: iOS 15.0+</span>
                    <span>Simulator CI Enabled</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Build & Run Instructions:</div>
                  <div>1. Open <code style={{ color: "var(--sky)" }}>mobile/ios/OPEN-VERSE.xcodeproj</code> in Xcode 15+.</div>
                  <div>2. Select an iPhone Simulator or connected iOS device.</div>
                  <div>3. Press Run (<kbd>⌘R</kbd>) or trigger the GitHub Actions iOS workflow.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
