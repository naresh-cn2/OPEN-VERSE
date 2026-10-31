import React, { useState, useEffect, useRef } from "react";
import { MobileHeader } from "./components/MobileHeader";
import { MobileChat } from "./components/MobileChat";
import { MobileDrawer } from "./components/MobileDrawer";
import { MobileHubPairing } from "./components/MobileHubPairing";
import { MobileSettings } from "./components/MobileSettings";
import { MobileUpdateModal } from "./components/MobileUpdateModal";
import {
  type ChatMessage,
  type ChatSession,
  type ModelProviderKeys,
  getStoredProviderKeys,
  getStoredSessions,
  saveSessions,
} from "./services/storage";
import {
  type OpenVerseMobileUser,
  getMobileSession,
  handleDeepLinkCallback,
  loginOfflineMode,
} from "./services/auth";
import { streamDirectAI } from "./services/direct-ai";
import { remoteHub, type HubStatusMessage } from "./services/remote-hub";
import { checkMobileUpdate, type MobileUpdateInfo } from "./services/updater";

export function App() {
  const [user, setUser] = useState<OpenVerseMobileUser | null>(() => {
    const session = getMobileSession();
    return session?.user || loginOfflineMode().user;
  });

  const [providerKeys, setProviderKeys] = useState<ModelProviderKeys>(getStoredProviderKeys());
  const [sessions, setSessions] = useState<ChatSession[]>(getStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const stored = getStoredSessions();
    return stored.length > 0 ? stored[0].id : null;
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<MobileUpdateInfo | null>(null);

  const [isHubConnected, setIsHubConnected] = useState(remoteHub.isConnected());
  const [executionMode, setExecutionMode] = useState<"direct" | "hub">("direct");
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Active session resolution
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  // 1. Check for Mobile Updates on launch
  useEffect(() => {
    checkMobileUpdate().then((info) => {
      setUpdateInfo(info);
      if (info.available) {
        setIsUpdateModalOpen(true);
      }
    });
  }, []);

  // 2. Listen for deep link events (from Android/iOS native wrappers)
  useEffect(() => {
    const handleDeepLinkEvent = (event: any) => {
      const url = event.detail?.url;
      if (url && typeof url === "string" && url.startsWith("openverse://")) {
        try {
          const session = handleDeepLinkCallback(url);
          setUser(session.user);
        } catch (err) {
          console.error("Deep link parse failure:", err);
        }
      }
    };

    window.addEventListener("openverse:deeplink" as any, handleDeepLinkEvent);
    return () => window.removeEventListener("openverse:deeplink" as any, handleDeepLinkEvent);
  }, []);

  // 3. Subscribe to Desktop Hub events
  useEffect(() => {
    const unsubscribe = remoteHub.subscribe((msg: HubStatusMessage) => {
      if (msg.type === "status") {
        setIsHubConnected(msg.connected);
        if (msg.connected) {
          setExecutionMode("hub");
        } else {
          setExecutionMode("direct");
        }
      } else if (msg.type === "task_chunk" && msg.chunk) {
        // Stream desktop agent chunk into active message
        appendChunkToCurrentMessage(msg.chunk);
      } else if (msg.type === "task_complete") {
        setIsStreaming(false);
      } else if (msg.type === "error" && msg.error) {
        setIsStreaming(false);
      }
    });

    return () => unsubscribe();
  }, [activeSessionId]);

  const appendChunkToCurrentMessage = (chunk: string) => {
    setSessions((prev) => {
      return prev.map((s) => {
        if (s.id === activeSessionId) {
          const lastMsg = s.messages[s.messages.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            const updatedLast = { ...lastMsg, content: lastMsg.content + chunk };
            return { ...s, messages: [...s.messages.slice(0, -1), updatedLast] };
          }
        }
        return s;
      });
    });
  };

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    saveSessions(updated);
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleSendMessage = async (text: string) => {
    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];

    if (!currentSessionId || !currentSessions.some((s) => s.id === currentSessionId)) {
      const newSession: ChatSession = {
        id: `chat-${Date.now()}`,
        title: text.slice(0, 32) + (text.length > 32 ? "..." : ""),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      currentSessions = [newSession, ...currentSessions];
      currentSessionId = newSession.id;
      setActiveSessionId(currentSessionId);
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const assistantMessageId = `msg-${Date.now()}-a`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      provider: executionMode === "hub" ? "Desktop Hub Agent" : providerKeys.selectedProvider,
      model: executionMode === "hub" ? "Desktop Autonomous Worker" : providerKeys.selectedModel,
      isStreaming: true,
    };

    currentSessions = currentSessions.map((s) => {
      if (s.id === currentSessionId) {
        const title = s.messages.length === 0 ? text.slice(0, 32) : s.title;
        return {
          ...s,
          title,
          updatedAt: Date.now(),
          messages: [...s.messages, userMessage, initialAssistantMessage],
        };
      }
      return s;
    });

    setSessions(currentSessions);
    saveSessions(currentSessions);
    setIsStreaming(true);

    // MODE 1: Execute via Desktop Hub Agent if active
    if (executionMode === "hub" && isHubConnected) {
      const sent = remoteHub.executeDesktopTask(text);
      if (!sent) {
        // Fallback to direct client
        runDirectAIStreaming(currentSessionId, assistantMessageId, userMessage);
      }
      return;
    }

    // MODE 2: Direct Client Streaming
    await runDirectAIStreaming(currentSessionId, assistantMessageId, userMessage);
  };

  const runDirectAIStreaming = async (
    currentSessionId: string,
    assistantMessageId: string,
    userMessage: ChatMessage
  ) => {
    abortControllerRef.current = new AbortController();

    await streamDirectAI(
      [...(activeSession?.messages || []), userMessage],
      providerKeys,
      {
        onChunk: (chunk: string) => {
          setSessions((prev) => {
            return prev.map((s) => {
              if (s.id === currentSessionId) {
                const updatedMsgs = s.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return { ...m, content: m.content + chunk };
                  }
                  return m;
                });
                return { ...s, messages: updatedMsgs };
              }
              return s;
            });
          });
        },
        onError: (err: Error) => {
          setIsStreaming(false);
          setSessions((prev) => {
            const updated = prev.map((s) => {
              if (s.id === currentSessionId) {
                const updatedMsgs = s.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      content: m.content + `\n\n[Error: ${err.message}]`,
                      isStreaming: false,
                    };
                  }
                  return m;
                });
                return { ...s, messages: updatedMsgs };
              }
              return s;
            });
            saveSessions(updated);
            return updated;
          });
        },
        onComplete: (fullText: string) => {
          setIsStreaming(false);
          setSessions((prev) => {
            const updated = prev.map((s) => {
              if (s.id === currentSessionId) {
                const updatedMsgs = s.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return { ...m, content: fullText, isStreaming: false };
                  }
                  return m;
                });
                return { ...s, messages: updatedMsgs };
              }
              return s;
            });
            saveSessions(updated);
            return updated;
          });
        },
      },
      abortControllerRef.current.signal
    );
  };

  const handleStopStreaming = () => {
    if (executionMode === "hub" && isHubConnected) {
      remoteHub.cancelDesktopTask();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === activeSessionId) {
          const updatedMsgs = s.messages.map((m) => {
            if (m.isStreaming) {
              return { ...m, isStreaming: false };
            }
            return m;
          });
          return { ...s, messages: updatedMsgs };
        }
        return s;
      });
      saveSessions(updated);
      return updated;
    });
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-zinc-100 overflow-hidden font-sans">
      <MobileHeader
        onOpenMenu={() => setIsDrawerOpen(true)}
        onOpenHub={() => setIsHubOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUpdate={() => setIsUpdateModalOpen(true)}
        updateAvailable={Boolean(updateInfo?.available)}
        isHubConnected={isHubConnected}
        executionMode={executionMode}
        onToggleExecutionMode={() =>
          setExecutionMode((prev) => (prev === "direct" ? "hub" : "direct"))
        }
        activeProvider={providerKeys.selectedProvider}
        activeModel={providerKeys.selectedModel}
        user={user}
      />

      <MobileChat
        messages={messages}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onNewSession={createNewChat}
        activeProvider={executionMode === "hub" ? "Desktop Hub Agent" : providerKeys.selectedProvider}
        activeModel={executionMode === "hub" ? "Autonomous Desktop" : providerKeys.selectedModel}
      />

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={createNewChat}
        onDeleteSession={deleteSession}
        onOpenHub={() => setIsHubOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isHubConnected={isHubConnected}
        user={user}
      />

      <MobileHubPairing
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
        onHubStatusChange={(conn) => setIsHubConnected(conn)}
      />

      <MobileSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUserChange={(newUser) => setUser(newUser)}
        onProviderConfigChange={(newCfg) => setProviderKeys(newCfg)}
      />

      <MobileUpdateModal
        updateInfo={updateInfo}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  );
}
export default App;
