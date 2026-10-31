import React, { useState, useEffect } from "react";
import { CheckCircle2, Laptop, Loader2, Radio, RefreshCw, Unplug, X } from "lucide-react";
import {
  type HubConnectionConfig,
  getStoredHubConfig,
  saveHubConfig,
} from "../services/storage";
import { remoteHub, type HubWorkspace, type HubStatusMessage } from "../services/remote-hub";

interface MobileHubPairingProps {
  isOpen: boolean;
  onClose: () => void;
  onHubStatusChange: (connected: boolean) => void;
}

export function MobileHubPairing({
  isOpen,
  onClose,
  onHubStatusChange,
}: MobileHubPairingProps) {
  const [config, setConfig] = useState<HubConnectionConfig>(getStoredHubConfig());
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(remoteHub.isConnected());
  const [workspaces, setWorkspaces] = useState<HubWorkspace[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = remoteHub.subscribe((msg: HubStatusMessage) => {
      if (msg.type === "status") {
        setConnected(msg.connected);
        onHubStatusChange(msg.connected);
        if (msg.connected) {
          setStatusMessage("Connected to OPEN-VERSE Desktop Hub");
        }
      } else if (msg.type === "workspaces" && msg.workspaces) {
        setWorkspaces(msg.workspaces);
      } else if (msg.type === "error" && msg.error) {
        setStatusMessage(msg.error);
        setConnected(false);
        onHubStatusChange(false);
      }
    });

    return () => unsubscribe();
  }, [onHubStatusChange]);

  if (!isOpen) return null;

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setConnecting(true);
    setStatusMessage("Connecting to Desktop Hub...");
    saveHubConfig(config);

    const success = await remoteHub.connect(config);
    setConnecting(false);
    setConnected(success);
    onHubStatusChange(success);
    if (!success) {
      setStatusMessage(`Unable to connect to ws://${config.host}:${config.port}/hub`);
    }
  };

  const handleDisconnect = () => {
    remoteHub.disconnect();
    setConnected(false);
    onHubStatusChange(false);
    setStatusMessage("Disconnected from Desktop Hub");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-violet-400" />
            <h3 className="font-bold text-white text-base">Desktop Hub Companion</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          Pair with your running OPEN-VERSE desktop application on your local Wi-Fi network to control workspaces and monitor agents remotely.
        </p>

        {statusMessage && (
          <div
            className={`mt-3 rounded-lg p-2.5 text-xs flex items-center gap-2 ${
              connected
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-zinc-800/60 border border-zinc-700/40 text-zinc-300"
            }`}
          >
            {connected ? (
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            ) : (
              <Radio className="size-4 text-zinc-400 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleConnect} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-zinc-400">Desktop Host / IP</label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="e.g. 192.168.1.100 or 10.0.2.2"
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-background px-3 py-2 text-xs text-zinc-100 font-mono focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400">Port (Default: 25463)</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: Number(e.target.value) || 25463 })}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-background px-3 py-2 text-xs text-zinc-100 font-mono focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            {connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/90 hover:bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all"
              >
                <Unplug className="size-4" />
                <span>Disconnect Hub</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={connecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-950/40 transition-all"
              >
                {connecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Radio className="size-4" />
                )}
                <span>Connect to Desktop Hub</span>
              </button>
            )}
          </div>
        </form>

        {/* Remote workspaces */}
        {connected && workspaces.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Desktop Workspaces ({workspaces.length})
            </span>
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center gap-2 rounded-lg bg-surface-card px-2.5 py-1.5 text-xs text-zinc-300"
                >
                  <Laptop className="size-3.5 text-violet-400" />
                  <span className="font-medium text-white">{ws.name}</span>
                  <span className="truncate text-[10px] text-zinc-500 font-mono">{ws.path}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
