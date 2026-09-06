"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { refToPath } from "@/lib/github-url";
import type { IssueState, IssueSummary, Paginated } from "@/types/github";

interface IssueListProps {
  owner: string;
  repo: string;
  refString: string;
  initial: Paginated<IssueSummary>;
}

const STATE_OPTIONS: { value: IssueState; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export function IssueList({ owner, repo, refString, initial }: IssueListProps) {
  const [state, setState] = useState<IssueState>("all");
  const [switching, setSwitching] = useState(false);

  const fetchPage = useCallback(
    async (page: number, forState: IssueState) => {
      const res = await fetch(
        `/api/repo/${owner}/${repo}/issues-before/${refToPath(refString)}?state=${forState}&page=${page}&perPage=10`
      );
      if (!res.ok) throw new Error("Failed to load more issues.");
      return (await res.json()) as Paginated<IssueSummary>;
    },
    [owner, repo, refString]
  );

  const { items, loading, error, sentinelRef, reset } = useInfiniteList<IssueSummary>({
    initialItems: initial.items,
    initialHasNextPage: initial.hasNextPage,
    fetchPage: (page) => fetchPage(page, state),
  });

  async function handleStateChange(next: IssueState) {
    if (next === state) return;
    setState(next);
    setSwitching(true);
    try {
      const page1 = await fetchPage(1, next);
      reset(page1.items, page1.hasNextPage);
    } catch {
      reset([], false);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {STATE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={state === option.value ? "default" : "outline"}
            onClick={() => handleStateChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {switching ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-1">
          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No issues found.</p>
          )}
          {items.map((issue) => (
            <a
              key={issue.number}
              href={issue.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <span className="min-w-0 flex-1 truncate">
                <span className="text-muted-foreground">#{issue.number}</span> {issue.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {issue.state} · {issue.authorLogin ?? "unknown"}
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
      )}
    </div>
  );
}
