// @vitest-environment jsdom

// @ts-expect-error react act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenVerseAuth } from "./open-verse-auth";

const { openExternalUrl } = vi.hoisted(() => ({
	openExternalUrl: vi.fn(),
}));

vi.mock("@/lib/desktop-client", () => ({
	openExternalUrl,
	desktopClient: { invoke: vi.fn(), subscribe: vi.fn(() => () => {}) },
}));

describe("OpenVerseAuth UI Component", () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(async () => {
		await act(async () => {
			root.unmount();
		});
		container.remove();
	});

	function buttonByText(text: string): HTMLButtonElement {
		const button = Array.from(container.querySelectorAll("button")).find(
			(candidate) => candidate.textContent?.trim() === text,
		);
		if (!button) {
			throw new Error(`button not found: ${text}`);
		}
		return button;
	}

	it("renders welcome screen with OPEN-VERSE branding and options", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="welcome" onAuthenticated={onAuth} />);
		});

		expect(container.textContent).toContain("OPEN-VERSE");
		expect(container.textContent).toContain("Your AI-powered development workspace");
		expect(container.querySelector('[data-openverse-auth-screen="welcome"]')).not.toBeNull();

		// Buttons available
		expect(buttonByText("Get Started")).not.toBeNull();
		expect(buttonByText("Sign In")).not.toBeNull();
		expect(container.textContent).toContain("Continue in Offline / Local Mode");
	});

	it("navigates from Welcome to Sign In and submits valid credentials", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="welcome" onAuthenticated={onAuth} />);
		});

		await act(async () => {
			buttonByText("Sign In").click();
		});

		expect(container.textContent).toContain("Sign In to OPEN-VERSE");
		expect(container.querySelector('[data-openverse-auth-screen="sign_in"]')).not.toBeNull();

		const emailInput = container.querySelector<HTMLInputElement>("#ov-signin-email");
		const passwordInput = container.querySelector<HTMLInputElement>("#ov-signin-password");

		await act(async () => {
			const setter = Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				"value",
			)?.set;
			setter?.call(emailInput, "dev@openverse.ai");
			emailInput?.dispatchEvent(new Event("change", { bubbles: true }));

			setter?.call(passwordInput, "SecurePass123!");
			passwordInput?.dispatchEvent(new Event("change", { bubbles: true }));
		});

		await act(async () => {
			buttonByText("Sign In").click();
		});

		expect(onAuth).toHaveBeenCalledTimes(1);
		expect(onAuth).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "dev@openverse.ai",
			}),
		);
	});

	it("navigates to Sign Up, rejects mismatched passwords, and signs up successfully", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="welcome" onAuthenticated={onAuth} />);
		});

		await act(async () => {
			buttonByText("Get Started").click();
		});

		expect(container.textContent).toContain("Create Account");
		expect(container.querySelector('[data-openverse-auth-screen="sign_up"]')).not.toBeNull();

		const emailInput = container.querySelector<HTMLInputElement>("#ov-signup-email");
		const passwordInput = container.querySelector<HTMLInputElement>("#ov-signup-password");
		const confirmInput = container.querySelector<HTMLInputElement>("#ov-signup-confirm");

		const setValue = (el: HTMLInputElement | null, val: string) => {
			const setter = Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				"value",
			)?.set;
			setter?.call(el, val);
			el?.dispatchEvent(new Event("change", { bubbles: true }));
		};

		// Test password mismatch
		await act(async () => {
			setValue(emailInput, "builder@openverse.ai");
			setValue(passwordInput, "StrongPass123");
			setValue(confirmInput, "DifferentPass456");
		});

		await act(async () => {
			buttonByText("Create Account").click();
		});

		expect(container.textContent).toContain("Passwords do not match");
		expect(onAuth).not.toHaveBeenCalled();

		// Correct confirmation password
		await act(async () => {
			setValue(confirmInput, "StrongPass123");
		});

		await act(async () => {
			buttonByText("Create Account").click();
		});

		expect(onAuth).toHaveBeenCalledTimes(1);
		expect(onAuth).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "builder@openverse.ai",
			}),
		);
	});

	it("switches to Offline / Local Mode and activates local developer profile", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="welcome" onAuthenticated={onAuth} />);
		});

		const offlineBtn = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Continue in Offline / Local Mode"),
		);
		expect(offlineBtn).not.toBeNull();

		await act(async () => {
			offlineBtn?.click();
		});

		expect(container.textContent).toContain("Local & Offline Mode");
		expect(container.textContent).toContain("zero-trust sandboxing");

		await act(async () => {
			buttonByText("Continue to Local Workspace").click();
		});

		expect(onAuth).toHaveBeenCalledTimes(1);
		expect(onAuth).toHaveBeenCalledWith(
			expect.objectContaining({
				isOfflineMode: true,
				id: "openverse-local-developer",
			}),
		);
	});

	it("renders password reset workflow", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="sign_in" onAuthenticated={onAuth} />);
		});

		const forgotLink = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Forgot password?"),
		);
		expect(forgotLink).not.toBeNull();

		await act(async () => {
			forgotLink?.click();
		});

		expect(container.textContent).toContain("Reset Password");
		const emailInput = container.querySelector<HTMLInputElement>("#ov-forgot-email");

		await act(async () => {
			const setter = Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				"value",
			)?.set;
			setter?.call(emailInput, "reset@openverse.ai");
			emailInput?.dispatchEvent(new Event("change", { bubbles: true }));
		});

		await act(async () => {
			buttonByText("Send Reset Instructions").click();
		});

		expect(container.textContent).toContain("Password reset instructions have been dispatched");
	});

	it("renders Google and GitHub OAuth options and handles unconfigured auth without fake storage login", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="sign_in" onAuthenticated={onAuth} />);
		});

		const githubBtn = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Continue with GitHub"),
		);
		const googleBtn = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Continue with Google"),
		);

		expect(githubBtn).toBeDefined();
		expect(googleBtn).toBeDefined();

		// Clicking Google button when cloud auth backend is not configured
		await act(async () => {
			googleBtn?.click();
		});

		expect(container.textContent).toContain(
			"Cloud authentication backend is not configured",
		);
		// Never faked a login into storage
		expect(onAuth).not.toHaveBeenCalled();
	});
});
