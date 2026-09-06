import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { getJobStatus } from "@/lib/indexing/job";
import { embedQuery } from "@/lib/indexing/embed";
import { getVectorNamespaceClient } from "@/lib/indexing/vector";
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import type { ChatSource, IndexedChunk } from "@/types/indexing";

export const maxDuration = 60;

const CHAT_MODEL = "gemini-2.0-flash";
const TOP_K = 8;
const MAX_HISTORY = 6;
const SOURCES_HEADER = "x-repolens-sources";

interface RouteParams {
  params: Promise<{ owner: string; repo: string; sha: string }>;
}

interface ChatRequestBody {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

function getGoogleProvider() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { owner, repo, sha } = await params;

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Question cannot be empty." }, { status: 400 });
  }

  const rate = await checkRateLimit("chat", getClientIp(request));
  if (!rate.success) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const job = await getJobStatus({ owner, repo }, sha);
    if (job?.status !== "done") {
      return NextResponse.json(
        { error: "This repo hasn't finished indexing yet." },
        { status: 400 }
      );
    }

    const vector = await embedQuery(message);
    const namespace = `${owner}/${repo}@${sha}`;
    const matches = await getVectorNamespaceClient(namespace).query({
      vector,
      topK: TOP_K,
      includeMetadata: true,
    });

    const chunks = matches
      .map((m) => m.metadata as IndexedChunk | undefined)
      .filter((m): m is IndexedChunk => Boolean(m));

    const sources: ChatSource[] = chunks.map((c) => ({
      filePath: c.filePath,
      startLine: c.startLine,
      endLine: c.endLine,
      url: `https://github.com/${owner}/${repo}/blob/${sha}/${c.filePath}#L${c.startLine}-L${c.endLine}`,
    }));

    const contextBlock =
      chunks.length > 0
        ? chunks
            .map(
              (c) =>
                `### ${c.filePath} (lines ${c.startLine}-${c.endLine})\n\`\`\`\n${c.content}\n\`\`\``
            )
            .join("\n\n")
        : "No relevant code context was found for this question.";

    const system = [
      `You are answering questions about the GitHub repository ${owner}/${repo} at commit ${sha}.`,
      "Answer only using the code context provided below. If the context doesn't contain enough information to answer, say so honestly instead of guessing or inventing details.",
      "Reference file paths when you point to specific code.",
      "",
      "Code context:",
      contextBlock,
    ].join("\n");

    const history = (body.history ?? []).slice(-MAX_HISTORY);

    const result = streamText({
      model: getGoogleProvider()(CHAT_MODEL),
      system,
      messages: [...history, { role: "user" as const, content: message }],
    });

    return result.toTextStreamResponse({
      headers: { [SOURCES_HEADER]: encodeURIComponent(JSON.stringify(sources)) },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to answer question.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
