import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { loadSqliteDb, nowIso, type SqliteDb } from "@cline/shared/db";
import { resolveDbDataDir } from "@cline/shared/storage";
import type { JsonRecord } from "./types";

export type TaskStatus = "queued" | "running" | "paused" | "cancelled" | "completed" | "failed" | "retrying";

export type TaskRecord = {
  taskId: string;
  sessionId: string;
  prompt: string;
  status: TaskStatus;
  priority: number;
  model?: string;
  workspaceRoot?: string;
  environmentId: string;
  attempt: number;
  maxAttempts: number;
  error?: string | null;
  resultSummary?: string | null;
  createdAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  claimToken?: string | null;
  claimUntilAt?: string | null;
};

export interface TaskQueueOptions {
  dbPath?: string;
  maxConcurrent?: number;
}

const DEFAULT_MAX_CONCURRENT = 4;
const DEFAULT_MAX_ATTEMPTS = 3;

export class TaskQueue {
  private db: SqliteDb;
  private maxConcurrent: number;
  private runningCount = 0;
  private claimTokens = new Map<string, string>();

  constructor(options: TaskQueueOptions = {}) {
    this.db = loadSqliteDb(options.dbPath ?? resolveTaskQueueDbPath());
    this.maxConcurrent = options.maxConcurrent ?? DEFAULT_MAX_CONCURRENT;
    this.ensureSchema();
    this.recoverInterruptedTasks();
  }

