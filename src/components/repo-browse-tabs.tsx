"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useState } from "react";
import { GitCommitHorizontal, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { refToPath } from "@/lib/github-url";
import { formatDate } from "@/lib/format";
import type { Branch, CommitSummary, Paginated, Release } from "@/types/github";

interface RepoBrowseTabsProps {
  owner: string;
  repo: string;
  defaultBranch: string;
  branches: Branch[];
  initialReleases: Paginated<Release>;
  initialCommits: Paginated<CommitSummary>;
}

export function RepoBrowseTabs({
  owner,
  repo,
  defaultBranch,
  branches,
  initialReleases,
  initialCommits,
}: RepoBrowseTabsProps) {
  const fetchReleasesPage = useCallback(
    async (page: number) => {
      const res = await fetch(`/api/repo/${owner}/${repo}/releases?page=${page}&perPage=20`);
      if (!res.ok) throw new Error("Failed to load releases.");
      return (await res.json()) as Paginated<Release>;
    },
    [owner, repo]
  );

  const releases = useInfiniteList<Release>({
    initialItems: initialReleases.items,
    initialHasNextPage: initialReleases.hasNextPage,
    fetchPage: fetchReleasesPage,
  });

  const [branch, setBranch] = useState(defaultBranch);
  const [branchLoading, setBranchLoading] = useState(false);

  const fetchCommitsPage = useCallback(
    async (page: number, forBranch: string) => {
      const res = await fetch(
        `/api/repo/${owner}/${repo}/commits?branch=${encodeURIComponent(forBranch)}&page=${page}&perPage=20`
      );
      if (!res.ok) throw new Error("Failed to load commits.");
      return (await res.json()) as Paginated<CommitSummary>;
    },
    [owner, repo]
  );

  const commits = useInfiniteList<CommitSummary>({
    initialItems: initialCommits.items,
    initialHasNextPage: initialCommits.hasNextPage,
    fetchPage: (page) => fetchCommitsPage(page, branch),
  });

  async function handleBranchChange(newBranch: string | null) {
    if (!newBranch) return;
    setBranch(newBranch);
    setBranchLoading(true);
    try {
      const page1 = await fetchCommitsPage(1, newBranch);
      commits.reset(page1.items, page1.hasNextPage);
    } catch {
      commits.reset([], false);
    } finally {
      setBranchLoading(false);
    }
  }

  return (
    <Tabs defaultValue="releases">
      <TabsList>
        <TabsTrigger value="releases">Releases</TabsTrigger>
        <TabsTrigger value="commits">All Commits</TabsTrigger>
      </TabsList>

      <TabsContent value="releases" className="mt-4 space-y-3">
        {releases.items.length === 0 && !releases.loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No releases yet — browse commits instead.
          </p>
        )}
        {releases.items.map((release) => (
          <Card key={release.id} className="flex-row items-center justify-between gap-4 px-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{release.name || release.tagName}</p>
              <p className="text-sm text-muted-foreground">
                {release.tagName} · {formatDate(release.publishedAt)}
                {release.prerelease && " · pre-release"}
              </p>
            </div>
            <Button
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/repo/${owner}/${repo}/${refToPath(release.tagName)}`}>
                  View analysis
                </Link>
              }
            />
          </Card>
        ))}
        {releases.error && (
          <p className="text-sm text-destructive">{releases.error}</p>
        )}
        <div ref={releases.sentinelRef} className="h-1" />
        {releases.loading && <ListSkeleton />}
      </TabsContent>

      <TabsContent value="commits" className="mt-4 space-y-3">
        {branches.length > 1 && (
          <Select value={branch} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.name} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {branchLoading ? (
          <ListSkeleton />
        ) : (
          <>
            {commits.items.length === 0 && !commits.loading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No commits found on this branch.
              </p>
            )}
            {commits.items.map((commit) => (
              <Link
                key={commit.sha}
                href={`/repo/${owner}/${repo}/${commit.sha}`}
                className="block"
              >
                <Card className="flex-row items-center gap-4 px-4 transition-colors hover:bg-muted/50">
                  {commit.authorAvatarUrl ? (
                    <Image
                      src={commit.authorAvatarUrl}
                      alt={commit.authorLogin ?? "author"}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <GitCommitHorizontal className="size-6 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {commit.message.split("\n")[0]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {commit.authorLogin ?? commit.authorName ?? "unknown"} ·{" "}
                      {formatDate(commit.date)}
                    </p>
                  </div>
                  <code className="shrink-0 text-xs text-muted-foreground">
                    {commit.sha.slice(0, 7)}
                  </code>
                </Card>
              </Link>
            ))}
            {commits.error && (
              <p className="text-sm text-destructive">{commits.error}</p>
            )}
            <div ref={commits.sentinelRef} className="h-1" />
            {commits.loading && <ListSkeleton />}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ListSkeleton() {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading…
    </div>
  );
}
