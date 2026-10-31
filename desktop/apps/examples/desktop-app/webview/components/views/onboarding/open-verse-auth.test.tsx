// @vitest-environment jsdom

// @ts-expect-error react act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenVerseAuth } from "./open-verse-auth";

const { openExternalUrl } = vi.hoisted(() => ({
	openExternalUrl: vi.fn().mockResolvedValue(undefined),
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
		openExternalUrl.mockClear();
	});

	afterEach(async () => {
		await act(async () => {
			root.unmount();
		});
		container.remove();
	});

	function buttonByText(text: string): HTMLButtonElement {
		const button = Array.from(container.querySelectorAll("button")).find(
			(candidate) => candidate.textContent?.trim().includes(text),
		);
		if (!button) {
			throw new Error(`button not found containing: ${text}`);
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

	it("navigates from Get Started to the two account options: Google and GitHub", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="welcome" onAuthenticated={onAuth} />);
		});

		await act(async () => {
			buttonByText("Get Started").click();
		});

		expect(container.textContent).toContain("Welcome");
		expect(container.textContent).toContain("Create an account or sign in with your provider.");
		expect(container.querySelector('[data-openverse-auth-screen="auth_options"]')).not.toBeNull();

		// The two account options exist
		expect(buttonByText("Continue with Google")).not.toBeNull();
		expect(buttonByText("Continue with GitHub")).not.toBeNull();

		// Does not introduce additional identity providers like email/password registration
		expect(container.querySelector("#ov-signup-password")).toBeNull();
		expect(container.querySelector("#ov-signin-password")).toBeNull();
	});

	it("navigates from Sign In to the two account options: Google and GitHub", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="welcome" onAuthenticated={onAuth} />);
		});

		await act(async () => {
			buttonByText("Sign In").click();
		});

		expect(container.textContent).toContain("Welcome");
		expect(buttonByText("Continue with Google")).not.toBeNull();
		expect(buttonByText("Continue with GitHub")).not.toBeNull();
	});

	it("triggers real OAuth browser flow when clicking Continue with Google", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="auth_options" onAuthenticated={onAuth} />);
		});

		await act(async () => {
			buttonByText("Continue with Google").click();
		});

		expect(openExternalUrl).toHaveBeenCalledTimes(1);
		expect(openExternalUrl).toHaveBeenCalledWith(
			expect.stringContaining("provider=google"),
		);
		expect(container.textContent).toContain("Browser opened for Google sign-in");
	});

	it("triggers real OAuth browser flow when clicking Continue with GitHub", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="auth_options" onAuthenticated={onAuth} />);
		});

		await act(async () => {
			buttonByText("Continue with GitHub").click();
		});

		expect(openExternalUrl).toHaveBeenCalledTimes(1);
		expect(openExternalUrl).toHaveBeenCalledWith(
			expect.stringContaining("provider=github"),
		);
		expect(container.textContent).toContain("Browser opened for GitHub sign-in");
	});

	it("completes OAuth sign-in when callback token is submitted", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="auth_options" onAuthenticated={onAuth} />);
		});

		// Start Google OAuth flow to reveal the token submission input
		await act(async () => {
			buttonByText("Continue with Google").click();
		});

		const tokenInput = container.querySelector<HTMLInputElement>("input");
		expect(tokenInput).not.toBeNull();

		await act(async () => {
			const setter = Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				"value",
			)?.set;
			setter?.call(tokenInput, "openverse://auth/callback#access_token=test_oauth_token&email=alice@gmail.com&provider=google");
			tokenInput?.dispatchEvent(new Event("change", { bubbles: true }));
		});

		await act(async () => {
			buttonByText("Complete").click();
		});

		expect(onAuth).toHaveBeenCalledTimes(1);
		expect(onAuth).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "alice@gmail.com",
				provider: "google",
				isOfflineMode: false,
			}),
		);
	});

	it("switches to Offline / Local Mode and activates local developer profile", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth initialScreen="welcome" onAuthenticated={onAuth} />);
		});

		await act(async () => {
			buttonByText("Continue in Offline / Local Mode").click();
		});

		expect(onAuth).toHaveBeenCalledTimes(1);
		expect(onAuth).toHaveBeenCalledWith(
			expect.objectContaining({
				isOfflineMode: true,
				id: "openverse-local-developer",
				provider: "local",
			}),
		);
	});
});
