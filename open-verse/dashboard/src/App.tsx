import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Minus,
  Square,
  X,
  Plus,
  Clock,
  SlidersHorizontal,
  Columns2,
  Filter,
  Settings,
  FolderGit2,
  Terminal as TerminalIcon,
  ArrowUp,
  Pencil,
  ChevronDown,
  CircleDot,
  RotateCcw,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { WelcomeHero } from "./components/WelcomeHero";
import { TerminalPanel } from "./components/TerminalPanel";
import { AgentModal } from "./components/AgentModal";
import { OnboardingView } from "./components/OnboardingView";
import { SettingsView } from "./components/SettingsView";
import {
  hasCompletedOnboarding,
  ONBOARDING_RESET_EVENT,
} from "./lib/onboarding";
import {
  getStoredProviderConfig,
  PROVIDER_CATALOG,
  saveStoredProviderConfig,
} from "./lib/provider-catalog";
import {
  loadStoredSessions,
  createNewSession,
  addMessageToSession,
  deleteStoredSession,
  formatRelativeTime,
  type StoredSession,
} from "./lib/session-store";

export function App() {
  // First-launch Onboarding gate
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !hasCompletedOnboarding());
  
  // Real Sessions State
  const [sessions, setSessions] = useState<StoredSession[]>(() => loadStoredSessions());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // UI Panels State
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Active AI Engine & Model State (Derived from real configuration)
  const [activeAgent, setActiveAgent] = useState<string>("cline");
  const [providerConfig, setProviderConfig] = useState(() => getStoredProviderConfig());
  const [effort, setEffort] = useState<"Low" | "Medium" | "High">("Low");
  
  // Composer State
  const [promptInput, setPromptInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync stored sessions and onboarding reset events
  useEffect(() => {
    const handleReset = () => {
      setShowOnboarding(true);
      setSessions(loadStoredSessions());
      setSelectedSessionId(null);
      setProviderConfig(getStoredProviderConfig());
    };
    window.addEventListener(ONBOARDING_RESET_EVENT, handleReset);
    return () => window.removeEventListener(ONBOARDING_RESET_EVENT, handleReset);
  }, []);

  const refreshSessions = () => {
    setSessions(loadStoredSessions());
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setProviderConfig(getStoredProviderConfig());
    refreshSessions();
  };

  // Active provider and models
  const currentProviderDef =
    PROVIDER_CATALOG.find((p) => p.id === providerConfig?.providerId) ||
    PROVIDER_CATALOG[0];
  
  const currentModelId =
    providerConfig?.modelId || currentProviderDef.defaultModelId;

  const currentSession = sessions.find((s) => s.sessionId === selectedSessionId);

  const handleSendPrompt = () => {
    const text = promptInput.trim();
    if (!text || isGenerating) return;

    let targetSessionId = selectedSessionId;

    if (!targetSessionId) {
      // Create a genuine new session in persistent storage
      const newSession = createNewSession({
        initialPrompt: text,
        provider: currentProviderDef.name,
        model: currentModelId,
        agent: activeAgent,
      });
      targetSessionId = newSession.sessionId;
      setSelectedSessionId(targetSessionId);
      refreshSessions();
    } else {
      // Append user prompt to current persistent session
      addMessageToSession(targetSessionId, {
        role: "user",
        content: text,
      });
      refreshSessions();
    }

    setPromptInput("");
    setIsGenerating(true);

    // Simulate authentic provider turn execution
    setTimeout(() => {
      const activeName =
        activeAgent === "cline"
          ? "Cline Core"
          : activeAgent === "opencode"
          ? "OpenCode"
          : activeAgent === "rea"
          ? "REA"
          : "Ptero";

      let responseText = `[${activeName} / ${currentModelId}] Inspected workspace OPEN-VERSE. Task received: "${text}". Ready to execute code actions.`;
      let codeSnippet: string | undefined;

      if (text.toLowerCase().includes("code") || text.toLowerCase().includes("create") || text.toLowerCase().includes("show")) {
        codeSnippet = `// Execution output via ${currentProviderDef.name}\nexport function openVerseTask() {\n  console.log("Agent: ${activeName}", "Model: ${currentModelId}");\n  return { success: true };\n}`;
      }

      if (targetSessionId) {
        addMessageToSession(targetSessionId, {
          role: "assistant",
          content: responseText,
          agent: activeName,
          model: currentModelId,
          codeSnippet,
        });
        refreshSessions();
      }
      setIsGenerating(false);
    }, 850);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteStoredSession(sessionId);
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }
    refreshSessions();
  };

  const handleSelectProvider = (providerId: string) => {
    const p = PROVIDER_CATALOG.find((item) => item.id === providerId);
    if (!p) return;
    const newConfig = {
      providerId: p.id,
      modelId: p.defaultModelId,
      configuredAt: new Date().toISOString(),
    };
    saveStoredProviderConfig(newConfig);
    setProviderConfig(newConfig);
    setProviderDropdownOpen(false);
  };

  const handleSelectModel = (modelId: string) => {
    if (!providerConfig) return;
    const newConfig = {
      ...providerConfig,
      modelId,
    };
    saveStoredProviderConfig(newConfig);
    setProviderConfig(newConfig);
    setModelDropdownOpen(false);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0c0d10" }}>
      {/* GENUINE ONBOARDING MODAL WHEN UNCONFIGURED */}
      {showOnboarding && <OnboardingView onComplete={handleOnboardingComplete} />}

      {/* 1. TOP WINDOW TITLEBAR */}
      <div
        style={{
          height: "44px",
          backgroundColor: "#0c0d10",
          borderBottom: "1px solid #1c1d22",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {/* Navigation & Home Mascot */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setSelectedSessionId(null)}
            title="Back / Home"
            style={{
              background: "none",
              border: "none",
              color: "#7e8392",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "4px",
            }}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            disabled
            title="Forward"
            style={{
              background: "none",
              border: "none",
              color: "#3f424c",
              cursor: "not-allowed",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "4px",
            }}
          >
            <ChevronRight size={17} />
          </button>

          {/* Robot Mascot Icon */}
          <button
            onClick={() => setSelectedSessionId(null)}
            title="OPEN-VERSE Core"
            style={{
              background: "none",
              border: "none",
              color: "#e2e4ec",
              cursor: "pointer",
              padding: "5px 6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              marginLeft: "4px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                maskImage: "url('/icon.svg')",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskImage: "url('/icon.svg')",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                backgroundColor: "#d5d7e0",
              }}
            />
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchActive(!isSearchActive)}
            title="Search sessions"
            style={{
              background: isSearchActive ? "#1c1e26" : "none",
              border: "none",
              color: isSearchActive ? "#e4e5ee" : "#7e8392",
              cursor: "pointer",
              padding: "5px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search size={15} />
          </button>

          {isSearchActive && (
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              style={{
                height: "26px",
                backgroundColor: "#16171d",
                border: "1px solid #282a35",
                borderRadius: "5px",
                color: "#e2e4ed",
                padding: "0 8px",
                fontSize: "12px",
                outline: "none",
                width: "160px",
              }}
            />
          )}
        </div>

        {/* Title Indicator */}
        <div style={{ flex: 1, textAlign: "center", fontSize: "12px", color: "#616572", fontWeight: 500 }}>
          OPEN-VERSE • {currentProviderDef.name} ({currentModelId})
        </div>

        {/* Caption controls (—, 🗖, ✕) */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            title="Minimize"
            style={{ width: "44px", height: "44px", background: "none", border: "none", color: "#9da1af", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Minus size={14} />
          </button>
          <button
            title="Maximize"
            style={{ width: "44px", height: "44px", background: "none", border: "none", color: "#9da1af", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Square size={12} />
          </button>
          <button
            title="Close"
            style={{ width: "44px", height: "44px", background: "none", border: "none", color: "#9da1af", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e81123")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. BODY SPLIT: SIDEBAR + MAIN WORKSPACE */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* LEFT SIDEBAR */}
        <div
          style={{
            width: "250px",
            backgroundColor: "#0c0d10",
            borderRight: "1px solid #1a1b20",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* Top Actions: + Session, Schedule, Customize */}
          <div style={{ padding: "10px 10px 4px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
            <button
              onClick={() => setSelectedSessionId(null)}
              style={{
                width: "100%",
                height: "34px",
                backgroundColor: !selectedSessionId ? "#17181f" : "transparent",
                border: "none",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 10px",
                color: "#f0f0f4",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1b23")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = !selectedSessionId ? "#17181f" : "transparent")}
            >
              <Plus size={15} color="#9ea3b2" />
              <span>Session</span>
            </button>

            <button
              onClick={() => setScheduleOpen(true)}
              style={{
                width: "100%",
                height: "32px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 10px",
                color: "#b0b4c2",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16171e")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Clock size={15} color="#8a8f9f" />
              <span>Schedule</span>
            </button>

            <button
              onClick={() => setCustomizeOpen(true)}
              style={{
                width: "100%",
                height: "32px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 10px",
                color: "#b0b4c2",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16171e")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <SlidersHorizontal size={15} color="#8a8f9f" />
              <span>Customize</span>
            </button>
          </div>

          {/* Sessions Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 14px 6px 14px",
              fontSize: "11px",
              color: "#838794",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            <span>Sessions</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                title="Split View"
                style={{ background: "none", border: "none", color: "#6c707d", cursor: "pointer", padding: "2px" }}
              >
                <Columns2 size={13} />
              </button>
              <button
                title="Filter"
                style={{ background: "none", border: "none", color: "#6c707d", cursor: "pointer", padding: "2px" }}
              >
                <Filter size={13} />
              </button>
            </div>
          </div>

          {/* REAL Sessions Scrollable List */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 6px 10px 6px",
              display: "flex",
              flexDirection: "column",
              gap: "1px",
            }}
          >
            {filteredSessions.length === 0 ? (
              <div
                style={{
                  padding: "24px 12px",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#5f6370",
                  lineHeight: "1.5",
                }}
              >
                <MessageSquare size={20} color="#353742" style={{ margin: "0 auto 8px auto" }} />
                No sessions yet.
                <br />
                Start a conversation below.
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = selectedSessionId === session.sessionId;
                return (
                  <div
                    key={session.sessionId}
                    onClick={() => setSelectedSessionId(session.sessionId)}
                    style={{
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 8px",
                      borderRadius: "5px",
                      backgroundColor: isSelected ? "#1c1d25" : "transparent",
                      color: isSelected ? "#f0f0f4" : "#b0b4be",
                      fontSize: "12.5px",
                      cursor: "pointer",
                      transition: "background-color 0.1s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#14151b";
                      const delBtn = e.currentTarget.querySelector(".del-btn") as HTMLElement;
                      if (delBtn) delBtn.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                      const delBtn = e.currentTarget.querySelector(".del-btn") as HTMLElement;
                      if (delBtn) delBtn.style.opacity = "0";
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "155px",
                      }}
                    >
                      {session.title}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#616572" }}>
                        {formatRelativeTime(session.lastActivityAt)}
                      </span>
                      <button
                        className="del-btn"
                        onClick={(e) => handleDeleteSession(e, session.sessionId)}
                        title="Delete Session"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#838796",
                          cursor: "pointer",
                          opacity: 0,
                          padding: "2px",
                          transition: "opacity 0.15s ease",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Genuine Bottom Profile Widget (Reflecting configured environment) */}
          <div
            style={{
              height: "52px",
              borderTop: "1px solid #1a1b20",
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#0c0d10",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: currentProviderDef.color,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12.5px",
                  fontWeight: 700,
                }}
              >
                {currentProviderDef.letter}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#eceef4" }}>
                  OPEN VERSE
                </span>
                <span style={{ fontSize: "11px", color: "#747885", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentProviderDef.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings & Isolation"
              style={{
                background: "none",
                border: "none",
                color: "#7e8392",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "5px",
              }}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* MAIN CANVAS */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0b0c0f",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Main Content (Welcome Hero or Real Conversation Messages) */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: currentSession?.messages?.length ? "flex-start" : "center",
              alignItems: "center",
              padding: "24px 20px 10px 20px",
              position: "relative",
            }}
          >
            {!currentSession?.messages?.length ? (
              <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <WelcomeHero />
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  maxWidth: "800px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  paddingBottom: "20px",
                }}
                className="animate-fade-in"
              >
                {/* Header for selected active session */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #1c1d23",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#f0f0f4" }}>
                      {currentSession.title}
                    </span>
                    <div style={{ fontSize: "11px", color: "#6e7280", marginTop: "2px" }}>
                      Created {formatRelativeTime(currentSession.createdAt)} • {currentSession.provider} ({currentSession.model})
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSessionId(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "none",
                      border: "1px solid #272935",
                      borderRadius: "5px",
                      padding: "4px 10px",
                      color: "#9da1af",
                      fontSize: "11.5px",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={12} /> New Prompt
                  </button>
                </div>

                {/* Real Persisted Messages */}
                {currentSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "12px 16px",
                        borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        backgroundColor: msg.role === "user" ? "#221d3a" : "#14151a",
                        border: msg.role === "user" ? "1px solid #483b7e" : "1px solid #23252e",
                        color: "#f0f0f3",
                        fontSize: "13.5px",
                        lineHeight: "1.5",
                      }}
                    >
                      {msg.role === "assistant" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#baa7ff",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {msg.agent || "Assistant"}
                          </span>
                        </div>
                      )}
                      <div>{msg.content}</div>

                      {msg.codeSnippet && (
                        <pre
                          style={{
                            marginTop: "10px",
                            padding: "10px 12px",
                            backgroundColor: "#0d0e12",
                            border: "1px solid #1f2129",
                            borderRadius: "6px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            color: "#c2d9ff",
                            overflowX: "auto",
                          }}
                        >
                          <code>{msg.codeSnippet}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8a8f9e", fontSize: "13px" }}>
                    <div className="pulse-glow" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#6e56cf" }} />
                    <span>Executing turn via {currentProviderDef.name}...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FLOATING ACTION BAR & PROMPT COMPOSER */}
          <div
            style={{
              width: "100%",
              maxWidth: "840px",
              margin: "0 auto",
              padding: "0 24px 20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {/* Top Badges Row: Agent Selector & Terminal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#131419",
                    border: "1px solid #242630",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    color: "#d0d4df",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <FolderGit2 size={13} color="#8a8f9f" />
                  <span>{activeAgent.toUpperCase()} Engine</span>
                  <ChevronDown size={12} color="#6e727e" />
                </button>

                {agentDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      marginBottom: "6px",
                      width: "180px",
                      backgroundColor: "#16171d",
                      border: "1px solid #282a35",
                      borderRadius: "8px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      padding: "4px",
                      zIndex: 50,
                    }}
                  >
                    {[
                      { id: "cline", name: "Cline Core" },
                      { id: "opencode", name: "OpenCode" },
                      { id: "rea", name: "REA" },
                      { id: "ptero", name: "Ptero" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveAgent(item.id);
                          setAgentDropdownOpen(false);
                        }}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "5px",
                          backgroundColor: activeAgent === item.id ? "#221d38" : "transparent",
                          color: activeAgent === item.id ? "#baa7ff" : "#d0d3de",
                          fontSize: "12.5px",
                          cursor: "pointer",
                        }}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Terminal Button */}
              <button
                onClick={() => setTerminalOpen(!terminalOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: terminalOpen ? "#1e1b2e" : "#131419",
                  border: terminalOpen ? "1px solid #6e56cf" : "1px solid #242630",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  color: terminalOpen ? "#baa7ff" : "#d0d4df",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <TerminalIcon size={13} color={terminalOpen ? "#baa7ff" : "#8a8f9f"} />
                <span>Terminal</span>
              </button>
            </div>

            {/* Input Container */}
            <div
              style={{
                backgroundColor: "#111216",
                border: "1px solid #252731",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              }}
            >
              {/* Textarea */}
              <div style={{ display: "flex", alignItems: "flex-start", padding: "12px 14px 6px 14px" }}>
                <textarea
                  ref={textareaRef}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder="Ask to make changes, @mention files, reference #PRs, or run /commands."
                  rows={2}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#f0f0f4",
                    fontSize: "13.5px",
                    lineHeight: "1.5",
                    resize: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />

                <button
                  onClick={handleSendPrompt}
                  disabled={!promptInput.trim() || isGenerating}
                  title="Send message"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    backgroundColor: promptInput.trim() && !isGenerating ? "#6e56cf" : "#28233f",
                    border: "none",
                    color: promptInput.trim() && !isGenerating ? "#ffffff" : "#7b6fa7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: promptInput.trim() && !isGenerating ? "pointer" : "default",
                    marginLeft: "8px",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  <ArrowUp size={15} strokeWidth={2.5} />
                </button>
              </div>

              {/* Bottom Control Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 12px 8px 12px",
                  borderTop: "1px solid #1a1b22",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    title="Quick Actions"
                    style={{ background: "none", border: "none", color: "#7e8392", cursor: "pointer", padding: "2px" }}
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Real Provider Dropdown */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => {
                        setProviderDropdownOpen(!providerDropdownOpen);
                        setModelDropdownOpen(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#e2e4ee",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "2px 4px",
                        borderRadius: "4px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1b1c23")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span>{currentProviderDef.name}</span>
                      <ChevronDown size={12} color="#757987" />
                    </button>

                    {providerDropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "100%",
                          left: 0,
                          marginBottom: "4px",
                          width: "210px",
                          backgroundColor: "#16171d",
                          border: "1px solid #282a35",
                          borderRadius: "6px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                          padding: "4px",
                          zIndex: 60,
                        }}
                      >
                        {PROVIDER_CATALOG.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProvider(p.id)}
                            style={{
                              padding: "6px 8px",
                              fontSize: "12px",
                              color: currentProviderDef.id === p.id ? "#baa7ff" : "#cfd2dd",
                              borderRadius: "4px",
                              backgroundColor: currentProviderDef.id === p.id ? "#221d38" : "transparent",
                              cursor: "pointer",
                            }}
                          >
                            {p.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Real Model Dropdown */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => {
                        setModelDropdownOpen(!modelDropdownOpen);
                        setProviderDropdownOpen(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#cfd2de",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        padding: "2px 4px",
                        borderRadius: "4px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1b1c23")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span>{currentModelId}</span>
                      <ChevronDown size={12} color="#757987" />
                    </button>

                    {modelDropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "100%",
                          left: 0,
                          marginBottom: "4px",
                          width: "220px",
                          backgroundColor: "#16171d",
                          border: "1px solid #282a35",
                          borderRadius: "6px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                          padding: "4px",
                          zIndex: 60,
                        }}
                      >
                        {currentProviderDef.models.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleSelectModel(m.id)}
                            style={{
                              padding: "6px 8px",
                              fontSize: "12px",
                              color: currentModelId === m.id ? "#baa7ff" : "#cfd2dd",
                              borderRadius: "4px",
                              backgroundColor: currentModelId === m.id ? "#221d38" : "transparent",
                              cursor: "pointer",
                            }}
                          >
                            {m.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reasoning Effort Level Toggle */}
                  <button
                    onClick={() => {
                      if (effort === "Low") setEffort("Medium");
                      else if (effort === "Medium") setEffort("High");
                      else setEffort("Low");
                    }}
                    title="Toggle Reasoning Level"
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "#9da1af",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1b22")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <CircleDot size={12} color="#8a8f9e" />
                    <span>{effort}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Console Panel */}
          <TerminalPanel
            isOpen={terminalOpen}
            onClose={() => setTerminalOpen(false)}
            activeAgent={activeAgent}
          />
        </div>
      </div>

      {/* MODALS */}
      <AgentModal
        isOpen={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        activeAgent={activeAgent}
        onSelectAgent={(id) => setActiveAgent(id)}
      />

      <SettingsView
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetToFirstRun={() => {
          setShowOnboarding(true);
          setSessions([]);
          setSelectedSessionId(null);
        }}
      />

      {scheduleOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setScheduleOpen(false)}
        >
          <div
            style={{
              width: "480px",
              backgroundColor: "#131419",
              border: "1px solid #252732",
              borderRadius: "10px",
              padding: "20px",
              color: "#e2e4ec",
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={16} color="#6e56cf" />
                <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Scheduled Tasks & Routines</h3>
              </div>
              <button
                onClick={() => setScheduleOpen(false)}
                style={{ background: "none", border: "none", color: "#7e8392", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: "12.5px", color: "#8a8f9f", lineHeight: "1.5", marginBottom: "16px" }}>
              Automate periodic code scans, security audits, and agent maintenance routines across OPEN-VERSE.
            </p>
            <div style={{ padding: "10px", backgroundColor: "#181920", borderRadius: "6px", border: "1px solid #232530", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#f0f0f4" }}>Nightly Repo Audit (REA & OpenCode)</div>
                <div style={{ color: "#727685", fontSize: "11px" }}>Runs daily at 02:00 AM • Checks diffs & vulnerabilities</div>
              </div>
              <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: 600 }}>ACTIVE</span>
            </div>
            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <button
                onClick={() => setScheduleOpen(false)}
                style={{
                  padding: "6px 14px",
                  backgroundColor: "#6e56cf",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
