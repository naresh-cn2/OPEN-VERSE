import { desktopClient } from "@/lib/desktop-client";
import type { Provider } from "@/lib/provider-schema";

/**
 * Providers whose credentials are managed through an OAuth sign-in flow
 * rather than a pasted API key. Mirrors the SDK's provider auth registry
 * (see sdk/packages/core/src/auth/provider-auth-registry.ts); the catalog's
 * "oauth" capability is the primary signal and this set is the fallback for
 * entries whose capability metadata is incomplete.
 */
export const OAUTH_PROVIDER_IDS = new Set([
	"cline",
	// ClinePass shares the Cline account OAuth credentials (its auth handler
	// stores under the "cline" provider), so it never has its own API key.
	"cline-pass",
	"oca",
	"openai-codex",
]);

export type ProviderAuthKind = "oauth" | "local" | "api-key";

/**
 * Client-side deadline for `run_provider_oauth_login` invokes. The browser
 * round-trip legitimately takes minutes — the user may still be choosing a
 * browser or confirming a device code, and Cline device codes stay valid for
 * many minutes — so the transport's default 120s command deadline would fail
 * a sign-in that is still perfectly viable (observed while verifying
 * cline/cline#14201). The sidecar already bounds the flow by the device-code
 * expiry; this is only a backstop against a wedged command.
 */
export const OAUTH_LOGIN_TIMEOUT_MS = 15 * 60_000;

// Cancellation targets the provider, so it must finish before another screen signs in.
let pendingClineCancellation: Promise<unknown> | null = null;
const activeLoginPromises = new Map<string, Promise<{ provider: string; accessToken: string }>>();

export function cancelClineOAuthLogin(): Promise<unknown> {
	activeLoginPromises.delete("cline");
	if (!pendingClineCancellation) {
		pendingClineCancellation = desktopClient
			.invoke("cancel_provider_oauth_login", { provider: "cline" })
			.finally(() => {
				pendingClineCancellation = null;
			});
	}
	return pendingClineCancellation;
}

export async function runProviderOAuthLogin(
	provider: string,
	signal?: AbortSignal,
): Promise<{ provider: string; accessToken: string }> {
	if (provider === "cline" && pendingClineCancellation) {
		await pendingClineCancellation.catch(() => undefined);
	}
	// Return active in-flight login if one is already running to avoid cancellation races
	const existing = activeLoginPromises.get(provider);
	if (existing) {
		return existing;
	}

	const promise = desktopClient
		.invoke<{ provider: string; accessToken: string }>(
			"run_provider_oauth_login",
			{ provider },
			{ timeoutMs: OAUTH_LOGIN_TIMEOUT_MS, signal },
		)
		.finally(() => {
			if (activeLoginPromises.get(provider) === promise) {
				activeLoginPromises.delete(provider);
			}
		});

	activeLoginPromises.set(provider, promise);
	return promise;
}

/**
 * How a provider expects to be authenticated, which drives which connect UI
 * to show: a browser sign-in button (oauth), a "uses your local CLI" notice
 * (local), or credential fields (api-key).
 */
export function getProviderAuthKind(provider: Provider): ProviderAuthKind {
	if (
		provider.capabilities?.includes("oauth") ||
		OAUTH_PROVIDER_IDS.has(provider.id)
	) {
		return "oauth";
	}
	if (provider.capabilities?.includes("local-auth")) {
		return "local";
	}
	return "api-key";
}

/**
 * Whether a provider from the catalog is usable for turns, shown as
 * "Configured" in settings and consulted by the first-run "connect a model"
 * notice. Plain API keys and OAuth are definitive. Beyond those, we rely on
 * the sidecar's `configured` flag (the same per-provider readiness check the
 * CLI uses), which requires real evidence of credentials: cloud credentials
 * for Bedrock/Vertex/SAP AI Core, a local-auth CLI, or a resolvable endpoint
 * + model for keyless local providers like Ollama. `enabled` alone is not
 * enough — legacy VS Code migration and empty saves can persist entries for
 * providers the user never actually configured.
 */
export function isProviderConnected(provider: Provider): boolean {
	if (provider.apiKey?.trim()) {
		return true;
	}
	if (provider.oauthAccessTokenPresent) {
		return true;
	}
	return provider.enabled && provider.configured === true;
}
