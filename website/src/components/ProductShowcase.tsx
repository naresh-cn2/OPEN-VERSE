import React, { useState } from "react";
import {
  Layers,
  Cpu,
  Terminal,
  ShieldCheck,
  Radio,
  FileCode,
  Sparkles,
  GitBranch,
  Search,
  Mic,
  Zap,
  ArrowRight,
  Check,
  Play,
  RotateCw,
} from "lucide-react";

export const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "workspace" | "swarms" | "models" | "lsp" | "voice" | "sync"
  >("workspace");

  const pillars = [
    {
      id: "workspace" as const,
      icon: <FileCode size={18} />,
      title: "Interactive Canvas",
      badge: "Coding Workspace",
      desc: "Side-by-side editing canvas with Pierre diffs and per-hunk rejection/acceptance.",
    },
    {
      id: "swarms" as const,
      icon: <Layers size={18} />,
      title: "Autonomous Swarms",
      badge: "Multi-Agent",
      desc: "Coordinator agents partition complex goals into subtasks executed by parallel subagents.",
    },
    {
      id: "models" as const,
      icon: <Cpu size={18} />,
      title: "Multi-Provider AI",
      badge: "Unified Routing",
      desc: "Seamless routing across Claude 3.7, Gemini 2.0 (2M Context), o3, and offline Ollama.",
    },
    {
      id: "lsp" as const,
      icon: <Terminal size={18} />,
      title: "Compiler-Grade LSP",
      badge: "Code Intelligence",
      desc: "Tree-Sitter AST symbol navigation and headless LSP diagnostics verify code before edit.",
    },
    {
      id: "voice" as const,
      icon: <Mic size={18} />,
      title: "Live Voice Assistant",
      badge: "Full-Duplex Audio",
      desc: "Bidirectional WebSocket streaming with on-device wake-word detection ('Hey Open-Verse').",
    },
    {
      id: "sync" as const,
      icon: <Radio size={18} />,
      title: "Encrypted P2P Sync",
      badge: "Decentralized",
      desc: "Pure Rust Iroh QUIC device-to-device replication without third-party cloud servers.",
    },
  ];

  return (
    <section id="features" style={{ padding: "100px 0 80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple" style={{ marginBottom: 12 }}>
            <Sparkles size={13} />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="section-title">One unified engine. Uncompromised intelligence.</h2>
          <p className="section-subtitle">
            OPEN-VERSE unifies frontier reasoning models, autonomous swarms, compiler-level code
            intelligence, and real-time voice into a single local-first architecture.
          </p>
        </div>

        {/* Feature Tabs Selector */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
            marginBottom: 32,
          }}
        >
          {pillars.map((pillar) => {
            const isActive = activeTab === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => setActiveTab(pillar.id)}
                style={{
                  background: isActive ? "rgba(139, 92, 246, 0.16)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${isActive ? "var(--border-focus)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: isActive ? "var(--accent-light)" : "var(--text-muted)" }}>
                    {pillar.icon}
                  </span>
                  <span style={{ fontSize: "0.92rem", fontWeight: 700 }}>{pillar.title}</span>
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: isActive ? "var(--accent-light)" : "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                  }}
                >
                  {pillar.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Interactive Preview Canvas */}
        <div
          className="glass-card"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "32px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            background: "linear-gradient(180deg, rgba(24, 24, 32, 0.85) 0%, rgba(15, 15, 20, 0.95) 100%)",
            boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.7)",
          }}
        >
          {activeTab === "workspace" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
              <div>
                <div className="badge badge-purple" style={{ marginBottom: 12 }}>Side-by-Side Canvas</div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>
                  Surgical code edits without hallucinated overwrites.
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.98rem", lineHeight: 1.6, marginBottom: 20 }}>
                  OPEN-VERSE combines Monaco editor with high-fidelity fuzzy patch application (<code style={{ color: "var(--sky)" }}>patchmark</code>).
                  Review changes line-by-line, accept or reject individual hunks, and inspect full syntax-highlighted diffs in real time.
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={16} style={{ color: "var(--emerald)" }} />
                    <span>Fuzzy whitespace & indentation tolerance eliminates edit failures</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={16} style={{ color: "var(--emerald)" }} />
                    <span>Per-hunk accept/reject buttons with instant git rollback</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={16} style={{ color: "var(--emerald)" }} />
                    <span>Integrated Pseudoterminal (PTY) verifies test outputs automatically</span>
                  </li>
                </ul>
              </div>

              {/* Mockup Canvas */}
              <div
                style={{
                  background: "#0d0d12",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-subtle)",
                  overflow: "hidden",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ background: "#14141c", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                    <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>src/auth/session.ts — Diff Review</span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: "0.65rem" }}>Hunk 1 of 1 Ready</span>
                </div>
                <div style={{ padding: "16px", lineHeight: 1.6 }}>
                  <div style={{ color: "var(--text-muted)" }}>@@ -42,7 +42,8 @@ export async function validateToken(token: string) &#123;</div>
                  <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)", padding: "2px 8px" }}>-   const decoded = jwt.decode(token);</div>
                  <div style={{ color: "var(--emerald)", background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px" }}>+   const decoded = await verifyIdTokenSignature(token, JWKS_ENDPOINT);</div>
                  <div style={{ color: "var(--emerald)", background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px" }}>+   if (decoded.exp &lt; Date.now() / 1000) throw new ExpiredSessionError();</div>
                  <div style={{ color: "var(--text-muted)", padding: "2px 8px" }}>    return sessionStore.create(decoded.sub);</div>
                </div>
                <div style={{ background: "#14141c", padding: "10px 16px", display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--border-subtle)" }}>
                  <button style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "6px 12px", borderRadius: 6, fontSize: "0.75rem", cursor: "pointer" }}>Reject</button>
                  <button style={{ background: "var(--emerald)", border: "none", color: "#ffffff", padding: "6px 14px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Accept Hunk (Apply)</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "swarms" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
              <div>
                <div className="badge badge-purple" style={{ marginBottom: 12 }}>Supervisor-Worker Swarms</div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>
                  Parallel execution with designated roles.
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.98rem", lineHeight: 1.6, marginBottom: 20 }}>
                  Why wait for a single agent to finish researching before testing? OPEN-VERSE spawns an autonomous swarm
                  sharing a live workboard. The <strong>Coordinator</strong> delegates discovery to the <strong>Scout</strong>,
                  implementation to the <strong>Coder</strong>, and test validation to the <strong>Verifier</strong>.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="badge badge-purple" style={{ minWidth: 90 }}>Coordinator</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Synthesizes goal, manages barrier syncs, resolves merge conflicts</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="badge badge-blue" style={{ minWidth: 90 }}>Scout</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Searches symbol ASTs, reads documentation, inspects schemas</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="badge badge-green" style={{ minWidth: 90 }}>Verifier</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Executes vitest, cargo test, and pytest suites in isolated git worktrees</span>
                  </div>
                </div>
              </div>

              {/* Swarm Visual Board */}
              <div
                style={{
                  background: "#0d0d12",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-subtle)",
                  padding: "20px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ color: "var(--accent-light)", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <RotateCw size={14} className="animate-spin" />
                  <span>SWARM WORKBOARD — 3 Active Workers</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ borderLeft: "3px solid var(--accent-primary)", paddingLeft: 12 }}>
                    <div style={{ color: "#ffffff", fontWeight: 600 }}>[Scout-1] Inspecting OAuth Flow</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Found 3 matching endpoints in website/api/auth — Completed (0.8s)</div>
                  </div>
                  <div style={{ borderLeft: "3px solid var(--sky)", paddingLeft: 12 }}>
                    <div style={{ color: "#ffffff", fontWeight: 600 }}>[Coder-1] Updating Token Verifier</div>
                    <div style={{ color: "var(--sky)", fontSize: "0.75rem" }}>Writing fuzzy patch to src/auth/session.ts — In Progress</div>
                  </div>
                  <div style={{ borderLeft: "3px solid var(--emerald)", paddingLeft: 12 }}>
                    <div style={{ color: "#ffffff", fontWeight: 600 }}>[Verifier-1] Running Acceptance Suite</div>
                    <div style={{ color: "var(--emerald)", fontSize: "0.75rem" }}>Executing bun test: 42 passed, 0 failed — Passed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "models" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
              <div>
                <div className="badge badge-purple" style={{ marginBottom: 12 }}>Zero-Lock-in Provider Routing</div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>
                  Any model. Seamless fallback. Transparent thinking.
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.98rem", lineHeight: 1.6, marginBottom: 20 }}>
                  Switch between <strong>Claude 3.7 Sonnet</strong> (with extended thinking replay), <strong>Google Gemini 2.0 Flash</strong> (with 2,000,000 token context),
                  <strong>OpenAI o3-mini</strong>, and 100% private offline <strong>Ollama models</strong>.
                  If one provider hits a rate limit (HTTP 429), OPEN-VERSE automatically falls back to your secondary model.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.9rem" }}>Claude 3.7 Sonnet</div>
                    <div style={{ color: "var(--accent-light)", fontSize: "0.75rem" }}>Extended Thinking + MCP</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.9rem" }}>Gemini 2.0 Flash</div>
                    <div style={{ color: "var(--sky)", fontSize: "0.75rem" }}>2,000,000 Token Context</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.9rem" }}>OpenAI o1 / o3</div>
                    <div style={{ color: "var(--emerald)", fontSize: "0.75rem" }}>Test-Time Compute</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.9rem" }}>Offline Ollama</div>
                    <div style={{ color: "var(--amber)", fontSize: "0.75rem" }}>100% Air-Gapped Private</div>
                  </div>
                </div>
              </div>

              {/* Thinking Trace Box */}
              <div
                style={{
                  background: "#0d0d12",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-subtle)",
                  padding: "20px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ color: "var(--accent-light)", fontWeight: 700, marginBottom: 8 }}>&lt;thinking&gt; (Claude 3.7 Reasoning Trace)</div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
                  1. Analyzing JWT verification failure reported in issue #42...<br />
                  2. Found JWKS cache expiration was hardcoded to 0, forcing repeated network requests.<br />
                  3. Solution: Add 5-minute memory cache with automatic background rotation.<br />
                  4. Verifying impact on test suites in auth.test.ts...
                </div>
                <div style={{ color: "var(--accent-light)", fontWeight: 700 }}>&lt;/thinking&gt;</div>
                <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(16, 185, 129, 0.12)", color: "var(--emerald)", borderRadius: 6 }}>
                  ✓ Replay validated: Dispatched patch to session.ts
                </div>
              </div>
            </div>
          )}

          {activeTab === "lsp" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
              <div>
                <div className="badge badge-purple" style={{ marginBottom: 12 }}>Compiler-Level Intelligence</div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>
                  Language Server Protocol (LSP) integration.
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.98rem", lineHeight: 1.6, marginBottom: 20 }}>
                  LLMs make mistakes when editing complex types. OPEN-VERSE hooks directly into headless language servers
                  (<code style={{ color: "var(--sky)" }}>typescript-language-server</code>, <code style={{ color: "var(--sky)" }}>rust-analyzer</code>, <code style={{ color: "var(--sky)" }}>pyright</code>).
                  Before any code is committed, the agent queries compiler diagnostics and type definitions to guarantee correctness.
                </p>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, flex: 1 }}>
                    <div style={{ color: "#ffffff", fontWeight: 700 }}>0 Type Errors</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Verified by tsc --noEmit</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, flex: 1 }}>
                    <div style={{ color: "#ffffff", fontWeight: 700 }}>AST Indexing</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Tree-Sitter symbol maps</div>
                  </div>
                </div>
              </div>

              <div style={{ background: "#0d0d12", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", padding: "20px", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                <div style={{ color: "var(--sky)", fontWeight: 700, marginBottom: 8 }}>LSP DIAGNOSTIC HOOK</div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  &gt; lsp.get_type_definition("SessionStore")<br />
                  &nbsp;&nbsp;→ interface SessionStore &#123; create(sub: string): Session &#125;<br />
                  &gt; lsp.get_diagnostics("src/auth/session.ts")<br />
                  &nbsp;&nbsp;→ 0 errors, 0 warnings (Compile Clean)<br />
                </div>
              </div>
            </div>
          )}

          {activeTab === "voice" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
              <div>
                <div className="badge badge-purple" style={{ marginBottom: 12 }}>Conversational Voice Engine</div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>
                  Hands-free live audio streaming & wake-word.
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.98rem", lineHeight: 1.6, marginBottom: 20 }}>
                  Say <em>"Hey Open-Verse"</em> to wake your assistant without touching the keyboard.
                  Powered by bidirectional WebSocket audio streaming (Gemini Multimodal Live / Whisper) with Voice Activity Detection (VAD)
                  and natural interruption handling.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="badge badge-green">Sub-300ms Latency</span>
                  <span className="badge badge-purple">On-Device Wake Word</span>
                </div>
              </div>

              <div style={{ background: "#0d0d12", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", padding: "24px", textAlign: "center" }}>
                <div style={{ display: "inline-flex", padding: 18, background: "rgba(139, 92, 246, 0.15)", borderRadius: "50%", marginBottom: 16 }}>
                  <Mic size={32} style={{ color: "var(--accent-light)" }} />
                </div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>"Hey Open-Verse, run the test suite."</div>
                <div style={{ color: "var(--emerald)", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>● Streaming Live Audio (WebSocket 24kHz PCM)</div>
              </div>
            </div>
          )}

          {activeTab === "sync" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
              <div>
                <div className="badge badge-purple" style={{ marginBottom: 12 }}>Iroh QUIC Peer-to-Peer</div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>
                  Direct device synchronization without cloud relays.
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.98rem", lineHeight: 1.6, marginBottom: 20 }}>
                  Sync chat histories, project workspaces, and active tasks directly between your desktop and mobile phone.
                  Built with pure Rust Iroh QUIC transport, your packets traverse NATs with end-to-end Ed25519 cryptographic encryption.
                  No third-party cloud server ever inspects your code.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <span className="badge badge-blue">Zero-Knowledge Relay</span>
                  <span className="badge badge-green">End-to-End Encrypted</span>
                </div>
              </div>

              <div style={{ background: "#0d0d12", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", padding: "20px", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                <div style={{ color: "var(--emerald)", fontWeight: 700, marginBottom: 8 }}>P2P IROH NODE STATUS</div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Node ID: ed25519:7a8f...9b2c<br />
                  Paired Device: Android Companion (Pixel 9 Pro)<br />
                  Latency: 14ms (Direct UDP QUIC Stream)<br />
                  Relay Dependency: None (Direct Peer Link)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
