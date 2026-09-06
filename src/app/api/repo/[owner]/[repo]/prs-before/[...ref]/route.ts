import { NextRequest, NextResponse } from "next/server";
import { getCommitDetail, listPullRequestsMergedBefore } from "@/lib/github";
import { errorResponse } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; ref: string[] }> }
) {
  const { owner, repo, ref } = await params;
  const refString = ref.join("/");
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const perPage = Number(searchParams.get("perPage") ?? "20") || 20;

  try {
    const commit = await getCommitDetail({ owner, repo }, refString);
    const before = commit.date ?? new Date().toISOString();
    const prs = await listPullRequestsMergedBefore({ owner, repo }, before, { page, perPage });
    return NextResponse.json(prs);
  } catch (error) {
    return errorResponse(error);
  }
}
