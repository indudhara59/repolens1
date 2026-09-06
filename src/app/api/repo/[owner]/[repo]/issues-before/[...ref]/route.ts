import { NextRequest, NextResponse } from "next/server";
import { getCommitDetail, listIssuesBefore } from "@/lib/github";
import { errorResponse } from "@/lib/api-error";
import { IssueState } from "@/types/github";

const VALID_STATES: IssueState[] = ["open", "closed", "all"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; ref: string[] }> }
) {
  const { owner, repo, ref } = await params;
  const refString = ref.join("/");
  const { searchParams } = request.nextUrl;
  const stateParam = searchParams.get("state") ?? "all";
  const state = VALID_STATES.includes(stateParam as IssueState)
    ? (stateParam as IssueState)
    : "all";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const perPage = Number(searchParams.get("perPage") ?? "20") || 20;

  try {
    const commit = await getCommitDetail({ owner, repo }, refString);
    const before = commit.date ?? new Date().toISOString();
    const issues = await listIssuesBefore({ owner, repo }, before, { state, page, perPage });
    return NextResponse.json(issues);
  } catch (error) {
    return errorResponse(error);
  }
}
