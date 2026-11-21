import React, { useState, useEffect } from "react";
import { Smartphone, Laptop, Radio, ArrowRight, Play, RotateCcw, CheckCircle2, Shield, Terminal, Mic } from "lucide-react";

export const InteractiveRemoteDemo: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const stepsData = [
    {
      title: "1. Prompt Sent from Mobile",
      phoneAction: "User dictates: 'Run test suite on STRATA-ENGINE and fix the failing auth token test.'",
      relayState: "Encrypting with pairing key (AES-256-GCM)...",
      laptopState: "Background daemon listening on outbound TLS connection.",
    },
    {
      title: "2. Task Dispatched to Laptop",
      phoneAction: "Status: Connected to Home Laptop • Waiting for tool execution.",
      relayState: "Relaying encrypted payload (Zero-Knowledge).",
      laptopState: "Agent starts task: cd C:\\Users\\...\\STRATA-ENGINE && bun test",
    },
    {
      title: "3. Live Execution & Test Running",
      phoneAction: "Live diff streaming: auth.test.ts (2 lines changed).",
      relayState: "Streaming diff chunks back to phone.",
      laptopState: "Running test runner: ✓ 42 passed, 0 failed. Tests all green!",
    },
    {
      title: "4. Approval Prompt on Mobile",
      phoneAction: "Phone Alert: 'Agent requests permission to commit changes.' [Approved]",
      relayState: "Approval token confirmed by user.",
      laptopState: "git commit -m 'fix: resolve auth token expiration bug'",
    },
    {
      title: "5. Task Complete",
      phoneAction: "Report Received: Task completed successfully. 100% test pass rate.",
      relayState: "Session archived in local SQLite.",
      laptopState: "Laptop agent enters ready state. Ready for next remote command.",
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-blue">True Remote Control</div>
          <h2 className="section-title">Away from your desk? <br />Your laptop never stops coding.</h2>
          <p className="section-subtitle">
            Experience the real workflow: your phone acts as your mission control, while your home laptop
            does the heavy lifting with full access to your local files, compilers, and repositories.
          </p>
        </div>

        {/* Demo Stage */}
        <div
          className="glass-card"
          style={{
            padding: "36px 28px",
            background: "linear-gradient(180deg, rgba(24, 24, 32, 0.8) 0%, rgba(14, 14, 18, 0.95) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Controls Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
              paddingBottom: 16,
              borderBottom: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--emerald)",
                  boxShadow: "0 0 10px var(--emerald)",
                }}
              />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                Active Simulation: <strong style={{ color: "#ffffff" }}>{stepsData[step].title}</strong>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
              >
                {isPlaying ? "Pause Demo" : <><Play size={13} /> Auto Play</>}
              </button>
              <button
                onClick={() => setStep(0)}
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                title="Reset simulation"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Grid Layout: Phone | Relay | Laptop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
              alignItems: "center",
            }}
          >
            {/* Phone Screen Mockup */}
            <div
              style={{
                background: "#0d0d12",
                border: "2px solid #27272a",
                borderRadius: 28,
                padding: "20px 16px",
                position: "relative",
                boxShadow: step === 0 || step === 3 ? "0 0 30px rgba(139, 92, 246, 0.3)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              {/* Phone Speaker Notch */}
              <div
                style={{
                  width: 60,
                  height: 5,
                  background: "#27272a",
                  borderRadius: 10,
                  margin: "0 auto 16px auto",
                }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Smartphone size={16} style={{ color: "var(--accent-light)" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ffffff" }}>OPEN-VERSE MOBILE</span>
                </div>
                <span className="badge badge-green" style={{ fontSize: "0.68rem", padding: "2px 8px" }}>
                  5G Cellular
                </span>
              </div>

              {/* Chat Viewport */}
              <div
                style={{
                  background: "#141419",
                  borderRadius: 12,
                  padding: 14,
                  minHeight: 170,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    Connected to: <strong>LAPTOP-CN2 (Home)</strong>
                  </div>
                  <div
                    style={{
                      background: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      padding: "8px 10px",
                      borderRadius: 8,
                      color: "#e4e4e7",
                      marginBottom: 8,
                    }}
                  >
                    {stepsData[step].phoneAction}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#09090b",
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #27272a",
                  }}
                >
                  <Mic size={14} style={{ color: "var(--accent-light)" }} />
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Dictate next prompt...</span>
                </div>
              </div>
            </div>

            {/* Cloud Relay Connector */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px 0",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "rgba(139, 92, 246, 0.12)",
                  border: "2px dashed var(--accent-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-light)",
                  marginBottom: 12,
                  boxShadow: "0 0 20px var(--accent-glow)",
                }}
              >
                <Radio size={24} className="animate-pulse" />
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "#ffffff" }}>
                  E2EE Outbound Relay
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", maxWidth: 180, margin: "4px auto 0 auto" }}>
                  {stepsData[step].relayState}
                </div>
              </div>
            </div>

            {/* Laptop Terminal Screen Mockup */}
            <div
              style={{
                background: "#0d0d12",
                border: "2px solid #27272a",
                borderRadius: 16,
                padding: 18,
                boxShadow: step === 1 || step === 2 ? "0 0 30px rgba(56, 189, 248, 0.25)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  borderBottom: "1px solid #1e1e24",
                  paddingBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Laptop size={16} style={{ color: "var(--sky)" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ffffff" }}>
                    HOME LAPTOP • STRATA-ENGINE
                  </span>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                </div>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  background: "#08080a",
                  padding: 12,
                  borderRadius: 8,
                  minHeight: 160,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div>
                  <div style={{ color: "var(--sky)", marginBottom: 4 }}>
                    $ open-verse-daemon --service --workspace STRATA-ENGINE
                  </div>
                  <div style={{ color: "var(--emerald)", marginBottom: 8 }}>
                    ● Local Agent Connected | Client: Mobile-Pair-01
                  </div>
                  <div style={{ color: "#ffffff" }}>
                    {stepsData[step].laptopState}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  <span>Branch: main</span>
                  <span>Port: 26736 (Local)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
            {stepsData.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: step === i ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: step === i ? "var(--accent-light)" : "var(--border-subtle)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
