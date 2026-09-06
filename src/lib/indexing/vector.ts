import "server-only";
import { Index } from "@upstash/vector";
import type { IndexedChunk } from "@/types/indexing";

const UPSERT_BATCH_SIZE = 100;

let client: Index | null = null;

function getVectorIndex(): Index {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash Vector is not configured (UPSTASH_VECTOR_REST_URL/TOKEN).");
  }
  if (!client) client = new Index({ url, token });
  return client;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export function chunkVectorId(chunk: Pick<IndexedChunk, "filePath" | "startLine" | "endLine">): string {
  return `${chunk.filePath}#L${chunk.startLine}-${chunk.endLine}`;
}

export async function upsertChunks(
  namespace: string,
  chunks: IndexedChunk[],
  vectors: number[][]
): Promise<void> {
  if (chunks.length !== vectors.length) {
    throw new Error("Chunk/vector count mismatch.");
  }
  if (chunks.length === 0) return;

  const index = getVectorIndex().namespace(namespace);
  const records = chunks.map((chunk, i) => ({
    id: chunkVectorId(chunk),
    vector: vectors[i],
    metadata: chunk as unknown as Record<string, unknown>,
  }));

  for (const batch of chunkArray(records, UPSERT_BATCH_SIZE)) {
    await index.upsert(batch);
  }
}

export function getVectorNamespaceClient(namespace: string) {
  return getVectorIndex().namespace(namespace);
}
