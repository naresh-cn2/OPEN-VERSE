import React, { useState, useEffect } from "react";
import {
  Monitor,
  Smartphone,
  Terminal,
  Check,
  Download,
  ShieldCheck,
  Info,
  Apple,
  ExternalLink,
} from "lucide-react";

export const DownloadCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"windows" | "mac" | "linux" | "android">("windows");
  const [detectedOS, setDetectedOS] = useState<"windows" | "mac" | "linux" | "android" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("windows")) setActiveTab("windows");
      else if (hash.includes("mac")) setActiveTab("mac");
      else if (hash.includes("linux")) setActiveTab("linux");
      else if (hash.includes("android")) setActiveTab("android");
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) setDetectedOS("windows");
    else if (ua.includes("mac")) setDetectedOS("mac");
    else if (ua.includes("linux")) setDetectedOS("linux");
    else if (ua.includes("android")) setDetectedOS("android");
  }, []);

  const DESKTOP_VERSION = "3.0.0";
  const MOBILE_VERSION = "3.0.0";
  const GITHUB_RELEASES_ORG = "naresh-cn2/OPEN-VERSE";
  const RELEASE_TAG = "hermes-agent";

  const ASSETS = {
    windows: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/${RELEASE_TAG}/OPEN-VERSE-3.0.0-windows-setup.exe`,
    mac: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/${RELEASE_TAG}/OPEN-VERSE-3.0.0-macos.dmg`,
    linux: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/${RELEASE_TAG}/OPEN-VERSE-3.0.0-linux-amd64.deb`,
    android: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/${RELEASE_TAG}/OPEN-VERSE-${MOBILE_VERSION}.apk`,
    sourceZip: `https://github.com/${GITHUB_RELEASES_ORG}/releases/download/${RELEASE_TAG}/OPEN-VERSE-3.0.0-source.zip`,
  };

  const FILE_META = {
    windows: {
      name: `OPEN-VERSE-3.0.0-windows-setup.exe`,
      size: "~134 MB",
      typeLabel: "Installer (.exe)",
    },
    mac: {
      name: `OPEN-VERSE-3.0.0-macos.dmg`,
      size: "~224 MB",
      typeLabel: "Disk Image (.dmg)",
    },
    linux: {
      name: `OPEN-VERSE-3.0.0-linux-amd64.deb`,
      size: "~193 MB",
      typeLabel: "Package (.deb)",
    },
    android: {
      name: `OPEN-VERSE-${MOBILE_VERSION}.apk`,
      size: "~10 MB",
      typeLabel: "APK (.apk)",
    },
    sourceZip: {
      name: `OPEN-VERSE-3.0.0-source.zip`,
      size: "~85 MB",
      typeLabel: "Source Code (.zip)",
    },
  };

  return (
    <section id="download" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Official Native Release Portal</div>
          <h2 className="section-title">Download & Install OPEN-VERSE</h2>
          <p className="section-subtitle">
            Official native builds for Windows, macOS, and Linux. Hermes Agent full source running under OPEN-VERSE.
          </p>
        </div>

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
            onClick={() => setActiveTab("android")}
            className={`tab-btn ${activeTab === "android" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Smartphone size={16} />
            <span>Android</span>
            {detectedOS === "android" && <Check size={13} style={{ color: "var(--emerald)" }} />}
          </button>
        </div>

        {/* Tab 1: Windows */}
        {activeTab === "windows" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-windows">
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
                    <span>Native Installer • MIT Licensed</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 640 }}>
                  Install OPEN-VERSE on Windows 10 &amp; 11 with the native installer.
                </p>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>Latest:</span>
                <span className="badge badge-green" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                  v{DESKTOP_VERSION} Stable
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
                    <Download size={18} style={{ color: "#4fc3f7" }} />
                    <span>{FILE_META.windows.typeLabel}</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {FILE_META.windows.size}
                  </span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Download and run the installer. OPEN-VERSE will appear in your Start Menu and launch with its graphical interface.
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
                  <span>Download OPEN-VERSE for Windows (NSIS)</span>
                </a>
                <a
                  href={`https://github.com/${GITHUB_RELEASES_ORG}/releases/download/${RELEASE_TAG}/OPEN-VERSE-3.0.0-windows.msi`}
                  download="OPEN-VERSE-3.0.0-windows.msi"
                  className="btn-secondary"
                  style={{ padding: "12px 20px", fontSize: "0.95rem", justifyContent: "center", width: "100%" }}
                >
                  <Download size={17} />
                  <span>Download OPEN-VERSE for Windows (MSI)</span>
                </a>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "16px 20px",
                marginBottom: 24,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <Info size={18} style={{ color: "var(--sky)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  <strong style={{ color: "#ffffff" }}>Installation &amp; SmartScreen Notice:</strong> As an open-source release establishing download reputation, Microsoft Edge or Windows Defender SmartScreen displays <em>"isn't commonly downloaded"</em> until community download reputation builds or an Extended Validation (EV) certificate is attached. Verify the authentic SHA-256 hash below before running.
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", wordBreak: "break-all", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: 6 }}>
                SHA-256: cf3950de41fd3d5a3f6ff19dd412209a294c6fe3658249eab70c04de89fa4934
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• OS: Windows 10 and 11</div>
              <div>• Architecture: 64-bit (x86_64)</div>
              <div>• Installer: NSIS (SHA-256 verified)</div>
              <div>• License: Open Source (MIT)</div>
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
                    <ShieldCheck size={14} style={{ color: "#a78bfa" }} />
                    <span>Native Disk Image • MIT Licensed</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Install OPEN-VERSE on macOS with the native DMG. Runs on Apple Silicon (M1-M4) and Intel x86_64.
                </p>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>Latest:</span>
                <span className="badge badge-green" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                  v{DESKTOP_VERSION} Stable
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
                    <Download size={18} style={{ color: "#a855f7" }} />
                    <span>{FILE_META.mac.typeLabel}</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {FILE_META.mac.size}
                  </span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Open the DMG, drag OPEN-VERSE to Applications, and launch from Launchpad or Spotlight.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href={ASSETS.mac}
                  download={FILE_META.mac.name}
                  className="btn-primary"
                  style={{ padding: "12px 26px", fontSize: "0.95rem", gap: 8 }}
                >
                  <Download size={18} />
                  <span>Download OPEN-VERSE for macOS</span>
                </a>
              </div>
            </div>

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
                <strong style={{ color: "#ffffff" }}>Install:</strong> Open the .dmg, drag OPEN-VERSE to your Applications folder, then launch from Launchpad.{" "}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Architecture: Apple Silicon and Intel x86_64</div>
              <div>• OS: macOS 11.0+</div>
              <div>• Package: Native DMG disk image</div>
              <div>• License: Open Source (MIT)</div>
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
                    <span>Native Package • MIT Licensed</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  Install OPEN-VERSE on 64-bit Linux — Ubuntu, Debian, Fedora, RHEL, and derivatives.
                </p>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>Latest:</span>
                <span className="badge badge-green" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                  v{DESKTOP_VERSION} Stable
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
                    <Download size={18} style={{ color: "#f43f5e" }} />
                    <span>{FILE_META.linux.typeLabel}</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {FILE_META.linux.size}
                  </span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Install with your package manager. OPEN-VERSE integrates with your desktop environment and launches with its graphical interface.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href={ASSETS.linux}
                  download={FILE_META.linux.name}
                  className="btn-primary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8 }}
                >
                  <Download size={17} />
                  <span>Download OPEN-VERSE for Linux (x86_64)</span>
                </a>
                <a
                  href={`https://github.com/${GITHUB_RELEASES_ORG}/releases/download/${RELEASE_TAG}/OPEN-VERSE-3.0.0-linux-arm64.deb`}
                  download="OPEN-VERSE-3.0.0-linux-arm64.deb"
                  className="btn-secondary"
                  style={{ padding: "12px 22px", fontSize: "0.92rem", gap: 8 }}
                >
                  <Download size={17} />
                  <span>Download OPEN-VERSE for Linux (ARM64)</span>
                </a>
              </div>
            </div>

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
                <strong style={{ color: "#ffffff" }}>Install:</strong> Run <code style={{ color: "var(--accent-light)" }}>sudo dpkg -i OPEN-VERSE-*.deb</code> or open the .deb with your software center.{" "}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• Requirements: glibc 2.31+</div>
              <div>• Architecture: x86_64 and ARM64</div>
              <div>• Package: Debian (.deb) installer</div>
              <div>• License: Open Source (MIT)</div>
            </div>
          </div>
        )}

        {/* Tab 4: Android */}
        {activeTab === "android" && (
          <div className="glass-card" style={{ padding: 36, maxWidth: 960, margin: "0 auto" }} id="download-android">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE for Android</h3>
                  <span
                    className="badge badge-purple"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(59, 130, 246, 0.12)",
                      color: "#60a5fa",
                      borderColor: "rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <ShieldCheck size={14} style={{ color: "#60a5fa" }} />
                    <span>Native Android App • MIT Licensed</span>
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 620 }}>
                  OPEN-VERSE mobile companion for Android. Same AI assistant, conversation history, and account as desktop. Connects to your desktop OPEN-VERSE instance for remote workflows.
                </p>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>Latest:</span>
                <span className="badge badge-green" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                  v{MOBILE_VERSION} Stable
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
                    <Download size={18} style={{ color: "#3b82f6" }} />
                    <span>{FILE_META.android.typeLabel}</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {FILE_META.android.size}
                  </span>
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                  Install the APK on your Android device. Pair with desktop via QR code for end-to-end encrypted remote access to your coding workflows.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href={ASSETS.android}
                  download={FILE_META.android.name}
                  className="btn-primary"
                  style={{ padding: "12px 26px", fontSize: "0.95rem", gap: 8 }}
                >
                  <Download size={18} />
                  <span>Download OPEN-VERSE for Android</span>
                </a>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "16px 20px",
                marginBottom: 24,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <Info size={18} style={{ color: "var(--sky)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  <strong style={{ color: "#ffffff" }}>Install:</strong> Enable "Install from unknown sources" in Android settings, then open the downloaded .apk to install.{" "}
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", wordBreak: "break-all", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: 6 }}>
                SHA-256: 623410f27b0409f11fb3c4c73d34cc2efc2be1e6407c429920777bc550454960
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <div>• OS: Android 7.0+ (API 24+)</div>
              <div>• Architecture: ARM64</div>
              <div>• Connects to: Desktop OPEN-VERSE via E2EE</div>
              <div>• License: Open Source (MIT)</div>
            </div>
          </div>
        )}

        {/* Optional source download section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: 24,
            marginTop: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Download size={16} style={{ color: "#6b7280" }} />
            <span style={{ fontWeight: 600, color: "#94a3b8" }}>Developer Download — Source Code</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.86rem", marginBottom: 16, maxWidth: 700 }}>
            Want to build from source? Download the complete OPEN-VERSE source repository.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href={ASSETS.sourceZip}
              download={FILE_META.sourceZip.name}
              className="btn-secondary"
              style={{ padding: "10px 20px", fontSize: "0.9rem", gap: 8 }}
            >
              <Download size={16} />
              <span>Download Source ZIP</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
