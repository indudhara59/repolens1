import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, GitFork, CircleAlert, ExternalLink } from "lucide-react";
import { getRepoMeta } from "@/lib/github";
import { GitHubServiceError } from "@/types/github";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function RepoPage({ params }: PageProps) {
  const { owner, repo } = await params;

  try {
    const meta = await getRepoMeta({ owner, repo });

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
                {meta.stars.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <GitFork className="size-3.5" />
                {meta.forks.toLocaleString()}
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

            <p className="text-sm text-muted-foreground">
              Releases, commits, pull requests, and issue analysis for this
              repo are coming in the next stage.
            </p>
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
