"use client";

import { Laptop, Loader2, RefreshCw, Smartphone, Wifi } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { OpenVerseRobot } from "@/components/open-verse-robot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	WindowTitleBar,
	WindowTitleBarProvider,
} from "@/components/window-title-bar";
import type { useHubStartup } from "@/hooks/use-hub-startup";
import { desktopClient, isTauriAvailable } from "@/lib/desktop-client";
import { setStoredHubEndpoint } from "@/lib/standalone-runner";

const BACKEND_UNRESPONSIVE_MS = 10_000;

/**
 * Shown instead of the app while local Hub startup is in progress or has failed, so the
 * user gets Retry and a diagnostics export instead of Hub errors from
 * whichever feature they tried first.
 */
export function HubStartupScreen({
	transport,
	hub,
}: ReturnType<typeof useHubStartup>) {
	const connected = transport === "connected";
	const [backendUnresponsive, setBackendUnresponsive] = useState(false);
	const [exportStatus, setExportStatus] = useState<string | null>(null);
	const [hubInput, setHubInput] = useState("");
	const [showHubInput, setShowHubInput] = useState(false);

	// Auto-enable standalone mode on mobile/web when no desktop hub is configured
	useEffect(() => {
		if (!isTauriAvailable() && !desktopClient.isHubConfigured() && !connected) {
			const timer = setTimeout(() => {
				desktopClient.enableStandaloneMode();
			}, 1500);
			return () => clearTimeout(timer);
		}
	}, [connected]);

	// The client keeps reconnecting on its own; only call it out once it has
	// been unreachable for a while.
	useEffect(() => {
		setBackendUnresponsive(false);
		if (connected) return;
		const timer = setTimeout(
			() => setBackendUnresponsive(true),
			BACKEND_UNRESPONSIVE_MS,
		);
		return () => clearTimeout(timer);
	}, [connected]);

	const exportDiagnostics = async () => {
		setExportStatus("Exporting diagnostics…");
		try {
			const result = await desktopClient.invoke<{ path: string }>(
				"export_diagnostics",
			);
			setExportStatus(`Diagnostics saved to ${result.path}`);
		} catch (error) {
			setExportStatus(error instanceof Error ? error.message : String(error));
		}
	};

	const handleConnectHub = (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!hubInput.trim()) return;
		let endpoint = hubInput.trim();
		if (!endpoint.startsWith("ws://") && !endpoint.startsWith("wss://")) {
			endpoint = `ws://${endpoint}`;
		}
		if (!endpoint.includes("/transport")) {
			endpoint = endpoint.replace(/\/$/, "") + "/transport";
		}
		setStoredHubEndpoint(endpoint);
		window.location.reload();
	};

	let content: ReactNode;
	if (!connected && backendUnresponsive) {
		content = (
			<div className="flex flex-col items-center gap-4 text-center max-w-sm">
				<OpenVerseRobot size={64} />
				<h1 className="text-lg font-bold text-white">
					OPEN-VERSE Connection
				</h1>
				<p className="text-xs text-muted-foreground leading-relaxed">
					No local desktop backend was detected on this device. You can chat
					directly on your device or pair with your computer's Desktop Hub.
				</p>

				<div className="flex w-full flex-col gap-2.5 pt-2">
					<Button
						className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2 font-medium"
						onClick={() => desktopClient.enableStandaloneMode()}
					>
						<Smartphone className="size-4" />
						Continue on Device (Standalone)
					</Button>

					{showHubInput ? (
						<form onSubmit={handleConnectHub} className="flex flex-col gap-2 pt-2">
							<Input
								placeholder="e.g. 192.168.1.100:3126"
								value={hubInput}
								onChange={(e) => setHubInput(e.target.value)}
								className="text-xs font-mono text-center h-9"
							/>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1 text-xs"
									onClick={() => setShowHubInput(false)}
								>
									Cancel
								</Button>
								<Button type="submit" className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
									Connect
								</Button>
							</div>
						</form>
					) : (
						<Button
							variant="outline"
							className="w-full border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 gap-2 text-xs"
							onClick={() => setShowHubInput(true)}
						>
							<Wifi className="size-3.5" />
							Pair with Desktop Hub (PC)
						</Button>
					)}

					<Button
						variant="ghost"
						className="text-xs text-zinc-500 hover:text-zinc-300 gap-1.5 h-8 mt-1"
						onClick={() => window.location.reload()}
					>
						<RefreshCw className="size-3" />
						Retry Connection
					</Button>
				</div>
			</div>
		);
	} else if (connected && hub.state === "failed") {
		content = (
			<>
				<OpenVerseRobot size={56} />
				<h1 className="text-base font-medium">
					OPEN VERSE couldn't connect to its Hub
				</h1>
				<p className="text-sm text-muted-foreground">
					{hub.error} Retry, or export diagnostics if this keeps happening.
				</p>
				<div className="flex gap-2">
					<Button onClick={() => void desktopClient.invoke("retry_hub")}>
						Retry
					</Button>
					<Button
						variant="outline"
						onClick={() => desktopClient.enableStandaloneMode()}
					>
						Continue Standalone
					</Button>
					<Button variant="outline" onClick={() => void exportDiagnostics()}>
						Export diagnostics
					</Button>
				</div>
				{exportStatus ? (
					<p className="break-all text-xs text-muted-foreground">
						{exportStatus}
					</p>
				) : null}
			</>
		);
	} else {
		content = (
			<>
				<OpenVerseRobot size={64} />
				<div className="flex items-center gap-2 pt-2">
					<Loader2
						aria-hidden="true"
						className="size-5 animate-spin text-violet-400"
					/>
					<output className="text-sm font-medium text-zinc-300">
						Starting OPEN VERSE…
					</output>
				</div>
			</>
		);
	}

	// Below dialogs (z-50) so the Hub update prompt stays on top. The title bar
	// keeps the drag region and, on frameless Windows, the window controls.
	return (
		<main className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
			<WindowTitleBarProvider contentEnabled={false}>
				<WindowTitleBar
					className="absolute inset-x-0 top-0"
					hostContent={false}
				/>
			</WindowTitleBarProvider>
			<div className="flex max-w-md flex-col items-center gap-4">{content}</div>
		</main>
	);
}
