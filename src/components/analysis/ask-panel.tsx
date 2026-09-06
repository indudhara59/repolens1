"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChatWorkspace } from "@/components/analysis/chat-provider";

export function AskPanel() {
  const { index, setSheetOpen } = useChatWorkspace();
  const { status, checking, start } = index;
  const [autoResumed, setAutoResumed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!checking && status.status === "running" && !autoResumed) {
      setAutoResumed(true);
      start();
    }
  }, [checking, status.status, autoResumed, start]);

  useEffect(() => {
    if (status.status !== "pending") setStarting(false);
  }, [status.status]);

  function handleStart() {
    setStarting(true);
    start();
  }

  const percentage = status.totalFiles > 0 ? (status.doneFiles / status.totalFiles) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-4" />
          Ask about this code
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checking ? null : status.status === "error" ? (
          <div className="space-y-3">
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{status.error ?? "Indexing failed."}</AlertDescription>
            </Alert>
            <Button size="sm" onClick={() => start()}>
              Retry
            </Button>
          </div>
        ) : status.status === "done" ? (
          <div className="space-y-2">
            <Button onClick={() => setSheetOpen(true)}>Open chat</Button>
            <p className="text-xs text-muted-foreground">
              This repo is indexed — ask questions about the code at this commit.
            </p>
          </div>
        ) : status.status === "running" ? (
          <div className="space-y-2">
            <Progress value={percentage} />
            <p className="text-sm text-muted-foreground">
              Indexing repo for Q&A... {status.doneFiles}/{status.totalFiles} files
            </p>
          </div>
        ) : (
          <Button onClick={handleStart} disabled={starting}>
            {starting && <Loader2 className="size-4 animate-spin" />}
            Ask about this code
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
