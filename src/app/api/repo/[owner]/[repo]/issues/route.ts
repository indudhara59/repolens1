import { NextRequest, NextResponse } from "next/server";
import { listIssues } from "@/lib/github";
import { errorResponse } from "@/lib/api-error";
import { IssueState } from "@/types/github";

const VALID_STATES: IssueState[] = ["open", "closed", "all"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const { searchParams } = request.nextUrl;
  const stateParam = searchParams.get("state") ?? "all";
  const state = VALID_STATES.includes(stateParam as IssueState)
    ? (stateParam as IssueState)
    : "all";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const perPage = Number(searchParams.get("perPage") ?? "20") || 20;

  try {
    const issues = await listIssues({ owner, repo }, { state, page, perPage });
    return NextResponse.json(issues);
  } catch (error) {
    return errorResponse(error);
  }
}
