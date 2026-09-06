"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IndexJobStatus } from "@/types/indexing";

const POLL_DELAY_MS = 300;

interface UseIndexJobOptions {
  owner: string;
  repo: string;
  sha: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useIndexJob({ owner, repo, sha }: UseIndexJobOptions) {
  const [status, setStatus] = useState<IndexJobStatus>({
    status: "pending",
    totalFiles: 0,
    doneFiles: 0,
  });
  const [checking, setChecking] = useState(true);
  const runningRef = useRef(false);

  const url = `/api/index/${owner}/${repo}/${sha}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        const data = (await res.json()) as IndexJobStatus;
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus({ status: "error", totalFiles: 0, doneFiles: 0, error: "Failed to check status." });
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (true) {
        const res = await fetch(url, { method: "POST" });
        const data = (await res.json()) as IndexJobStatus;
        setStatus(data);
        if (data.status === "done" || data.status === "error") break;
        await sleep(POLL_DELAY_MS);
      }
    } finally {
      runningRef.current = false;
    }
  }, [url]);

  return { status, checking, start };
}
