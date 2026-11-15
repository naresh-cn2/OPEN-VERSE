"use client";

import {
	Bot,
	Check,
	CheckCircle2,
	ChevronRight,
	Globe,
	HardDrive,
	Key,
	Laptop,
	Moon,
	ShieldCheck,
	Sparkles,
	Sun,
	Terminal,
	User,
} from "lucide-react";
import React, { useState } from "react";
import { OpenVerseRobot } from "@/components/open-verse-robot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type OpenVerseUser,
	completeUserOnboarding,
	getCurrentSession,
	updateUserPreferences,
} from "@/lib/open-verse-auth";
import { markOnboardingCompleted } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

interface FirstTimeOnboardingProps {
	user: OpenVerseUser;
	onFinished: (user: OpenVerseUser) => void;
}

export function FirstTimeOnboarding({ user, onFinished }: FirstTimeOnboardingProps) {
	const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
	const [displayName, setDisplayName] = useState(
		user.displayName || user.email.split("@")[0] || "OpenVerse Creator",
	);
	const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
	const [workspaceMode, setWorkspaceMode] = useState<"agentic" | "standard">("agentic");

	const handleComplete = () => {
		// Persist chosen preferences
		updateUserPreferences(user.id, {
			theme,
			workspaceMode,
			notificationsEnabled: true,
			telemetryEnabled: false,
		});

		// Mark onboarding completed
		const finalUser = completeUserOnboarding(user.id) || {
			...user,
			displayName,
			onboardingCompleted: true,
		};

		markOnboardingCompleted();
		onFinished(finalUser);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090d]/95 p-4 backdrop-blur-2xl">
			{/* Ambient background glow */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[550px] rounded-full bg-violet-600/15 blur-[130px]" />
				<div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 size-[400px] rounded-full bg-indigo-600/10 blur-[110px]" />
			</div>

			<div className="relative w-full max-w-lg rounded-3xl border border-zinc-800/80 bg-[#111116]/95 p-8 shadow-2xl backdrop-blur-xl">
				{/* Step Progress Bar */}
				<div className="mb-6 flex items-center justify-between border-b border-zinc-800/80 pb-4">
					<div className="flex items-center gap-2">
						<OpenVerseRobot size={32} />
						<span className="text-sm font-bold tracking-tight text-white">OPEN-VERSE</span>
					</div>
					<div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
						<span>Step {step} of 4</span>
						<div className="flex gap-1 ml-2">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className={cn(
										"h-1.5 w-6 rounded-full transition-all duration-300",
										i === step
											? "bg-violet-500 w-8"
											: i < step
												? "bg-violet-600/60"
												: "bg-zinc-800",
									)}
								/>
							))}
						</div>
					</div>
				</div>

				{/* STEP 1: Profile Confirmation */}
				{step === 1 && (
					<div className="space-y-6 animate-in fade-in-0 duration-200">
						<div className="text-center">
							<Badge className="mb-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px]">
								<CheckCircle2 className="mr-1 size-3" /> Google Account Verified
							</Badge>
							<h2 className="text-xl font-bold text-white">Welcome to OPEN-VERSE</h2>
							<p className="mt-1 text-xs text-zinc-400">
								Your Google identity is now verified and connected to your private workspace.
							</p>
						</div>

						<div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
							{user.avatarUrl ? (
								<img
									src={user.avatarUrl}
									alt=""
									referrerPolicy="no-referrer"
									crossOrigin="anonymous"
									className="size-16 rounded-full border-2 border-violet-500/40 shadow-md object-cover"
								/>
							) : (
								<div className="flex size-16 items-center justify-center rounded-full bg-violet-600/30 text-violet-300 text-xl font-bold border border-violet-500/40">
									{displayName.charAt(0).toUpperCase()}
								</div>
							)}

							<div className="w-full space-y-3">
								<div className="space-y-1">
									<label className="text-[11px] font-medium text-zinc-400">
										Verified Google Email
									</label>
									<Input
										value={user.email}
										disabled
										className="h-9 text-xs bg-zinc-900/60 border-zinc-800 text-zinc-400 font-mono"
									/>
								</div>

								<div className="space-y-1">
									<label className="text-[11px] font-medium text-zinc-300">
										Display Name
									</label>
									<Input
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
										className="h-9 text-xs bg-zinc-900 border-zinc-700 text-white focus:border-violet-500"
										placeholder="Your name"
									/>
								</div>
							</div>
						</div>

						<Button
							className="w-full h-11 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20"
							onClick={() => setStep(2)}
						>
							<span>Next: Personalize Workspace</span>
							<ChevronRight className="size-4" />
						</Button>
					</div>
				)}

				{/* STEP 2: Preferences */}
				{step === 2 && (
					<div className="space-y-6 animate-in fade-in-0 duration-200">
						<div>
							<h2 className="text-xl font-bold text-white">Workspace Preferences</h2>
							<p className="mt-1 text-xs text-zinc-400">
								Choose how you want OPEN-VERSE to look and execute tasks.
							</p>
						</div>

						{/* Theme Selection */}
						<div className="space-y-2">
							<label className="text-xs font-semibold text-zinc-300">Interface Theme</label>
							<div className="grid grid-cols-3 gap-2.5">
								{[
									{ id: "dark", label: "Dark", icon: Moon },
									{ id: "light", label: "Light", icon: Sun },
									{ id: "system", label: "System", icon: Laptop },
								].map((t) => {
									const Icon = t.icon;
									const isSelected = theme === t.id;
									return (
										<button
											key={t.id}
											type="button"
											onClick={() => setTheme(t.id as any)}
											className={cn(
												"flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-xs transition-all",
												isSelected
													? "border-violet-500 bg-violet-500/10 text-white font-semibold shadow-sm"
													: "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
											)}
										>
											<Icon className={cn("size-5", isSelected ? "text-violet-400" : "text-zinc-400")} />
											<span>{t.label}</span>
										</button>
									);
								})}
							</div>
						</div>

						{/* Workspace Execution Mode */}
						<div className="space-y-2">
							<label className="text-xs font-semibold text-zinc-300">Execution Mode</label>
							<div className="grid grid-cols-2 gap-2.5">
								<button
									type="button"
									onClick={() => setWorkspaceMode("agentic")}
									className={cn(
										"flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all",
										workspaceMode === "agentic"
											? "border-violet-500 bg-violet-500/10 shadow-sm"
											: "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
									)}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Terminal className="size-4 text-violet-400" />
										<span>Autonomous Agent</span>
									</div>
									<p className="text-[11px] text-zinc-400 leading-snug">
										Shell, file editing, tests, subagents, and browser automation enabled.
									</p>
								</button>

								<button
									type="button"
									onClick={() => setWorkspaceMode("standard")}
									className={cn(
										"flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all",
										workspaceMode === "standard"
											? "border-violet-500 bg-violet-500/10 shadow-sm"
											: "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
									)}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Bot className="size-4 text-zinc-300" />
										<span>Standard Chat</span>
									</div>
									<p className="text-[11px] text-zinc-400 leading-snug">
										Conversational AI assistant with code snippets and markdown responses.
									</p>
								</button>
							</div>
						</div>

						<div className="flex gap-2">
							<Button
								variant="outline"
								className="h-11 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 text-xs rounded-xl"
								onClick={() => setStep(1)}
							>
								Back
							</Button>
							<Button
								className="flex-1 h-11 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20"
								onClick={() => setStep(3)}
							>
								<span>Next: AI Provider Architecture</span>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					</div>
				)}

				{/* STEP 3: Multi-Provider Decoupling Orientation */}
				{step === 3 && (
					<div className="space-y-6 animate-in fade-in-0 duration-200">
						<div>
							<h2 className="text-xl font-bold text-white">Bring Any AI Model</h2>
							<p className="mt-1 text-xs text-zinc-400">
								OPEN-VERSE decouples your identity from AI models across 3 independent pillars:
							</p>
						</div>

						<div className="space-y-2.5">
							{/* Pillar 1: Online Accounts */}
							<div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
									<Globe className="size-4" />
								</div>
								<div>
									<div className="flex items-center gap-1.5">
										<span className="text-xs font-semibold text-white">Online Web Accounts</span>
										<Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
											ChatGPT • Claude • Gemini • DeepSeek • Cline
										</Badge>
									</div>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										Sign into your provider account directly. Your conversations and prompts remain yours.
									</p>
								</div>
							</div>

							{/* Pillar 2: API Keys */}
							<div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
									<Key className="size-4" />
								</div>
								<div>
									<div className="flex items-center gap-1.5">
										<span className="text-xs font-semibold text-white">Custom API Keys</span>
										<Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
											OpenAI • Anthropic • Nvidia • OpenRouter
										</Badge>
									</div>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										Bring your own keys (BYOK). Keys are stored encrypted in your local OS keychain.
									</p>
								</div>
							</div>

							{/* Pillar 3: Local Offline Models */}
							<div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
									<HardDrive className="size-4" />
								</div>
								<div>
									<div className="flex items-center gap-1.5">
										<span className="text-xs font-semibold text-white">Local Offline Models</span>
										<Badge variant="outline" className="text-[10px] text-violet-400 border-violet-500/30">
											Ollama • LM Studio • vLLM
										</Badge>
									</div>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										Run 100% locally and privately without internet connection or cloud fees.
									</p>
								</div>
							</div>
						</div>

						<div className="flex gap-2">
							<Button
								variant="outline"
								className="h-11 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 text-xs rounded-xl"
								onClick={() => setStep(2)}
							>
								Back
							</Button>
							<Button
								className="flex-1 h-11 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20"
								onClick={() => setStep(4)}
							>
								<span>Ready: Finalize Setup</span>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					</div>
				)}

				{/* STEP 4: Ready to Build */}
				{step === 4 && (
					<div className="space-y-6 text-center animate-in fade-in-0 duration-200">
						<div className="flex justify-center">
							<div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-600/30">
								<Sparkles className="size-10 text-white animate-pulse" />
								<div className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white">
									<Check className="size-3.5 stroke-[3]" />
								</div>
							</div>
						</div>

						<div>
							<h2 className="text-2xl font-bold text-white">You're All Set!</h2>
							<p className="mt-1.5 text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
								Your OPEN-VERSE workspace is ready. You can switch models, launch autonomous
								agents, or run local tasks anytime.
							</p>
						</div>

						<div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-left text-xs space-y-2">
							<div className="flex items-center justify-between text-zinc-400">
								<span>User Identity:</span>
								<span className="font-semibold text-white">{displayName}</span>
							</div>
							<div className="flex items-center justify-between text-zinc-400">
								<span>Google Account:</span>
								<span className="font-mono text-zinc-300">{user.email}</span>
							</div>
							<div className="flex items-center justify-between text-zinc-400">
								<span>Selected Theme:</span>
								<span className="capitalize text-zinc-300">{theme}</span>
							</div>
							<div className="flex items-center justify-between text-zinc-400">
								<span>Execution Mode:</span>
								<span className="capitalize text-zinc-300">
									{workspaceMode === "agentic" ? "Autonomous Agent" : "Standard Chat"}
								</span>
							</div>
						</div>

						<Button
							className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm rounded-xl shadow-lg transition-transform active:scale-[0.99]"
							onClick={handleComplete}
						>
							Enter OPEN-VERSE Workspace
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
