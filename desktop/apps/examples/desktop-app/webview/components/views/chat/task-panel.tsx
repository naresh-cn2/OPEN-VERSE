"use client";

import { useEffect, useRef, useState } from "react";
import { desktopClient } from "@/lib/desktop-client";
import type { TaskRecord, TaskStats } from "@/lib/desktop-client";

export type TaskStatus =
  | "queued"
  | "running"
  | "paused"
  | "cancelled"
  | "completed"
  | "failed"
  | "retrying";

export interface TaskPanelProps {
  className?: string;
}

export function TaskPanel({ className }: TaskPanelProps) {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [prompt, setPrompt] = useState("");
  const [sessionId, setSessionId] = useState("default-session");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const unsubRef = useRef<(() => void) | null>(null);

  const filtered = Array.isArray(tasks)
    ? statusFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status === statusFilter)
    : [];
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const list = await desktopClient.listTasks({ limit: 50 });
        setTasks(list);
      } catch {}
      try {
        const s = await desktopClient.getTaskStats();
        setStats(s);
      } catch {}
    };
    loadTasks();

    const unsub = desktopClient.subscribe("task_status", (payload: any) => {
      const task = payload as TaskRecord;
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.taskId === task.taskId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = task;
          return next;
        }
        return [task, ...prev];
      });
    });
    unsubRef.current = unsub;

    return () => {
      unsub?.();
    };
  }, []);


  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    try {
      const task = await desktopClient.enqueueTask({
        sessionId,
        prompt,
        priority: 0,
      });
      setTasks((prev) => [task, ...prev]);
      setPrompt("");
      try {
        const s = await desktopClient.getTaskStats();
        setStats(s);
      } catch {}
    } catch (err) {
      console.error("Failed to enqueue task:", err);
    }
  };

  const handleCancel = async (taskId: string) => {
    try {
      await desktopClient.cancelTask(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId ? { ...t, status: "cancelled" } : t
        ),
      );
      try {
        const s = await desktopClient.getTaskStats();
        setStats(s);
      } catch {}
    } catch (err) {
      console.error("Failed to cancel task:", err);
    }
  };

  const handleRetry = async (taskId: string) => {
    try {
      await desktopClient.retryTask(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId ? { ...t, status: "queued" } : t
        ),
      );
      try {
        const s = await desktopClient.getTaskStats();
        setStats(s);
      } catch {}
    } catch (err) {
      console.error("Failed to retry task:", err);
    }
  };

  return (
    <div className={`flex flex-col h-full border-l border-border ${className || ""}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-muted">
        <h2 className="text-sm font-semibold text-foreground">Multi-Chat Tasks</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2 py-1 text-xs rounded ${statusFilter === "all" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >All</button>
          <button
            onClick={() => setStatusFilter("queued")}
            className={`px-2 py-1 text-xs rounded ${statusFilter === "queued" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >Queued</button>
          <button
            onClick={() => setStatusFilter("running")}
            className={`px-2 py-1 text-xs rounded ${statusFilter === "running" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >Running</button>
        </div>
      </div>

      {stats && (
        <div className="px-3 py-1 bg-muted text-xs">
          <span className="text-foreground/70">Q:{stats.queued}</span>
          <span className="text-blue-500">R:{stats.running}</span>
          <span className="text-green-500">C:{stats.completed}</span>
          <span className="text-red-500">F:{stats.failed}</span>
          <span className="text-slate-500">X:{stats.cancelled}</span>
          <span className="ml-auto text-slate-500">Max concurrency: {stats.maxConcurrent}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-sm">No tasks</div>
        ) : (
          filtered.map((task) => (
            <div key={task.taskId} className="border border-border p-2 rounded bg-background">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{task.sessionId}</span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${statusColor(task.status)} text-white`}
                >
                  {task.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {task.prompt.slice(0, 80)}{task.prompt.length > 80 ? "..." : ""}
              </div>
              <div className="flex gap-1">
                {task.status === "queued" || task.status === "paused" || task.status === "failed" || task.status === "cancelled" ? (
                  <button
                    onClick={() => handleRetry(task.taskId)}
                    className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >Retry</button>
                ) : null}
                {task.status === "running" ? (
                  <button
                    onClick={() => handleCancel(task.taskId)}
                    className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >Cancel</button>
                ) : null}
              </div>
              {task.error && (
                <div className="text-xs text-red-500 mt-1">{task.error}</div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-2 bg-muted">
        <form onSubmit={handleEnqueue} className="flex gap-1">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="New task prompt..."
            className="flex-1 px-2 py-1 text-xs rounded border border-input bg-background focus:outline-none"
          />
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="session"
            className="px-1.5 py-1 text-xs rounded border border-input bg-background focus:outline-none w-20"
          />
          <button
            type="submit"
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!prompt.trim()}
          >Add</button>
        </form>
      </div>
    </div>
  );
}