import { NextRequest, NextResponse } from "next/server";
import { listReleases } from "@/lib/github";
import { errorResponse } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const perPage = Number(searchParams.get("perPage") ?? "20") || 20;

  try {
    const releases = await listReleases({ owner, repo }, page, perPage);
    return NextResponse.json(releases);
  } catch (error) {
    return errorResponse(error);
  }
}
