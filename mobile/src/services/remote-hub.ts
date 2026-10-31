/**
 * OPEN-VERSE Remote Hub Companion Service
 * Pairs mobile app with running desktop OPEN-VERSE Hub daemon
 */

import { type HubConnectionConfig } from "./storage";

export interface HubWorkspace {
  id: string;
  name: string;
  path: string;
}

export interface HubStatusMessage {
  type: "status" | "workspaces" | "task_update" | "error";
  connected: boolean;
  version?: string;
  workspaces?: HubWorkspace[];
  activeTask?: string;
  error?: string;
}

export type HubEventListener = (msg: HubStatusMessage) => void;

class RemoteHubClient {
  private ws: WebSocket | null = null;
  private listeners: Set<HubEventListener> = new Set();
  private isConnecting: boolean = false;
  private currentConfig: HubConnectionConfig | null = null;

  public subscribe(listener: HubEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(msg: HubStatusMessage) {
    this.listeners.forEach((l) => l(msg));
  }

  public connect(config: HubConnectionConfig): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      this.currentConfig = config;
      this.isConnecting = true;

      const url = `ws://${config.host}:${config.port}/hub`;
      try {
        this.ws = new WebSocket(url);

        const timeout = setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            this.ws?.close();
            this.notify({
              type: "error",
              connected: false,
              error: `Connection to Hub at ${url} timed out.`,
            });
            resolve(false);
          }
        }, 4000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.notify({ type: "status", connected: true });
          // Request available workspaces from desktop
          this.send({ type: "list_workspaces" });
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.notify(data);
          } catch {
            // non-json message
          }
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.notify({
            type: "error",
            connected: false,
            error: `Failed to connect to OPEN-VERSE Desktop Hub at ${url}.`,
          });
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.notify({ type: "status", connected: false });
        };
      } catch (err) {
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN);
  }

  public send(payload: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }
}

export const remoteHub = new RemoteHubClient();
