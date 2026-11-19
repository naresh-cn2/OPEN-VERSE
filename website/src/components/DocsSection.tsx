import React, { useState } from "react";
import {
  Laptop,
  Smartphone,
  Terminal,
  Cpu,
  ArrowRight,
  Layers,
  Key,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Code,
  FolderGit2,
  Sliders,
  HelpCircle
} from "lucide-react";

export const DocsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"quickstart" | "providers" | "swarms" | "mcp" | "faq">("quickstart");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    {
      num: "01",
      icon: <Laptop size={20} style={{ color: "var(--accent-light)" }} />,
      title: "Launch OPEN-VERSE Desktop",
      desc: "Install and run OPEN-VERSE on Windows, macOS, or Linux. Open your project workspace repository; OPEN-VERSE immediately scans your AST symbols and initializes local tools.",
    },
    {
      num: "02",
      icon: <Smartphone size={20} style={{ color: "var(--emerald)" }} />,
      title: "Pair Mobile Companion via QR Code",
      desc: "In Settings → Remote Control, click 'Pair Phone'. Open OPEN-VERSE on your mobile device and scan the cryptographic QR code. Both devices establish an end-to-end encrypted connection instantly via Rust Iroh QUIC.",
    },
    {
      num: "03",
      icon: <Terminal size={20} style={{ color: "var(--sky)" }} />,
      title: "Dictate or Type Tasks from Anywhere",
      desc: "Leave your computer running at home or office. From your phone, dictate: 'Refactor the database connection pool and run tests.' Monitor live terminal logs, review patch diffs, and approve actions on the go.",
    },
  ];

  const providers = [
    {
      name: "Google Gemini 2.0 / 2.5",
      type: "Multimodal & 2M Context",
      badge: "High Context",
      env: "GEMINI_API_KEY",
      desc: "Ideal for massive multi-file refactors and full repository context indexing. Supports Flash and Pro tiers with native system instructions.",
    },
    {
      name: "Anthropic Claude 3.7 Sonnet",
      type: "Hybrid Extended Thinking",
      badge: "Recommended",
      env: "ANTHROPIC_API_KEY",
      desc: "State-of-the-art reasoning with adjustable thinking token budgets. Exceptional for deep architectural refactoring and nuanced edge-case fixes.",
    },
    {
      name: "OpenAI GPT-4o & o3-mini",
      type: "High-Speed & Deliberation",
      badge: "Industry Standard",
      env: "OPENAI_API_KEY",
      desc: "Supports low-latency streaming and o3-mini STEM reasoning. Compatible with standard OpenAI API gateways and Azure OpenAI endpoints.",
    },
    {
      name: "Local Ollama / LM Studio",
      type: "100% Offline & Private",
      badge: "Zero Cloud",
      env: "OLLAMA_HOST=http://localhost:11434",
      desc: "Run Llama 3.3, Qwen 2.5 Coder, DeepSeek R1 distilled, or Mistral locally on your GPU. No network connection required; zero tokens leave your machine.",
    },
  ];

  const faqs = [
    {
      q: "Why does Windows 11 Smart App Control show a warning when running the installer?",
      a: "Windows 11 22H2+ includes Smart App Control (SAC) Enforced mode, which uses cloud intelligence to block unsigned or newly released executables that lack historical cloud reputation. OPEN-VERSE provides full SHA-256 integrity checksums and Minisign signatures. To install on SAC Enforced machines, use the portable ZIP or run via winget / developer mode.",
    },
    {
      q: "Does my proprietary code ever get sent to OPEN-VERSE servers?",
      a: "Never. OPEN-VERSE has no centralized server storing your source code. All agent execution, AST indexing, tool calls, and file modifications run strictly on your local machine. When using mobile companion, devices communicate via an end-to-end encrypted direct peer-to-peer relay.",
    },
    {
      q: "Can I use OPEN-VERSE completely offline?",
      a: "Yes. By selecting Local Ollama or LM Studio as your AI provider, OPEN-VERSE operates 100% offline. The AST symbol indexing, file diffing, terminal execution, and local canvas tools require no internet access.",
    },
    {
      q: "How does OPEN-VERSE compare to web-based cloud AI agents?",
      a: "Cloud AI agents run in isolated Docker containers with artificial quotas, stale dependencies, and slow upload syncs. OPEN-VERSE runs directly on your actual development machine, with immediate access to your real compilers, databases, Docker daemons, git history, and local environment variables.",
    },
  ];

  return (
    <section id="docs" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Documentation & Developer Guide</div>
          <h2 className="section-title">Everything you need to master OPEN-VERSE.</h2>
          <p className="section-subtitle">
            Zero cloud lock-in, genuine native architecture, and multi-provider autonomy.
          </p>
        </div>

        {/* Documentation Tab Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 36,
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "quickstart", label: "Quickstart", icon: <Terminal size={15} /> },
            { id: "providers", label: "AI Providers", icon: <Cpu size={15} /> },
            { id: "swarms", label: "Agent Swarms", icon: <Layers size={15} /> },
            { id: "mcp", label: "MCP & Tools", icon: <Code size={15} /> },
            { id: "faq", label: "Security & FAQ", icon: <HelpCircle size={15} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: isActive ? "rgba(139, 92, 246, 0.16)" : "rgba(255, 255, 255, 0.03)",
                  border: isActive ? "1px solid rgba(139, 92, 246, 0.45)" : "1px solid rgba(255, 255, 255, 0.06)",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: Quickstart */}
        {activeTab === "quickstart" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
                marginBottom: 36,
              }}
            >
              {steps.map((st, i) => (
                <div key={i} className="glass-card" style={{ padding: 28, position: "relative" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "2.2rem",
                      fontWeight: 900,
                      color: "rgba(255, 255, 255, 0.08)",
                      position: "absolute",
                      top: 20,
                      right: 24,
                    }}
                  >
                    {st.num}
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    {st.icon}
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", marginBottom: 10 }}>
                    {st.title}
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {st.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick terminal launch snippet */}
            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ffffff" }}>
                  CLI Quick Launch (Windows / macOS / Linux)
                </span>
                <button
                  onClick={() => copyToClipboard("open-verse --workspace ./my-project", "cli-quick")}
                  className="copy-btn"
                >
                  {copiedKey === "cli-quick" ? <Check size={14} style={{ color: "var(--emerald)" }} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="code-box" style={{ background: "#09090d" }}>
                <span style={{ color: "var(--accent-light)" }}>$</span>
                <span style={{ flex: 1 }}>open-verse --workspace ./my-project --model claude-3-7-sonnet</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Providers */}
        {activeTab === "providers" && (
          <div className="glass-card" style={{ padding: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Cpu size={22} style={{ color: "var(--accent-light)" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
                Multi-Provider Model Agility
              </h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 28, lineHeight: 1.6 }}>
              Configure provider API keys directly in the native settings or via environment variables. OPEN-VERSE supports hot model switching mid-session from either your desktop keyboard or mobile phone.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {providers.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0d0d14",
                    borderRadius: 14,
                    padding: 22,
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>{p.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{p.type}</div>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: "0.68rem", padding: "2px 8px" }}>
                      {p.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                    {p.desc}
                  </p>

                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      background: "rgba(0, 0, 0, 0.4)",
                      borderRadius: 8,
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{p.env}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 3: Swarms */}
        {activeTab === "swarms" && (
          <div className="glass-card" style={{ padding: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Layers size={22} style={{ color: "var(--accent-light)" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
                Hierarchical Autonomous Swarm Architecture
              </h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 28, lineHeight: 1.6 }}>
              Unlike single-turn chat interfaces, OPEN-VERSE can spin up specialized subagents that decompose large programming tasks into independent work streams.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
              }}
            >
              {[
                {
                  role: "Coordinator Agent",
                  desc: "Deconstructs the user goal into a DAG of executable tasks, tracks progress on the live shared workboard, and validates completion criteria.",
                },
                {
                  role: "Architect / Researcher",
                  desc: "Scans repository ASTs, documentation, and external APIs in a read-only sandbox before proposing unified design decisions.",
                },
                {
                  role: "Implementation Author",
                  desc: "Applies precision multi-file diffs in parallel git worktree slices without stepping on other workers.",
                },
                {
                  role: "Verification & QA",
                  desc: "Runs local test suites, linters, and type checkers, capturing compiler errors and providing immediate feedback loops.",
                },
              ].map((sw, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0d0d14",
                    borderRadius: 14,
                    padding: 22,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#c4b5fd", marginBottom: 8 }}>
                    {sw.role}
                  </div>
                  <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                    {sw.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: MCP */}
        {activeTab === "mcp" && (
          <div className="glass-card" style={{ padding: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Code size={22} style={{ color: "var(--accent-light)" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
                Model Context Protocol (MCP) & Extensibility
              </h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 28, lineHeight: 1.6 }}>
              OPEN-VERSE is fully compatible with the Model Context Protocol standard. Connect databases, external APIs, and local developer sidecars in standard JSON configuration:
            </p>

            <div
              style={{
                background: "#08080c",
                borderRadius: 12,
                padding: 20,
                border: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.82rem",
                color: "#e2e8f0",
                lineHeight: 1.6,
                overflowX: "auto",
              }}
            >
              <pre style={{ margin: 0 }}>
{`// ~/.open-verse/mcp.json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." }
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab Content 5: FAQ */}
        {activeTab === "faq" && (
          <div className="glass-card" style={{ padding: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <HelpCircle size={22} style={{ color: "var(--accent-light)" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
                Frequently Asked Questions & Security Integrity
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {faqs.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0d0d14",
                    borderRadius: 12,
                    padding: 22,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
                    {f.q}
                  </div>
                  <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {f.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
