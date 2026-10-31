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
  type: "status" | "workspaces" | "task_update" | "task_chunk" | "tool_call" | "task_complete" | "error";
  connected: boolean;
  version?: string;
  workspaces?: HubWorkspace[];
  activeTask?: string;
  chunk?: string;
  tool?: string;
  args?: any;
  error?: string;
}

export type HubEventListener = (msg: HubStatusMessage) => void;

class RemoteHubClient {
  private ws: WebSocket | null = null;
  private listeners: Set<HubEventListener> = new Set();
  private isConnecting: boolean = false;
  private currentConfig: HubConnectionConfig | null = null;
  private activeWorkspaceId: string | null = null;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;

  public subscribe(listener: HubEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(msg: HubStatusMessage) {
    this.listeners.forEach((l) => l(msg));
  }

  public setActiveWorkspace(id: string | null) {
    this.activeWorkspaceId = id;
    if (id && this.isConnected()) {
      this.send({ type: "select_workspace", workspaceId: id });
    }
  }

  public getActiveWorkspace(): string | null {
    return this.activeWorkspaceId;
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
          this.startHeartbeat();
          this.notify({ type: "status", connected: true });
          // Request available workspaces from desktop
          this.send({ type: "list_workspaces" });
          if (this.activeWorkspaceId) {
            this.send({ type: "select_workspace", workspaceId: this.activeWorkspaceId });
          }
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
          this.stopHeartbeat();
          this.notify({ type: "status", connected: false });
        };
      } catch (err) {
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: "ping", timestamp: Date.now() });
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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

  /**
   * Execute task remotely on the desktop agent engine
   */
  public executeDesktopTask(prompt: string, workspaceId?: string): boolean {
    return this.send({
      type: "execute_task",
      prompt,
      workspaceId: workspaceId || this.activeWorkspaceId,
      timestamp: Date.now(),
    });
  }

  public cancelDesktopTask(): boolean {
    return this.send({ type: "cancel_task" });
  }
}

export const remoteHub = new RemoteHubClient();
