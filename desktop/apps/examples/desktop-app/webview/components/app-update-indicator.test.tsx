// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { AppUpdateIndicator } from "./app-update-indicator";

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(),
	toast: vi.fn(),
	status: { state: "idle" as const, version: null as string | null, error: null as string | null },
}));

vi.mock("@/lib/desktop-client", () => ({
	desktopClient: { invoke: mocks.invoke },
	isTauriAvailable: () => true,
}));

vi.mock("@/hooks/use-toast", () => ({
	toast: mocks.toast,
}));

vi.mock("@/hooks/use-app-update", () => ({
	useAppUpdateStatus: () => mocks.status,
	restartToApplyUpdate: async () => {
		try {
			await mocks.invoke("restart_to_apply_update");
			return true;
		} catch {
			return false;
		}
	},
}));

describe("AppUpdateIndicator", () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		mocks.invoke.mockReset();
		mocks.toast.mockReset();
		mocks.status = { state: "idle", version: null, error: null };
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => {
			root.unmount();
		});
		container.remove();
	});

	it("renders nothing when status is idle", () => {
		act(() => {
			root.render(<AppUpdateIndicator />);
		});
		expect(container.innerHTML).toBe("");
	});

	it("renders update button when update is ready", () => {
		mocks.status = { state: "ready", version: "0.2.0", error: null };
		act(() => {
			root.render(<AppUpdateIndicator />);
		});

		const button = container.querySelector("button[aria-label='Update ready: v0.2.0']");
		expect(button).not.toBeNull();
	});
});
