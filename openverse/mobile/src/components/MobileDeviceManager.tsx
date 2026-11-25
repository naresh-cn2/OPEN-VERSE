import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Apple,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  Laptop,
  Power,
  Radio,
  RefreshCw,
  Shield,
  Smartphone,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import {
  mobileDeviceNetwork,
  type OpenVerseDevice,
  type CrossDeviceCommand,
} from "../services/device-network";
import { type OpenVerseMobileUser } from "../services/auth";

interface MobileDeviceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  user: OpenVerseMobileUser | null;
  activeHostId: string | null;
  onSelectHost: (deviceId: string) => void;
}

export function MobileDeviceManager({
  isOpen,
  onClose,
  user,
  activeHostId,
  onSelectHost,
}: MobileDeviceManagerProps) {
  const [devices, setDevices] = useState<OpenVerseDevice[]>(
    mobileDeviceNetwork.getKnownDevices()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleDevicesUpdate = (e: any) => {
      if (Array.isArray(e.detail?.devices)) {
        setDevices(e.detail.devices);
      }
    };

    window.addEventListener("openverse:devices-updated", handleDevicesUpdate);
    return () =>
      window.removeEventListener("openverse:devices-updated", handleDevicesUpdate);
  }, []);

  if (!isOpen) return null;

  const currentDeviceId = mobileDeviceNetwork.getDeviceId();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mobileDeviceNetwork.heartbeat();
    setDevices(mobileDeviceNetwork.getKnownDevices());
    setIsRefreshing(false);
  };

  const handleRevoke = async (deviceId: string, deviceName: string) => {
    setRevokingId(deviceId);
    try {
      await mobileDeviceNetwork.revokeDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      setStatusNotice(`Revoked access for '${deviceName}'`);
      setTimeout(() => setStatusNotice(null), 3000);
    } catch {
      setStatusNotice("Failed to revoke device access");
    } finally {
      setRevokingId(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "windows":
        return <Laptop className="size-4 text-sky-400" />;
      case "macos":
        return <Apple className="size-4 text-purple-400" />;
      case "linux":
        return <Terminal className="size-4 text-emerald-400" />;
      case "android":
      case "ios":
        return <Smartphone className="size-4 text-indigo-400" />;
      default:
        return <Radio className="size-4 text-zinc-400" />;
    }
  };

  const formatLastSeen = (isoString?: string) => {
    if (!isoString) return "Recently";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 35) return "Active now";
    if (diff < 120) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-zinc-800 bg-[#0d0c14] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Laptop className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm leading-tight">
                Personal Device Network
              </h3>
              <p className="text-[11px] text-zinc-400 leading-tight">
                {user?.email || "Personal OPEN-VERSE Account"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
              title="Refresh device status"
            >
              <RefreshCw
                className={`size-4 ${isRefreshing ? "animate-spin text-violet-400" : ""}`}
              />
            </button>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {statusNotice && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-2.5 text-xs text-violet-300 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-violet-400" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Section: Architecture explanation */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-950/15 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
              <Cpu className="size-3.5" />
              <span>One Personal Agent Across All Devices</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Your complete Hermes Agent runs securely on your connected host computer.
              When away, tasks assigned from this phone route directly to your host machine.
            </p>
          </div>

          {/* Device list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Connected Devices ({devices.length})
              </span>
              <span className="text-[10px] text-zinc-500">
                Auto-refreshes every 20s
              </span>
            </div>

            {devices.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center text-xs text-zinc-500">
                No other devices connected yet. Open OPEN-VERSE on your Windows, Mac, or Linux computer and sign in with the same Google account.
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((dev) => {
                  const isCurrent = dev.deviceId === currentDeviceId;
                  const isComputer =
                    dev.platform === "windows" ||
                    dev.platform === "macos" ||
                    dev.platform === "linux";
                  const isHost = activeHostId === dev.deviceId || (!activeHostId && isComputer && dev.isOnline);

                  return (
                    <div
                      key={dev.deviceId}
                      className={`rounded-xl border p-3.5 transition-all ${
                        isHost
                          ? "border-violet-500/40 bg-violet-950/20"
                          : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 rounded-lg bg-zinc-800 p-1.5">
                            {getPlatformIcon(dev.platform)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {dev.deviceName}
                              </span>
                              {isCurrent && (
                                <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-medium text-indigo-300 border border-indigo-500/30">
                                  This Phone
                                </span>
                              )}
                              {isHost && (
                                <span className="rounded bg-violet-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-violet-300 border border-violet-500/30 flex items-center gap-1">
                                  <Cpu className="size-2.5" />
                                  <span>Agent Host</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 mt-1 text-[11px] text-zinc-400">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`size-2 rounded-full ${
                                    dev.isOnline
                                      ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"
                                      : "bg-zinc-600"
                                  }`}
                                />
                                <span
                                  className={
                                    dev.isOnline ? "text-emerald-400 font-medium" : "text-zinc-500"
                                  }
                                >
                                  {dev.isOnline ? "Online" : "Offline"}
                                </span>
                              </div>
                              <span>•</span>
                              <span>{formatLastSeen(dev.lastSeenAt)}</span>
                              {dev.appVersion && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] text-zinc-500">
                                    v{dev.appVersion}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <div className="flex items-center gap-1">
                            {isComputer && !isHost && (
                              <button
                                onClick={() => onSelectHost(dev.deviceId)}
                                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-[10px] font-medium text-zinc-200 transition-colors"
                              >
                                Use as Host
                              </button>
                            )}
                            <button
                              onClick={() => handleRevoke(dev.deviceId, dev.deviceName)}
                              disabled={revokingId === dev.deviceId}
                              className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Revoke device access"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-emerald-400" />
            <span>End-to-End Google Auth &amp; Session Isolation</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-medium text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
