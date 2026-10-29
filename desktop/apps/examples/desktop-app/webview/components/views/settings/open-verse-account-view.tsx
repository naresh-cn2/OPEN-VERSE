"use client";

import {
	AlertCircle,
	CheckCircle2,
	ExternalLink,
	HardDrive,
	Key,
	Laptop,
	Loader2,
	LogOut,
	Shield,
	Sparkles,
	User as UserIcon,
} from "lucide-react";
import React, { useState } from "react";
import { OpenVerseRobot } from "@/components/open-verse-robot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/contexts/account-context";
import { openExternalUrl } from "@/lib/desktop-client";
import {
	type OpenVerseUser,
	getCurrentSession,
	openVerseSignOut,
} from "@/lib/open-verse-auth";
import { cn } from "@/lib/utils";
import { PageFrame, PageHeader } from "../page-layout";

const PRIVACY_URL = "https://open-verse-website.vercel.app/privacy";
const TERMS_URL = "https://open-verse-website.vercel.app/terms";

export function OpenVerseAccountView({
	onNavigateToProviders,
}: {
	onNavigateToProviders?: () => void;
}) {
	const { openVerseUser, user: legacyUser, signOut } = useAccount();
	const [signingOut, setSigningOut] = useState(false);

	// Resolve active identity
	const currentSession = typeof window !== "undefined" ? getCurrentSession() : null;
	const activeUser: Partial<OpenVerseUser> =
		openVerseUser ?? currentSession?.user ?? legacyUser ?? {
			id: "openverse-local-developer",
			email: "local@openverse.internal",
			displayName: "Local Developer",
			isOfflineMode: true,
			provider: "local",
		};

	const displayName =
		activeUser.displayName ||
		activeUser.email?.split("@")[0] ||
		(activeUser.isOfflineMode ? "Local Developer" : "OPEN-VERSE User");

	const email = activeUser.email || "local@openverse.internal";
	const provider = activeUser.provider ?? (activeUser.isOfflineMode ? "local" : "email");
	const initial = displayName.charAt(0).toUpperCase() || "O";

	const handleSignOut = async () => {
		setSigningOut(true);
		try {
			await signOut();
		} catch {
			await openVerseSignOut();
		} finally {
			setSigningOut(false);
			if (typeof window !== "undefined") {
				window.location.reload();
			}
		}
	};

	return (
		<PageFrame>
			<PageHeader
				title="Account Settings"
				subtitle="Manage your OPEN-VERSE identity, connected sign-in provider, and workspace preferences."
			/>

			<div className="flex flex-col gap-6 max-w-3xl pb-12">
				{/* Identity Profile Card */}
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<div className="relative flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-2xl font-bold text-white shadow-md shadow-violet-900/20">
								{initial}
								<span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background p-0.5 border border-border">
									{provider === "google" ? (
										<svg className="size-3.5" viewBox="0 0 24 24">
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
									) : provider === "github" ? (
										<svg className="size-3.5 fill-current" viewBox="0 0 24 24">
											<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
										</svg>
									) : (
										<Laptop className="size-3 text-violet-400" />
									)}
								</span>
							</div>

							<div className="flex flex-col">
								<div className="flex items-center gap-2">
									<h2 className="text-lg font-semibold text-foreground">
										{displayName}
									</h2>
									<Badge
										variant="outline"
										className={cn(
											"text-[11px] font-medium uppercase tracking-wider px-2 py-0.5",
											provider === "google"
												? "border-blue-500/30 bg-blue-500/10 text-blue-400"
												: provider === "github"
													? "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
													: "border-violet-500/30 bg-violet-500/10 text-violet-300",
										)}
									>
										{provider === "google"
											? "Google OAuth"
											: provider === "github"
												? "GitHub OAuth"
												: "Local Developer"}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground mt-0.5">{email}</p>
							</div>
						</div>

						<Button
							variant="outline"
							size="sm"
							onClick={handleSignOut}
							disabled={signingOut}
							className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300 shrink-0 self-start sm:self-center"
						>
							{signingOut ? (
								<Loader2 className="mr-1.5 size-3.5 animate-spin" />
							) : (
								<LogOut className="mr-1.5 size-3.5" />
							)}
							Sign Out
						</Button>
					</div>

					<div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/60 pt-5 text-xs">
						<div>
							<span className="text-muted-foreground block text-[11px]">User ID</span>
							<span className="font-mono text-foreground font-medium truncate block mt-0.5">
								{activeUser.id || "ov-local-dev"}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground block text-[11px]">Account Type</span>
							<span className="text-foreground font-medium block mt-0.5">
								{activeUser.isOfflineMode ? "Autonomous Local Mode" : "Cloud Account"}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground block text-[11px]">Identity Status</span>
							<span className="text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
								<CheckCircle2 className="size-3" />
								Active & Verified
							</span>
						</div>
					</div>
				</div>

				{/* Data & Storage Architecture Card */}
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<div className="flex items-center gap-3 mb-3">
						<HardDrive className="size-5 text-violet-400" />
						<h3 className="text-sm font-semibold text-foreground">
							Local Workspace & Session Storage
						</h3>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed">
						All session history, task logs, and workspace files are persisted locally on your computer.
						Your conversations belong to your OPEN-VERSE workspace and are never coupled to AI model
						providers.
					</p>

					<div className="mt-4 rounded-lg bg-muted/40 p-3.5 text-xs font-mono text-muted-foreground border border-border/40">
						<div className="flex items-center justify-between">
							<span>Active Database:</span>
							<span className="text-foreground">~/.openverse/data/db/sessions.db</span>
						</div>
						<div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/20">
							<span>Legacy Cline Sessions:</span>
							<span className="text-emerald-400">Preserved intact (71+ sessions)</span>
						</div>
					</div>
				</div>

				{/* AI Model Providers Overview Card */}
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-3">
							<Sparkles className="size-5 text-indigo-400" />
							<div>
								<h3 className="text-sm font-semibold text-foreground">
									AI Model Providers
								</h3>
								<p className="text-[11px] text-muted-foreground">
									Model providers supply AI intelligence. Connecting a provider does not modify your OPEN-VERSE identity.
								</p>
							</div>
						</div>
						{onNavigateToProviders && (
							<Button
								variant="ghost"
								size="sm"
								className="text-xs text-primary"
								onClick={onNavigateToProviders}
							>
								Configure
							</Button>
						)}
					</div>

					<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
						{/* Cline Provider */}
						<div className="rounded-lg border border-border/70 p-3 bg-background/50 flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<span className="font-medium text-xs text-foreground">Cline Provider</span>
									<Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
										Available
									</Badge>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Free Nemotron 3.5, Claude, ClinePass & BYOK credits.
								</p>
							</div>
						</div>

						{/* Google Gemini */}
						<div className="rounded-lg border border-border/70 p-3 bg-background/50 flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<span className="font-medium text-xs text-foreground">Google Gemini</span>
									<Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
										Planned
									</Badge>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Gemini 2.5 Flash, 1.5 Pro, and multimodal tools.
								</p>
							</div>
						</div>

						{/* OpenAI / ChatGPT */}
						<div className="rounded-lg border border-border/70 p-3 bg-background/50 flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<span className="font-medium text-xs text-foreground">OpenAI / ChatGPT</span>
									<Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
										Planned
									</Badge>
								</div>
								<p className="text-[11px] text-muted-foreground">
									GPT-4o, o3-mini, and custom assistants.
								</p>
							</div>
						</div>

						{/* Local & BYOK */}
						<div className="rounded-lg border border-border/70 p-3 bg-background/50 flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<span className="font-medium text-xs text-foreground">Local Models & BYOK</span>
									<Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400 bg-violet-500/10">
										Active
									</Badge>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Ollama, LM Studio, Anthropic, OpenRouter, and custom API keys.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Legal Links */}
				<div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
					<button
						className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
						onClick={() => void openExternalUrl(TERMS_URL)}
						type="button"
					>
						Terms of Service
					</button>
					<span>•</span>
					<button
						className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
						onClick={() => void openExternalUrl(PRIVACY_URL)}
						type="button"
					>
						Privacy Policy
					</button>
				</div>
			</div>
		</PageFrame>
	);
}
