"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import { desktopClient, isTauriAvailable } from "@/lib/desktop-client";
import {
	checkForAppUpdate,
	installAvailableUpdate,
	type UpdateCheckResult,
} from "@/lib/open-verse-updater";

export type AppUpdateStatus = {
	state: "idle" | "checking" | "downloading" | "ready" | "error";
	version?: string | null;
	error?: string | null;
	details?: UpdateCheckResult | null;
};

const POLL_INTERVAL_MS = 30_000;

const IDLE_STATUS: AppUpdateStatus = { state: "idle" };

// Module-scoped store so the toast (page shell) and the sidebar update
// indicator observe the same polled status without extra polling loops.
let currentStatus: AppUpdateStatus = IDLE_STATUS;
const statusListeners = new Set<() => void>();

function statusesEqual(a: AppUpdateStatus, b: AppUpdateStatus): boolean {
	return (
		a.state === b.state &&
		(a.version ?? null) === (b.version ?? null) &&
		(a.error ?? null) === (b.error ?? null)
	);
}

function setUpdateStatus(status: AppUpdateStatus) {
	if (statusesEqual(currentStatus, status)) {
		return;
	}
	currentStatus = status;
	for (const listener of statusListeners) {
		listener();
	}
}

function subscribeToUpdateStatus(listener: () => void): () => void {
	statusListeners.add(listener);
	return () => {
		statusListeners.delete(listener);
	};
}

function getUpdateStatusSnapshot(): AppUpdateStatus {
	return currentStatus;
}

function getUpdateStatusServerSnapshot(): AppUpdateStatus {
	return IDLE_STATUS;
}

/**
 * Read the latest auto-updater status. Reflects the polling performed by
 * `useAppUpdate()` (mounted once in the page shell); stays "idle" in
 * web/sidecar mode where there is no app bundle to update.
 */
export function useAppUpdateStatus(): AppUpdateStatus {
	return useSyncExternalStore(
		subscribeToUpdateStatus,
		getUpdateStatusSnapshot,
		getUpdateStatusServerSnapshot,
	);
}

/**
 * Ask the shell or release server to check for an update right now.
 * Works across Desktop Tauri, Android, iOS, and Web.
 */
export async function checkForUpdateNow(): Promise<AppUpdateStatus | null> {
	if (isTauriAvailable()) {
		try {
			const status = await desktopClient.invoke<AppUpdateStatus>(
				"check_for_update_now",
			);
			setUpdateStatus(status);
			return status;
		} catch {
			return null;
		}
	}

	try {
		setUpdateStatus({ state: "checking" });
		const result = await checkForAppUpdate();
		if (result.updateAvailable) {
			const status: AppUpdateStatus = {
				state: "ready",
				version: result.latestVersion,
				details: result,
			};
			setUpdateStatus(status);
			return status;
		}
		const status: AppUpdateStatus = {
			state: "idle",
			version: result.currentVersion,
			details: result,
		};
		setUpdateStatus(status);
		return status;
	} catch (err) {
		const status: AppUpdateStatus = {
			state: "error",
			error: err instanceof Error ? err.message : String(err),
		};
		setUpdateStatus(status);
		return status;
	}
}

/**
 * Restart the app or apply the downloaded update.
 * On Desktop: restarts to apply.
 * On Android: prompts Android package installer.
 * On Web: reloads window.
 */
export async function restartToApplyUpdate(): Promise<boolean> {
	if (isTauriAvailable()) {
		try {
			await desktopClient.invoke("restart_to_apply_update");
			return true;
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Restart failed",
				description: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}

	if (currentStatus.details) {
		try {
			const res = await installAvailableUpdate(currentStatus.details);
			toast({
				title: "Update",
				description: res.message,
			});
			return true;
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Update failed",
				description: err instanceof Error ? err.message : String(err),
			});
			return false;
		}
	}

	return false;
}

// Module-scoped so a page remount does not re-toast an update the user
// already dismissed while the Rust side still reports it as "ready".
let notifiedVersion: string | null = null;

function showUpdateReadyToast(version: string) {
	notifiedVersion = version;
	toast({
		title: `Update ready: v${version}`,
		description:
			"The new version has been downloaded. Restart now, or later from the update button in the header.",
		duration: Number.POSITIVE_INFINITY,
		className: "flex-col items-start gap-3 space-x-0",
		action: (
			<ToastAction
				altText="Restart now"
				onClick={() => {
					void restartToApplyUpdate();
				}}
			>
				Restart now
			</ToastAction>
		),
	});
}

/**
 * User-initiated check from the "Check for Updates..." menu item. Unlike the
 * silent background cycle, every outcome is reported: an update ready to
 * restart into, already up to date, or a failed check.
 */
export async function checkForUpdateAndNotify(): Promise<void> {
	const checking = toast({
		title: "Checking for updates...",
		duration: Number.POSITIVE_INFINITY,
	});
	const status = await checkForUpdateNow();
	checking.dismiss();
	if (!status) {
		toast({
			variant: "destructive",
			title: "Unable to check for updates",
			description:
				"The update check could not be started. Try again in a moment.",
		});
		return;
	}
	switch (status.state) {
		case "ready":
			if (status.version) {
				showUpdateReadyToast(status.version);
			}
			return;
		case "error":
			toast({
				variant: "destructive",
				title: "Update check failed",
				description: status.error ?? "Unknown error",
			});
			return;
		default:
			toast({
				title: "You're up to date",
				description: "You're already running the latest version of OPEN-VERSE.",
			});
	}
}

/**
 * Watches the Tauri shell's auto-updater. Updates are checked, downloaded, and
 * installed in the background by the Rust side; once one is staged this hook
 * surfaces a persistent toast offering a one-click restart into the new
 * version. Dismissing the toast is fine too — the staged update stays
 * reachable from the sidebar update indicator and takes effect on the next
 * launch regardless. No-op in web/sidecar mode where there is no app bundle
 * to update.
 */
export function useAppUpdate() {
	useEffect(() => {
		let cancelled = false;

		const poll = async () => {
			if (isTauriAvailable()) {
				let status: AppUpdateStatus;
				try {
					status =
						await desktopClient.invoke<AppUpdateStatus>("get_update_status");
				} catch {
					return;
				}
				if (cancelled) return;
				setUpdateStatus(status);
				if (status.state !== "ready" || !status.version) return;
				if (notifiedVersion === status.version) return;
				showUpdateReadyToast(status.version);
				return;
			}

			// Mobile / Web background check
			try {
				const result = await checkForAppUpdate();
				if (cancelled) return;
				if (result.updateAvailable) {
					const status: AppUpdateStatus = {
						state: "ready",
						version: result.latestVersion,
						details: result,
					};
					setUpdateStatus(status);
					if (notifiedVersion !== result.latestVersion) {
						showUpdateReadyToast(result.latestVersion);
					}
				}
			} catch {
				// Network error in background check, ignore
			}
		};

		void poll();
		const interval = setInterval(() => {
			void poll();
		}, POLL_INTERVAL_MS * 4); // Check every 2 minutes in background
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, []);
}
