import { NextRequest, NextResponse } from "next/server";
import { getRepoMeta } from "@/lib/github";
import { errorResponse } from "@/lib/api-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  try {
    const meta = await getRepoMeta({ owner, repo });
    return NextResponse.json(meta);
  } catch (error) {
    return errorResponse(error);
  }
}
