"use client";

import {
	Check,
	ChevronDown,
	ChevronRight,
	Plus,
	Search,
	SlidersHorizontal,
	Star,
	Brain,
	Cpu,
	Zap,
} from "lucide-react";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { Provider, ProviderModel } from "@/lib/provider-schema";
import {
	readReasoningSelectionStorageFromWindow,
	writeReasoningSelectionToWindow,
} from "@/lib/model-selection";

export type ReasoningLevel = "default" | "none" | "low" | "medium" | "high" | "max";

export interface UnifiedModelItem {
	id: string;
	name: string;
	providerId: string;
	providerName: string;
	description?: string;
	contextWindow?: number;
	supportsVision?: boolean;
	supportsReasoning?: boolean;
	isFree?: boolean;
	inputModalities?: string[];
	outputModalities?: string[];
	tags?: string[];
}

export interface UnifiedModelPickerProps {
	providers: Provider[];
	selectedProvider: string;
	selectedModel: string;
	onSelectModel: (providerId: string, modelId: string) => void;
	onReasoningChange?: (level: string) => void;
	currentReasoning?: string;
	onOpenSettings?: () => void;
	disabled?: boolean;
	className?: string;
}

const RECENT_STORAGE_KEY = "openverse.recent_models.v1";
const FAVORITES_STORAGE_KEY = "openverse.favorite_models.v1";

const REASONING_LEVELS: { label: string; value: ReasoningLevel; clineValue: string }[] = [
	{ label: "Default", value: "default", clineValue: "low" },
	{ label: "None", value: "none", clineValue: "none" },
	{ label: "High", value: "high", clineValue: "high" },
	{ label: "Max", value: "max", clineValue: "xhigh" },
];

function formatContextSize(tokens?: number): string {
	if (!tokens) return "128K";
	if (tokens >= 1_000_000) return `${Math.round(tokens / 1_000_000)}M`;
	return `${Math.round(tokens / 1024)}K`;
}

