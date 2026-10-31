"use client";

import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	ExternalLink,
	KeyRound,
	Laptop,
	Loader2,
	RotateCw,
	ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";
import { OpenVerseRobot } from "@/components/open-verse-robot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openExternalUrl } from "@/lib/desktop-client";
import {
	type AuthScreenState,
	type OpenVerseUser,
	completeOAuthCallback,
	continueInOfflineMode,
	initiateOAuthSignIn,
	isAuthConfigured,
} from "@/lib/open-verse-auth";

const PRIVACY_URL = "https://open-verse-website.vercel.app/privacy";
const TERMS_URL = "https://open-verse-website.vercel.app/terms";

// Google G logo SVG
function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" width="18" height="18">
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

// GitHub icon SVG
function GitHubIcon({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="currentColor"
			height="18"
			viewBox="0 0 24 24"
			width="18"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
		</svg>
	);
}

interface OpenVerseAuthProps {
	onAuthenticated: (user: OpenVerseUser) => void;
	initialScreen?: AuthScreenState;
}

export function OpenVerseAuth({
	onAuthenticated,
	initialScreen = "welcome",
}: OpenVerseAuthProps) {
	const [screen, setScreen] = useState<AuthScreenState>(initialScreen);
	const [pendingProvider, setPendingProvider] = useState<"google" | "github" | null>(null);
	const [manualToken, setManualToken] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successNotice, setSuccessNotice] = useState<string | null>(null);

	const clearErrors = () => {
		setErrorMessage(null);
		setSuccessNotice(null);
	};

	const handleOAuthLogin = async (provider: "google" | "github") => {
		clearErrors();
		setLoading(true);
		setPendingProvider(provider);
		try {
			const res = await initiateOAuthSignIn(provider);
			setSuccessNotice(
				`Browser opened for ${provider === "google" ? "Google" : "GitHub"} sign-in. Please authorize OPEN-VERSE to continue.`,
			);
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
			setPendingProvider(null);
		} finally {
			setLoading(false);
		}
	};

	const handleCompleteWithToken = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!manualToken.trim()) {
			setErrorMessage("Please enter or paste your authorization token or callback URL.");
			return;
		}
		clearErrors();
		setLoading(true);
		try {
			const session = await completeOAuthCallback(manualToken, pendingProvider || "google");
			setSuccessNotice("Authentication successful! Welcome to OPEN-VERSE.");
			onAuthenticated(session.user);
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleOfflineMode = () => {
		clearErrors();
		const session = continueInOfflineMode();
		onAuthenticated(session.user);
	};

	return (
		<div
			className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0e0e13]/90 p-8 shadow-2xl backdrop-blur-xl"
			data-openverse-auth-container
		>
			{/* Notifications */}
			{errorMessage && (
				<div
					className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300"
					role="alert"
				>
					<AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
					<div className="flex-1 leading-relaxed">{errorMessage}</div>
				</div>
			)}

			{successNotice && (
				<div
					className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300"
					role="status"
				>
					<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
					<div className="flex-1 leading-relaxed">{successNotice}</div>
				</div>
			)}

			{/* SCREEN: WELCOME */}
			{screen === "welcome" && (
				<div className="flex flex-col items-center text-center" data-openverse-auth-screen="welcome">
					<div className="mb-6 flex justify-center">
						<OpenVerseRobot size={110} />
					</div>

					<div className="flex items-center gap-2">
						<span className="text-3xl font-bold tracking-tight text-white">
							OPEN-VERSE
						</span>
						<Badge
							variant="outline"
							className="border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] uppercase font-mono px-1.5 py-0.5"
						>
							v0.2.0
						</Badge>
					</div>

					<p className="mt-2 text-sm font-medium text-violet-300">
						Your AI-powered development workspace
					</p>

					<p className="mt-4 text-xs leading-relaxed text-zinc-400 max-w-sm">
						Build, understand, and improve software with autonomous AI agents
						working alongside you locally on your machine.
					</p>

					<div className="mt-8 flex w-full flex-col gap-3">
						<Button
							className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-violet-900/30 transition-all h-10"
							onClick={() => {
								clearErrors();
								setScreen("auth_options");
							}}
							type="button"
						>
							Get Started
						</Button>

						<Button
							className="w-full border-zinc-700/80 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-200 h-10"
							onClick={() => {
								clearErrors();
								setScreen("auth_options");
							}}
							type="button"
							variant="outline"
						>
							Sign In
						</Button>

						<div className="relative my-2 flex items-center justify-center">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-zinc-800" />
							</div>
							<span className="relative bg-[#0e0e13] px-3 text-[11px] text-zinc-500 uppercase tracking-wider">
								or
							</span>
						</div>

						<Button
							className="w-full border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs h-9 flex items-center justify-center gap-2"
							onClick={handleOfflineMode}
							type="button"
							variant="ghost"
						>
							<Laptop className="size-3.5" />
							Continue in Offline / Local Mode
						</Button>
					</div>

					<div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
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
			)}

			{/* SCREEN: ACCOUNT OPTIONS (Continue with Google or GitHub) */}
			{(screen === "auth_options" || screen === "sign_in" || screen === "sign_up") && (
				<div className="flex flex-col" data-openverse-auth-screen="auth_options">
					<button
						aria-label="Back to welcome"
						className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors self-start"
						onClick={() => {
							clearErrors();
							setPendingProvider(null);
							setScreen("welcome");
						}}
						type="button"
					>
						<ArrowLeft className="size-3.5" />
						Back
					</button>

					<div className="flex items-center gap-3 mb-1">
						<OpenVerseRobot size={36} glow={false} />
						<h2 className="text-xl font-bold tracking-tight text-white">
							Welcome
						</h2>
					</div>
					<p className="text-xs text-zinc-400 mb-6">
						Create an account or sign in with your provider.
					</p>

					{/* The two account options */}
					<div className="flex flex-col gap-3">
						<Button
							className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 flex items-center justify-center gap-3 font-medium transition-all shadow-sm"
							disabled={loading}
							onClick={() => handleOAuthLogin("google")}
							type="button"
						>
							{loading && pendingProvider === "google" ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<GoogleIcon className="size-4.5" />
							)}
							<span>Continue with Google</span>
						</Button>

						<Button
							className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 flex items-center justify-center gap-3 font-medium transition-all shadow-sm"
							disabled={loading}
							onClick={() => handleOAuthLogin("github")}
							type="button"
						>
							{loading && pendingProvider === "github" ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<GitHubIcon className="size-4.5" />
							)}
							<span>Continue with GitHub</span>
						</Button>
					</div>

					{/* Active OAuth State & Manual Callback input if browser redirected */}
					{pendingProvider && (
						<div className="mt-5 rounded-lg border border-violet-500/30 bg-violet-950/20 p-4">
							<div className="flex items-center gap-2 text-xs font-medium text-violet-300">
								<RotateCw className="size-3.5 animate-spin text-violet-400" />
								Waiting for {pendingProvider === "google" ? "Google" : "GitHub"} authorization...
							</div>
							<p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
								A browser tab was opened. If you were redirected to a code or token, paste it below to finish signing in:
							</p>
							<form onSubmit={handleCompleteWithToken} className="mt-3 flex gap-2">
								<Input
									className="h-8 text-xs bg-zinc-950 border-zinc-800 font-mono"
									placeholder="Paste token or openverse:// URL"
									value={manualToken}
									onChange={(e) => setManualToken(e.target.value)}
								/>
								<Button size="sm" type="submit" disabled={loading} className="h-8 text-xs shrink-0">
									Complete
								</Button>
							</form>
						</div>
					)}

					<div className="relative my-6 flex items-center justify-center">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t border-zinc-800" />
						</div>
						<span className="relative bg-[#0e0e13] px-3 text-[11px] text-zinc-500 uppercase tracking-wider">
							or
						</span>
					</div>

					<Button
						className="w-full border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs h-9 flex items-center justify-center gap-2"
						onClick={handleOfflineMode}
						type="button"
						variant="ghost"
					>
						<Laptop className="size-3.5" />
						Continue in Offline / Local Mode
					</Button>

					<div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
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
			)}
		</div>
	);
}
