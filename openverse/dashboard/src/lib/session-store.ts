export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  agent?: string;
  model?: string;
  codeSnippet?: string;
}

export interface StoredSession {
  sessionId: string;
  title: string;
  createdAt: string;
  lastActivityAt: string;
  provider: string;
  model: string;
  messages: ChatMessage[];
  status: "active" | "completed" | "error";
}

const SESSIONS_STORAGE_KEY = "openverse.sessions.v1";

export function loadStoredSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to load stored sessions:", error);
    return [];
  }
}

export function saveStoredSessions(sessions: StoredSession[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.warn("Failed to save stored sessions:", error);
  }
}

export function createNewSession(options: {
  initialPrompt: string;
  provider: string;
  model: string;
  agent?: string;
}): StoredSession {
  const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const title =
    options.initialPrompt.trim().length > 32
      ? `${options.initialPrompt.trim().slice(0, 32)}...`
      : options.initialPrompt.trim() || "New Session";

  const userMessage: ChatMessage = {
    id: `msg_${Date.now()}_u`,
    role: "user",
    content: options.initialPrompt,
    timestamp: now,
  };

  const newSession: StoredSession = {
    sessionId,
    title,
    createdAt: now,
    lastActivityAt: now,
    provider: options.provider,
    model: options.model,
    messages: [userMessage],
    status: "active",
  };

  const existing = loadStoredSessions();
  saveStoredSessions([newSession, ...existing]);
  return newSession;
}

export function addMessageToSession(
  sessionId: string,
  message: Omit<ChatMessage, "id" | "timestamp">
): StoredSession | null {
  const sessions = loadStoredSessions();
  const index = sessions.findIndex((s) => s.sessionId === sessionId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const fullMessage: ChatMessage = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
  };

  sessions[index].messages.push(fullMessage);
  sessions[index].lastActivityAt = now;
  saveStoredSessions(sessions);
  return sessions[index];
}

export function deleteStoredSession(sessionId: string): void {
  const sessions = loadStoredSessions();
  const filtered = sessions.filter((s) => s.sessionId !== sessionId);
  saveStoredSessions(filtered);
}

export function clearAllStoredSessions(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear sessions:", error);
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const seconds = Math.floor(elapsedMs / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  } catch {
    return "";
  }
}
