"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChatWorkspace } from "@/components/analysis/chat-provider";

interface ChatSheetProps {
  owner: string;
  repo: string;
}

export function ChatSheet({ owner, repo }: ChatSheetProps) {
  const { sheetOpen, setSheetOpen, messages, sending, chatError, draft, setDraft, sendMessage } =
    useChatWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft;
    setDraft("");
    sendMessage(text);
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Ask about {owner}/{repo}
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask a question about this repo&apos;s code at this commit.
            </p>
          )}
          {messages.map((message, i) => (
            <div key={i} className={message.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-left text-sm whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.content ||
                  (sending && i === messages.length - 1 ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    ""
                  ))}
              </div>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-1 space-y-0.5 text-left">
                  <p className="text-xs font-medium text-muted-foreground">Sources</p>
                  {message.sources.map((source, si) => (
                    <a
                      key={si}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {source.filePath}:{source.startLine}-{source.endLine}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {chatError && (
          <Alert variant="destructive" className="mx-4">
            <AlertDescription>{chatError}</AlertDescription>
          </Alert>
        )}

        <SheetFooter>
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question about this code..."
              disabled={sending}
              autoFocus
            />
            <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal />}
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
