import { ExternalLink, FileDiff, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { CommitDetail } from "@/types/github";

export function OverviewSection({ commit }: { commit: CommitDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-medium">{commit.message.split("\n")[0]}</p>
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {commit.authorLogin ?? commit.authorName ?? "unknown author"}
          <span aria-hidden>·</span>
          {formatDateTime(commit.date)}
          <span aria-hidden>·</span>
          <a
            href={commit.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            {commit.sha.slice(0, 7)}
            <ExternalLink className="size-3" />
          </a>
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <FileDiff className="size-3.5" />
            {commit.files.length} files changed
          </Badge>
          {commit.stats && (
            <>
              <Badge variant="outline" className="gap-1" style={{ color: "var(--delta-positive)" }}>
                <Plus className="size-3.5" />
                {commit.stats.additions}
              </Badge>
              <Badge variant="outline" className="gap-1" style={{ color: "var(--delta-negative)" }}>
                <Minus className="size-3.5" />
                {commit.stats.deletions}
              </Badge>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
