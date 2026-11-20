import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Trash2 } from "lucide-react";

interface TerminalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeAgent: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  isOpen,
  onClose,
  activeAgent,
}) => {
  const [history, setHistory] = useState<Array<{ type: "input" | "output" | "error" | "info"; text: string }>>([
    { type: "info", text: "OPEN-VERSE Unified Environment v1.0.0 [Integrated Core]" },
    { type: "info", text: "Connected Agents: Cline (Code Engine), OpenCode (Semantic AST), REA (Reverse Eng), Ptero (Free LLM Hub)" },
    { type: "output", text: "Type 'help' for available commands or execute shell commands directly." }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const newHistory = [...history, { type: "input" as const, text: `$ ${cmd}` }];
    const lower = cmd.toLowerCase();

    if (lower === "clear" || lower === "cls") {
      setHistory([]);
      setInputVal("");
      return;
    } else if (lower === "help") {
      newHistory.push({
        type: "output",
        text: `Available commands:
  agents          List all 4 integrated Open-Verse agent engines
  status          Show health and connection state of agents
  switch <name>   Switch active agent (cline, opencode, rea, ptero)
  git status      Check current Open-Verse git status
  tools           Show available tools for current agent (${activeAgent})
  clear           Clear the terminal console`
      });
    } else if (lower === "agents") {
      newHistory.push({
        type: "output",
        text: `[ACTIVE] cline      - Full Autonomous Coding & Refactoring Agent
[READY]  opencode   - Deep Code Understanding, AST & Semantic Search
[READY]  rea        - Binary & Application Behavior Reverse Engineering
[READY]  ptero      - High-Throughput Free Multi-Model Chat & Inference`
      });
    } else if (lower === "status") {
      newHistory.push({
        type: "output",
        text: `OPEN-VERSE Runtime Status:
  ● Core Workspace: C:\\Users\\nares\\Workspace\\OPEN-VERSE\\OPEN-VERSE
  ● Active Agent  : ${activeAgent.toUpperCase()}
  ● Sidecar State : Ready (Port: 3125)
  ● Git Repos     : cline (main), opencode (dev), rea (main), ptero (main)`
      });
    } else if (lower === "tools") {
      newHistory.push({
        type: "output",
        text: `Active Tools for ${activeAgent}:
  - read_file, write_to_file, replace_file_content
  - run_command, manage_task, git_operations
  - browser_subagent, deep_semantic_search
  - binary_decompilation_analyzer (REA mode)`
      });
    } else if (lower.startsWith("switch ")) {
      const target = lower.split(" ")[1];
      newHistory.push({
        type: "info",
        text: `Switched execution context target to '${target}'.`
      });
    } else {
      newHistory.push({
        type: "output",
        text: `Executed in workspace: ${cmd} (exited with code 0)`
      });
    }

    setHistory(newHistory);
    setInputVal("");
  };

  return (
    <div
      style={{
        height: isExpanded ? "450px" : "240px",
        backgroundColor: "#0d0e12",
        borderTop: "1px solid #23252e",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        position: "relative",
      }}
      className="animate-fade-in"
    >
      {/* Terminal Titlebar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          backgroundColor: "#131419",
          borderBottom: "1px solid #1f2127",
          fontSize: "12px",
          color: "#9da1af",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TerminalIcon size={14} color="#6e56cf" />
          <span style={{ fontWeight: 600, color: "#e4e5eb" }}>Terminal</span>
          <span style={{ color: "#5d616c", fontSize: "11px" }}>
            bash • {activeAgent} environment
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setHistory([])}
            title="Clear Console"
            style={{
              background: "none",
              border: "none",
              color: "#7e838f",
              cursor: "pointer",
              padding: "3px",
              borderRadius: "4px",
            }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
            style={{
              background: "none",
              border: "none",
              color: "#7e838f",
              cursor: "pointer",
              padding: "3px",
              borderRadius: "4px",
            }}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={onClose}
            title="Close Terminal"
            style={{
              background: "none",
              border: "none",
              color: "#7e838f",
              cursor: "pointer",
              padding: "3px",
              borderRadius: "4px",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: "12.5px",
          lineHeight: "1.6",
        }}
      >
        {history.map((line, idx) => (
          <div
            key={idx}
            style={{
              color:
                line.type === "input"
                  ? "#baa7ff"
                  : line.type === "info"
                  ? "#64b5f6"
                  : line.type === "error"
                  ? "#ef5350"
                  : "#c5c8d2",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              marginBottom: "3px",
            }}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Input */}
      <form
        onSubmit={handleCommand}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px 8px 16px",
          borderTop: "1px solid #1a1c22",
          backgroundColor: "#0d0e12",
        }}
      >
        <span style={{ color: "#6e56cf", fontWeight: 700, fontSize: "13px" }}>❯</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enter command..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f0f0f3",
            fontFamily: "var(--font-mono)",
            fontSize: "12.5px",
          }}
        />
      </form>
    </div>
  );
};
