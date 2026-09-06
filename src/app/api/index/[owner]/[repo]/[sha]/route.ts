import { NextResponse } from "next/server";
import { advanceIndexingJob, getJobStatus } from "@/lib/indexing/job";
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ owner: string; repo: string; sha: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { owner, repo, sha } = await params;
  try {
    const status = await getJobStatus({ owner, repo }, sha);
    return NextResponse.json(status ?? { status: "pending", totalFiles: 0, doneFiles: 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check indexing status.";
    return NextResponse.json({ status: "error", totalFiles: 0, doneFiles: 0, error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { owner, repo, sha } = await params;

  const rate = await checkRateLimit("index", getClientIp(request));
  if (!rate.success) {
    return NextResponse.json(
      { status: "error", totalFiles: 0, doneFiles: 0, error: RATE_LIMIT_MESSAGE },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const status = await advanceIndexingJob({ owner, repo }, sha);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Indexing failed.";
    return NextResponse.json({ status: "error", totalFiles: 0, doneFiles: 0, error: message }, { status: 500 });
  }
}
