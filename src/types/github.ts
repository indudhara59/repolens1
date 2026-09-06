export interface RepoRef {
  owner: string;
  repo: string;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  defaultBranch: string;
  htmlUrl: string;
  ownerAvatarUrl: string;
  topics: string[];
  license: string | null;
  updatedAt: string;
}

export interface Release {
  id: number;
  tagName: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  publishedAt: string | null;
  htmlUrl: string;
  targetCommitish: string;
}

export interface CommitSummary {
  sha: string;
  message: string;
  authorName: string | null;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  date: string | null;
  htmlUrl: string;
}

export interface CommitDetail extends CommitSummary {
  stats: { additions: number; deletions: number; total: number } | null;
  files: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }[];
}

export type PullRequestState = "open" | "closed" | "all";
export type IssueState = "open" | "closed" | "all";

export interface PullRequestSummary {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  authorLogin: string | null;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  htmlUrl: string;
  /** SHA of the merge commit, or the head commit if not yet merged. */
  nearestCommitSha: string | null;
}

export interface IssueSummary {
  number: number;
  title: string;
  state: string;
  authorLogin: string | null;
  createdAt: string;
  closedAt: string | null;
  htmlUrl: string;
  commentsCount: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  hasNextPage: boolean;
}

export interface Branch {
  name: string;
  commitSha: string;
}

export interface ContributorStat {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  contributions: number;
}

export interface LanguageStat {
  language: string;
  bytes: number;
  percentage: number;
}

export interface CommitActivityPoint {
  weekStart: string;
  count: number;
}

export class GitHubServiceError extends Error {
  constructor(
    message: string,
    public readonly kind: "not_found" | "rate_limited" | "forbidden" | "invalid" | "unknown",
    public readonly status?: number
  ) {
    super(message);
    this.name = "GitHubServiceError";
  }
}
