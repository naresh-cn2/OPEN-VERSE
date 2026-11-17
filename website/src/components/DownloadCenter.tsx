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
} from "lucide-react";

export const DownloadCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"windows" | "mac" | "linux" | "mobile">("windows");
  const [detectedOS, setDetectedOS] = useState<"windows" | "mac" | "linux" | "mobile" | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showIosSafariGuide, setShowIosSafariGuide] = useState(false);

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
    iosTestFlight: "https://testflight.apple.com/join/openverse-preview",
    iosZip: `https://github.com/${GITHUB_RELEASES_ORG}/archive/refs/heads/main.zip`,
  };

  // File metadata (size + checksum) — updated via release automation
  const FILE_META = {
    windows: {
      name: `OPEN-VERSE_${DESKTOP_VERSION}_x64-setup.exe`,
      zipName: `OPEN-VERSE_${DESKTOP_VERSION}_x64-windows.zip`,
      size: "167.6 MB",
      sha256: "7d32a4ba94e3b25152356f46e34a439839e6055cc8b4130d0a5fe4065a0e53bc",
      available: true,
    },
    mac: {
      name: `OPEN-VERSE_0.2.0_aarch64.dmg`,
      size: "165 MB",
      sha256: "0ac01302a129a4a1676ea7d81b749355cdd8cdb52a898ec014a15ebe006e0e2c",
      available: true,
    },
    linuxDeb: {
      name: `OPEN-VERSE_0.2.0_amd64.deb`,
      size: "228 MB",
      sha256: "ab5777a7c5716bbaf9b2e4dd2eebadec3f5244092cb1ee116fedb0fdbb311dc8",
      available: true,
    },
    linuxRpm: {
      name: `OPEN-VERSE-0.2.0-1.x86_64.rpm`,
      size: "228 MB",
      sha256: "90dd67b89c31254c9b8f6edc9f45acd2a760bf20698e59539a82f0eca751bfb9",
      available: true,
    },
    android: {
      name: `open-verse-mobile.apk`,
      versionedName: `open-verse-v${DESKTOP_VERSION}-android.apk`,
      zipName: `open-verse-mobile-v${DESKTOP_VERSION}.zip`,
      size: "10.0 MB",
      sha256: "516b718af05ab51dcb13d49d1199e0b5183ee78b42d47a0cbec53aa6f0945fe2",
      available: true,
    },
    ios: {
      name: `open-verse-ios-v${DESKTOP_VERSION}`,
      version: DESKTOP_VERSION,
      build: "7",
      size: "TestFlight / PWA",
      testFlightUrl: "https://testflight.apple.com/join/openverse-preview",
      available: true,
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

  const copyMacGatekeeperCommand = () => {
    const cmd = "sudo xattr -cr /Applications/OPEN-VERSE.app";
    copyToClipboard(cmd, "mac-gatekeeper");
  };

  const copyLinuxDebCommand = () => {
    const cmd = `sudo dpkg -i ${FILE_META.linuxDeb.name}`;
    copyToClipboard(cmd, "linux-deb");
  };

  const copyLinuxRpmCommand = () => {
    const cmd = `sudo rpm -i ${FILE_META.linuxRpm.name}`;
    copyToClipboard(cmd, "linux-rpm");
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
            Get the official cross-platform application for desktop and mobile. All downloads are cryptographically verified
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
                  style={{ padding: "12px 24px", fontSize: "0.95rem", gap: 8 }}
                  download={FILE_META.windows.name}
                >
                  <Download size={18} />
                  <span>Download for Windows (.exe)</span>
                </a>
                <a
                  href={ASSETS.windowsZip}
                  className="btn-secondary"
                  style={{ padding: "12px 22px", fontSize: "0.95rem", gap: 8 }}
                  download={FILE_META.windows.zipName}
                >
                  <Download size={18} />
                  <span>Download ZIP (.zip)</span>
                </a>
              </div>
            </div>

            {/* SmartScreen & Browser Warning Clarification */}
            <div style={{ background: "rgba(14, 165, 233, 0.08)", border: "1px solid rgba(14, 165, 233, 0.25)", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: "0.84rem", color: "#e2e8f0", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, color: "var(--sky)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={16} />
                <span>Windows Defender SmartScreen & Chrome Note:</span>
              </div>
              <div>
                Because OPEN-VERSE is open-source and newly released, Windows SmartScreen or Chrome may prompt <em>&ldquo;Unrecognized app&rdquo;</em> or <em>&ldquo;File not commonly downloaded&rdquo;</em>.
              </div>
              <div style={{ marginTop: 6 }}>
                • <strong>In Chrome / Edge:</strong> In your browser downloads bar/tray, click <strong>&ldquo;Keep&rdquo; → &ldquo;Keep anyway&rdquo;</strong> to allow the download.
              </div>
              <div>
                • <strong>When Opening Installer:</strong> If Windows SmartScreen appears, click <strong>&ldquo;More info&rdquo;</strong> and then click <strong>&ldquo;Run anyway&rdquo;</strong>.
              </div>
              <div>
                • <strong>Alternative:</strong> Download the <strong>ZIP archive</strong> above, extract it, and run the installer directly.
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: "var(--accent-light)" }} />
                <span>Asset: <code>{FILE_META.windows.name}</code> (x86_64) • {FILE_META.windows.size}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span style={{ fontFamily: "var(--font-mono)" }}>SHA-256:</span>
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
                  title="Copy SHA-256 Checksum"
                >
                  {copiedKey === "win-sha" ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === "win-sha" ? "Copied" : "Copy"}</span>
                </button>
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
                <span>1. Download {FILE_META.windows.name}</span>
                <span>2. Run the installer and follow the prompts</span>
                <span>3. Launch OPEN-VERSE from your Start menu</span>
                <span>4. The app will auto-check for updates on future launches</span>
                <button onClick={copyWinInstallCommand} className="copy-btn" title="Copy install steps">
                  {copiedKey === "win-install" ? <Check size={16} /> : <Copy size={16} />}
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
                <span>Installation Instructions</span>
              </div>
              <div className="code-box">
                <span>1. Download {FILE_META.mac.name}</span>
                <span>2. Open the disk image and drag OPEN-VERSE to your Applications folder</span>
                <span>3. Ad-hoc build: If prompted by macOS Gatekeeper, run:</span>
                <span>   sudo xattr -cr /Applications/OPEN-VERSE.app</span>
                <span>4. Launch OPEN-VERSE</span>
                <button onClick={copyMacGatekeeperCommand} className="copy-btn" title="Copy Gatekeeper command">
                  {copiedKey === "mac-gatekeeper" ? <Check size={16} /> : <Copy size={16} />}
                </button>
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
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>SHA-256: <code style={{ color: "var(--accent-light)" }}>{FILE_META.linuxDeb.sha256.slice(0, 16)}...</code></span>
                  <button onClick={() => copyToClipboard(FILE_META.linuxDeb.sha256, "deb-sha")} style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    {copiedKey === "deb-sha" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
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
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>SHA-256: <code style={{ color: "var(--accent-light)" }}>{FILE_META.linuxRpm.sha256.slice(0, 16)}...</code></span>
                  <button onClick={() => copyToClipboard(FILE_META.linuxRpm.sha256, "rpm-sha")} style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    {copiedKey === "rpm-sha" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
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
                  {platformBadge(FILE_META.android.available)}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 16, lineHeight: 1.5 }}>
                  Native Android application with Direct AI Streaming (Gemini, Claude, OpenAI, Ollama) and OPEN-VERSE Desktop Hub companion pairing.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  <a
                    href={ASSETS.androidApk}
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
                    download={FILE_META.android.name}
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
                    <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>iOS / iPhone App</h4>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} style={{ color: "var(--emerald)" }} />
                    <span>Ready</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 16, lineHeight: 1.5 }}>
                  Native iOS companion with WKWebView container, deep-link Google OAuth callbacks, and Desktop Hub pairing.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {/* Primary: Apple TestFlight Link */}
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
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      borderRadius: 10,
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                    }}
                  >
                    <Apple size={18} />
                    <span>Join iOS Beta (Apple TestFlight)</span>
                    <ExternalLink size={14} style={{ opacity: 0.8 }} />
                  </a>

                  {/* Secondary: Instant Safari PWA Install */}
                  <button
                    onClick={() => setShowIosSafariGuide(!showIosSafariGuide)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      borderRadius: 8,
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Share2 size={16} style={{ color: "var(--accent-light)" }} />
                    <span>Install on iPhone (Safari Add to Home Screen)</span>
                  </button>

                  {/* Developer: Xcode Project Archive */}
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
                      padding: "9px 16px",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      borderRadius: 8,
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(255, 255, 255, 0.03)",
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                    }}
                  >
                    <Download size={14} />
                    <span>Download Xcode Project & Source (.zip)</span>
                  </a>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <span>Target: iOS 15.0+ (iPhone & iPad)</span>
                    <span style={{ color: "var(--emerald)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={13} />
                      <span>OAuth & Pairing Ready</span>
                    </span>
                  </div>
                </div>

                {/* iOS Step-by-Step Guidance Box */}
                <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: 8, padding: "12px 14px", fontSize: "0.8rem", color: "#e2e8f0", marginBottom: 14, lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--accent-light)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Info size={15} />
                    <span>How to Install on iPhone / iPad:</span>
                  </strong>
                  
                  <div style={{ marginTop: 6 }}>
                    <strong>1. Official Public Beta (Apple TestFlight):</strong>
                    <div style={{ paddingLeft: 6, color: "var(--text-secondary)", marginTop: 2 }}>
                      Tap <strong>&ldquo;Join iOS Beta (Apple TestFlight)&rdquo;</strong> above. If you don&apos;t have TestFlight yet, install it free from the App Store, then accept the invitation and tap <strong>Install</strong>.
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>2. Instant Web App (No App Store / No Xcode needed):</strong>
                    <div style={{ paddingLeft: 6, color: "var(--text-secondary)", marginTop: 2 }}>
                      In <strong>Safari</strong> on your iPhone, tap the <strong>Share</strong> button (box with arrow <span style={{ fontWeight: 700 }}>⎋</span>) at the bottom toolbar, scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>. OPEN-VERSE launches full-screen as a standalone native app!
                    </div>
                  </div>
                </div>

                {/* Developer Instructions */}
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Developer & Sideloading (Xcode / AltStore):</div>
                  <div>1. Open <code style={{ color: "var(--sky)" }}>mobile/ios/OPEN-VERSE.xcodeproj</code> in Xcode 15+.</div>
                  <div>2. Select an iPhone Simulator or connected iOS device and press Run (<kbd>⌘R</kbd>).</div>
                  <div>3. Or sideload unsigned IPA builds via AltStore, TrollStore, or Sideloadly.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
