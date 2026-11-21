import type { TaskQueue } from "./task-queue";

export type ConcurrencySlot = {
  taskId: string;
  sessionId: string;
  startedAt: number;
};

export class ConcurrencyController {
  private taskQueue: TaskQueue;
  private maxConcurrent: number;
  private activeSlots = new Map<string, ConcurrencySlot>(); // taskId -> slot
  private claimInterval: ReturnType<typeof setInterval> | null = null;
  private onTaskAvailable?: () => void;

  constructor(taskQueue: TaskQueue, options?: { maxConcurrent?: number; claimIntervalMs?: number }) {
    this.taskQueue = taskQueue;
    this.maxConcurrent = options?.maxConcurrent ?? taskQueue.getMaxConcurrent();
    this.startClaimLoop(options?.claimIntervalMs ?? 2_000);
  }

  private startClaimLoop(intervalMs: number): void {
    this.claimInterval = setInterval(() => this.claimAvailable(), intervalMs);
    // Claim immediately on start.
    this.claimAvailable();
  }

  private claimAvailable(): void {
    while (this.activeSlots.size < this.maxConcurrent) {
      const task = this.taskQueue.claimNext();
      if (!task) break;
      this.activeSlots.set(task.taskId, {
        taskId: task.taskId,
        sessionId: task.sessionId,
        startedAt: Date.now(),
      });
      this.onTaskAvailable?.();
    }
  }

  public completeTask(taskId: string, status: "completed" | "failed" | "cancelled", input?: {
    resultSummary?: string | null;
    error?: string | null;
  }): boolean {
    const slot = this.activeSlots.get(taskId);
    if (!slot) return false;

    const result = this.taskQueue.complete(taskId, { status, ...input });
    if (result) {
      this.activeSlots.delete(taskId);
      // Try to claim the next queued task now that a slot is free.
      this.claimAvailable();
    }
    return result;
  }

  public cancelTask(taskId: string): boolean {
    const slot = this.activeSlots.get(taskId);
    if (!slot) return false;

    const result = this.taskQueue.cancel(taskId);
    if (result) {
      this.activeSlots.delete(taskId);
      this.claimAvailable();
    }
    return result;
  }

  public pauseTask(taskId: string): boolean {
    const slot = this.activeSlots.get(taskId);
    if (!slot) return false;

    const result = this.taskQueue.pauseTask(taskId);
    if (result) {
      this.activeSlots.delete(taskId);
      this.claimAvailable();
    }
    return result;
  }

  public retryTask(taskId: string): boolean {
    const result = this.taskQueue.retry(taskId);
    if (result) {
      this.claimAvailable();
    }
    return result;
  }

  public getTask(taskId: string) {
    return this.taskQueue.get(taskId);
  }

  public listTasks(input?: {
    status?: "queued" | "running" | "paused" | "cancelled" | "completed" | "failed" | "retrying";
    sessionId?: string;
    limit?: number;
  }) {
    return this.taskQueue.list(input);
  }

  public getStats() {
    const stats = this.taskQueue.getStats();
    return {
      ...stats,
      maxConcurrent: this.maxConcurrent,
      activeSlots: this.activeSlots.size,
    };
  }

  public setMaxConcurrent(value: number): void {
    this.maxConcurrent = Math.max(1, value);
    this.taskQueue.setMaxConcurrent(value);
    this.claimAvailable();
  }

  public setOnTaskAvailable(handler: () => void): void {
    this.onTaskAvailable = handler;
  }

  public getActiveSlots(): ConcurrencySlot[] {
    return Array.from(this.activeSlots.values());
  }

  public stop(): void {
    if (this.claimInterval) {
      clearInterval(this.claimInterval);
      this.claimInterval = null;
    }
    this.activeSlots.clear();
  }
}
