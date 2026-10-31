import React, { useState, useEffect, useRef } from "react";
import { MobileHeader } from "./components/MobileHeader";
import { MobileChat } from "./components/MobileChat";
import { MobileDrawer } from "./components/MobileDrawer";
import { MobileHubPairing } from "./components/MobileHubPairing";
import { MobileSettings } from "./components/MobileSettings";
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
import { remoteHub } from "./services/remote-hub";

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
  const [isHubConnected, setIsHubConnected] = useState(remoteHub.isConnected());
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Active session resolution
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  // Listen for deep link events (e.g. from native Android or iOS wrapper)
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
      provider: providerKeys.selectedProvider,
      model: providerKeys.selectedModel,
      isStreaming: true,
    };

    // Update session with user and empty streaming assistant message
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

    abortControllerRef.current = new AbortController();

    // Direct AI Streaming Call
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-zinc-100 overflow-hidden font-sans">
      <MobileHeader
        onOpenMenu={() => setIsDrawerOpen(true)}
        onOpenHub={() => setIsHubOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isHubConnected={isHubConnected}
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
        activeProvider={providerKeys.selectedProvider}
        activeModel={providerKeys.selectedModel}
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
    </div>
  );
}
export default App;
