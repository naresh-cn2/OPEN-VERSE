import React from "react";
import {
  FolderKanban,
  HardDrive,
  MessageSquare,
  Plus,
  Radio,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { type ChatSession } from "../services/storage";
import { type OpenVerseMobileUser } from "../services/auth";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenHub: () => void;
  onOpenSettings: () => void;
  isHubConnected: boolean;
  user: OpenVerseMobileUser | null;
}

export function MobileDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenHub,
  onOpenSettings,
  isHubConnected,
  user,
}: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-surface border-r border-border p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-white text-base">
              OPEN-VERSE
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-surface-hover hover:text-white"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* New Chat Action */}
        <div className="py-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-950/40 hover:bg-violet-500 active:scale-95 transition-all"
          >
            <Plus className="size-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          <span className="px-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Recent Chats
          </span>

          {sessions.length === 0 ? (
            <div className="px-2 py-4 text-xs text-zinc-500 italic">
              No recent conversations yet.
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                  sess.id === activeSessionId
                    ? "bg-violet-600/15 border border-violet-500/30 text-violet-200"
                    : "text-zinc-300 hover:bg-surface-hover hover:text-white"
                }`}
              >
                <button
                  onClick={() => {
                    onSelectSession(sess.id);
                    onClose();
                  }}
                  className="flex flex-1 items-center gap-2 truncate text-left"
                >
                  <MessageSquare className="size-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{sess.title}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(sess.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                  aria-label="Delete chat"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-border pt-3 space-y-2">
          {/* Desktop Hub pairing trigger */}
          <button
            onClick={() => {
              onOpenHub();
              onClose();
            }}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-surface-card px-3 py-2 text-xs text-zinc-300 hover:border-zinc-700 hover:bg-surface-hover transition-all"
          >
            <div className="flex items-center gap-2">
              <Radio className={`size-4 ${isHubConnected ? "text-emerald-400" : "text-zinc-400"}`} />
              <span>Desktop Hub</span>
            </div>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-mono ${
                isHubConnected
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {isHubConnected ? "Connected" : "Offline"}
            </span>
          </button>

          {/* Settings & Account */}
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-zinc-800 bg-surface-card px-3 py-2 text-xs text-zinc-300 hover:border-zinc-700 hover:bg-surface-hover transition-all"
          >
            <Settings className="size-4 text-zinc-400" />
            <span>Settings & Models</span>
          </button>

          {/* User profile info */}
          <div className="flex items-center gap-2 px-1 pt-1 text-[11px] text-zinc-400">
            <span className="size-2 rounded-full bg-violet-400" />
            <span className="truncate font-medium text-zinc-300">
              {user?.displayName || "Local Developer"}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase">
              ({user?.provider || "local"})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
