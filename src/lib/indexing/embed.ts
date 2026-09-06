import "server-only";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const EMBEDDING_MODEL = "text-embedding-004";
const BATCH_SIZE = 100;

let client: GoogleGenerativeAI | null = null;

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client.getGenerativeModel({ model: EMBEDDING_MODEL });
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export async function embedChunks(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const model = getModel();
  const vectors: number[][] = [];

  for (const batch of chunkArray(texts, BATCH_SIZE)) {
    const { embeddings } = await model.batchEmbedContents({
      requests: batch.map((text) => ({
        content: { role: "user", parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
      })),
    });
    vectors.push(...embeddings.map((e) => e.values));
  }

  return vectors;
}
