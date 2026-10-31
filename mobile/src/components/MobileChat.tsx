import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Bot,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  Square,
  Terminal,
  User,
} from "lucide-react";
import { type ChatMessage } from "../services/storage";

interface MobileChatProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
  onNewSession: () => void;
  activeProvider: string;
  activeModel: string;
}

const QUICK_PROMPTS = [
  "Explain this repository architecture",
  "Write a TypeScript utility for WebSocket retry",
  "Audit this security configuration",
  "Help me troubleshoot a React 19 hook issue",
];

export function MobileChat({
  messages,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onNewSession,
  activeProvider,
  activeModel,
}: MobileChatProps) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Scrollable messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center px-4">
            <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/30">
              <Sparkles className="size-8 text-violet-400" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white">
              OPEN-VERSE Mobile
            </h2>
            <p className="mt-1.5 text-xs text-zinc-400 max-w-xs leading-relaxed">
              Autonomous AI agent client for mobile. Stream directly with{" "}
              <span className="text-violet-300 font-medium capitalize">
                {activeProvider} ({activeModel})
              </span>{" "}
              or pair with your desktop Hub.
            </p>

            {/* Quick prompt suggestions */}
            <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider text-left pl-1">
                Suggested prompts
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="rounded-xl border border-zinc-800 bg-surface px-3 py-2.5 text-left text-xs text-zinc-300 hover:border-violet-500/40 hover:bg-surface-hover active:scale-[0.99] transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-zinc-500">
                {msg.role === "user" ? (
                  <>
                    <span>You</span>
                    <User className="size-3" />
                  </>
                ) : (
                  <>
                    <Bot className="size-3 text-violet-400" />
                    <span className="font-medium text-zinc-400 capitalize">
                      {msg.provider || activeProvider}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[9px]">{msg.model || activeModel}</span>
                  </>
                )}
              </div>

              <div
                className={`relative group max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-tr-sm shadow-md shadow-violet-950/40"
                    : "bg-surface border border-zinc-800 text-zinc-200 rounded-tl-sm shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                {msg.isStreaming && (
                  <span className="inline-block size-2 ml-1 animate-pulse rounded-full bg-violet-400" />
                )}

                {msg.role === "assistant" && !msg.isStreaming && (
                  <div className="mt-2 flex items-center justify-end gap-2 border-t border-zinc-800/60 pt-2">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Floating Bottom Composer */}
      <div className="border-t border-border bg-surface/95 backdrop-blur-lg p-3 pb-safe">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeProvider} (${activeModel})...`}
              rows={1}
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-background px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none transition-all max-h-32"
            />
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-950/40 hover:bg-red-500 active:scale-95 transition-all"
              aria-label="Stop generation"
            >
              <Square className="size-4 fill-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-950/40 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 active:scale-95 transition-all"
              aria-label="Send message"
            >
              <ArrowUp className="size-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
