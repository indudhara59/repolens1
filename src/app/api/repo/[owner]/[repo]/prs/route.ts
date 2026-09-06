import { NextRequest, NextResponse } from "next/server";
import { listPullRequests } from "@/lib/github";
import { errorResponse } from "@/lib/api-error";
import { PullRequestState } from "@/types/github";

const VALID_STATES: PullRequestState[] = ["open", "closed", "all"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const { searchParams } = request.nextUrl;
  const stateParam = searchParams.get("state") ?? "all";
  const state = VALID_STATES.includes(stateParam as PullRequestState)
    ? (stateParam as PullRequestState)
    : "all";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const perPage = Number(searchParams.get("perPage") ?? "20") || 20;

  try {
    const prs = await listPullRequests({ owner, repo }, { state, page, perPage });
    return NextResponse.json(prs);
  } catch (error) {
    return errorResponse(error);
  }
}
