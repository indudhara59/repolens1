import "server-only";
import { Octokit } from "octokit";
import { cached, CACHE_TTL } from "@/lib/redis";
import {
  CommitDetail,
  CommitSummary,
  GitHubServiceError,
  IssueState,
  IssueSummary,
  Paginated,
  PullRequestState,
  PullRequestSummary,
  Release,
  RepoMeta,
  RepoRef,
} from "@/types/github";

export { parseGitHubUrl } from "@/lib/github-url";

let client: Octokit | null = null;

function getOctokit(): Octokit {
  if (!client) {
    client = new Octokit({ auth: process.env.GITHUB_TOKEN || undefined });
  }
  return client;
}

interface OctokitErrorLike {
  status?: number;
  message?: string;
  response?: { headers?: Record<string, string> };
}

function toServiceError(error: unknown): GitHubServiceError {
  const err = error as OctokitErrorLike;
  const status = err?.status;
  const message = err?.message ?? "GitHub request failed";
  const remaining = err?.response?.headers?.["x-ratelimit-remaining"];

  if (status === 404) {
    return new GitHubServiceError(
      "Repository not found. It may not exist, or it may be private.",
      "not_found",
      status
    );
  }
  if (status === 403 && (remaining === "0" || /rate limit/i.test(message))) {
    return new GitHubServiceError(
      "GitHub API rate limit exceeded. Please try again in a few minutes.",
      "rate_limited",
      status
    );
  }
  if (status === 429) {
    return new GitHubServiceError(
      "GitHub is rate-limiting requests right now. Please try again shortly.",
      "rate_limited",
      status
    );
  }
  if (status === 403) {
    return new GitHubServiceError(
      "Access to this repository is forbidden. It may be private.",
      "forbidden",
      status
    );
  }
  return new GitHubServiceError(message, "unknown", status);
}

export async function getRepoMeta(ref: RepoRef): Promise<RepoMeta> {
  return cached(`gh:meta:${ref.owner}/${ref.repo}`, CACHE_TTL.META, async () => {
    try {
      const { data } = await getOctokit().rest.repos.get({
        owner: ref.owner,
        repo: ref.repo,
      });
      return {
        owner: data.owner.login,
        repo: data.name,
        fullName: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        language: data.language,
        defaultBranch: data.default_branch,
        htmlUrl: data.html_url,
        ownerAvatarUrl: data.owner.avatar_url,
        topics: data.topics ?? [],
        license: data.license?.spdx_id ?? null,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      throw toServiceError(error);
    }
  });
}

export async function listReleases(
  ref: RepoRef,
  page = 1,
  perPage = 20
): Promise<Paginated<Release>> {
  return cached(
    `gh:releases:${ref.owner}/${ref.repo}:${page}:${perPage}`,
    CACHE_TTL.RELEASES,
    async () => {
      try {
        const { data } = await getOctokit().rest.repos.listReleases({
          owner: ref.owner,
          repo: ref.repo,
          page,
          per_page: perPage,
        });
        return {
          items: data.map((r) => ({
            id: r.id,
            tagName: r.tag_name,
            name: r.name,
            body: r.body ?? null,
            draft: r.draft,
            prerelease: r.prerelease,
            publishedAt: r.published_at,
            htmlUrl: r.html_url,
            targetCommitish: r.target_commitish,
          })),
          page,
          perPage,
          hasNextPage: data.length === perPage,
        };
      } catch (error) {
        throw toServiceError(error);
      }
    }
  );
}

export async function listCommits(
  ref: RepoRef,
  options: { branch?: string; page?: number; perPage?: number } = {}
): Promise<Paginated<CommitSummary>> {
  const { branch, page = 1, perPage = 20 } = options;
  return cached(
    `gh:commits:${ref.owner}/${ref.repo}:${branch ?? "default"}:${page}:${perPage}`,
    CACHE_TTL.COMMITS,
    async () => {
      try {
        const { data } = await getOctokit().rest.repos.listCommits({
          owner: ref.owner,
          repo: ref.repo,
          sha: branch,
          page,
          per_page: perPage,
        });
        return {
          items: data.map((c) => ({
            sha: c.sha,
            message: c.commit.message,
            authorName: c.commit.author?.name ?? null,
            authorLogin: c.author?.login ?? null,
            authorAvatarUrl: c.author?.avatar_url ?? null,
            date: c.commit.author?.date ?? null,
            htmlUrl: c.html_url,
          })),
          page,
          perPage,
          hasNextPage: data.length === perPage,
        };
      } catch (error) {
        throw toServiceError(error);
      }
    }
  );
}

export async function getCommitDetail(ref: RepoRef, sha: string): Promise<CommitDetail> {
  return cached(`gh:commit:${ref.owner}/${ref.repo}:${sha}`, CACHE_TTL.COMMITS, async () => {
    try {
      const { data } = await getOctokit().rest.repos.getCommit({
        owner: ref.owner,
        repo: ref.repo,
        ref: sha,
      });
      return {
        sha: data.sha,
        message: data.commit.message,
        authorName: data.commit.author?.name ?? null,
        authorLogin: data.author?.login ?? null,
        authorAvatarUrl: data.author?.avatar_url ?? null,
        date: data.commit.author?.date ?? null,
        htmlUrl: data.html_url,
        stats: data.stats
          ? {
              additions: data.stats.additions ?? 0,
              deletions: data.stats.deletions ?? 0,
              total: data.stats.total ?? 0,
            }
          : null,
        files: (data.files ?? []).map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
          patch: f.patch,
        })),
      };
    } catch (error) {
      throw toServiceError(error);
    }
  });
}

