import React, { useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Laptop,
  LogOut,
  Save,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react";
import {
  type ModelProviderKeys,
  getStoredProviderKeys,
  saveProviderKeys,
} from "../services/storage";
import {
  type OpenVerseMobileUser,
  startMobileOAuth,
  loginOfflineMode,
  saveMobileSession,
} from "../services/auth";

interface MobileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: OpenVerseMobileUser | null;
  onUserChange: (user: OpenVerseMobileUser | null) => void;
  onProviderConfigChange: (config: ModelProviderKeys) => void;
}

export function MobileSettings({
  isOpen,
  onClose,
  user,
  onUserChange,
  onProviderConfigChange,
}: MobileSettingsProps) {
  const [providerKeys, setProviderKeys] = useState<ModelProviderKeys>(getStoredProviderKeys());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProviders = (e: React.FormEvent) => {
    e.preventDefault();
    saveProviderKeys(providerKeys);
    onProviderConfigChange(providerKeys);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleOAuth = (provider: "google" | "github") => {
    startMobileOAuth(provider);
  };

  const handleOfflineMode = () => {
    const session = loginOfflineMode();
    onUserChange(session.user);
  };

  const handleSignOut = () => {
    saveMobileSession(null);
    onUserChange(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-sm flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base">Settings</h3>
            <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-mono text-violet-400 border border-violet-500/20">
              v0.2.0
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section: OPEN-VERSE Identity Account */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Shield className="size-3.5 text-violet-400" />
              <span>OPEN-VERSE Account</span>
            </div>

            {user ? (
              <div className="rounded-xl border border-zinc-800 bg-surface-card p-3.5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 font-bold text-white text-sm">
                    {user.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white">{user.displayName}</span>
                    <span className="text-xs text-zinc-400 font-mono">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 capitalize">
                    {user.provider} Auth
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    <LogOut className="size-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-surface-card p-3.5 space-y-2">
                <p className="text-xs text-zinc-400">Sign in with your preferred account:</p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => handleOAuth("google")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700/80 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
                  >
                    <span>Continue with Google</span>
                  </button>
                  <button
                    onClick={() => handleOAuth("github")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700/80 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
                  >
                    <span>Continue with GitHub</span>
                  </button>
                  <button
                    onClick={handleOfflineMode}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950/40 border border-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200"
                  >
                    <Laptop className="size-3" />
                    <span>Continue in Offline / Local Mode</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section: AI Model Providers */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <KeyRound className="size-3.5 text-violet-400" />
              <span>AI Model Providers</span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
              Model providers are completely separate from your OPEN-VERSE account. Enter API keys for the providers you want to stream directly on mobile:
            </p>

            <form onSubmit={handleSaveProviders} className="space-y-3">
              {/* Active Provider Selector */}
              <div>
                <label className="text-[11px] font-medium text-zinc-400">Active Provider</label>
                <select
                  value={providerKeys.selectedProvider}
                  onChange={(e) => {
                    const prov = e.target.value as any;
                    let defaultModel = "gemini-2.5-flash";
                    if (prov === "anthropic") defaultModel = "claude-3-7-sonnet-20250219";
                    if (prov === "openai") defaultModel = "gpt-4o";
                    if (prov === "ollama") defaultModel = "llama3.2";
                    if (prov === "openrouter") defaultModel = "anthropic/claude-3.5-sonnet";
                    setProviderKeys({ ...providerKeys, selectedProvider: prov, selectedModel: defaultModel });
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-background px-3 py-2 text-xs text-zinc-100 font-medium focus:border-violet-500 focus:outline-none capitalize"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="ollama">Ollama (Local / LAN)</option>
                </select>
              </div>

              {/* Model identifier */}
              <div>
                <label className="text-[11px] font-medium text-zinc-400">Model Name</label>
                <input
                  type="text"
                  value={providerKeys.selectedModel}
                  onChange={(e) => setProviderKeys({ ...providerKeys, selectedModel: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-background px-3 py-2 text-xs text-zinc-100 font-mono focus:border-violet-500 focus:outline-none"
                  placeholder="e.g. gemini-2.5-flash, gpt-4o"
                />
              </div>

              {/* Provider Key Inputs */}
              <div>
                <label className="text-[11px] font-medium text-zinc-400">Google Gemini API Key</label>
                <input
                  type="password"
                  value={providerKeys.geminiApiKey || ""}
                  onChange={(e) => setProviderKeys({ ...providerKeys, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-background px-3 py-2 text-xs text-zinc-100 font-mono focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400">Anthropic API Key</label>
                <input
                  type="password"
                  value={providerKeys.anthropicApiKey || ""}
                  onChange={(e) => setProviderKeys({ ...providerKeys, anthropicApiKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-background px-3 py-2 text-xs text-zinc-100 font-mono focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400">OpenAI API Key</label>
                <input
                  type="password"
                  value={providerKeys.openaiApiKey || ""}
                  onChange={(e) => setProviderKeys({ ...providerKeys, openaiApiKey: e.target.value })}
                  placeholder="sk-proj-..."
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-background px-3 py-2 text-xs text-zinc-100 font-mono focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400">Ollama Host URL</label>
                <input
                  type="text"
                  value={providerKeys.ollamaBaseUrl || ""}
                  onChange={(e) => setProviderKeys({ ...providerKeys, ollamaBaseUrl: e.target.value })}
                  placeholder="http://10.0.2.2:11434"
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-background px-3 py-2 text-xs text-zinc-100 font-mono focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-950/40 transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-300" />
                      <span>Settings Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>Save Provider Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
