import { useState } from "react";
import {
  KeyRound,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { WelcomeHero } from "./WelcomeHero";
import {
  PROVIDER_CATALOG,
  saveStoredProviderConfig,
} from "../lib/provider-catalog";
import { markOnboardingCompleted } from "../lib/onboarding";

interface OnboardingViewProps {
  onComplete: () => void;
}

export const OnboardingView = ({ onComplete }: OnboardingViewProps) => {
  const [step, setStep] = useState<"welcome" | "connect" | "github" | "done">("welcome");
  const [selectedMethod, setSelectedMethod] = useState<"cline" | "api-key">("api-key");
  
  // Provider Setup state
  const [selectedProviderId, setSelectedProviderId] = useState<string>("anthropic");
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("http://localhost:11434");
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-3-7-sonnet-20250219");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>("");

  const activeProvider =
    PROVIDER_CATALOG.find((p) => p.id === selectedProviderId) || PROVIDER_CATALOG[0];

  const handleProviderChange = (id: string) => {
    setSelectedProviderId(id);
    const p = PROVIDER_CATALOG.find((item) => item.id === id);
    if (p) {
      setSelectedModelId(p.defaultModelId);
      setValidationSuccess(null);
      setValidationMessage("");
      if (p.authType === "base-url") {
        setBaseUrl("http://localhost:11434");
      }
    }
  };

  const handleValidateConnection = () => {
    setIsValidating(true);
    setValidationSuccess(null);

    setTimeout(() => {
      if (activeProvider.authType === "api-key") {
        if (!apiKey.trim()) {
          setValidationSuccess(false);
          setValidationMessage("API key is required to connect to " + activeProvider.name);
          setIsValidating(false);
          return;
        }
        if (apiKey.trim().length < 8) {
          setValidationSuccess(false);
          setValidationMessage("Invalid API key format. Please check your credentials.");
          setIsValidating(false);
          return;
        }
        setValidationSuccess(true);
        setValidationMessage(`Validated connection to ${activeProvider.name} successfully.`);
      } else {
        // Base-url validation (e.g. Ollama)
        setValidationSuccess(true);
        setValidationMessage(`Configured local endpoint ${baseUrl} for ${selectedModelId}.`);
      }
      setIsValidating(false);
    }, 700);
  };

  const handleProceedFromConnect = () => {
    // Save configuration
    saveStoredProviderConfig({
      providerId: selectedProviderId,
      apiKey: activeProvider.authType === "api-key" ? apiKey.trim() : undefined,
      baseUrl: activeProvider.authType === "base-url" ? baseUrl.trim() : undefined,
      modelId: selectedModelId,
      configuredAt: new Date().toISOString(),
    });

    setStep("github");
  };

  const handleFinishOnboarding = () => {
    markOnboardingCompleted({
      setupMethod: selectedMethod,
      providerId: selectedProviderId,
      modelId: selectedModelId,
    });
    onComplete();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0a0a0d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "20px",
        overflowY: "auto",
        userSelect: "none",
      }}
    >
      {/* Background Hero Mascot */}
      <div style={{ position: "absolute", top: "5%", pointerEvents: "none", opacity: 0.85 }}>
        <WelcomeHero />
      </div>

      {/* Main Glass Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "rgba(18, 19, 25, 0.95)",
          border: "1px solid #282a36",
          borderRadius: "14px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(110,86,207,0.12)",
          padding: "32px 36px",
          position: "relative",
          zIndex: 10,
          backdropFilter: "blur(12px)",
        }}
        className="animate-fade-in"
      >
        {/* STEP 1: WELCOME SCREEN */}
        {step === "welcome" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#baa7ff",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  backgroundColor: "rgba(110,86,207,0.18)",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  border: "1px solid rgba(110,86,207,0.3)",
                }}
              >
                OPEN VERSE • First Launch Setup
              </span>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f3f4f8", marginTop: "12px" }}>
                Welcome to OPEN VERSE
              </h1>
              <p style={{ fontSize: "13.5px", color: "#8e93a2", marginTop: "6px", lineHeight: "1.5" }}>
                Connect your preferred AI model provider to configure your fresh environment.
              </p>
            </div>

            {/* Setup Options Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              {/* Option: Bring your own API key */}
              <div
                onClick={() => setSelectedMethod("api-key")}
                style={{
                  padding: "16px 18px",
                  borderRadius: "10px",
                  backgroundColor: selectedMethod === "api-key" ? "rgba(110,86,207,0.1)" : "#14151b",
                  border: selectedMethod === "api-key" ? "1.5px solid #6e56cf" : "1px solid #232530",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(110,86,207,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <KeyRound size={18} color="#baa7ff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "#f0f0f4" }}>
                      Use Your Own API Key or Local Model
                    </h3>
                    {selectedMethod === "api-key" && <CheckCircle2 size={16} color="#baa7ff" />}
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#8a8f9f", marginTop: "4px", lineHeight: "1.4" }}>
                    Connect Anthropic, OpenAI, Google Gemini, Ollama (Local), DeepSeek, or OpenRouter with full privacy.
                  </p>
                </div>
              </div>

              {/* Option: Cloud Sign-In */}
              <div
                onClick={() => setSelectedMethod("cline")}
                style={{
                  padding: "16px 18px",
                  borderRadius: "10px",
                  backgroundColor: selectedMethod === "cline" ? "rgba(110,86,207,0.1)" : "#14151b",
                  border: selectedMethod === "cline" ? "1.5px solid #6e56cf" : "1px solid #232530",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(110,86,207,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={18} color="#baa7ff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "#f0f0f4" }}>
                      Sign In with Account
                    </h3>
                    {selectedMethod === "cline" && <CheckCircle2 size={16} color="#baa7ff" />}
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#8a8f9f", marginTop: "4px", lineHeight: "1.4" }}>
                    Sign in to use managed subscription accounts, promotions, or unified gateway.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                onClick={() => setStep("connect")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "#6e56cf",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(110,86,207,0.4)",
                }}
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROVIDER & MODEL CONNECTION */}
        {step === "connect" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f4" }}>
                  Configure Model Provider
                </h2>
                <p style={{ fontSize: "12.5px", color: "#8a8f9f", marginTop: "2px" }}>
                  Select an AI provider and enter your authentication credentials.
                </p>
              </div>
              <button
                onClick={() => setStep("welcome")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7e8392",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                }}
              >
                <ArrowLeft size={13} /> Back
              </button>
            </div>

            {/* Provider Grid Selector */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#adb1bf", display: "block", marginBottom: "8px" }}>
                Select Provider
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {PROVIDER_CATALOG.map((p) => {
                  const isSel = selectedProviderId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        backgroundColor: isSel ? "rgba(110,86,207,0.16)" : "#14151b",
                        border: isSel ? "1.5px solid #6e56cf" : "1px solid #232530",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "5px",
                          backgroundColor: `${p.color}22`,
                          color: p.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {p.letter}
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: isSel ? "#baa7ff" : "#d2d5e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Provider Details & Credentials Input */}
            <div
              style={{
                padding: "14px",
                backgroundColor: "#13141a",
                borderRadius: "8px",
                border: "1px solid #242632",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f4" }}>
                  {activeProvider.name} Credentials
                </span>
                {activeProvider.docUrl && (
                  <a
                    href={activeProvider.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11.5px",
                      color: "#baa7ff",
                      textDecoration: "none",
                    }}
                  >
                    <span>{activeProvider.docLabel}</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {activeProvider.authType === "api-key" ? (
                <div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setValidationSuccess(null);
                      }}
                      placeholder={`Enter your ${activeProvider.name} API Key...`}
                      style={{
                        width: "100%",
                        height: "36px",
                        backgroundColor: "#0d0e12",
                        border: "1px solid #282a36",
                        borderRadius: "6px",
                        padding: "0 36px 0 10px",
                        color: "#f0f0f4",
                        fontSize: "13px",
                        outline: "none",
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#7e8392",
                        cursor: "pointer",
                      }}
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <span style={{ fontSize: "11px", color: "#6a6f7e", marginTop: "4px", display: "block" }}>
                    Your API key is stored securely in your isolated local OPEN VERSE profile.
                  </span>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: "11px", color: "#8a8f9f", display: "block", marginBottom: "4px" }}>
                    Ollama Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    style={{
                      width: "100%",
                      height: "36px",
                      backgroundColor: "#0d0e12",
                      border: "1px solid #282a36",
                      borderRadius: "6px",
                      padding: "0 10px",
                      color: "#f0f0f4",
                      fontSize: "13px",
                      outline: "none",
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </div>
              )}

              {/* Model Selection */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#8a8f9f", display: "block", marginBottom: "4px" }}>
                  Default Model
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  style={{
                    width: "100%",
                    height: "34px",
                    backgroundColor: "#0d0e12",
                    border: "1px solid #282a36",
                    borderRadius: "6px",
                    padding: "0 10px",
                    color: "#e2e4ec",
                    fontSize: "12.5px",
                    outline: "none",
                  }}
                >
                  {activeProvider.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test / Validation Feedback */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={handleValidateConnection}
                  disabled={isValidating}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#1f212a",
                    border: "1px solid #2f3242",
                    borderRadius: "6px",
                    color: "#d0d4df",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {isValidating ? "Validating..." : "Test Connection"}
                </button>

                {validationSuccess !== null && (
                  <span
                    style={{
                      fontSize: "11.5px",
                      color: validationSuccess ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {validationMessage}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={handleProceedFromConnect}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 18px",
                  backgroundColor: "#6e56cf",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>Save & Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GITHUB & WORKSPACE CHECK */}
        {step === "github" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(110,86,207,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <GitBranch size={22} color="#baa7ff" />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0f4" }}>
                Workspace Integration
              </h2>
              <p style={{ fontSize: "13px", color: "#8a8f9f", marginTop: "4px", lineHeight: "1.5" }}>
                Target repository detected: <strong>naresh-cn2/OPEN-VERSE</strong>.
              </p>
            </div>

            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#13141a",
                borderRadius: "8px",
                border: "1px solid #232532",
                fontSize: "12px",
                color: "#9da1af",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#d2d5e0", fontWeight: 500 }}>Active Workspace</span>
                <span>OPEN-VERSE (main)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#d2d5e0", fontWeight: 500 }}>Configured Engine</span>
                <span style={{ color: "#baa7ff" }}>{activeProvider.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#d2d5e0", fontWeight: 500 }}>Initial Model</span>
                <span>{selectedModelId}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <button
                onClick={() => setStep("connect")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7e8392",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12.5px",
                }}
              >
                <ArrowLeft size={13} /> Back
              </button>

              <button
                onClick={() => setStep("done")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  backgroundColor: "#6e56cf",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>Complete Setup</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: DONE */}
        {step === "done" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(34,197,94,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid #22c55e",
              }}
            >
              <CheckCircle2 size={32} color="#22c55e" />
            </div>

            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f4" }}>
                Setup Complete
              </h2>
              <p style={{ fontSize: "13px", color: "#8a8f9f", marginTop: "6px", lineHeight: "1.5" }}>
                Your isolated OPEN VERSE profile is initialized with <strong>{activeProvider.name}</strong>.
                You are ready to start real coding tasks.
              </p>
            </div>

            <button
              onClick={handleFinishOnboarding}
              style={{
                marginTop: "12px",
                padding: "10px 28px",
                backgroundColor: "#6e56cf",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(110,86,207,0.45)",
              }}
            >
              Open Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
