"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Loader2, MessageCircle, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIndexJob } from "@/hooks/use-index-job";

interface AskPanelProps {
  owner: string;
  repo: string;
  sha: string;
}

export function AskPanel({ owner, repo, sha }: AskPanelProps) {
  const { status, checking, start } = useIndexJob({ owner, repo, sha });
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
            <div className="flex gap-2">
              <Input placeholder="Ask a question about this code..." disabled />
              <Button size="icon" disabled>
                <SendHorizontal />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This repo is indexed — answering questions arrives in a later stage.
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
