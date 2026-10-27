import React from "react";
import { Laptop, Smartphone, Terminal, Cpu, ArrowRight, Layers } from "lucide-react";

export const DocsSection: React.FC = () => {
  const steps = [
    {
      num: "01",
      icon: <Laptop size={20} style={{ color: "var(--accent-light)" }} />,
      title: "Launch OPEN-VERSE Desktop",
      desc: "Install and run OPEN-VERSE on your Windows, macOS, or Linux laptop. Open your target project workspace (e.g., STRATA-ENGINE) and verify your local terminal and test runners are accessible.",
    },
    {
      num: "02",
      icon: <Smartphone size={20} style={{ color: "var(--emerald)" }} />,
      title: "Pair Mobile Companion via QR Code",
      desc: "In Settings → Remote Control, click 'Pair Phone'. Open the OPEN-VERSE app on your iPhone or Android and scan the cryptographic QR code. Both devices establish an end-to-end encrypted connection instantly.",
    },
    {
      num: "03",
      icon: <Terminal size={20} style={{ color: "var(--sky)" }} />,
      title: "Dictate or Type Tasks from Anywhere",
      desc: "Leave your laptop plugged in at home. From your phone, dictate: 'Refactor the database connection pool and run the integration tests.' Monitor the live terminal logs and approve actions on the go.",
    },
  ];

  const models = [
    { name: "Claude 3.7 Sonnet", type: "Cloud Reasoning", badge: "Recommended" },
    { name: "GPT-4o & o3-mini", type: "Cloud Intelligence", badge: "Supported" },
    { name: "DeepSeek R1 & V3", type: "Cloud Reasoning", badge: "High Speed" },
    { name: "Local Ollama (Llama 3.3, Qwen 2.5)", type: "100% Offline Local", badge: "Private" },
  ];

  return (
    <section id="docs" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-purple">Documentation & Quickstart</div>
          <h2 className="section-title">Get up and running in 3 minutes.</h2>
          <p className="section-subtitle">
            Simple setup, zero network headaches. No complex server configurations or cloud container syncs required.
          </p>
        </div>

        {/* 3 Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
            marginBottom: 56,
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

        {/* Multi-Model Grid */}
        <div className="glass-card" style={{ padding: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Cpu size={22} style={{ color: "var(--accent-light)" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
              Model Agnostic: Use Any Model on Laptop or Mobile
            </h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 24 }}>
            Switch models dynamically mid-session from your phone. Use local weights when on offline networks, or switch to top cloud reasoning models for complex refactors.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {models.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: "#0d0d12",
                  borderRadius: 12,
                  padding: "16px 18px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#ffffff" }}>{m.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.type}</span>
                  <span className="badge badge-purple" style={{ fontSize: "0.68rem", padding: "2px 8px" }}>
                    {m.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
