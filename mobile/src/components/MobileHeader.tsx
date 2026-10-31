import React from "react";
import { ArrowDownCircle, Laptop, Menu, Radio, Sparkles } from "lucide-react";
import { type OpenVerseMobileUser } from "../services/auth";

interface MobileHeaderProps {
  onOpenMenu: () => void;
  onOpenHub: () => void;
  onOpenSettings: () => void;
  onOpenUpdate?: () => void;
  updateAvailable?: boolean;
  isHubConnected: boolean;
  executionMode?: "direct" | "hub";
  onToggleExecutionMode?: () => void;
  activeProvider: string;
  activeModel: string;
  user: OpenVerseMobileUser | null;
}

export function MobileHeader({
  onOpenMenu,
  onOpenHub,
  onOpenSettings,
  onOpenUpdate,
  updateAvailable = false,
  isHubConnected,
  executionMode = "direct",
  onToggleExecutionMode,
  activeProvider,
  activeModel,
  user,
}: MobileHeaderProps) {
  const initial = user?.displayName?.charAt(0).toUpperCase() || (user?.isOfflineMode ? "L" : "O");

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-3 pt-safe select-none">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMenu}
          className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-surface-hover hover:text-zinc-100 active:scale-95 transition-all"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-sm shadow-violet-900/30">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                OPEN-VERSE
              </span>
              <span className="rounded bg-violet-500/10 px-1 py-0.2 text-[9px] font-mono text-violet-400 border border-violet-500/20">
                v0.2.0
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-none mt-0.5 font-medium">
              Mobile AI Studio
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Update available badge */}
        {updateAvailable && (
          <button
            onClick={onOpenUpdate}
            className="flex items-center gap-1 rounded-full bg-violet-600/20 border border-violet-500/40 px-2 py-1 text-[10px] font-medium text-violet-300 animate-pulse hover:bg-violet-600/30 transition-all"
            title="New update available"
          >
            <ArrowDownCircle className="size-3 text-violet-400" />
            <span>Update</span>
          </button>
        )}

        {/* Hub status badge & Mode toggle */}
        <button
          onClick={isHubConnected && onToggleExecutionMode ? onToggleExecutionMode : onOpenHub}
          className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium border transition-all ${isHubConnected
              ? executionMode === "hub"
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-violet-500/40 bg-violet-500/15 text-violet-300"
              : "border-zinc-800 bg-surface-card text-zinc-400 hover:text-zinc-300"
            }`}
          title={
            isHubConnected
              ? `Mode: ${executionMode === "hub" ? "Desktop Agent" : "Direct AI"}. Tap to switch.`
              : "Direct Client Mode (Tap to pair Hub)"
          }
        >
          {isHubConnected ? (
            <>
              {executionMode === "hub" ? (
                <>
                  <Laptop className="size-3 text-emerald-400" />
                  <span className="font-mono text-[10px]">Desktop Agent</span>
                </>
              ) : (
                <>
                  <Radio className="size-3 text-violet-400" />
                  <span className="font-mono text-[10px]">Direct Client</span>
                </>
              )}
            </>
          ) : (
            <>
              <Radio className="size-3 text-violet-400" />
              <span className="font-mono text-[10px] capitalize">{activeProvider}</span>
            </>
          )}
        </button>

        {/* User avatar / profile button */}
        <button
          onClick={onOpenSettings}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
          aria-label="User account and settings"
        >
          {initial}
        </button>
      </div>
    </header>
  );
}
