"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatWorkspace } from "@/components/analysis/chat-provider";
import type { CommitDetail } from "@/types/github";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  added: "secondary",
  removed: "destructive",
};

interface ChangedFilesSectionProps {
  files: CommitDetail["files"];
}

export function ChangedFilesSection({ files }: ChangedFilesSectionProps) {
  const { index, openWithPrefill } = useChatWorkspace();
  const indexed = index.status.status === "done";

  if (files.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Files changed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {files.map((file) => (
          <div
            key={file.filename}
            className="flex flex-col gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Badge variant={STATUS_VARIANT[file.status] ?? "outline"} className="shrink-0 font-normal">
                {file.status}
              </Badge>
              <code className="truncate text-xs">{file.filename}</code>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span style={{ color: "var(--delta-positive)" }}>+{file.additions}</span>
              <span style={{ color: "var(--delta-negative)" }}>-{file.deletions}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={!indexed}
                title={indexed ? undefined : "Index this repo first (see Ask about this code)"}
                onClick={() =>
                  openWithPrefill(`Explain what changed in ${file.filename} in this commit and why.`)
                }
              >
                Explain this file
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
