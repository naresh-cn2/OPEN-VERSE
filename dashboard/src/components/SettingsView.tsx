import type { FC } from "react";
import { X, RotateCcw, Trash2, Key, ShieldCheck } from "lucide-react";
import { getStoredProviderConfig, clearStoredProviderConfig } from "../lib/provider-catalog";
import { resetOnboarding } from "../lib/onboarding";
import { clearAllStoredSessions } from "../lib/session-store";

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToFirstRun: () => void;
}

export const SettingsView: FC<SettingsViewProps> = ({
  isOpen,
  onClose,
  onResetToFirstRun,
}) => {
  if (!isOpen) return null;

  const currentConfig = getStoredProviderConfig();

  const handleResetFirstRun = () => {
    if (confirm("Reset OPEN VERSE to fresh first-run state? You will see the genuine initial onboarding flow.")) {
      resetOnboarding();
      clearStoredProviderConfig();
      onResetToFirstRun();
      onClose();
    }
  };

  const handleClearSessions = () => {
    if (confirm("Clear all real session history from your OPEN VERSE profile?")) {
      clearAllStoredSessions();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 110,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "540px",
          backgroundColor: "#13141a",
          border: "1px solid #282a36",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          padding: "24px",
          color: "#ededf2",
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Settings & Configuration</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#7e8392", cursor: "pointer" }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Current Provider Section */}
        <div
          style={{
            padding: "14px",
            backgroundColor: "#181a22",
            borderRadius: "8px",
            border: "1px solid #242633",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Key size={15} color="#6e56cf" />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Active AI Provider</span>
          </div>
          <div style={{ fontSize: "12.5px", color: "#9da1b2", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div><strong>Provider:</strong> {currentConfig?.providerId || "Not Configured"}</div>
            <div><strong>Model:</strong> {currentConfig?.modelId || "None"}</div>
            <div><strong>Status:</strong> {currentConfig?.apiKey ? "API Key Enrolled" : currentConfig?.baseUrl ? "Local Endpoint" : "Unconfigured"}</div>
          </div>
        </div>

        {/* Profile & Storage Isolation Info */}
        <div
          style={{
            padding: "14px",
            backgroundColor: "#181a22",
            borderRadius: "8px",
            border: "1px solid #242633",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <ShieldCheck size={15} color="#22c55e" />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Profile Isolation</span>
          </div>
          <p style={{ fontSize: "12px", color: "#8a8f9f", lineHeight: "1.5" }}>
            OPEN VERSE runs on an isolated profile (`openverse.*`), completely separate from any external personal Cline accounts or global configurations.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleResetFirstRun}
            style={{
              padding: "10px 14px",
              backgroundColor: "#221d38",
              border: "1px solid #4a3c7b",
              borderRadius: "8px",
              color: "#baa7ff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <RotateCcw size={15} />
            <span>Reset to Fresh First-Launch (Replay Onboarding)</span>
          </button>

          <button
            onClick={handleClearSessions}
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "8px",
              color: "#f87171",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <Trash2 size={15} />
            <span>Clear Session History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