export async function listPullRequests(
  ref: RepoRef,
  options: { state?: PullRequestState; page?: number; perPage?: number } = {}
): Promise<Paginated<PullRequestSummary>> {
  const { state = "all", page = 1, perPage = 20 } = options;
  return cached(
    `gh:prs:${ref.owner}/${ref.repo}:${state}:${page}:${perPage}`,
    CACHE_TTL.PRS,
    async () => {
      try {
        const { data } = await getOctokit().rest.pulls.list({
          owner: ref.owner,
          repo: ref.repo,
          state,
          page,
          per_page: perPage,
          sort: "created",
          direction: "desc",
        });
        return {
          items: data.map((pr) => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            merged: pr.merged_at !== null,
            authorLogin: pr.user?.login ?? null,
            createdAt: pr.created_at,
            mergedAt: pr.merged_at,
            closedAt: pr.closed_at,
            htmlUrl: pr.html_url,
            nearestCommitSha: pr.merge_commit_sha ?? pr.head.sha ?? null,
          })),
          page,
          perPage,
          hasNextPage: data.length === perPage,
        };
      } catch (error) {
        throw toServiceError(error);
      }
    }
  );
}

export async function listIssues(
  ref: RepoRef,
  options: { state?: IssueState; page?: number; perPage?: number } = {}
): Promise<Paginated<IssueSummary>> {
  const { state = "all", page = 1, perPage = 20 } = options;
  return cached(
    `gh:issues:${ref.owner}/${ref.repo}:${state}:${page}:${perPage}`,
    CACHE_TTL.ISSUES,
    async () => {
      try {
        const { data } = await getOctokit().rest.issues.listForRepo({
          owner: ref.owner,
          repo: ref.repo,
          state,
          page,
          per_page: perPage,
          sort: "created",
          direction: "desc",
        });
        // The issues endpoint also returns pull requests; exclude them.
        const issuesOnly = data.filter((issue) => !issue.pull_request);
        return {
          items: issuesOnly.map((issue) => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            authorLogin: issue.user?.login ?? null,
            createdAt: issue.created_at,
            closedAt: issue.closed_at,
            htmlUrl: issue.html_url,
            commentsCount: issue.comments,
          })),
          page,
          perPage,
          hasNextPage: data.length === perPage,
        };
      } catch (error) {
        throw toServiceError(error);
      }
    }
  );
}
