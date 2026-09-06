import { RepoRef } from "@/types/github";

const OWNER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const REPO_RE = /^[a-zA-Z0-9._-]{1,100}$/;

/**
 * Accepts a full GitHub URL (with optional protocol, trailing path/query,
 * and ".git" suffix) or a bare "owner/repo" string. Safe to use in both
 * client and server code (no server-only dependencies).
 */
export function parseGitHubUrl(input: string): RepoRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let owner: string | undefined;
  let repo: string | undefined;

  const urlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/i
  );
  if (urlMatch) {
    [, owner, repo] = urlMatch;
  } else {
    const shorthandMatch = trimmed.match(/^([^/\s]+)\/([^/\s#?]+)\/?$/);
    if (shorthandMatch) [, owner, repo] = shorthandMatch;
  }

  if (!owner || !repo) return null;

  repo = repo.replace(/\.git$/i, "");

  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo)) return null;

  return { owner, repo };
}