export function UnifiedModelPicker({
	providers,
	selectedProvider,
	selectedModel,
	onSelectModel,
	onReasoningChange,
	currentReasoning = "default",
	onOpenSettings,
	disabled = false,
	className = "",
}: UnifiedModelPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
	const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
	const [recentIds, setRecentIds] = useState<string[]>([]);
	const [selectedReasoningLevel, setSelectedReasoningLevel] = useState<ReasoningLevel>(() => {
		if (currentReasoning === "xhigh" || currentReasoning === "max") return "max";
		if (currentReasoning === "high") return "high";
		if (currentReasoning === "none") return "none";
		return "default";
	});

	const triggerRef = useRef<HTMLButtonElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Load favorites and recents from storage
	useEffect(() => {
		try {
			const savedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
			if (savedFavs) {
				setFavorites(new Set(JSON.parse(savedFavs)));
			}
			const savedRecents = localStorage.getItem(RECENT_STORAGE_KEY);
			if (savedRecents) {
				setRecentIds(JSON.parse(savedRecents));
			} else {
				// Seed realistic initial recents
				setRecentIds([
					"nemotron-3.5-super-vl-120b-a12b",
					"minimax-m3.1-flash",
					"nemotron-3-nano-omni",
					"nemotron-3.5-super-vl-free",
					"inkling-2-small-free",
				]);
			}
		} catch {
			// Ignore local storage errors
		}
	}, []);

	// Flatten all models across all available providers
	const allModels = useMemo<UnifiedModelItem[]>(() => {
		const list: UnifiedModelItem[] = [];
		for (const provider of providers) {
			const models = provider.modelList ?? [];
			for (const m of models) {
				const isFree =
					m.featured?.tier === "free" ||
					m.featured?.tags?.includes("Free") ||
					m.id.toLowerCase().includes("free") ||
					m.name.toLowerCase().includes("free");
				list.push({
					id: m.id,
					name: m.name || m.id,
					providerId: provider.id,
					providerName: provider.name || provider.id,
					description: m.description,
					contextWindow: m.contextWindow ?? (m.id.includes("nemotron") ? 264192 : 131072),
					supportsVision: m.supportsVision ?? true,
					supportsReasoning: m.supportsReasoning ?? true,
					isFree,
					inputModalities: m.inputModalities ?? ["text", "image"],
					outputModalities: m.outputModalities ?? ["text"],
					tags: m.featured?.tags,
				});
			}
		}
		return list;
	}, [providers]);

	// Lookup for currently selected model
	const currentModelItem = useMemo(() => {
		return (
			allModels.find(
				(m) => m.id === selectedModel && m.providerId === selectedProvider,
			) ??
			allModels.find((m) => m.id === selectedModel) ?? {
				id: selectedModel,
				name: selectedModel,
				providerId: selectedProvider,
				providerName: selectedProvider,
				contextWindow: 264192,
				supportsVision: true,
				supportsReasoning: true,
				isFree: false,
				inputModalities: ["text", "image", "audio", "video"],
			}
		);
	}, [allModels, selectedModel, selectedProvider]);

	// Hovered model item for flyout
	const hoveredModelItem = useMemo(() => {
		if (!hoveredModelId) return currentModelItem;
		return allModels.find((m) => m.id === hoveredModelId) ?? currentModelItem;
	}, [allModels, hoveredModelId, currentModelItem]);

	// Categorized models
	const filteredModels = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return allModels;
		return allModels.filter(
			(m) =>
				m.name.toLowerCase().includes(query) ||
				m.id.toLowerCase().includes(query) ||
				m.providerName.toLowerCase().includes(query) ||
				(m.description && m.description.toLowerCase().includes(query)),
		);
	}, [allModels, searchQuery]);

	const recentModels = useMemo(() => {
		if (searchQuery) return [];
		return recentIds
			.map((id) => allModels.find((m) => m.id === id))
			.filter((m): m is UnifiedModelItem => m !== undefined);
	}, [allModels, recentIds, searchQuery]);

	const opencodeModels = useMemo(() => {
		return filteredModels.filter((m) => m.providerId === "opencode");
	}, [filteredModels]);

	const nvidiaModels = useMemo(() => {
		return filteredModels.filter((m) => m.providerId === "nvidia");
	}, [filteredModels]);

	const otherModels = useMemo(() => {
		return filteredModels.filter(
			(m) => m.providerId !== "opencode" && m.providerId !== "nvidia",
		);
	}, [filteredModels]);

	// Handle selection
	const handleSelect = useCallback(
		(model: UnifiedModelItem) => {
			onSelectModel(model.providerId, model.id);
			// Record in recents
			setRecentIds((prev) => {
				const next = [model.id, ...prev.filter((id) => id !== model.id)].slice(0, 10);
				try {
					localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
				} catch {}
				return next;
			});
			setIsOpen(false);
		},
		[onSelectModel],
	);

	const toggleFavorite = useCallback((modelId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setFavorites((prev) => {
			const next = new Set(prev);
			if (next.has(modelId)) next.delete(modelId);
			else next.add(modelId);
			try {
				localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
			} catch {}
			return next;
		});
	}, []);

	const handleReasoningSelect = useCallback(
		(level: ReasoningLevel, clineValue: string) => {
			setSelectedReasoningLevel(level);
			if (onReasoningChange) {
				onReasoningChange(clineValue);
			}
			try {
				writeReasoningSelectionToWindow(hoveredModelItem.providerId, clineValue as any);
			} catch {}
		},
		[hoveredModelItem.providerId, onReasoningChange],
	);

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dialogRef.current &&
				!dialogRef.current.contains(e.target as Node) &&
				triggerRef.current &&
				!triggerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};
		window.addEventListener("mousedown", handleClickOutside);
		return () => window.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	// Auto-focus search input when opened
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => searchInputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	return (
		<div className={`relative inline-block ${className}`}>
			{/* Composer Trigger Button */}
			<button
				ref={triggerRef}
				aria-expanded={isOpen}
				aria-haspopup="dialog"
				className="group flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				disabled={disabled}
				onClick={() => setIsOpen((prev) => !prev)}
				type="button"
			>
				<span className="truncate max-w-[280px]">
					<span className="text-muted-foreground">{currentModelItem.providerName} / </span>
					<span className="font-semibold text-foreground">{currentModelItem.name}</span>
				</span>
				<ChevronDown className="size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
			</button>

			{/* Modal Dialog */}
			{isOpen && (
				<div
					ref={dialogRef}
					className="absolute bottom-full left-0 z-50 mb-2 flex flex-row items-start gap-1 rounded-xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150"
					style={{ minWidth: "360px" }}
				>
					{/* Main Picker Column */}
					<div className="flex w-[340px] flex-col">
						{/* Search Bar */}
						<div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
							<Search className="size-4 shrink-0 text-muted-foreground" />
							<input
								ref={searchInputRef}
								className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search models"
								type="text"
								value={searchQuery}
							/>
							{onOpenSettings && (
								<button
									className="rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
									onClick={() => {
										setIsOpen(false);
										onOpenSettings();
									}}
									title="Set up another provider"
									type="button"
								>
									<Plus className="size-3.5" />
								</button>
							)}
							<button
								className="rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
								title="Filter models"
								type="button"
							>
								<SlidersHorizontal className="size-3.5" />
							</button>
						</div>

						{/* Models List */}
						<div className="max-h-[380px] overflow-y-auto px-1 py-1.5 scrollbar-thin">
							{/* Recent Section */}
							{recentModels.length > 0 && (
								<div className="mb-2">
									<div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										Recent
									</div>
									{recentModels.map((m) => renderModelRow(m))}
								</div>
							)}

							{/* OpenCode Section */}
							{opencodeModels.length > 0 && (
								<div className="mb-2">
									<div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										OpenCode
									</div>
									{opencodeModels.map((m) => renderModelRow(m))}
								</div>
							)}

							{/* Nvidia Section */}
							{nvidiaModels.length > 0 && (
								<div className="mb-2">
									<div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										Nvidia
									</div>
									{nvidiaModels.map((m) => renderModelRow(m))}
								</div>
							)}

							{/* Other Providers Section */}
							{otherModels.length > 0 && (
								<div className="mb-2">
									<div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										Other Models
									</div>
									{otherModels.map((m) => renderModelRow(m))}
								</div>
							)}

							{filteredModels.length === 0 && (
								<div className="px-4 py-8 text-center text-xs text-muted-foreground">
									No models matching &quot;{searchQuery}&quot;
								</div>
							)}
						</div>
					</div>

					{/* Right Flyout Submenu for Capabilities & Reasoning */}
					<div className="flex w-[240px] flex-col rounded-lg border border-border/70 bg-popover/90 p-2 shadow-lg backdrop-blur-md">
						{/* Reasoning Effort Header */}
						<div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
							Reasoning Effort
						</div>

						{/* Reasoning Effort Options */}
						<div className="space-y-0.5">
							{REASONING_LEVELS.map((level) => {
								const isSelected = selectedReasoningLevel === level.value;
								return (
									<button
										key={level.value}
										className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
											isSelected
												? "bg-accent font-semibold text-accent-foreground"
												: "text-foreground hover:bg-surface-hover"
										}`}
										onClick={() => handleReasoningSelect(level.value, level.clineValue)}
										type="button"
									>
										<span>{level.label}</span>
										{isSelected && <Check className="size-3.5 text-primary" />}
									</button>
								);
							})}
						</div>

						<div className="my-2 border-t border-border/60" />

						{/* Favorite row with keyboard shortcut */}
						<button
							className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left text-foreground hover:bg-surface-hover"
							onClick={(e) => toggleFavorite(hoveredModelItem.id, e)}
							type="button"
						>
							<span className="flex items-center gap-1.5">
								<Star
									className={`size-3.5 ${
										favorites.has(hoveredModelItem.id)
											? "fill-yellow-400 text-yellow-400"
											: "text-muted-foreground"
									}`}
								/>
								<span>Favorite</span>
							</span>
							<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
								CTRL F
							</span>
						</button>

						<div className="my-2 border-t border-border/60" />

						{/* Model Capabilities Footer Card */}
						<div className="rounded-md bg-muted/40 p-2.5 text-xs">
							<div className="font-semibold text-foreground">
								{hoveredModelItem.providerName} • {formatContextSize(hoveredModelItem.contextWindow)} context
							</div>
							<div className="mt-1 text-[11px] text-muted-foreground">
								{hoveredModelItem.inputModalities?.length
									? hoveredModelItem.inputModalities
											.map((mod) => mod.charAt(0).toUpperCase() + mod.slice(1))
											.join(", ") + ", Tools"
									: "Text, Image, Tools"}
							</div>
							{hoveredModelItem.isFree && (
								<div className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
									<Zap className="size-2.5" /> Free Tier Available
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);

	function renderModelRow(model: UnifiedModelItem) {
		const isSelected =
			model.id === selectedModel && model.providerId === selectedProvider;
		const isHovered = hoveredModelId === model.id;

		return (
			<div
				key={`${model.providerId}-${model.id}`}
				className={`group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
					isSelected
						? "bg-accent/80 font-medium text-accent-foreground"
						: isHovered
							? "bg-surface-hover text-foreground"
							: "text-foreground hover:bg-surface-hover/80"
				}`}
				onClick={() => handleSelect(model)}
				onMouseEnter={() => setHoveredModelId(model.id)}
			>
				<div className="flex min-w-0 items-center gap-2">
					{isSelected ? (
						<Check className="size-3.5 shrink-0 text-primary" />
					) : (
						<span className="size-3.5 shrink-0" />
					)}
					<span className="truncate font-medium">{model.name}</span>
					<span className="shrink-0 text-[10px] text-muted-foreground font-normal">
						{model.providerName}
					</span>
					{model.isFree && (
						<span className="shrink-0 rounded bg-muted/80 px-1 py-0.2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/50">
							Free
						</span>
					)}
				</div>

				<div className="flex shrink-0 items-center gap-1">
					{model.supportsReasoning && (
						<span className="flex items-center text-[10px] text-muted-foreground group-hover:text-foreground">
							{selectedReasoningLevel === "max"
								? "Max"
								: selectedReasoningLevel === "high"
									? "High"
									: selectedReasoningLevel === "none"
										? "None"
										: "Default"}{" "}
							<ChevronRight className="size-3 ml-0.5 inline" />
						</span>
					)}
				</div>
			</div>
		);
	}
}
