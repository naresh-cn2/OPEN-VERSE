import React from "react";
import { Shield, Lock, Laptop, CheckCircle2, KeyRound, Radio } from "lucide-react";

export const ArchitectureSecurity: React.FC = () => {
  const pillars = [
    {
      icon: <Radio size={24} style={{ color: "var(--accent-light)" }} />,
      title: "Outbound TLS Only — Zero Inbound Ports",
      desc: "Your laptop never acts as a public web server. It connects outbound to the OPEN-VERSE encrypted coordination relay using secure TLS WebSockets. You never have to configure port forwarding, firewall exceptions, or static IPs.",
    },
    {
      icon: <Lock size={24} style={{ color: "var(--emerald)" }} />,
      title: "Zero-Knowledge End-to-End Encryption",
      desc: "Device pairing exchanges an ephemeral AES-256-GCM symmetric session key via cryptographic QR handshake. The cloud relay cannot read your prompts, code diffs, or file contents. It only routes encrypted packets.",
    },
    {
      icon: <Laptop size={24} style={{ color: "var(--sky)" }} />,
      title: "Source Code Stays on Your Machine",
      desc: "Unlike cloud-only IDEs that upload your entire proprietary codebase to third-party containers, OPEN-VERSE executes tools, linters, tests, and compilers directly on your physical laptop. Only turn summaries and diffs are sent to mobile.",
    },
  ];

  return (
    <section id="security" style={{ padding: "80px 0", position: "relative" }}>
      <div className="container">
        <div className="section-header">
          <div className="badge badge-green">Security & Privacy First</div>
          <h2 className="section-title">Engineered to protect your code and devices.</h2>
          <p className="section-subtitle">
            Remote access without compromise. Here is why you can safely leave your laptop running
            and trust OPEN-VERSE with production code.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            marginBottom: 48,
          }}
        >
          {pillars.map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 32 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>
                {item.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Interactive Permission Policy Card */}
        <div
          className="glass-card"
          style={{
            padding: 32,
            background: "linear-gradient(135deg, rgba(20, 20, 28, 0.9) 0%, rgba(12, 12, 16, 0.95) 100%)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <KeyRound size={22} style={{ color: "var(--accent-light)" }} />
            <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
              Granular Mobile Tool Approvals
            </h4>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: 20 }}>
            You retain absolute control. When the agent on your laptop wants to execute a terminal command (like <code>git push</code> or <code>npm run deploy</code>), it suspends execution and requests permission on your mobile phone screen before proceeding.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: "0.85rem", color: "var(--emerald)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={16} /> Command execution approval
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={16} /> File deletion guardrails
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={16} /> Git push verification
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
