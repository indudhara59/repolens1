import { NextRequest, NextResponse } from "next/server";
import { getCommitDetail } from "@/lib/github";
import { errorResponse } from "@/lib/api-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; sha: string }> }
) {
  const { owner, repo, sha } = await params;
  try {
    const commit = await getCommitDetail({ owner, repo }, sha);
    return NextResponse.json(commit);
  } catch (error) {
    return errorResponse(error);
  }
}
