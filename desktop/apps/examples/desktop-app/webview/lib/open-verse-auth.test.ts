// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	completeOAuthCallback,
	continueInOfflineMode,
	getCurrentSession,
	getCurrentUser,
	getOAuthAuthorizeUrl,
	initiateOAuthSignIn,
	openVerseSignOut,
	setStoredSession,
	subscribeAuthChange,
} from "./open-verse-auth";

const { openExternalUrl } = vi.hoisted(() => ({
	openExternalUrl: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./desktop-client", () => ({
	openExternalUrl,
	desktopClient: { invoke: vi.fn(), subscribe: vi.fn(() => () => {}) },
}));

describe("open-verse-auth library", () => {
	beforeEach(() => {
		window.localStorage.clear();
		setStoredSession(null);
		openExternalUrl.mockClear();
	});

	afterEach(() => {
		window.localStorage.clear();
		setStoredSession(null);
	});

	describe("OAuth authorization URLs", () => {
		it("generates correct OAuth authorize URLs for Google and GitHub", () => {
			const googleUrl = getOAuthAuthorizeUrl("google");
			expect(googleUrl).toContain("provider=google");
			expect(googleUrl).toContain("redirect_to=openverse%3A%2F%2Fauth%2Fcallback");

			const githubUrl = getOAuthAuthorizeUrl("github");
			expect(githubUrl).toContain("provider=github");
			expect(githubUrl).toContain("redirect_to=openverse%3A%2F%2Fauth%2Fcallback");
		});

		it("initiates OAuth flow by launching browser", async () => {
			const result = await initiateOAuthSignIn("google");
			expect(result.handled).toBe(true);
			expect(openExternalUrl).toHaveBeenCalledWith(result.url);
		});
	});

	describe("OAuth callback parsing", () => {
		it("completes OAuth session from URL hash with access_token and user info", async () => {
			const callbackUrl =
				"openverse://auth/callback#access_token=token123&email=user@domain.com&name=TestUser&provider=google";
			const session = await completeOAuthCallback(callbackUrl);

			expect(session.accessToken).toBe("token123");
			expect(session.user.email).toBe("user@domain.com");
			expect(session.user.displayName).toBe("TestUser");
			expect(session.user.provider).toBe("google");
			expect(session.user.isOfflineMode).toBe(false);

			expect(getCurrentUser()?.email).toBe("user@domain.com");
		});

		it("rejects empty callback input", async () => {
			await expect(completeOAuthCallback("   ")).rejects.toThrow(
				"Authorization token or callback response is required.",
			);
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
	});
});
