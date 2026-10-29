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
	it("renders OPEN-VERSE first-party identity profile and separate model providers section", async () => {
		setStoredSession({
			user: {
				id: "ov-user-123",
				email: "developer@openverse.ai",
				displayName: "Naresh",
				provider: "google",
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
		expect(container.textContent).toContain("Google OAuth");

		// Data and session isolation
		expect(container.textContent).toContain("Local Workspace & Session Storage");
		expect(container.textContent).toContain("~/.openverse/data/db/sessions.db");
		expect(container.textContent).toContain("Preserved intact (71+ sessions)");

		// Separate AI Model Providers
		expect(container.textContent).toContain("AI Model Providers");
		expect(container.textContent).toContain("Cline Provider");
		expect(container.textContent).toContain("Google Gemini");
		expect(container.textContent).toContain("OpenAI / ChatGPT");
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
		expect(container.textContent).toContain("Autonomous Local Mode");
	});
});
