"use client";

import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { refToPath } from "@/lib/github-url";
import { formatDate } from "@/lib/format";
import type { Paginated, PullRequestSummary } from "@/types/github";

interface PrListProps {
  owner: string;
  repo: string;
  refString: string;
  initial: Paginated<PullRequestSummary>;
}

export function PrList({ owner, repo, refString, initial }: PrListProps) {
  const fetchPage = useCallback(
    async (page: number) => {
      const res = await fetch(
        `/api/repo/${owner}/${repo}/prs-before/${refToPath(refString)}?page=${page}&perPage=10`
      );
      if (!res.ok) throw new Error("Failed to load more pull requests.");
      return (await res.json()) as Paginated<PullRequestSummary>;
    },
    [owner, repo, refString]
  );

  const { items, loading, error, sentinelRef } = useInfiniteList<PullRequestSummary>({
    initialItems: initial.items,
    initialHasNextPage: initial.hasNextPage,
    fetchPage,
  });

  return (
    <div className="space-y-1">
      {items.map((pr) => (
        <a
          key={pr.number}
          href={pr.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
        >
          <span className="min-w-0 flex-1 truncate">
            <span className="text-muted-foreground">#{pr.number}</span> {pr.title}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {pr.authorLogin ?? "unknown"}
            {pr.mergedAt && ` · ${formatDate(pr.mergedAt)}`}
          </span>
        </a>
      ))}
      {error && <p className="px-2 text-sm text-destructive">{error}</p>}
      <div ref={sentinelRef} className="h-1" />
      {loading && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Loading…
        </div>
      )}
    </div>
  );
}
