"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useIndexJob } from "@/hooks/use-index-job";
import type { ChatMessage, ChatSource } from "@/types/indexing";

const HISTORY_TURNS = 6;
const SOURCES_HEADER = "x-repolens-sources";

interface ChatWorkspaceValue {
  index: ReturnType<typeof useIndexJob>;
  messages: ChatMessage[];
  sending: boolean;
  chatError: string | null;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  draft: string;
  setDraft: (text: string) => void;
  sendMessage: (text: string) => Promise<void>;
  openWithPrefill: (text: string) => void;
}

const ChatWorkspaceContext = createContext<ChatWorkspaceValue | null>(null);

export function useChatWorkspace(): ChatWorkspaceValue {
  const ctx = useContext(ChatWorkspaceContext);
  if (!ctx) throw new Error("useChatWorkspace must be used within a ChatProvider");
  return ctx;
}

interface ChatProviderProps {
  owner: string;
  repo: string;
  sha: string;
  children: ReactNode;
}

export function ChatProvider({ owner, repo, sha, children }: ChatProviderProps) {
  const index = useIndexJob({ owner, repo, sha });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setChatError(null);
      const history = messages
        .slice(-HISTORY_TURNS)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, { role: "user", content: trimmed }, { role: "assistant", content: "" }]);
      setSending(true);

      try {
        const res = await fetch(`/api/chat/${owner}/${repo}/${sha}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to get a response.");
        }

        const sourcesHeader = res.headers.get(SOURCES_HEADER);
        const sources: ChatSource[] = sourcesHeader
          ? JSON.parse(decodeURIComponent(sourcesHeader))
          : [];

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const snapshot = accumulated;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: snapshot };
            return next;
          });
        }

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: accumulated, sources };
          return next;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        setChatError(message);
        // Roll back the optimistic user + empty assistant messages and put
        // the question back in the input so the user can just hit send again.
        setMessages((prev) => prev.slice(0, -2));
        setDraft(trimmed);
      } finally {
        setSending(false);
      }
    },
    [messages, owner, repo, sha, sending]
  );

  const openWithPrefill = useCallback((text: string) => {
    setDraft(text);
    setSheetOpen(true);
  }, []);

  return (
    <ChatWorkspaceContext.Provider
      value={{
        index,
        messages,
        sending,
        chatError,
        sheetOpen,
        setSheetOpen,
        draft,
        setDraft,
        sendMessage,
        openWithPrefill,
      }}
    >
      {children}
    </ChatWorkspaceContext.Provider>
  );
}
