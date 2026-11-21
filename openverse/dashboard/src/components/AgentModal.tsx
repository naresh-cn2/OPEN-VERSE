import type { FC } from "react";
import { X, Bot, Code, Cpu, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAgent: string;
  onSelectAgent: (agentId: string) => void;
}

export const AgentModal: FC<AgentModalProps> = ({
  isOpen,
  onClose,
  activeAgent,
  onSelectAgent,
}) => {
  if (!isOpen) return null;

  const agents = [
    {
      id: "cline",
      name: "Cline Core",
      category: "Autonomous Coding",
      icon: Bot,
      color: "#6e56cf",
      description: "Autonomous software development agent with execution engine, diff editing, and task lifecycle management.",
      status: "Installed & Active",
      branch: "main",
      tools: ["File Operations", "Terminal Shell", "Browser Testing", "Context Analysis"]
    },
    {
      id: "opencode",
      name: "OpenCode",
      category: "Intelligence & AST",
      icon: Code,
      color: "#22c55e",
      description: "Deep semantic code analysis, codegen engine, syntax tree comprehension, and cross-file refactoring.",
      status: "Installed & Synced",
      branch: "dev",
      tools: ["AST Parser", "Code Generation", "Type Checker", "Cross-Ref Indexer"]
    },
    {
      id: "rea",
      name: "REA",
      category: "Reverse Engineering",
      icon: Cpu,
      color: "#f59e0b",
      description: "Reverse engineer anything with AI agents: native binary disassembly, network protocols, and runtime inspection.",
      status: "Installed & Synced",
      branch: "main",
      tools: ["Binary Inspector", "Protocol Decoder", "Decompiler", "API Mapper"]
    },
    {
      id: "ptero",
      name: "Ptero",
      category: "Multi-Model Router",
      icon: Sparkles,
      color: "#06b6d4",
      description: "High-speed AI chat and model multiplexing layer giving free access to powerful LLMs with zero-latency streaming.",
      status: "Installed & Synced",
      branch: "main",
      tools: ["Multi-Model Router", "Token Optimizer", "Stream Accelerator", "Free Tier Gateway"]
    }
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "680px",
          maxHeight: "85vh",
          backgroundColor: "#131419",
          border: "1px solid #282a33",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in"
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #20222a",
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f4" }}>
              OPEN-VERSE Agent Hub & Tools
            </h2>
            <p style={{ fontSize: "12px", color: "#8a8f9d", marginTop: "2px" }}>
              Manage all cloned AI engines integrated in your unified environment
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#7e8392",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isCurrent = activeAgent === agent.id;

            return (
              <div
                key={agent.id}
                onClick={() => {
                  onSelectAgent(agent.id);
                  onClose();
                }}
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  backgroundColor: isCurrent ? "#1b1929" : "#181920",
                  border: isCurrent ? "1px solid #6e56cf" : "1px solid #23252f",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: `${agent.color}22`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} color={agent.color} />
                    </div>
                    <div>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f4" }}>
                        {agent.name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          marginLeft: "8px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "#22242e",
                          color: "#9da1b0",
                        }}
                      >
                        {agent.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isCurrent ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          color: "#baa7ff",
                          fontWeight: 500,
                        }}
                      >
                        <CheckCircle2 size={14} /> Active Engine
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#7e8392",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid #282a35",
                        }}
                      >
                        Click to Activate
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: "12px", color: "#9ca1af", lineHeight: "1.4" }}>
                  {agent.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", color: "#6e7380" }}>Tools:</span>
                  {agent.tools.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: "#1f2129",
                        color: "#b0b4c2",
                        border: "1px solid #272a34",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #20222a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#7e8392",
            backgroundColor: "#111216",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} color="#22c55e" />
            <span>All 4 engines synchronized with local git worktree</span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              backgroundColor: "#232530",
              color: "#e2e4ec",
              border: "1px solid #2f3240",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
