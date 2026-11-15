import type { SidecarContext } from "./types";

export async function handleBrowserCommand(
	ctx: SidecarContext,
	command: string,
	args?: Record<string, unknown>,
): Promise<unknown> {
	switch (command) {
		case "browser_available": {
			return { available: false };
		}
		case "browser_get_tabs": {
			return { tabs: [] };
		}
		case "browser_create_tab": {
			return { tab: { tabId: String(args?.tabId ?? crypto.randomUUID()), url: args?.url ?? "about:blank", title: "New Tab", active: true, createdAt: Date.now() } };
		}
		case "browser_close_tab": {
			return {};
		}
		case "browser_switch_tab": {
			return {};
		}
		case "browser_navigate_tab": {
			return {};
		}
		case "browser_click_tab": {
			return {};
		}
		case "browser_type_tab": {
			return {};
		}
		case "browser_submit_tab": {
			return {};
		}
		case "browser_snapshot_tab": {
			return { snapshot: { tabId: String(args?.tabId), url: "about:blank", title: "New Tab", html: "", text: "", timestamp: Date.now() } };
		}
		case "browser_get_console_messages": {
			return { messages: [] };
		}
		case "browser_get_network_requests": {
			return { requests: [] };
		}
		case "browser_run_lighthouse": {
			return { error: "Lighthouse not available" };
		}
		case "browser_check_permissions": {
			return { permissions: [] };
		}
		case "browser_request_permissions": {
			return { permissions: args?.permissions ?? [] };
		}
		default:
			throw new Error(`unsupported browser command: ${command}`);
	}
}
