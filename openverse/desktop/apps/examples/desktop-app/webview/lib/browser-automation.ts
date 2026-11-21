"use client";

export type BrowserTab = {
  tabId: string;
  url: string;
  title: string;
  favIconUrl?: string;
  active: boolean;
  createdAt: number;
};

export type BrowserSnapshot = {
  tabId: string;
  url: string;
  title: string;
  html: string;
  text: string;
  timestamp: number;
};

export type BrowserConsoleMessage = {
  tabId: string;
  level: "log" | "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
};

export type BrowserNetworkRequest = {
  tabId: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
};

export type BrowserPermission = "tabs" | "snapshots" | "click" | "forms" | "screenshots" | "console" | "network" | "performance" | "heap" | "lighthouse";

export interface BrowserAutomationService {
  isAvailable(): boolean;
  getTabs(): Promise<BrowserTab[]>;
  createTab(url?: string): Promise<BrowserTab>;
  closeTab(tabId: string): Promise<void>;
  switchTab(tabId: string): Promise<void>;
  navigateTab(tabId: string, url: string): Promise<void>;
  clickTab(tabId: string, selector: string): Promise<void>;
  typeTab(tabId: string, selector: string, text: string): Promise<void>;
  submitTab(tabId: string, selector: string): Promise<void>;
  snapshotTab(tabId: string): Promise<BrowserSnapshot>;
  getConsoleMessages(tabId: string): Promise<BrowserConsoleMessage[]>;
  getNetworkRequests(tabId: string): Promise<BrowserNetworkRequest[]>;
  runLighthouse(tabId: string): Promise<any>;
  checkPermissions(): Promise<BrowserPermission[]>;
  requestPermissions(permissions: BrowserPermission[]): Promise<BrowserPermission[]>;
}

class BrowserAutomationServiceImpl implements BrowserAutomationService {
  private available: boolean = false;
  private tabs: Map<string, BrowserTab> = new Map();
  private snapshots: Map<string, BrowserSnapshot[]> = new Map();

  async isAvailable(): Promise<boolean> {
    try {
      const result = await desktopClient.browserAvailable?.();
      this.available = result ?? false;
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }

  async getTabs(): Promise<BrowserTab[]> {
    try {
      const tabs = await desktopClient.browserGetTabs?.();
      if (tabs) {
        this.tabs.clear();
        for (const t of tabs) {
          this.tabs.set(t.tabId, t);
        }
        return tabs;
      }
    } catch {
      // Browser automation not available
    }
    return Array.from(this.tabs.values());
  }

  async createTab(url?: string): Promise<BrowserTab> {
    try {
      const tab = await desktopClient.browserCreateTab?.({ url });
      if (tab) {
        this.tabs.set(tab.tabId, tab);
        return tab;
      }
    } catch {
      // Browser automation not available
    }
    throw new Error("Browser automation not available");
  }

  async closeTab(tabId: string): Promise<void> {
    try {
      await desktopClient.browserCloseTab?.({ tabId });
      this.tabs.delete(tabId);
    } catch {
      throw new Error("Failed to close tab");
    }
  }

  async switchTab(tabId: string): Promise<void> {
    try {
      await desktopClient.browserSwitchTab?.({ tabId });
    } catch {
      throw new Error("Failed to switch tab");
    }
  }

  async navigateTab(tabId: string, url: string): Promise<void> {
    try {
      await desktopClient.browserNavigateTab?.({ tabId, url });
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        this.tabs.set(tabId, tab);
      }
    } catch {
      throw new Error("Failed to navigate tab");
    }
  }

  async clickTab(tabId: string, selector: string): Promise<void> {
    try {
      await desktopClient.browserClickTab?.({ tabId, selector });
    } catch {
      throw new Error("Failed to click element");
    }
  }

  async typeTab(tabId: string, selector: string, text: string): Promise<void> {
    try {
      await desktopClient.browserTypeTab?.({ tabId, selector, text });
    } catch {
      throw new Error("Failed to type text");
    }
  }

  async submitTab(tabId: string, selector: string): Promise<void> {
    try {
      await desktopClient.browserSubmitTab?.({ tabId, selector });
    } catch {
      throw new Error("Failed to submit form");
    }
  }

  async snapshotTab(tabId: string): Promise<BrowserSnapshot> {
    try {
      const snapshot = await desktopClient.browserSnapshotTab?.({ tabId });
      if (snapshot) {
        const snaps = this.snapshots.get(tabId) ?? [];
        snaps.push(snapshot);
        this.snapshots.set(tabId, snaps);
        return snapshot;
      }
    } catch {
      throw new Error("Failed to capture snapshot");
    }
    throw new Error("Browser automation not available");
  }

  async getConsoleMessages(tabId: string): Promise<BrowserConsoleMessage[]> {
    try {
      return await desktopClient.browserGetConsoleMessages?.({ tabId }) ?? [];
    } catch {
      return [];
    }
  }

  async getNetworkRequests(tabId: string): Promise<BrowserNetworkRequest[]> {
    try {
      return await desktopClient.browserGetNetworkRequests?.({ tabId }) ?? [];
    } catch {
      return [];
    }
  }

  async runLighthouse(tabId: string): Promise<any> {
    try {
      return await desktopClient.browserRunLighthouse?.({ tabId });
    } catch {
      throw new Error("Lighthouse not available");
    }
  }

  async checkPermissions(): Promise<BrowserPermission[]> {
    try {
      return await desktopClient.browserCheckPermissions?.() ?? [];
    } catch {
      return [];
    }
  }

  async requestPermissions(permissions: BrowserPermission[]): Promise<BrowserPermission[]> {
    try {
      return await desktopClient.browserRequestPermissions?.({ permissions }) ?? permissions;
    } catch {
      return [];
    }
  }
}

export const browserAutomation: BrowserAutomationService = new BrowserAutomationServiceImpl();