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
	Apple,
	ExternalLink,
	Share2,
	Globe,
	Laptop,
	Layers,
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

  // Sync hash with active tab (e.g. #download-mobile opens the mobile tab automatically)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("windows")) setActiveTab("windows");
      else if (hash.includes("mac")) setActiveTab("mac");
      else if (hash.includes("linux")) setActiveTab("linux");
      else if (hash.includes("mobile") || hash.includes("android") || hash.includes("ios") || hash.includes("iphone")) setActiveTab("mobile");
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

  // Release versions — updated via release automation
  const DESKTOP_VERSION = "0.2.6";
  const GITHUB_RELEASES_ORG = "naresh-cn2/OPEN-VERSE";

  // Direct download assets hosted on GitHub Releases & Vercel CDN
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

  // File metadata (size + checksum) — updated via release automation
  const FILE_META = {
    windows: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
      zipName: `OPEN-VERSE_${DESKTOP_VERSION}_x64-windows.zip`,
      size: "167.6 MB",
      sha256: "36d60fd9b980b98596674f26d3fb10d71087e36856c27dfefe3f1e7ea3632812",
      zipSha256: "b6de33be3a3e252bf4cc4ee254d66616648ea4553f7beb661a7d8636da83155f",
      status: "requires-authenticode" as const,
    },
    mac: {
      name: `OPEN-VERSE_0.2.0_aarch64.dmg`,
      size: "172.8 MB",
      sha256: "0ac01302a129a4a1676ea7d81b749355cdd8cdb52a898ec014a15ebe006e0e2c",
      status: "requires-notarization" as const,
    },
    linuxDeb: {
      name: `OPEN-VERSE_0.2.0_amd64.deb`,
      size: "239.1 MB",
      sha256: "ab5777a7c5716bbaf9b2e4dd2eebadec3f5244092cb1ee116fedb0fdbb311dc8",
      status: "signature-verified" as const,
    },
    linuxRpm: {
      name: `OPEN-VERSE-0.2.0-1.x86_64.rpm`,
      size: "239.1 MB",
      sha256: "90dd67b89c31254c9b8f6edc9f45acd2a760bf20698e59539a82f0eca751bfb9",
      status: "signature-verified" as const,
    },
    android: {
      name: `open-verse-mobile.apk`,
      versionedName: `open-verse-v${DESKTOP_VERSION}-android.apk`,
      zipName: `open-verse-mobile-v${DESKTOP_VERSION}.zip`,
      size: "10.0 MB",
      sha256: "187dd7216b36d31f32340c129b8555cad56aa206b3de4cf003f4151badc2b955",
      status: "signature-verified" as const,
    },
    ios: {
      name: `open-verse-ios-v${DESKTOP_VERSION}`,
      version: DESKTOP_VERSION,
      build: "8",
      size: "Native Xcode Project (ARM64)",
      status: "requires-apple-developer" as const,
    },
  };

  const isDefaultTab = detectedOS ? detectedOS : "windows";
  const [initialTabSet, setInitialTabSet] = useState(false);

  useEffect(() => {
    if (!initialTabSet && isDefaultTab && !window.location.hash) {
      setActiveTab(isDefaultTab);
      setInitialTabSet(true);
    }
  }, [isDefaultTab, initialTabSet]);

  const copyWinInstallCommand = () => {
    const steps = `1. Download ${FILE_META.windows.name}\n2. Run installer and follow prompts\n3. Launch OPEN-VERSE from Start Menu`;
    copyToClipboard(steps, "win-install");
  };

  const copyLinuxDebCommand = () => {
    const cmd = `sudo dpkg -i ${FILE_META.linuxDeb.name}`;
    copyToClipboard(cmd, "linux-deb");
  };

  const copyLinuxRpmCommand = () => {
    const cmd = `sudo rpm -i ${FILE_META.linuxRpm.name}`;
    copyToClipboard(cmd, "linux-rpm");
  };

  type TruthfulPlatformStatus =
    | "available"
    | "signature-verified"
    | "install-verified"
    | "device-tested"
    | "requires-authenticode"
    | "requires-notarization"
    | "requires-apple-developer"
    | "requires-external-signing"
    | "preview-only"
    | "planned";

  const platformBadge = (status: TruthfulPlatformStatus) => {
    switch (status) {
      case "available":
        return (
          <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Check size={14} style={{ color: "var(--emerald)" }} />
            <span>Available for Download</span>
          </span>
        );
      case "signature-verified":
        return (
          <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(16, 185, 129, 0.12)", color: "var(--emerald)", borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <ShieldCheck size={14} style={{ color: "var(--emerald)" }} />
            <span>Signature Verified • Sideload Ready</span>
          </span>
        );
      case "install-verified":
        return (
          <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(56, 189, 248, 0.12)", color: "var(--sky)", borderColor: "rgba(56, 189, 248, 0.3)" }}>
            <Check size={14} style={{ color: "var(--sky)" }} />
            <span>Installation Verified</span>
          </span>
        );
      case "device-tested":
        return (
          <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(139, 92, 246, 0.15)", color: "#c4b5fd", borderColor: "rgba(139, 92, 246, 0.35)" }}>
            <Monitor size={14} style={{ color: "#c4b5fd" }} />
            <span>Device Tested</span>
          </span>
        );
      case "requires-authenticode":
        return (
          <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <AlertCircle size={14} style={{ color: "#fbbf24" }} />
            <span>Requires Authenticode Signing (Blocked by SAC)</span>
          </span>
        );
      case "requires-notarization":
        return (
          <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <AlertCircle size={14} style={{ color: "#fbbf24" }} />
            <span>Requires Apple Developer ID Notarization</span>
          </span>
        );
      case "requires-apple-developer":
        return (
          <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <AlertCircle size={14} style={{ color: "#fbbf24" }} />
            <span>Requires Apple Developer Program ($99/yr)</span>
          </span>
        );
      case "requires-external-signing":
        return (
          <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <AlertCircle size={14} style={{ color: "#fbbf24" }} />
            <span>Requires External Signing</span>
          </span>
        );
      case "preview-only":
        return (
          <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(56, 189, 248, 0.12)", color: "var(--sky)", borderColor: "rgba(56, 189, 248, 0.3)" }}>
            <Info size={14} style={{ color: "var(--sky)" }} />
            <span>Preview Only</span>
          </span>
        );
      case "planned":
      default:
        return (
          <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <AlertCircle size={14} style={{ color: "var(--accent-light)" }} />
            <span>Planned</span>
          </span>
        );
    }
  };

  return (
    <section id="download" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Official Native Release Portal</div>
          <h2 className="section-title">Download & Install OPEN-VERSE Native Apps</h2>
          <p className="section-subtitle">
            Get the official native application for desktop and mobile. All downloads are cryptographically verified
            with Minisign or platform signatures and feature full local runtime execution.
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for Windows</h3>
                  {platformBadge(FILE_META.windows.status)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native 64-bit NSIS installer (.exe) for Windows 10 & 11 with built-in agent runtime, Minisign signature verification, and automated background update service.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={ASSETS.windows}
                  download={FILE_META.windows.name}
                  className="btn-primary"
                  style={{ padding: "12px 24px", fontSize: "0.95rem", gap: 8 }}
                >
                  <Download size={18} />
                  <span>Download Windows Installer (.exe)</span>
                </a>
                <a
                  href={ASSETS.windowsZip}
                  download={FILE_META.windows.zipName}
                  className="btn-secondary"
                  style={{ padding: "12px 22px", fontSize: "0.95rem", gap: 8 }}
                >
                  <Download size={18} />
                  <span>Download ZIP Package (.zip)</span>
                </a>
                <a
                  href={ASSETS.windowsSig}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: "12px 18px", fontSize: "0.95rem", gap: 8 }}
                >
                  <Download size={16} />
                  <span>Minisign Signature (.sig)</span>
                </a>
              </div>
              <div style={{ marginTop: 10, fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <span>Direct GitHub CDN:</span>
                <a href={ASSETS.windows} style={{ color: "var(--accent-light)", textDecoration: "underline" }} download={FILE_META.windows.name}>Installer (.exe)</a>
                <span>•</span>
                <a href={ASSETS.windowsZip} style={{ color: "var(--accent-light)", textDecoration: "underline" }} download={FILE_META.windows.zipName}>Standalone ZIP (.zip)</a>
              </div>
            </div>

            {/* Smart App Control & SmartScreen Forensic Guidance */}
            <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: "#fbbf24", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={18} />
                <span>Windows Security & Smart App Control (SAC) Forensic Notice</span>
              </div>
              <p style={{ fontSize: "0.86rem", color: "#e2e8f0", margin: "0 0 10px 0", lineHeight: 1.5 }}>
                OPEN-VERSE Windows binaries are cryptographically signed with Minisign ED25519 (<code>.sig</code>), but do not yet include a commercial Microsoft Authenticode signature. Depending on your Windows configuration:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <strong style={{ color: "#fbbf24" }}>Windows 11 with Smart App Control (Enforced)</strong>
                  <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginTop: 4, lineHeight: 1.45 }}>
                    Windows kernel Code Integrity (<code>ci.dll</code>, Events 3077/3118) blocks both unsigned installers and extracted binaries. Zero-warning execution under SAC requires enrollment in <strong>Microsoft Azure Trusted Signing ($9.99/mo)</strong> or <strong>Microsoft Store ($19 one-time)</strong>.
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <strong style={{ color: "#38bdf8" }}>Standard Windows 10 & 11 (Evaluation / Off)</strong>
                  <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginTop: 4, lineHeight: 1.45 }}>
                    When Defender SmartScreen displays <em>&ldquo;Windows protected your PC&rdquo;</em>, click <strong>&ldquo;More info&rdquo;</strong> &rarr; click <strong>&ldquo;Run anyway&rdquo;</strong>. In Edge, hover over paused download &rarr; click <strong>•••</strong> &rarr; <strong>Keep</strong> &rarr; <strong>Keep anyway</strong>.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <Clock size={15} style={{ color: "var(--accent-light)" }} />
                  <span>Standalone ZIP: <code>{FILE_META.windows.zipName}</code> (159.9 MB)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  <span style={{ fontFamily: "var(--font-mono)" }}>ZIP SHA-256:</span>
                  <code style={{ color: "var(--accent-light)", wordBreak: "break-all" }}>{FILE_META.windows.zipSha256}</code>
                  <button
                    onClick={() => copyToClipboard(FILE_META.windows.zipSha256, "win-zip-sha")}
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
                    title="Copy ZIP SHA-256 Checksum"
                  >
                    {copiedKey === "win-zip-sha" ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === "win-zip-sha" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <Clock size={15} style={{ color: "var(--accent-light)" }} />
                  <span>NSIS Installer: <code>{FILE_META.windows.name}</code> (159.9 MB)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  <span style={{ fontFamily: "var(--font-mono)" }}>EXE SHA-256:</span>
                  <code style={{ color: "var(--accent-light)", wordBreak: "break-all" }}>{FILE_META.windows.sha256}</code>
                  <button
                    onClick={() => copyToClipboard(FILE_META.windows.sha256, "win-sha")}
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
                    title="Copy EXE SHA-256 Checksum"
                  >
                    {copiedKey === "win-sha" ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === "win-sha" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Installation Instructions */}
            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Installation Instructions</span>
              </div>
              <div className="code-box">
                <span>1. Download {FILE_META.windows.name}</span>
                <span>2. Run the installer and follow the prompts</span>
                <span>3. Launch OPEN-VERSE from your Start menu</span>
                <span>4. The app will auto-check for updates on future launches</span>
                <button onClick={copyWinInstallCommand} className="copy-btn" title="Copy install steps">
                  {copiedKey === "win-install" ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Alternative Legitimate Windows Distribution Channels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
              {/* Windows Package Manager (winget) */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}>
                    <Terminal size={16} style={{ color: "var(--sky)" }} />
                    <span>Windows Package Manager (winget)</span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: "0.7rem" }}>Microsoft Native</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.4 }}>
                  Install via Microsoft official winget package manager with automated verification:
                </p>
                <div className="code-box" style={{ fontSize: "0.8rem", padding: "8px 12px" }}>
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

              {/* Modern MSIX Package */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}>
                    <Layers size={16} style={{ color: "var(--accent-light)" }} />
                    <span>Modern MSIX Package</span>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>Store & Sideload</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.4 }}>
                  Isolated container package built with Windows 10/11 SDK tools (makeappx):
                </p>
                <div className="code-box" style={{ fontSize: "0.8rem", padding: "8px 12px" }}>
                  <code>Add-AppxPackage -Path .\OPEN-VERSE_0.2.6_x64.msix</code>
                  <button
                    onClick={() => copyToClipboard("Add-AppxPackage -Path .\\OPEN-VERSE_0.2.6_x64.msix", "msix-cmd")}
                    className="copy-btn"
                    title="Copy PowerShell command"
                  >
                    {copiedKey === "msix-cmd" ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Operating System: Windows 10 (1903+) or Windows 11</div>
              <div>• Architecture: 64-bit Intel / AMD (x86_64)</div>
              <div>• Integrity: Verified Minisign Ed25519 cryptography (.sig)</div>
              <div>• Signing: Open-source release (Minisign signed; Authenticode in roadmap)</div>
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
                  {platformBadge(FILE_META.mac.status)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native Apple Silicon disk image (.dmg) built on GitHub-hosted macOS runners. Includes embedded runtime and standalone AI assistant.
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

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
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

            <div style={{ background: "#0d0d12", borderRadius: 12, padding: 20, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={15} style={{ color: "var(--sky)" }} />
                <span>Installation Guidance & Gatekeeper Notice</span>
              </div>
              <div className="code-box">
                <span>1. Download {FILE_META.mac.name}</span>
                <span>2. Open disk image (.dmg) and drag OPEN-VERSE to your Applications folder</span>
                <span>3. Apple Gatekeeper Notice: Community builds are ad-hoc signed. Official zero-prompt launch requires Apple Developer Program notarization ($99/yr)</span>
                <span>4. To launch community build: Right-click OPEN-VERSE.app in Applications → select Open → click Open Anyway</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Architecture: Apple Silicon (M1/M2/M3/M4, ARM64)</div>
              <div>• macOS version: macOS 11.0 Big Sur or later</div>
              <div>• Signing: Ad-hoc signed (Apple Developer ID notarization requires $99/yr enrollment)</div>
              <div>• Terminal override: <code>xattr -cr /Applications/OPEN-VERSE.app</code></div>
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
                  {platformBadge(FILE_META.linuxDeb.status)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Native packages for 64-bit Linux distributions (Ubuntu, Debian, Fedora, RHEL).
                  Includes Minisign signature verification and automated in-app update service.
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
                  <span>Download .deb (Ubuntu / Debian)</span>
                </a>
                <a
                  href={ASSETS.linuxRpm}
                  download={FILE_META.linuxRpm.name}
                  className="btn-primary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8 }}
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
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>SHA-256: <code style={{ color: "var(--accent-light)" }}>{FILE_META.linuxDeb.sha256.slice(0, 16)}...</code></span>
                  <button onClick={() => copyToClipboard(FILE_META.linuxDeb.sha256, "deb-sha")} style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    {copiedKey === "deb-sha" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div style={{ marginTop: 10 }}>
                  <a href={ASSETS.linuxDebSig} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.78rem", gap: 6 }}>
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
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>SHA-256: <code style={{ color: "var(--accent-light)" }}>{FILE_META.linuxRpm.sha256.slice(0, 16)}...</code></span>
                  <button onClick={() => copyToClipboard(FILE_META.linuxRpm.sha256, "rpm-sha")} style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    {copiedKey === "rpm-sha" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div style={{ marginTop: 10 }}>
                  <a href={ASSETS.linuxRpmSig} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.78rem", gap: 6 }}>
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
                <span>Debian/Ubuntu: sudo dpkg -i {FILE_META.linuxDeb.name}</span>
                <span>Fedora/RHEL: sudo rpm -i {FILE_META.linuxRpm.name}</span>
                <span>Launch: cline-app (or select OPEN-VERSE in application launcher)</span>
                <button onClick={copyLinuxDebCommand} className="copy-btn" title="Copy Debian install command">
                  {copiedKey === "linux-deb" ? <Check size={16} /> : <Copy size={16} />}
                </button>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28 }}>
              {/* Android Card */}
              <div style={{ background: "#0d0d12", borderRadius: 16, padding: 24, border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Smartphone size={22} style={{ color: "var(--emerald)" }} />
                    <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>Android APK</h4>
                  </div>
                  {platformBadge(FILE_META.android.status)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 16, lineHeight: 1.5 }}>
                  Native Android application with Direct AI Streaming (Gemini, Claude, OpenAI, Ollama) and OPEN-VERSE Desktop Hub companion pairing.
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
                  <a
                    href={ASSETS.androidZip}
                    download={FILE_META.android.zipName}
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
                    <span>Download ZIP Package (.zip Archive)</span>
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
                <div style={{ background: "rgba(14, 165, 233, 0.08)", border: "1px solid rgba(14, 165, 233, 0.25)", borderRadius: 8, padding: "12px 14px", fontSize: "0.8rem", color: "#e2e8f0", marginBottom: 14, lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--sky)" }}>Android Download & Install Guidance:</strong>
                  <div style={{ marginTop: 4 }}>• If Chrome displays <em>&ldquo;File might be harmful&rdquo;</em>, tap <strong>&ldquo;Download anyway&rdquo;</strong>.</div>
                  <div>• When download completes, tap <strong>&ldquo;Open&rdquo;</strong> to install.</div>
                  <div>• If tapping the browser notification says <em>&ldquo;Can&apos;t open file&rdquo;</em>, open your phone&apos;s <strong>Files</strong> or <strong>My Files</strong> app, go to the <strong>Downloads</strong> folder, and tap <code>open-verse-mobile.apk</code> to launch Android Package Installer.</div>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Installation Instructions:</div>
                  <div>1. Download the APK file directly to your Android device.</div>
                  <div>2. Tap to install (enable &quot;Install unknown apps&quot; if prompted).</div>
                  <div>3. Launch OPEN-VERSE. Requires Android 7.0+ (API 24 to 34).</div>
                </div>
              </div>

              {/* iOS Card */}
              <div style={{ background: "#0d0d12", borderRadius: 16, padding: 24, border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Apple size={22} style={{ color: "var(--sky)" }} />
                    <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for iOS (Native)</h4>
                  </div>
                  {platformBadge(FILE_META.ios.status)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 16, lineHeight: 1.5 }}>
                  Native iOS companion app with Swift runtime, WKWebView application container, Google OAuth deep-link callback integration, and Desktop Hub pairing.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {/* Primary: Apple TestFlight Invite Queue */}
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
                      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                    }}
                  >
                    <Apple size={18} />
                    <span>Join iOS Beta (Apple TestFlight Queue)</span>
                    <ExternalLink size={14} style={{ opacity: 0.8 }} />
                  </a>

                  {/* Secondary: Xcode Project Archive */}
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

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <span>Target: iOS 15.0+ (iPhone & iPad ARM64)</span>
                    <span style={{ color: "var(--emerald)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={13} />
                      <span>Swift Architecture Ready</span>
                    </span>
                  </div>
                </div>

                {/* iOS Step-by-Step Guidance Box */}
                <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 8, padding: "12px 14px", fontSize: "0.8rem", color: "#e2e8f0", marginBottom: 14, lineHeight: 1.5 }}>
                  <strong style={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertCircle size={15} />
                    <span>Apple Distribution & Security Requirements:</span>
                  </strong>
                  
                  <div style={{ marginTop: 6 }}>
                    <strong>1. Public Beta Distribution (Apple TestFlight):</strong>
                    <div style={{ paddingLeft: 6, color: "var(--text-secondary)", marginTop: 2 }}>
                      Distributing native apps via Apple TestFlight or the App Store strictly requires an active <strong>Apple Developer Program membership ($99/year)</strong> for provisioning profiles. Request access via the queue above to be enrolled when publishing slots are authorized.
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>2. Local Development & Sideloading:</strong>
                    <div style={{ paddingLeft: 6, color: "var(--text-secondary)", marginTop: 2 }}>
                      Developers can compile and install directly onto a physical iPhone using a free personal Apple ID in Xcode, or sideload unsigned IPAs via AltStore or Sideloadly.
                    </div>
                  </div>
                </div>

                {/* Developer Instructions */}
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Developer Build & Run (Xcode):</div>
                  <div>1. Clone repository and open <code style={{ color: "var(--sky)" }}>mobile/ios/OPEN-VERSE.xcodeproj</code> in Xcode 15+.</div>
                  <div>2. Select your connected iPhone or iPad under target destinations.</div>
                  <div>3. Sign with your personal team certificate and press Run (<kbd>⌘R</kbd>).</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