  private ensureSchema(): void {
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA busy_timeout = 5000;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_queue (
        task_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        priority INTEGER NOT NULL DEFAULT 0,
        model TEXT,
        workspace_root TEXT,
        environment_id TEXT NOT NULL DEFAULT 'local',
        attempt INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        error_message TEXT,
        result_summary TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        ended_at TEXT,
        claim_token TEXT,
        claim_until_at TEXT
      );
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_task_queue_status_priority
      ON task_queue(status, priority DESC, created_at ASC);
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_task_queue_session
      ON task_queue(session_id, created_at DESC);
    `);
  }
  private recoverInterruptedTasks(): void {
    const now = nowIso();
    const expired = this.db
      .prepare(
        `SELECT task_id FROM task_queue WHERE status = 'running' AND (claim_until_at IS NULL OR claim_until_at < ?)`
      )
      .all(now) as Array<{ task_id: string }>;

    for (const row of expired) {
      this.db
        .prepare(
          `UPDATE task_queue SET status = 'queued', claim_token = NULL, claim_until_at = NULL, attempt = attempt + 1 WHERE task_id = ?`
        )
        .run(row.task_id);
    }
  }


  public enqueue(input: {
    sessionId: string;
    prompt: string;
    priority?: number;
    model?: string;
    workspaceRoot?: string;
    environmentId?: string;
    maxAttempts?: number;
  }): TaskRecord {
    const taskId = randomUUID();
    const now = nowIso();
    const priority = input.priority ?? 0;
    const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

    this.db
      .prepare(
        `INSERT INTO task_queue (
          task_id, session_id, prompt, status, priority, model, workspace_root,
          environment_id, attempt, max_attempts, created_at
        ) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, 0, ?, ?)`
      )
      .run(
        taskId,
        input.sessionId,
        input.prompt,
        priority,
        input.model ?? null,
        input.workspaceRoot ?? null,
        input.environmentId ?? "local",
        maxAttempts,
        now
      );

    return this.get(taskId)!;
  }

  public get(taskId: string): TaskRecord | undefined {
    const row = this.db.prepare(`SELECT * FROM task_queue WHERE task_id = ?`).get(taskId) as
      | Record<string, unknown>
      | undefined;
    if (!row) return undefined;
    return this.rowToRecord(row);
  }
  public list(input?: {
    status?: TaskStatus | TaskStatus[];
    sessionId?: string;
    limit?: number;
  }): TaskRecord[] {
    const where: string[] = [];
    const params: unknown[] = [];

    if (input?.status) {
      const statuses = Array.isArray(input.status) ? input.status : [input.status];
      if (statuses.length > 0) {
        where.push(`status IN (${placeholders(statuses.length)})`);
        params.push(...statuses);
      }
    }
    if (input?.sessionId) {
      where.push(`session_id = ?`);
      params.push(input.sessionId);
    }

    const limit = Math.min(1000, Math.max(1, Math.floor(input?.limit ?? 200)));
    const rows = this.db
      .prepare(
        `SELECT * FROM task_queue${where.length > 0 ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY priority DESC, created_at ASC LIMIT ?`
      )
      .all(...params, limit) as Record<string, unknown>[];

    return rows.map((row) => this.rowToRecord(row));
  }

  public claimNext(): TaskRecord | undefined {
    if (this.runningCount >= this.maxConcurrent) return undefined;

    const now = nowIso();
    const claimUntil = new Date(Date.now() + 10 * 60_000).toISOString();
    const claimToken = randomUUID();

    // Select the highest-priority queued task first.
    const selected = this.db
      .prepare(
        `SELECT task_id FROM task_queue
         WHERE status = 'queued'
         ORDER BY priority DESC, created_at ASC
         LIMIT 1`
      )
      .get() as { task_id: string } | undefined;

    if (!selected) return undefined;

    // Claim it atomically with a conditional update.
    const result = this.db
      .prepare(
        `UPDATE task_queue
         SET status = 'running', claim_token = ?, claim_until_at = ?, started_at = COALESCE(started_at, ?), attempt = attempt + 1
         WHERE task_id = ? AND status = 'queued'`
      )
      .run(claimToken, claimUntil, now, selected.task_id);

    if ((result.changes ?? 0) === 0) return undefined;

    const row = this.get(selected.task_id);
    if (!row) return undefined;

    this.runningCount += 1;
    this.claimTokens.set(row.taskId, claimToken);
    return row;
  }

  public complete(
    taskId: string,
    input: {
      status: "completed" | "failed" | "cancelled";
      resultSummary?: string | null;
      error?: string | null;
    }
  ): boolean {
    const claimToken = this.claimTokens.get(taskId);
    const now = nowIso();

    const result = this.db
      .prepare(
        `UPDATE task_queue
         SET status = ?, claim_token = NULL, claim_until_at = NULL, ended_at = ?,
             result_summary = ?, error_message = ?
         WHERE task_id = ?`
      )
      .run(
        input.status,
        now,
        input.resultSummary ?? null,
        input.error ?? null,
        taskId
      );

    const changed = (result.changes ?? 0) > 0;
    if (changed) {
      this.runningCount = Math.max(0, this.runningCount - 1);
      this.claimTokens.delete(taskId);
    }
    return changed;
  }

  public retry(taskId: string): boolean {
    const row = this.get(taskId);
    if (!row) return false;
    if (row.status !== "failed" && row.status !== "cancelled") return false;
    if (row.attempt >= (row.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)) return false;

    this.db
      .prepare(
        `UPDATE task_queue SET status = 'queued', claim_token = NULL, claim_until_at = NULL, started_at = NULL, ended_at = NULL, error_message = NULL, result_summary = NULL WHERE task_id = ?`
      )
      .run(taskId);
    return true;
  }

  public cancel(taskId: string): boolean {
    const row = this.get(taskId);
    if (!row) return false;
    if (row.status === "completed" || row.status === "cancelled") return false;

    this.db
      .prepare(
        `UPDATE task_queue SET status = 'cancelled', claim_token = NULL, claim_until_at = NULL, ended_at = ? WHERE task_id = ?`
      )
      .run(nowIso(), taskId);

    const changed = (this.db.prepare(`SELECT changes() AS changes`).get() as { changes: number })
      .changes > 0;
    if (changed) {
      this.runningCount = Math.max(0, this.runningCount - 1);
      this.claimTokens.delete(taskId);
    }
    return changed;
  }

  public pauseTask(taskId: string): boolean {
    const row = this.get(taskId);
    if (!row) return false;
    if (row.status !== "running") return false;

    this.db
      .prepare(
        `UPDATE task_queue SET status = 'paused', claim_token = NULL, claim_until_at = NULL WHERE task_id = ?`
      )
      .run(taskId);

    this.runningCount = Math.max(0, this.runningCount - 1);
    this.claimTokens.delete(taskId);
    this.claimAvailableIfNeeded();
    return true;
  }

  public claimAvailableIfNeeded(): void {
    // Claim queued tasks up to the concurrency limit.
    while (this.runningCount < this.maxConcurrent) {
      const task = this.claimNext();
      if (!task) break;
    }
  }

  public getStats(): {
    queued: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    paused: number;
    retrying: number;
  } {
    const rows = this.db
      .prepare(
        `SELECT status, COUNT(*) AS cnt FROM task_queue GROUP BY status`
      )
      .all() as Array<{ status: string; cnt: number }>;

    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.status] = row.cnt;

    return {
      queued: counts.queued ?? 0,
      running: counts.running ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      cancelled: counts.cancelled ?? 0,
      paused: counts.paused ?? 0,
      retrying: counts.retrying ?? 0,
    };
  }

  public getRunningCount(): number {
    return this.runningCount;
  }

  public getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  public setMaxConcurrent(value: number): void {
    this.maxConcurrent = Math.max(1, value);
  }

  public releaseClaim(taskId: string): void {
    this.claimTokens.delete(taskId);
    this.runningCount = Math.max(0, this.runningCount - 1);
  }

  public close(): void {
    this.db.close?.();
  }

  private rowToRecord(row: Record<string, unknown>): TaskRecord {
    return {
      taskId: row.task_id as string,
      sessionId: row.session_id as string,
      prompt: row.prompt as string,
      status: row.status as TaskStatus,
      priority: (row.priority as number) ?? 0,
      model: (row.model as string) ?? undefined,
      workspaceRoot: (row.workspace_root as string) ?? undefined,
      environmentId: (row.environment_id as string) ?? "local",
      attempt: (row.attempt as number) ?? 0,
      maxAttempts: (row.max_attempts as number) ?? DEFAULT_MAX_ATTEMPTS,
      error: (row.error_message as string) ?? null,
      resultSummary: (row.result_summary as string) ?? null,
      createdAt: row.created_at as string,
      startedAt: (row.started_at as string) ?? null,
      endedAt: (row.ended_at as string) ?? null,
      claimToken: (row.claim_token as string) ?? null,
      claimUntilAt: (row.claim_until_at as string) ?? null,
    };
  }
}

function resolveTaskQueueDbPath(): string {
  const dir = resolveDbDataDir();
  return join(dir, "task-queue.db");
}

function placeholders(count: number): string {
  return Array(count).fill("?").join(", ");
}

