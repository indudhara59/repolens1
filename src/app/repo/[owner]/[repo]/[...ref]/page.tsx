import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CircleAlert } from "lucide-react";
import { getCommitDetail, getRepoMeta } from "@/lib/github";
import { GitHubServiceError } from "@/types/github";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RepoHeader } from "@/components/repo-header";
import { OverviewSection } from "@/components/analysis/overview-section";
import { ContributorsSection } from "@/components/analysis/contributors-section";
import { LanguageSection } from "@/components/analysis/language-section";
import { CommitActivitySection } from "@/components/analysis/commit-activity-section";
import { PullRequestsSection } from "@/components/analysis/pull-requests-section";
import { IssuesSection } from "@/components/analysis/issues-section";
import { AskPanel } from "@/components/analysis/ask-panel";
import { ChangedFilesSection } from "@/components/analysis/changed-files-section";
import { ChatProvider } from "@/components/analysis/chat-provider";
import { ChatSheet } from "@/components/analysis/chat-sheet";

interface PageProps {
  params: Promise<{ owner: string; repo: string; ref: string[] }>;
}

function SectionSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repo, ref } = await params;
  const refString = ref.join("/");
  try {
    const commit = await getCommitDetail({ owner, repo }, refString);
    return {
      title: `${owner}/${repo} @ ${commit.sha.slice(0, 7)}`,
      description: commit.message.split("\n")[0],
    };
  } catch {
    return { title: `${owner}/${repo} @ ${refString}` };
  }
}

export default async function RefAnalysisPage({ params }: PageProps) {
  const { owner, repo, ref } = await params;
  const refString = ref.join("/");

  try {
    const [meta, commit] = await Promise.all([
      getRepoMeta({ owner, repo }),
      getCommitDetail({ owner, repo }, refString),
    ]);
    const before = commit.date ?? new Date().toISOString();

    return (
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
        <ChatProvider owner={owner} repo={repo} sha={commit.sha}>
          <RepoHeader meta={meta} refString={refString} />

          <OverviewSection commit={commit} />

          <ChangedFilesSection files={commit.files} />

          <AskPanel />

          <div className="grid gap-6 md:grid-cols-2">
            <Suspense fallback={<SectionSkeleton />}>
              <ContributorsSection owner={owner} repo={repo} />
            </Suspense>
            <Suspense fallback={<SectionSkeleton />}>
              <LanguageSection owner={owner} repo={repo} />
            </Suspense>
          </div>

          <Suspense fallback={<SectionSkeleton />}>
            <CommitActivitySection owner={owner} repo={repo} refString={refString} />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <PullRequestsSection owner={owner} repo={repo} refString={refString} before={before} />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <IssuesSection owner={owner} repo={repo} refString={refString} before={before} />
          </Suspense>

          <ChatSheet owner={owner} repo={repo} />
        </ChatProvider>
      </main>
    );
  } catch (error) {
    if (error instanceof GitHubServiceError) {
      if (error.kind === "not_found") notFound();

      return (
        <main className="mx-auto max-w-4xl px-6 py-12">
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>
              {error.kind === "rate_limited" ? "Rate limit reached" : "Couldn't load this page"}
            </AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </main>
      );
    }
    throw error;
  }
}
