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
  Info,
  Apple,
  ExternalLink,
  Layers,
  FolderArchive,
  FileCode2,
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
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("windows")) setActiveTab("windows");
      else if (hash.includes("mac")) setActiveTab("mac");
      else if (hash.includes("linux")) setActiveTab("linux");
      else if (hash.includes("mobile") || hash.includes("android") || hash.includes("ios") || hash.includes("iphone"))
        setActiveTab("mobile");
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android") || ua.includes("iphone") || ua.includes("ipad")) setDetectedOS("mobile");
    else if (ua.includes("win")) setDetectedOS("windows");
    else if (ua.includes("mac")) setDetectedOS("mac");
    else if (ua.includes("linux")) setDetectedOS("linux");
  }, []);

  // Release version & repository configuration
  const DESKTOP_VERSION = "0.2.8";
  const GITHUB_RELEASES_ORG = "naresh-cn2/OPEN-VERSE";

  // Official release assets
  const ASSETS = {
    windows: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
    windowsZip: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_x64-windows.zip`,
    windowsSig: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe.sig`,
    mac: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-latest/OPEN-VERSE_0.2.0_aarch64.dmg`,
    linuxDeb: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-latest/OPEN-VERSE_0.2.0_amd64.deb`,
    linuxDebSig: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-latest/OPEN-VERSE_0.2.0_amd64.deb.sig`,
    linuxRpm: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-latest/OPEN-VERSE-0.2.0-1.x86_64.rpm`,
    linuxRpmSig: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/desktop-latest/OPEN-VERSE-0.2.0-1.x86_64.rpm.sig`,
    androidApk: "/open-verse-mobile.apk",
    androidVersionedApk: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/open-verse-v${DESKTOP_VERSION}-android.apk`,
    androidZip: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/v${DESKTOP_VERSION}/open-verse-mobile-v${DESKTOP_VERSION}.zip`,
    iosTestFlight: `https://github.com/${GITHUB_RELEASES_ORG}/issues/new?title=iOS+TestFlight+Beta+Invite+Request&body=Please+grant+TestFlight+beta+access+for+my+Apple+ID.`,
    iosZip: `https://github.com/${GITHUB_RELEASES_ORG}/archive/refs/heads/main.zip`,
  };

  const FILE_META = {
    windows: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
      zipName: `OPEN-VERSE_${DESKTOP_VERSION}_x64-windows.zip`,
      size: "129.3 MB",
      zipSize: "129.3 MB",
      sha256: "481d43089055d8bfdc1f5c67f894814ece88078503a46eb90c286db15579d4dc",
      zipSha256: "0a875ab71b13f3659a5be7d4527f862163e8a41736ae2c27725a5b7786e8a31c",
    },
    mac: {
      name: `OPEN-VERSE_0.2.0_aarch64.dmg`,
      size: "172.8 MB",
      sha256: "0ac01302a129a4a1676ea7d81b749355cdd8cdb52a898ec014a15ebe006e0e2c",
    },
    linuxDeb: {
      name: `OPEN-VERSE_0.2.0_amd64.deb`,
      size: "239.1 MB",
      sha256: "ab5777a7c5716bbaf9b2e4dd2eebadec3f5244092cb1ee116fedb0fdbb311dc8",
    },
    linuxRpm: {
      name: `OPEN-VERSE-0.2.0-1.x86_64.rpm`,
      size: "239.1 MB",
      sha256: "90dd67b89c31254c9b8f6edc9f45acd2a760bf20698e59539a82f0eca751bfb9",
    },
    android: {
      name: `open-verse-mobile.apk`,
      versionedName: `open-verse-v${DESKTOP_VERSION}-android.apk`,
      zipName: `open-verse-mobile-v${DESKTOP_VERSION}.zip`,
      size: "10.6 MB",
      sha256: "623410f27b0409f11fb3c4c73d34cc2efc2be1e6407c429920777bc550454960",
    },
    ios: {
      name: `open-verse-ios-v${DESKTOP_VERSION}`,
      version: DESKTOP_VERSION,
      build: "9",
      size: "Native Xcode Project (ARM64)",
    },
  };

  return (
    <section id="download" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Official Native Release Portal</div>
          <h2 className="section-title">Download & Install OPEN-VERSE</h2>
          <p className="section-subtitle">
            Official native builds for Windows, macOS, Linux, and Mobile. High-performance local runtime
            with cryptographic Minisign integrity verification.
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
            className={`tab-btn ${activeTab === "windows" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Monitor size={16} />
            <span>Windows (10 / 11)</span>
            {detectedOS === "windows" && <Check size={13} style={{ color: "var(--emerald)" }} />}
          </button>
          <button
            onClick={() => setActiveTab("mac")}
            className={`tab-btn ${activeTab === "mac" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Apple size={16} />
            <span>macOS</span>
            {detectedOS === "mac" && <Check size={13} style={{ color: "var(--emerald)" }} />}
          </button>
          <button
            onClick={() => setActiveTab("linux")}
            className={`tab-btn ${activeTab === "linux" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Terminal size={16} />
            <span>Linux</span>
            {detectedOS === "linux" && <Check size={13} style={{ color: "var(--emerald)" }} />}
          </button>
          <button
            onClick={() => setActiveTab("mobile")}
            className={`tab-btn ${activeTab === "mobile" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Smartphone size={16} />
            <span>Mobile Companion (Android & iOS)</span>
            {detectedOS === "mobile" && <Check size={13} style={{ color: "var(--emerald)" }} />}
          </button>
        </div>

        {/* Tab 1: Windows */}
        {activeTab === "windows" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-windows">
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for Windows</h3>
                  <span
                    className="badge badge-purple"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(139, 92, 246, 0.12)",
                      color: "#c4b5fd",
                      borderColor: "rgba(139, 92, 246, 0.3)",
                    }}
                  >
                    <ShieldCheck size={14} style={{ color: "#a78bfa" }} />
                    <span>Verified Community Release • Minisign Signed</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 640 }}>
                  Native 64-bit application for Windows 10 & 11. Choose between the standard desktop setup installer or the portable standalone archive.
                </p>
              </div>

              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>Latest:</span>
                <span className="badge badge-green" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                  v{DESKTOP_VERSION} Stable
                </span>
              </div>
            </div>

            {/* Primary Download Options Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 20,
                marginBottom: 28,
              }}
            >
              {/* Option 1: Setup Installer */}
              <div
                style={{
                  background: "#0c0c12",
                  borderRadius: 14,
                  padding: 24,
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                  transition: "border-color 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ffffff", fontWeight: 700, fontSize: "1.05rem" }}>
                      <Monitor size={18} style={{ color: "var(--sky)" }} />
                      <span>Setup Installer (.exe)</span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {FILE_META.windows.size}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                    Standard Windows installer with Start Menu integration, desktop shortcuts, and automated background updates.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href={ASSETS.windows}
                    download={FILE_META.windows.name}
                    className="btn-primary"
                    style={{ padding: "12px 20px", fontSize: "0.95rem", justifyContent: "center", width: "100%" }}
                  >
                    <Download size={17} />
                    <span>Download Windows Installer</span>
                  </a>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>SHA-256:</span>
                      <code style={{ color: "var(--accent-light)" }}>{FILE_META.windows.sha256.slice(0, 14)}...</code>
                      <button
                        onClick={() => copyToClipboard(FILE_META.windows.sha256, "win-exe-sha")}
                        style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                        title="Copy EXE SHA-256 Checksum"
                      >
                        {copiedKey === "win-exe-sha" ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <a
                      href={ASSETS.windowsSig}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--text-secondary)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <span>Signature (.sig)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Option 2: Portable Standalone ZIP */}
              <div
                style={{
                  background: "#0c0c12",
                  borderRadius: 14,
                  padding: 24,
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                  transition: "border-color 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ffffff", fontWeight: 700, fontSize: "1.05rem" }}>
                      <FolderArchive size={18} style={{ color: "var(--accent-light)" }} />
                      <span>Portable Package (.zip)</span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {FILE_META.windows.zipSize}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                    Self-contained standalone archive. Extract anywhere and launch immediately with zero registry changes or system administrator privileges required.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href={ASSETS.windowsZip}
                    download={FILE_META.windows.zipName}
                    className="btn-secondary"
                    style={{ padding: "12px 20px", fontSize: "0.95rem", justifyContent: "center", width: "100%" }}
                  >
                    <Download size={17} />
                    <span>Download Portable ZIP</span>
                  </a>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>SHA-256:</span>
                      <code style={{ color: "var(--accent-light)" }}>{FILE_META.windows.zipSha256.slice(0, 14)}...</code>
                      <button
                        onClick={() => copyToClipboard(FILE_META.windows.zipSha256, "win-zip-sha")}
                        style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                        title="Copy ZIP SHA-256 Checksum"
                      >
                        {copiedKey === "win-zip-sha" ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <span style={{ color: "var(--emerald)" }}>Zero Install</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CLI & Sideload Channels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {/* winget command */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}>
                    <Terminal size={16} style={{ color: "var(--sky)" }} />
                    <span>Windows Package Manager (winget)</span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: "0.7rem" }}>Official Manifest</span>
                </div>
                <div className="code-box" style={{ fontSize: "0.82rem", padding: "8px 12px" }}>
                  <code>winget install OpenVerse.OpenVerse</code>
                  <button
                    onClick={() => copyToClipboard("winget install OpenVerse.OpenVerse", "winget-cmd")}
                    className="copy-btn"
                    title="Copy winget command"
                  >
                    {copiedKey === "winget-cmd" ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Modern MSIX package */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}>
                    <Layers size={16} style={{ color: "var(--accent-light)" }} />
                    <span>PowerShell MSIX Package</span>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>SDK Sideload</span>
                </div>
                <div className="code-box" style={{ fontSize: "0.82rem", padding: "8px 12px" }}>
                  <code>Add-AppxPackage -Path .\OPEN-VERSE_0.2.7_x64.msix</code>
                  <button
                    onClick={() => copyToClipboard("Add-AppxPackage -Path .\\OPEN-VERSE_0.2.7_x64.msix", "msix-cmd")}
                    className="copy-btn"
                    title="Copy PowerShell command"
                  >
                    {copiedKey === "msix-cmd" ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Clean, Neutral First-Launch Guidance Note */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "16px 20px",
                marginBottom: 24,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <Info size={18} style={{ color: "var(--sky)", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                <strong style={{ color: "#ffffff" }}>First-Launch Tip:</strong> When launching an open-source community release for the first time, Windows Defender SmartScreen may ask for confirmation. Click <strong>&ldquo;More info&rdquo;</strong> &rarr; <strong>&ldquo;Run anyway&rdquo;</strong> to continue. Alternatively, use the Portable ZIP package for zero-install execution.
              </div>
            </div>

            {/* Specs Footer */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• OS: Windows 10 (1903+) or Windows 11</div>
              <div>• Architecture: 64-bit Intel / AMD (x86_64)</div>
              <div>• Cryptography: Minisign Ed25519 (.sig)</div>
              <div>• Updates: In-app background service</div>
            </div>
          </div>
        )}

        {/* Tab 5: Hermes Agent (Local Dev Build) */}
        {activeTab === "windows" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto", marginTop: 40 }} id="download-hermes">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>Hermes Agent — Local Build</h3>
                  <span
                    className="badge badge-purple"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(139, 92, 246, 0.12)",
                      color: "#c4b5fd",
                      borderColor: "rgba(139, 92, 246, 0.3)",
                    }}
                  >
                    <Terminal size={14} style={{ color: "#a78bfa" }} />
                    <span>From your OPEN-VERSE repo (git install)</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 640 }}>
                  Full Hermes Agent source running from your repository. MIT-licensed. Isolated config at <code style={{ color: "var(--accent-light)" }}>C:\Users\nares\.hermes-openverse</code>. Use this to develop and modify Hermes directly.
                </p>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>Version:</span>
                <span className="badge badge-green" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                  v0.0.0 (2026.9.24)
                </span>
              </div>
            </div>

            <div
              style={{
                background: "#0c0c12",
                borderRadius: 14,
                padding: 24,
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ffffff", fontWeight: 700, fontSize: "1.05rem" }}>
                    <Download size={18} style={{ color: "var(--sky)" }} />
                    <span>Hermes Agent Launcher (.bat)</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>~15 MB runtime</span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Double-click to launch Hermes Agent from your repo. Or run the PowerShell equivalent.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: 8, padding: 12, fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#ffffff", overflowX: "auto" }}
                >{`scripts\hermes-openverse.bat`}</div>
                <a
                  href="https://github.com/naresh-cn2/OPEN-VERSE/releases/download/hermes-agent/Hermes-Agent-2026.9.24-windows.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ padding: "12px 20px", fontSize: "0.95rem", justifyContent: "center", width: "100%", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <Download size={17} />
                  <span>Download Hermes Agent (107 MB ZIP)</span>
                </a>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Repo:</span>
                  <code style={{ color: "var(--accent-light)" }}>WORKSPACE\OPEN-VERSE\OPEN-VERSE\OPEN-VERSE\hermes-agent</code>
                </div>
                <span style={{ color: "var(--emerald)" }}>Local Dev</span>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "16px 20px",
                marginTop: 24,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <Info size={18} style={{ color: "var(--sky)", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                <strong style={{ color: "#ffffff" }}>First Launch:</strong> The first run installs pinned Python 3.14 + dependencies (one-time, ~2 min). Subsequent launches are instant. Config/memory is isolated at <code style={{ color: "var(--accent-light)" }}>C:\Users\nares\.hermes-openverse</code> so it won&rsquo;t affect the Store-installed Hermes.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: macOS */}
        {activeTab === "mac" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-mac">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for macOS</h3>
                  <span
                    className="badge badge-purple"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(56, 189, 248, 0.12)",
                      color: "var(--sky)",
                      borderColor: "rgba(56, 189, 248, 0.3)",
                    }}
                  >
                    <Apple size={14} style={{ color: "var(--sky)" }} />
                    <span>Apple Silicon DMG • Ad-Hoc Signed</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native Apple Silicon disk image (.dmg) built for macOS 11.0+. Includes embedded agent runtime, local LSP engine, and full offline execution.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={ASSETS.mac}
                  download={FILE_META.mac.name}
                  className="btn-primary"
                  style={{ padding: "12px 26px", fontSize: "0.95rem", gap: 8 }}
                >
                  <Download size={18} />
                  <span>Download for macOS (.dmg)</span>
                </a>
              </div>
            </div>

            {/* Checksum and Asset Details */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: "var(--accent-light)" }} />
                <span>Asset: <code>{FILE_META.mac.name}</code> (Apple Silicon / ARM64) • {FILE_META.mac.size}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span style={{ fontFamily: "var(--font-mono)" }}>SHA-256:</span>
                <code style={{ color: "var(--accent-light)", wordBreak: "break-all" }}>{FILE_META.mac.sha256}</code>
                <button
                  onClick={() => copyToClipboard(FILE_META.mac.sha256, "mac-sha")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-light)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.78rem",
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                  title="Copy SHA-256 Checksum"
                >
                  {copiedKey === "mac-sha" ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === "mac-sha" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Clean Installation Guidance */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "16px 20px",
                marginBottom: 24,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <Info size={18} style={{ color: "var(--sky)", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                <strong style={{ color: "#ffffff" }}>Installation Tip:</strong> Open the disk image and drag <code>OPEN-VERSE.app</code> into your Applications folder. If macOS Gatekeeper prompts on first launch of this community release, right-click the application in Applications &rarr; select <strong>Open</strong> &rarr; click <strong>Open</strong>.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Architecture: Apple Silicon (M1/M2/M3/M4, ARM64)</div>
              <div>• OS: macOS 11.0 Big Sur or later</div>
              <div>• Signing: Ad-hoc signed community binary</div>
              <div>• CLI alternative: <code>xattr -cr /Applications/OPEN-VERSE.app</code></div>
            </div>
          </div>
        )}

        {/* Tab 3: Linux */}
        {activeTab === "linux" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-linux">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for Linux</h3>
                  <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Check size={14} style={{ color: "var(--emerald)" }} />
                    <span>Available • Minisign Verified</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native packages for 64-bit Linux distributions (Ubuntu, Debian, Fedora, RHEL). Includes Minisign signature verification and automated updates.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={ASSETS.linuxDeb}
                  download={FILE_META.linuxDeb.name}
                  className="btn-primary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8 }}
                >
                  <Download size={17} />
                  <span>Download .deb (Debian/Ubuntu)</span>
                </a>
                <a
                  href={ASSETS.linuxRpm}
                  download={FILE_META.linuxRpm.name}
                  className="btn-primary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8 }}
                >
                  <Download size={17} />
                  <span>Download .rpm (Fedora/RHEL)</span>
                </a>
              </div>
            </div>

            {/* Asset Details */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#ffffff", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  <Terminal size={16} style={{ color: "var(--sky)" }} />
                  <span>Debian / Ubuntu (.deb)</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                  Size: <code>{FILE_META.linuxDeb.size}</code>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span>SHA-256: <code style={{ color: "var(--accent-light)" }}>{FILE_META.linuxDeb.sha256.slice(0, 16)}...</code></span>
                  <button onClick={() => copyToClipboard(FILE_META.linuxDeb.sha256, "deb-sha")} style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                    {copiedKey === "deb-sha" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={ASSETS.linuxDebSig} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.78rem", gap: 6 }}>
                    <Download size={13} />
                    <span>Download .sig</span>
                  </a>
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#ffffff", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  <Terminal size={16} style={{ color: "var(--accent-light)" }} />
                  <span>Fedora / RHEL (.rpm)</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                  Size: <code>{FILE_META.linuxRpm.size}</code>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span>SHA-256: <code style={{ color: "var(--accent-light)" }}>{FILE_META.linuxRpm.sha256.slice(0, 16)}...</code></span>
                  <button onClick={() => copyToClipboard(FILE_META.linuxRpm.sha256, "rpm-sha")} style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                    {copiedKey === "rpm-sha" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={ASSETS.linuxRpmSig} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.78rem", gap: 6 }}>
                    <Download size={13} />
                    <span>Download .sig</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Terminal Command */}
            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Package Installation Commands</span>
              </div>
              <div className="code-box" style={{ marginBottom: 8 }}>
                <span>sudo dpkg -i {FILE_META.linuxDeb.name}</span>
                <button onClick={() => copyToClipboard(`sudo dpkg -i ${FILE_META.linuxDeb.name}`, "linux-deb")} className="copy-btn" title="Copy Debian install command">
                  {copiedKey === "linux-deb" ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="code-box">
                <span>sudo rpm -i {FILE_META.linuxRpm.name}</span>
                <button onClick={() => copyToClipboard(`sudo rpm -i ${FILE_META.linuxRpm.name}`, "linux-rpm")} className="copy-btn" title="Copy RPM install command">
                  {copiedKey === "linux-rpm" ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Requirements: glibc 2.31+</div>
              <div>• Package formats: .deb (dpkg/apt) and .rpm (rpm/dnf)</div>
              <div>• Architecture: x86_64</div>
              <div>• Updates: In-app background service</div>
            </div>
          </div>
        )}

        {/* Tab 4: Mobile (Android & iOS) */}
        {activeTab === "mobile" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-mobile">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
              {/* Android Card */}
              <div style={{ background: "#0c0c12", borderRadius: 16, padding: 24, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Smartphone size={22} style={{ color: "var(--emerald)" }} />
                      <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>Android Companion</h4>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: "0.72rem" }}>Direct APK</span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 18, lineHeight: 1.5 }}>
                    Native Android application with multi-provider AI streaming and encrypted pairing with your desktop workspace.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    <a
                      href={ASSETS.androidApk}
                      download="open-verse-mobile.apk"
                      className="btn-primary"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "100%",
                        padding: "12px 20px",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        borderRadius: 10,
                        textDecoration: "none",
                      }}
                    >
                      <Download size={18} />
                      <span>Download Android APK (v{DESKTOP_VERSION})</span>
                    </a>
                    <a
                      href={ASSETS.androidVersionedApk}
                      download={FILE_META.android.versionedName}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        width: "100%",
                        padding: "9px 16px",
                        fontSize: "0.82rem",
                        fontWeight: 500,
                        borderRadius: 8,
                        border: "1px solid var(--border-subtle)",
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                      }}
                    >
                      <span>Direct APK Mirror ({FILE_META.android.versionedName})</span>
                    </a>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 16 }}>
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

                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px 14px", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, color: "#ffffff", marginBottom: 2 }}>Quick Installation:</div>
                  <div>1. Tap the download button directly on your phone.</div>
                  <div>2. Open the downloaded file to install (allow &quot;Install unknown apps&quot; if prompted).</div>
                  <div>3. Launch OPEN-VERSE. Requires Android 7.0+ (API 24+).</div>
                </div>
              </div>

              {/* iOS Card */}
              <div style={{ background: "#0c0c12", borderRadius: 16, padding: 24, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Apple size={22} style={{ color: "var(--sky)" }} />
                      <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for iOS</h4>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: "0.72rem" }}>Native App</span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 18, lineHeight: 1.5 }}>
                    Native iOS companion app with Swift runtime, WKWebView container, and secure desktop workspace sync.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    <a
                      href={ASSETS.iosTestFlight}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "100%",
                        padding: "12px 20px",
                        fontSize: "0.92rem",
                        fontWeight: 600,
                        borderRadius: 10,
                        textDecoration: "none",
                      }}
                    >
                      <Apple size={18} />
                      <span>Join iOS Beta (TestFlight Queue)</span>
                      <ExternalLink size={14} style={{ opacity: 0.8 }} />
                    </a>

                    <a
                      href={ASSETS.iosZip}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        width: "100%",
                        padding: "10px 16px",
                        fontSize: "0.84rem",
                        fontWeight: 500,
                        borderRadius: 8,
                        border: "1px solid var(--border-subtle)",
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                      }}
                    >
                      <Download size={15} />
                      <span>Download Native Xcode Project (.zip)</span>
                    </a>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 16 }}>
                    <span>Target: iOS 15.0+ (ARM64)</span>
                    <span style={{ color: "var(--emerald)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={13} />
                      <span>Swift Ready</span>
                    </span>
                  </div>
                </div>

                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "12px 14px", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, color: "#ffffff", marginBottom: 2 }}>Distribution Options:</div>
                  <div>• <strong>TestFlight Queue:</strong> Join the public queue to receive automated beta slot allocation.</div>
                  <div>• <strong>Xcode Build:</strong> Clone the repo and run <code style={{ color: "var(--sky)" }}>mobile/ios/OPEN-VERSE.xcodeproj</code> with your personal Apple ID.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
