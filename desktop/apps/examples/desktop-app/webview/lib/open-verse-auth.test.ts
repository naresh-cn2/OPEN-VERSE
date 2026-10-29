// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	continueInOfflineMode,
	getCurrentSession,
	getCurrentUser,
	isValidEmail,
	openVerseResetPassword,
	openVerseSendPasswordReset,
	openVerseSignIn,
	openVerseSignOut,
	openVerseSignUp,
	openVerseVerifyOtp,
	setStoredSession,
	subscribeAuthChange,
	validatePassword,
} from "./open-verse-auth";

describe("open-verse-auth library", () => {
	beforeEach(() => {
		window.localStorage.clear();
		setStoredSession(null);
	});

	afterEach(() => {
		window.localStorage.clear();
		setStoredSession(null);
	});

	describe("validation helpers", () => {
		it("validates valid email formats correctly", () => {
			expect(isValidEmail("user@example.com")).toBe(true);
			expect(isValidEmail("developer.openverse@domain.co.uk")).toBe(true);
			expect(isValidEmail("invalid-email")).toBe(false);
			expect(isValidEmail("missing@domain")).toBe(false);
			expect(isValidEmail("@domain.com")).toBe(false);
			expect(isValidEmail("")).toBe(false);
		});

		it("validates password length requirements", () => {
			expect(validatePassword("short").valid).toBe(false);
			expect(validatePassword("short").message).toContain("at least 8 characters");
			expect(validatePassword("12345678").valid).toBe(true);
			expect(validatePassword("StrongP@ssw0rd!").valid).toBe(true);
		});
	});

	describe("authentication flows", () => {
		it("signs up a new user and creates an active session", async () => {
			const result = await openVerseSignUp({
				email: "engineer@openverse.ai",
				password: "SecurePassword123!",
				fullName: "Ada Lovelace",
			});

			expect(result.session).not.toBeNull();
			expect(result.session?.user.email).toBe("engineer@openverse.ai");
			expect(result.session?.user.displayName).toBe("Ada Lovelace");
			expect(result.session?.user.isOfflineMode).toBe(false);

			const current = getCurrentUser();
			expect(current?.email).toBe("engineer@openverse.ai");
		});

		it("rejects sign-up with invalid email or weak password", async () => {
			await expect(
				openVerseSignUp({
					email: "not-an-email",
					password: "ValidPassword123!",
				}),
			).rejects.toThrow("Please enter a valid email address.");

			await expect(
				openVerseSignUp({
					email: "user@domain.com",
					password: "123",
				}),
			).rejects.toThrow("Password must be at least 8 characters long.");
		});

		it("signs in with valid email and password", async () => {
			const session = await openVerseSignIn({
				email: "developer@openverse.ai",
				password: "SuperSecret123!",
			});

			expect(session.user.email).toBe("developer@openverse.ai");
			expect(getCurrentSession()?.user.email).toBe("developer@openverse.ai");
		});

		it("rejects sign-in with empty password or invalid email", async () => {
			await expect(
				openVerseSignIn({
					email: "invalid-email",
					password: "password123",
				}),
			).rejects.toThrow("Please enter a valid email address.");

			await expect(
				openVerseSignIn({
					email: "user@domain.com",
					password: "",
				}),
			).rejects.toThrow("Password is required.");
		});

		it("initiates offline / local mode with local developer profile", () => {
			const session = continueInOfflineMode();

			expect(session.user.isOfflineMode).toBe(true);
			expect(session.user.id).toBe("openverse-local-developer");
			expect(session.user.displayName).toBe("Local Developer");
			expect(getCurrentUser()?.isOfflineMode).toBe(true);
		});

		it("verifies OTP and activates user session", async () => {
			const session = await openVerseVerifyOtp({
				email: "verify@openverse.ai",
				token: "998877",
			});

			expect(session.user.email).toBe("verify@openverse.ai");
			expect(getCurrentSession()?.user.email).toBe("verify@openverse.ai");
		});

		it("signs out and clears active session and user", async () => {
			await openVerseSignIn({
				email: "logout-test@openverse.ai",
				password: "Password123!",
			});
			expect(getCurrentUser()).not.toBeNull();

			await openVerseSignOut();
			expect(getCurrentUser()).toBeNull();
			expect(getCurrentSession()).toBeNull();
		});

		it("triggers subscriber events on authentication state change", async () => {
			const listener = vi.fn();
			const unsubscribe = subscribeAuthChange(listener);

			await openVerseSignIn({
				email: "subscriber@openverse.ai",
				password: "Password123!",
			});
			expect(listener).toHaveBeenCalled();
			expect(listener.mock.calls[listener.mock.calls.length - 1][0]?.user.email).toBe(
				"subscriber@openverse.ai",
			);

			await openVerseSignOut();
			expect(listener.mock.calls[listener.mock.calls.length - 1][0]).toBeNull();

			unsubscribe();
		});
	});
});

