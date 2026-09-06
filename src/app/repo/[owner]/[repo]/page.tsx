import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Star, GitFork, CircleAlert, ExternalLink } from "lucide-react";
import { getRepoMeta, listBranches, listCommits, listReleases } from "@/lib/github";
import { GitHubServiceError } from "@/types/github";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RepoBrowseTabs } from "@/components/repo-browse-tabs";
import { formatNumber } from "@/lib/format";

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  try {
    const meta = await getRepoMeta({ owner, repo });
    return {
      title: meta.fullName,
      description: meta.description ?? `Browse releases, commits, and analysis for ${meta.fullName}.`,
    };
  } catch {
    return { title: `${owner}/${repo}` };
  }
}

export default async function RepoPage({ params }: PageProps) {
  const { owner, repo } = await params;

  try {
    const meta = await getRepoMeta({ owner, repo });
    const [branches, releases, commits] = await Promise.all([
      listBranches({ owner, repo }),
      listReleases({ owner, repo }),
      listCommits({ owner, repo }, { branch: meta.defaultBranch }),
    ]);

    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Card>
          <CardHeader className="flex flex-row items-start gap-4">
            <Image
              src={meta.ownerAvatarUrl}
              alt={meta.owner}
              width={56}
              height={56}
              className="rounded-full"
            />
            <div className="flex-1 space-y-1">
              <a
                href={meta.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xl font-semibold hover:underline"
              >
                {meta.fullName}
                <ExternalLink className="size-4 text-muted-foreground" />
              </a>
              {meta.description && (
                <p className="text-muted-foreground">{meta.description}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {meta.language && <Badge variant="secondary">{meta.language}</Badge>}
              <Badge variant="outline" className="gap-1">
                <Star className="size-3.5" />
                {formatNumber(meta.stars)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <GitFork className="size-3.5" />
                {formatNumber(meta.forks)}
              </Badge>
              {meta.license && <Badge variant="outline">{meta.license}</Badge>}
              <Badge variant="outline">default branch: {meta.defaultBranch}</Badge>
            </div>

            {meta.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {meta.topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="font-normal">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            <RepoBrowseTabs
              owner={owner}
              repo={repo}
              defaultBranch={meta.defaultBranch}
              branches={branches}
              initialReleases={releases}
              initialCommits={commits}
            />
          </CardContent>
        </Card>
      </main>
    );
  } catch (error) {
    if (error instanceof GitHubServiceError) {
      if (error.kind === "not_found") notFound();

      return (
        <main className="mx-auto max-w-3xl px-6 py-12">
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>
              {error.kind === "rate_limited"
                ? "Rate limit reached"
                : "Couldn't load this repository"}
            </AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </main>
      );
    }
    throw error;
  }
}
