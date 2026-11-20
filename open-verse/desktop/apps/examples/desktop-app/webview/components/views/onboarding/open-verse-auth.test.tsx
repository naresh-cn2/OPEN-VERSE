// @vitest-environment jsdom

// @ts-expect-error react act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	completeUserOnboarding,
	loginWithGoogleOidc,
	setStoredSession,
} from "@/lib/open-verse-auth";
import { OpenVerseAuth } from "./open-verse-auth";

const { openExternalUrl } = vi.hoisted(() => ({
	openExternalUrl: vi.fn().mockResolvedValue(undefined),
}));

class MemoryStorage implements Storage {
	private store = new Map<string, string>();
	get length() { return this.store.size; }
	clear() { this.store.clear(); }
	getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
	setItem(key: string, value: string) { this.store.set(key, String(value)); }
	removeItem(key: string) { this.store.delete(key); }
	key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
}

if (!window.localStorage || typeof window.localStorage.clear !== "function") {
	Object.defineProperty(window, "localStorage", { value: new MemoryStorage(), writable: true });
}
if (!window.sessionStorage || typeof window.sessionStorage.clear !== "function") {
	Object.defineProperty(window, "sessionStorage", { value: new MemoryStorage(), writable: true });
}

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
		window.localStorage.clear();
		window.sessionStorage.clear();
		setStoredSession(null);
		window.location.hash = "";
	});

	afterEach(async () => {
		await act(async () => {
			root.unmount();
		});
		container.remove();
		window.localStorage.clear();
		window.sessionStorage.clear();
		setStoredSession(null);
		window.location.hash = "";
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

	it("renders Google-only authentic OPEN-VERSE screen with simple design", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth onAuthenticated={onAuth} />);
		});

		expect(container.textContent).toContain("OPEN-VERSE");
		expect(container.textContent).toContain("Your AI workspace, everywhere.");
		expect(container.textContent).toContain("Continue with Google");
		// Ensure neither guest nor fake options exist
		expect(container.textContent).not.toContain("Continue as Guest");
		expect(container.textContent).not.toContain("Continue with GitHub");
		expect(container.textContent).not.toContain("Continue in Offline Local Mode");
		expect(container.querySelector("[data-openverse-auth-container]")).not.toBeNull();
		// Ensure Check for Updates is present
		expect(container.textContent).toContain("Check for Updates");
	});

	it("launches official Google OAuth with prompt=select_account when clicking Continue with Google", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth onAuthenticated={onAuth} />);
		});

		const googleBtn = buttonByText("Continue with Google");
		await act(async () => {
			googleBtn.click();
		});

		// Verifies that external browser URL was opened with accounts.google.com and prompt=select_account
		expect(openExternalUrl).toHaveBeenCalledTimes(1);
		const openedUrl = openExternalUrl.mock.calls[0][0];
		expect(openedUrl).toContain("/api/auth/authorize");
		expect(openedUrl).toContain("provider=google");
		expect(openedUrl).toContain("prompt=select_account");
		expect(openedUrl).toContain("scope=openid+email+profile");
	});

	it("authenticates returning user when Google returns identity callback", async () => {
		// Pre-register returning user
		const { session } = await loginWithGoogleOidc({
			sub: "cn2_sub_999",
			email: "nareshnayak.cn2@gmail.com",
			name: "Naresh",
		});
		completeUserOnboarding(session.user.id);

		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth onAuthenticated={onAuth} />);
		});

		// Simulate callback dispatch from Google
		await act(async () => {
			const callbackUrl =
				"openverse://auth/callback#access_token=ov_tok_999&email=nareshnayak.cn2@gmail.com&name=Naresh&sub=cn2_sub_999";
			(window as any).__dispatchOpenVerseDeepLink(callbackUrl);
		});

		await act(async () => {
			await new Promise((r) => setTimeout(r, 450));
		});

		expect(onAuth).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "nareshnayak.cn2@gmail.com",
				displayName: "Naresh",
				provider: "google",
			}),
		);
	});

	it("presents first-time onboarding wizard when a new Google user signs up", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth onAuthenticated={onAuth} />);
		});

		// Simulate new Google user returning from accounts.google.com
		await act(async () => {
			const callbackUrl =
				"openverse://auth/callback#access_token=ov_tok_new&email=newuser@gmail.com&name=New+User&sub=new_sub_555";
			(window as any).__dispatchOpenVerseDeepLink(callbackUrl);
		});

		await act(async () => {
			await new Promise((r) => setTimeout(r, 100));
		});

		// Transitions to first-time onboarding wizard
		expect(container.textContent).toContain("Welcome to OPEN-VERSE");
		expect(container.textContent).toContain("Step 1 of 4");
		const emailInput = container.querySelector('input[disabled]') as HTMLInputElement;
		expect(emailInput?.value).toBe("newuser@gmail.com");
	});

	it("strictly excludes Continue as Guest button on the opening screen", async () => {
		const onAuth = vi.fn();
		await act(async () => {
			root.render(<OpenVerseAuth onAuthenticated={onAuth} />);
		});

		expect(container.textContent).not.toContain("Continue as Guest");
		expect(container.textContent).toContain("Continue with Google");
		expect(container.textContent).toContain("Check for Updates");
	});
});
