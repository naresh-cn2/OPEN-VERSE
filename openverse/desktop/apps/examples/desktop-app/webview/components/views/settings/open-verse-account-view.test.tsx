// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountProvider } from "@/contexts/account-context";
import { setStoredSession } from "@/lib/open-verse-auth";
import { OpenVerseAccountView } from "./open-verse-account-view";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	window.localStorage.clear();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
});

describe("OpenVerseAccountView", () => {
	it("renders OPEN-VERSE Google identity profile, connected providers, and separate model pillars", async () => {
		setStoredSession({
			user: {
				id: "ov-user-123",
				email: "developer@openverse.ai",
				displayName: "Naresh",
				provider: "google",
				googleSub: "108392019283",
				isOfflineMode: false,
			},
		});

		await act(async () => {
			root.render(
				<AccountProvider>
					<OpenVerseAccountView />
				</AccountProvider>,
			);
		});

		// First-party identity rendered
		expect(container.textContent).toContain("Account Settings");
		expect(container.textContent).toContain("Naresh");
		expect(container.textContent).toContain("developer@openverse.ai");
		expect(container.textContent).toContain("Google Account");
		expect(container.textContent).toContain("108392019283");

		// Connected Identity Providers (Google Only)
		expect(container.textContent).toContain("Connected Identity Providers");
		expect(container.textContent).toContain("Google");

		// Session Security
		expect(container.textContent).toContain("Session Security & Expiration");
		expect(container.textContent).toContain("30-day auto-renew");

		// Separate AI Model Providers (The 3 Pillars)
		expect(container.textContent).toContain("AI Model Providers (3 Separate Pillars)");
		expect(container.textContent).toContain("Online Accounts");
		expect(container.textContent).toContain("API Keys");
		expect(container.textContent).toContain("Local Models");

		// Danger zone
		expect(container.textContent).toContain("Danger Zone");
		expect(container.textContent).toContain("Delete Account & Data");
	});

	it("renders autonomous offline mode user with local developer badge", async () => {
		setStoredSession({
			user: {
				id: "openverse-local-developer",
				email: "local@openverse.internal",
				displayName: "Local Developer",
				provider: "local",
				isOfflineMode: true,
			},
		});

		await act(async () => {
			root.render(
				<AccountProvider>
					<OpenVerseAccountView />
				</AccountProvider>,
			);
		});

		expect(container.textContent).toContain("Local Developer");
		expect(container.textContent).toContain("Local Developer");
	});
});
