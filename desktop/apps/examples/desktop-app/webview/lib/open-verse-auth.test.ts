// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearPkceState,
	completeOAuthCallback,
	completeUserOnboarding,
	continueInOfflineMode,
	deleteOpenVerseAccount,
	deriveSubFromEmail,
	findUserByEmail,
	findUserByGoogleSub,
	generatePkceChallenge,
	getAccountRegistry,
	getCurrentSession,
	getCurrentUser,
	getKnownGoogleAccounts,
	getOAuthAuthorizeUrl,
	initiateOAuthSignIn,
	loginWithGoogleOidc,
	openVerseSignOut,
	retrievePkceState,
	setStoredSession,
	signInWithGoogleDirect,
	subscribeAuthChange,
	updateUserPreferences,
} from "./open-verse-auth";

const { openExternalUrl } = vi.hoisted(() => ({
	openExternalUrl: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./desktop-client", () => ({
	openExternalUrl,
	desktopClient: { invoke: vi.fn(), subscribe: vi.fn(() => () => { }) },
}));

describe("open-verse-auth library", () => {
	beforeEach(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
		setStoredSession(null);
		openExternalUrl.mockClear();
	});

	afterEach(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
		setStoredSession(null);
	});

	describe("OAuth authorization URLs & PKCE", () => {
		it("generates correct OAuth authorize URLs for Google", () => {
			const googleUrl = getOAuthAuthorizeUrl("google");
			expect(googleUrl).toContain("/api/auth/authorize");
			expect(googleUrl).toContain("provider=google");
			expect(googleUrl).toContain("prompt=select_account");
			expect(googleUrl).toContain("redirect_to=");
		});

		it("initiates OAuth flow by launching browser", async () => {
			const result = await initiateOAuthSignIn("google");
			expect(result.handled).toBe(true);
			expect(openExternalUrl).toHaveBeenCalledWith(result.url);
		});

		it("generates and stores cryptographically sound PKCE parameters", async () => {
			const pkce = await generatePkceChallenge();
			expect(pkce.codeVerifier).toBeDefined();
			expect(pkce.codeChallenge).toBeDefined();
			expect(pkce.state.startsWith("st_")).toBe(true);
			expect(pkce.nonce.startsWith("no_")).toBe(true);

			const retrieved = retrievePkceState();
			expect(retrieved?.codeVerifier).toBe(pkce.codeVerifier);
			expect(retrieved?.codeChallenge).toBe(pkce.codeChallenge);

			clearPkceState();
			expect(retrievePkceState()).toBeNull();
		});

		it("derives deterministic Google subject IDs from email", () => {
			const sub1 = deriveSubFromEmail("developer@gmail.com");
			const sub2 = deriveSubFromEmail("developer@gmail.com");
			const subOther = deriveSubFromEmail("other@gmail.com");

			expect(sub1).toBe(sub2);
			expect(sub1).not.toBe(subOther);
			expect(sub1.startsWith("108")).toBe(true);
		});
	});

	describe("Unified Google Sign-In & First-Time vs Returning User", () => {
		it("creates a new user account with private workspace defaults on first signup", async () => {
			const sub = "109823091823901";
			const result = await loginWithGoogleOidc({
				sub,
				email: "alice@gmail.com",
				name: "Alice",
				emailVerified: true,
			});

			expect(result.isNewUser).toBe(true);
			expect(result.session.user.id).toBe(`ov_user_${sub}`);
			expect(result.session.user.email).toBe("alice@gmail.com");
			expect(result.session.user.googleSub).toBe(sub);
			expect(result.session.user.onboardingCompleted).toBe(false);
			expect(result.session.user.preferences?.workspaceMode).toBe("agentic");

			// Persisted in registry
			const inRegistry = findUserByGoogleSub(sub);
			expect(inRegistry).not.toBeNull();
			expect(inRegistry?.email).toBe("alice@gmail.com");
		});

		it("recognizes a returning user and preserves settings and conversations", async () => {
			const sub = "109823091823901";
			// First signup
			const first = await loginWithGoogleOidc({
				sub,
				email: "alice@gmail.com",
				name: "Alice",
			});
			expect(first.isNewUser).toBe(true);

			// Complete onboarding and customize preferences
			completeUserOnboarding(first.session.user.id);
			updateUserPreferences(first.session.user.id, { theme: "dark", workspaceMode: "standard" });

			// Second sign-in as returning user
			const returning = await loginWithGoogleOidc({
				sub,
				email: "alice@gmail.com",
				name: "Alice Updated",
			});

			expect(returning.isNewUser).toBe(false);
			expect(returning.session.user.id).toBe(`ov_user_${sub}`);
			// Onboarding status and custom preferences were preserved
			expect(returning.session.user.onboardingCompleted).toBe(true);
			expect(returning.session.user.preferences?.workspaceMode).toBe("standard");
			expect(returning.session.user.lastLoginAt).toBeDefined();
		});

		it("signs in directly with Google account and updates current session", async () => {
			const session = await signInWithGoogleDirect("naresh@gmail.com", "Naresh");
			expect(session.user.provider).toBe("google");
			expect(session.user.email).toBe("naresh@gmail.com");
			expect(session.user.displayName).toBe("Naresh");
			expect(getCurrentUser()?.email).toBe("naresh@gmail.com");
		});
	});

	describe("OAuth callback parsing", () => {
		it("completes OAuth session from URL hash with access_token and user info", async () => {
			const callbackUrl =
				"openverse://auth/callback#access_token=token123&email=user@domain.com&name=TestUser&provider=google&sub=google_sub_999";
			const session = await completeOAuthCallback(callbackUrl);

			expect(session.accessToken).toBe("token123");
			expect(session.user.email).toBe("user@domain.com");
			expect(session.user.displayName).toBe("TestUser");
			expect(session.user.provider).toBe("google");
			expect(session.user.isOfflineMode).toBe(false);

			expect(getCurrentUser()?.email).toBe("user@domain.com");
		});

		it("completes OAuth session from raw Google authorization code query string", async () => {
			const queryParam = "code=mock_google_auth_code_xyz&scope=email+profile+openid";

			const originalFetch = globalThis.fetch;
			globalThis.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
				const urlStr = String(url);
				if (urlStr.includes("oauth2.googleapis.com/token")) {
					return Promise.resolve(
						new Response(
							JSON.stringify({
								access_token: "mock_access_token_123",
								id_token:
									"header." +
									Buffer.from(
										JSON.stringify({
											sub: "google_sub_user_abc",
											email: "alex@custom-domain.org",
											name: "Alex User",
											picture: "https://example.com/alex.jpg",
										}),
									).toString("base64url") +
									".sig",
								expires_in: 3600,
								token_type: "Bearer",
							}),
							{ status: 200, headers: { "Content-Type": "application/json" } },
						),
					);
				}
				if (urlStr.includes("googleapis.com/oauth2/v3/userinfo")) {
					return Promise.resolve(
						new Response(
							JSON.stringify({
								sub: "google_sub_user_abc",
								email: "alex@custom-domain.org",
								name: "Alex User",
								picture: "https://example.com/alex.jpg",
							}),
							{ status: 200, headers: { "Content-Type": "application/json" } },
						),
					);
				}
				return originalFetch(url);
			});

			try {
				const session = await completeOAuthCallback(queryParam, "google");

				expect(session.user.provider).toBe("google");
				expect(session.user.email).toBe("alex@custom-domain.org");
				expect(session.user.displayName).toBe("Alex User");
				expect(session.user.googleSub).toBe("google_sub_user_abc");
				expect(session.accessToken).toBe("mock_access_token_123");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("completes OAuth session from raw Google authorization code query string", async () => {
			const queryParam = "code=mock_google_auth_code_xyz&scope=email+profile+openid";

			const originalFetch = globalThis.fetch;
			globalThis.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
				const urlStr = String(url);
				if (urlStr.includes("oauth2.googleapis.com/token")) {
					return Promise.resolve(
						new Response(
							JSON.stringify({
								access_token: "mock_access_token_123",
								id_token:
									"header." +
									Buffer.from(
										JSON.stringify({
											sub: "google_sub_user_abc",
											email: "alex@custom-domain.org",
											name: "Alex User",
											picture: "https://example.com/alex.jpg",
										}),
									).toString("base64url") +
									".sig",
								expires_in: 3600,
								token_type: "Bearer",
							}),
							{ status: 200, headers: { "Content-Type": "application/json" } },
						),
					);
				}
				if (urlStr.includes("googleapis.com/oauth2/v3/userinfo")) {
					return Promise.resolve(
						new Response(
							JSON.stringify({
								sub: "google_sub_user_abc",
								email: "alex@custom-domain.org",
								name: "Alex User",
								picture: "https://example.com/alex.jpg",
							}),
							{ status: 200, headers: { "Content-Type": "application/json" } },
						),
					);
				}
				return originalFetch(url);
			});

			try {
				const session = await completeOAuthCallback(queryParam, "google");

				expect(session.user.provider).toBe("google");
				expect(session.user.email).toBe("alex@custom-domain.org");
				expect(session.user.displayName).toBe("Alex User");
				expect(session.user.googleSub).toBe("google_sub_user_abc");
				expect(session.accessToken).toBe("mock_access_token_123");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("rejects empty callback input", async () => {
			await expect(completeOAuthCallback("   ")).rejects.toThrow(
				"Authorization token or callback response is required.",
			);
		});
	});

	describe("Multi-User Independence & Isolation", () => {
		it("maintains separate, isolated accounts for completely different users", async () => {
			// User A logs in
			const userA = await loginWithGoogleOidc({
				sub: "google_sub_user_a",
				email: "userA@company.com",
				name: "User A",
			});
			updateUserPreferences(userA.session.user.id, { theme: "light", workspaceMode: "standard" });

			// User B logs in
			const userB = await loginWithGoogleOidc({
				sub: "google_sub_user_b",
				email: "userB@personal.org",
				name: "User B",
			});

			// Registry keeps them separate
			const registry = getAccountRegistry();
			expect(registry[userA.session.user.id].email).toBe("usera@company.com");
			expect(registry[userA.session.user.id].preferences?.theme).toBe("light");

			expect(registry[userB.session.user.id].email).toBe("userb@personal.org");
			expect(registry[userB.session.user.id].preferences?.theme).toBe("dark");

			// Active session belongs to User B now
			expect(getCurrentUser()?.email).toBe("userb@personal.org");
			expect(getCurrentUser()?.googleSub).toBe("google_sub_user_b");
		});

		it("returns empty known accounts when no users have signed in on this client", () => {
			window.localStorage.clear();
			expect(getKnownGoogleAccounts()).toEqual([]);
		});
	});

	describe("Offline / Local mode & Session management", () => {
		it("activates offline mode with local developer profile", () => {
			const session = continueInOfflineMode();
			expect(session.user.isOfflineMode).toBe(true);
			expect(session.user.email).toBe("local@openverse.internal");
			expect(session.user.displayName).toBe("Local Developer");
			expect(session.user.provider).toBe("local");

			const current = getCurrentSession();
			expect(current?.user.id).toBe("openverse-local-developer");
		});

		it("dispatches events on session change", () => {
			const listener = vi.fn();
			const unsubscribe = subscribeAuthChange(listener);

			continueInOfflineMode();
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({
					user: expect.objectContaining({ id: "openverse-local-developer" }),
				}),
			);

			unsubscribe();
		});

		it("clears session on sign-out", async () => {
			continueInOfflineMode();
			expect(getCurrentSession()).not.toBeNull();

			await openVerseSignOut();
			expect(getCurrentSession()).toBeNull();
			expect(getCurrentUser()).toBeNull();
		});

		it("permanently deletes user account and wipes local session data", async () => {
			const { session } = await loginWithGoogleOidc({
				sub: "delete_test_sub",
				email: "delete_me@gmail.com",
				name: "Delete Me",
			});

			const userId = session.user.id;
			expect(findUserByGoogleSub("delete_test_sub")).not.toBeNull();

			// Delete account
			const deleted = await deleteOpenVerseAccount(userId);
			expect(deleted).toBe(true);
			expect(findUserByGoogleSub("delete_test_sub")).toBeNull();
			expect(getCurrentSession()).toBeNull();
		});
	});
});
