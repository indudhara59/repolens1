import "server-only";
import { getOctokit } from "@/lib/github";
import { getRedis } from "@/lib/redis";
import { shouldIndexFile } from "@/lib/indexing/filter";
import { chunkFile } from "@/lib/indexing/chunk";
import { embedChunks } from "@/lib/indexing/embed";
import { upsertChunks } from "@/lib/indexing/vector";
import type { IndexableFile, IndexedChunk, IndexJobDoc, IndexJobStatus } from "@/types/indexing";
import type { RepoRef } from "@/types/github";

const BATCH_SIZE = 15;
const LOCK_TTL_SECONDS = 25;
const DONE_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
const RUNNING_TTL_SECONDS = 60 * 60 * 24; // 1 day, self-cleans abandoned jobs

function jobKey(ref: RepoRef, sha: string): string {
  return `index:job:${ref.owner}/${ref.repo}:${sha}`;
}

function lockKey(ref: RepoRef, sha: string): string {
  return `index:lock:${ref.owner}/${ref.repo}:${sha}`;
}

function toStatus(doc: IndexJobDoc): IndexJobStatus {
  return {
    status: doc.status,
    totalFiles: doc.totalFiles,
    doneFiles: doc.doneFiles,
    error: doc.error,
  };
}

export async function getJobStatus(ref: RepoRef, sha: string): Promise<IndexJobStatus | null> {
  const redis = getRedis();
  if (!redis) throw new Error("Indexing requires Upstash Redis to be configured.");

  const doc = await redis.get<IndexJobDoc>(jobKey(ref, sha));
  return doc ? toStatus(doc) : null;
}

async function fetchAndFilterTree(ref: RepoRef, sha: string): Promise<IndexableFile[]> {
  const { data } = await getOctokit().rest.git.getTree({
    owner: ref.owner,
    repo: ref.repo,
    tree_sha: sha,
    recursive: "true",
  });

  return data.tree
    .filter(
      (entry): entry is typeof entry & { path: string; sha: string; size: number } =>
        entry.type === "blob" &&
        typeof entry.path === "string" &&
        typeof entry.sha === "string" &&
        typeof entry.size === "number"
    )
    .filter((entry) => shouldIndexFile(entry.path, entry.size))
    .map((entry) => ({ path: entry.path, sha: entry.sha, size: entry.size }));
}

async function fetchFileContent(ref: RepoRef, blobSha: string): Promise<string | null> {
  try {
    const { data } = await getOctokit().rest.git.getBlob({
      owner: ref.owner,
      repo: ref.repo,
      file_sha: blobSha,
    });
    const buffer = Buffer.from(data.content, "base64");
    // Null bytes are a reliable signal of binary content that slipped
    // past the extension allowlist; skip rather than embed garbage.
    if (buffer.includes(0)) return null;
    return buffer.toString("utf-8");
  } catch {
    return null;
  }
}

export async function advanceIndexingJob(ref: RepoRef, sha: string): Promise<IndexJobStatus> {
  const redis = getRedis();
  if (!redis) throw new Error("Indexing requires Upstash Redis to be configured.");

  const key = jobKey(ref, sha);
  const lock = lockKey(ref, sha);

  const existing = await redis.get<IndexJobDoc>(key);
  if (existing?.status === "done") return toStatus(existing);

  const acquired = await redis.set(lock, "1", { nx: true, ex: LOCK_TTL_SECONDS });
  if (!acquired) {
    // Someone else is already processing this repo+sha; report current
    // progress without doing duplicate work.
    const current = await redis.get<IndexJobDoc>(key);
    return current ? toStatus(current) : { status: "pending", totalFiles: 0, doneFiles: 0 };
  }

  try {
    let doc = existing;
    if (!doc) {
      const files = await fetchAndFilterTree(ref, sha);
      doc = {
        status: "running",
        files,
        nextIndex: 0,
        totalFiles: files.length,
        doneFiles: 0,
      };
      await redis.set(key, doc, { ex: RUNNING_TTL_SECONDS });
    }

    if (doc.nextIndex >= doc.files.length) {
      const done: IndexJobDoc = { ...doc, status: "done" };
      await redis.set(key, done, { ex: DONE_TTL_SECONDS });
      return toStatus(done);
    }

    const batch = doc.files.slice(doc.nextIndex, doc.nextIndex + BATCH_SIZE);
    const chunks: IndexedChunk[] = [];

    for (const file of batch) {
      const content = await fetchFileContent(ref, file.sha);
      if (!content) continue;
      for (const c of chunkFile(content)) {
        chunks.push({
          filePath: file.path,
          startLine: c.startLine,
          endLine: c.endLine,
          repo: `${ref.owner}/${ref.repo}`,
          sha,
          content: c.text,
        });
      }
    }

    if (chunks.length > 0) {
      const vectors = await embedChunks(chunks.map((c) => c.content));
      await upsertChunks(`${ref.owner}/${ref.repo}@${sha}`, chunks, vectors);
    }

    const nextIndex = doc.nextIndex + batch.length;
    const isDone = nextIndex >= doc.files.length;
    const updated: IndexJobDoc = {
      ...doc,
      status: isDone ? "done" : "running",
      nextIndex,
      doneFiles: nextIndex,
    };
    await redis.set(key, updated, { ex: isDone ? DONE_TTL_SECONDS : RUNNING_TTL_SECONDS });
    return toStatus(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Indexing failed.";
    const base = existing ?? { totalFiles: 0, doneFiles: 0 };
    return { status: "error", totalFiles: base.totalFiles, doneFiles: base.doneFiles, error: message };
  } finally {
    await redis.del(lock);
  }
}
