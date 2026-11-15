"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { OpenVerseRobot } from "@/components/open-verse-robot";
import { Button } from "@/components/ui/button";
import { openExternalUrl } from "@/lib/desktop-client";
import { markOnboardingCompleted } from "@/lib/onboarding";
import {
	type OpenVerseUser,
	completeOAuthCallback,
	initiateOAuthSignIn,
} from "@/lib/open-verse-auth";
import { FirstTimeOnboarding } from "./first-time-onboarding";

const PRIVACY_URL = "https://open-verse-website.vercel.app/privacy";
const TERMS_URL = "https://open-verse-website.vercel.app/terms";

// Official Google G SVG
export function GoogleIcon({ className = "size-5" }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" width="20" height="20">
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
				fill="#EA4335"
			/>
		</svg>
	);
}

interface OpenVerseAuthProps {
	initialScreen?: string;
	onAuthenticated: (user: OpenVerseUser) => void;
}

export function OpenVerseAuth({ onAuthenticated }: OpenVerseAuthProps) {
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successNotice, setSuccessNotice] = useState<string | null>(null);
	const [pendingOnboardingUser, setPendingOnboardingUser] = useState<OpenVerseUser | null>(null);

	// Deep link and OAuth callback handler
	useEffect(() => {
		const handleDeepLink = async (rawUrl: string) => {
			if (
				!rawUrl ||
				(!rawUrl.includes("openverse://") &&
					!rawUrl.includes("access_token=") &&
					!rawUrl.includes("code=") &&
					!rawUrl.includes("id_token=") &&
					!rawUrl.includes("auth=callback"))
			) {
				return;
			}
			setLoading(true);
			setErrorMessage(null);
			setSuccessNotice(null);
			try {
				const session = await completeOAuthCallback(rawUrl, "google");
				if (!session.user.onboardingCompleted) {
					setPendingOnboardingUser(session.user);
				} else {
					markOnboardingCompleted();
					setSuccessNotice(`Welcome back, ${session.user.displayName || session.user.email}!`);
					setTimeout(() => onAuthenticated(session.user), 400);
				}
			} catch (err) {
				setErrorMessage(err instanceof Error ? err.message : String(err));
			} finally {
				setLoading(false);
			}
		};

		(window as any).__dispatchOpenVerseDeepLink = (url: string) => {
			void handleDeepLink(url);
		};

		const checkForCallback = () => {
			if (typeof window === "undefined") return;

			// Check query parameters (Google redirect returns ?code=...)
			const search = window.location.search;
			if (search && (search.includes("code=") || search.includes("access_token="))) {
				const fullQuery = search.startsWith("?") ? search.slice(1) : search;
				try {
					window.history.replaceState({}, document.title, window.location.pathname);
				} catch {
					// ignore
				}
				void handleDeepLink(fullQuery);
				return;
			}

			// Check hash
			const hash = window.location.hash;
			if (
				hash &&
				(hash.includes("openverse://") ||
					hash.includes("access_token=") ||
					hash.includes("code=") ||
					hash.includes("id_token=") ||
					hash.includes("auth=callback"))
			) {
				const cleanHash = hash.startsWith("#") ? hash.slice(1) : hash;
				try {
					window.history.replaceState({}, document.title, window.location.pathname);
				} catch {
					// ignore
				}
				void handleDeepLink(cleanHash);
			}
		};

		checkForCallback();
		window.addEventListener("hashchange", checkForCallback);

		let unlistenDeeplink: (() => void) | undefined;
		if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
			import("@tauri-apps/api/event")
				.then(({ listen }) => {
					listen<string>("openverse_deeplink", (event) => {
						if (event.payload) void handleDeepLink(event.payload);
					})
						.then((fn) => {
							unlistenDeeplink = fn;
						})
						.catch(() => {});
				})
				.catch(() => {});
		}

		return () => {
			delete (window as any).__dispatchOpenVerseDeepLink;
			window.removeEventListener("hashchange", checkForCallback);
			if (unlistenDeeplink) unlistenDeeplink();
		};
	}, [onAuthenticated]);

	// Continue with Google using Google's native account chooser
	const handleContinueWithGoogle = async () => {
		setLoading(true);
		setErrorMessage(null);
		try {
			await initiateOAuthSignIn("google");
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
			setLoading(false);
		}
	};

	// If pending first-time onboarding, display the 4-step wizard
	if (pendingOnboardingUser) {
		return (
			<FirstTimeOnboarding
				user={pendingOnboardingUser}
				onFinished={(user) => {
					onAuthenticated(user);
				}}
			/>
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090d]/95 p-4 backdrop-blur-2xl">
			{/* Ambient Gradient Glow */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-violet-600/12 blur-[130px]" />
				<div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 size-[350px] rounded-full bg-indigo-600/10 blur-[100px]" />
			</div>

			<div
				className="relative w-full max-w-sm rounded-3xl border border-zinc-800/80 bg-[#111116]/95 p-8 shadow-2xl backdrop-blur-xl"
				data-openverse-auth-container
			>
				{/* Top Branding: simple and authentic */}
				<div className="flex flex-col items-center text-center">
					<div className="mb-5 flex justify-center">
						<OpenVerseRobot size={96} />
					</div>

					<h1 className="text-2xl font-bold tracking-tight text-white">
						OPEN-VERSE
					</h1>

					<p className="mt-2 text-sm text-zinc-400">
						Your AI workspace, everywhere.
					</p>
				</div>

				{/* Notifications */}
				{errorMessage && (
					<div
						className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
						role="alert"
					>
						<AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
						<div className="flex-1 leading-relaxed">{errorMessage}</div>
					</div>
				)}

				{successNotice && (
					<div
						className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300"
						role="status"
					>
						<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
						<div className="flex-1 leading-relaxed">{successNotice}</div>
					</div>
				)}

				{/* Main Action Area: Google Only */}
				<div className="mt-7 flex flex-col gap-3">
					{/* Primary Continue with Google Button */}
					<Button
						className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm rounded-xl flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-70"
						disabled={loading}
						onClick={handleContinueWithGoogle}
						type="button"
					>
						{loading ? (
							<Loader2 className="size-5 animate-spin text-zinc-900" />
						) : (
							<GoogleIcon className="size-5 shrink-0" />
						)}
						<span>Continue with Google</span>
					</Button>
				</div>

				{/* Footer links */}
				<div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 border-t border-zinc-800/60 pt-4">
					<button
						className="hover:text-zinc-300 transition-colors underline-offset-4 hover:underline"
						onClick={() => void openExternalUrl(TERMS_URL)}
						type="button"
					>
						Terms of Service
					</button>
					<span>•</span>
					<button
						className="hover:text-zinc-300 transition-colors underline-offset-4 hover:underline"
						onClick={() => void openExternalUrl(PRIVACY_URL)}
						type="button"
					>
						Privacy Policy
					</button>
				</div>
			</div>
		</div>
	);
}
