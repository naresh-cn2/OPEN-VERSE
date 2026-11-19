import {
	Bot,
	Cpu,
	GitBranchPlus,
	GitPullRequest,
	type LucideIcon,
	Network,
	ShieldCheck,
	Sparkles,
	Terminal,
	Users,
} from "lucide-react";

/**
 * "What's new" and onboarding catch-up highlights for OPEN-VERSE.
 *
 * OPEN-VERSE Desktop introduces key capabilities to users in-app.
 * To publish a new highlight:
 * 1. Add an entry to the TOP of `WHATS_NEW_RELEASES`.
 * 2. Give it a clear title and 3-4 highlights with Lucide icons.
 * 3. Spotlight releases (such as Connectors) render dedicated interactive layouts.
 */

export type WhatsNewHighlight = {
	title: string;
	description: string;
	icon: LucideIcon;
};

export type WhatsNewRelease =
	| { id: string; title: string; highlights: WhatsNewHighlight[] }
	| { id: string; title: string; spotlight: "connectors" };

export const WHATS_NEW_RELEASES: WhatsNewRelease[] = [
	{
		id: "2026-11-open-verse-platform",
		title: "Welcome to OPEN-VERSE",
		highlights: [
			{
				title: "Autonomous AI Assistant",
				description:
					"OPEN-VERSE inspects your codebase, edits files, runs tests, and completes engineering tasks in any project.",
				icon: Bot,
			},
			{
				title: "Multi-Model Intelligence",
				description:
					"Bring any model: Google Gemini, Anthropic Claude, OpenAI, DeepSeek, or run local offline models with Ollama.",
				icon: Cpu,
			},
			{
				title: "Terminal & Tool Execution",
				description:
					"Execute shell commands, file edits, and tools protected by fine-grained permission and security controls.",
				icon: Terminal,
			},
			{
				title: "SSH Remotes & Parallel Work",
				description:
					"Work across remote machines via SSH and delegate parallel subagents across isolated git worktrees.",
				icon: Network,
			},
		],
	},
	{
		id: "2026-11-connectors",
		title: "Connect OPEN-VERSE to your apps",
		spotlight: "connectors",
	},
];
