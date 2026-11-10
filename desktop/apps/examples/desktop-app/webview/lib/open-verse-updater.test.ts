// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
	CURRENT_APP_VERSION,
	compareVersions,
	detectPlatform,
} from "./open-verse-updater";

describe("open-verse-updater", () => {
	describe("version comparison", () => {
		it("correctly identifies newer patch versions", () => {
			expect(compareVersions("0.2.0", "0.2.1")).toBe(1);
			expect(compareVersions("0.2.0", "0.2.0")).toBe(0);
			expect(compareVersions("0.2.1", "0.2.0")).toBe(-1);
		});

		it("correctly identifies newer minor and major versions", () => {
			expect(compareVersions("0.2.0", "0.3.0")).toBe(1);
			expect(compareVersions("0.2.0", "1.0.0")).toBe(1);
			expect(compareVersions("1.0.0", "0.9.9")).toBe(-1);
		});

		it("handles 'v' prefixes gracefully", () => {
			expect(compareVersions("v0.2.0", "v0.2.2")).toBe(1);
			expect(compareVersions("v1.2.3", "1.2.3")).toBe(0);
		});
	});

	describe("platform detection", () => {
		it("identifies web platform by default in jsdom", () => {
			const platform = detectPlatform();
			expect(["web", "desktop-windows"]).toContain(platform);
		});

		it("identifies android when AndroidInterface is present", () => {
			(window as any).AndroidInterface = { getAppVersion: () => "0.2.0" };
			expect(detectPlatform()).toBe("android");
			delete (window as any).AndroidInterface;
		});
	});
});

