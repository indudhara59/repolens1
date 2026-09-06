import { NextResponse } from "next/server";
import { GitHubServiceError } from "@/types/github";

const STATUS_BY_KIND: Record<GitHubServiceError["kind"], number> = {
  not_found: 404,
  rate_limited: 429,
  forbidden: 403,
  invalid: 400,
  unknown: 502,
};

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof GitHubServiceError) {
    return NextResponse.json(
      { error: error.message, kind: error.kind },
      { status: STATUS_BY_KIND[error.kind] }
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: "Unexpected server error.", kind: "unknown" },
    { status: 500 }
  );
}
