import React from "react";
import { ArrowDownCircle, Check, Sparkles, X } from "lucide-react";
import { type MobileUpdateInfo } from "../services/updater";

interface MobileUpdateModalProps {
  updateInfo: MobileUpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileUpdateModal({
  updateInfo,
  isOpen,
  onClose,
}: MobileUpdateModalProps) {
  if (!isOpen || !updateInfo || !updateInfo.available) return null;

  const handleUpdate = () => {
    if (window.AndroidInterface && typeof window.AndroidInterface.downloadAndInstallApk === "function") {
      window.AndroidInterface.downloadAndInstallApk(updateInfo.downloadUrl);
    } else if (window.AndroidInterface && typeof window.AndroidInterface.openExternalUrl === "function") {
      window.AndroidInterface.openExternalUrl(updateInfo.downloadUrl);
    } else {
      window.open(updateInfo.downloadUrl, "_blank");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl border border-violet-500/30 bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600">
              <Sparkles className="size-4 text-white" />
            </div>
            <h3 className="font-bold text-white text-base">Update Available</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-zinc-400">Installed Version</span>
            <span className="font-mono text-xs text-zinc-300 font-semibold">
              v{updateInfo.currentVersion}
            </span>
          </div>
          <span className="text-zinc-600">→</span>
          <div className="flex flex-col">
            <span className="text-[11px] text-violet-400 font-medium">New Version</span>
            <span className="font-mono text-xs text-emerald-400 font-bold">
              v{updateInfo.latestVersion}
            </span>
          </div>
        </div>

        {updateInfo.releaseNotes && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-background/60 p-3 max-h-36 overflow-y-auto">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Release Notes
            </span>
            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {updateInfo.releaseNotes}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleUpdate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-950/40 active:scale-95 transition-all"
          >
            <ArrowDownCircle className="size-4" />
            <span>Download & Install Update</span>
          </button>

          <button
            onClick={onClose}
            className="flex w-full items-center justify-center py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}

