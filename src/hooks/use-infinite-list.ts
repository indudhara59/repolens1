"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PageResult<T> {
  items: T[];
  hasNextPage: boolean;
}

interface UseInfiniteListOptions<T> {
  initialItems: T[];
  initialHasNextPage: boolean;
  fetchPage: (page: number) => Promise<PageResult<T>>;
}

export function useInfiniteList<T>({
  initialItems,
  initialHasNextPage,
  fetchPage,
}: UseInfiniteListOptions<T>) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasNextPage) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const result = await fetchPage(nextPage);
      setItems((prev) => [...prev, ...result.items]);
      setHasNextPage(result.hasNextPage);
      setPage(nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, hasNextPage, fetchPage]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const reset = useCallback((nextItems: T[], nextHasNextPage: boolean) => {
    setItems(nextItems);
    setHasNextPage(nextHasNextPage);
    setPage(1);
    setError(null);
  }, []);

  return { items, loading, error, hasNextPage, sentinelRef, loadMore, reset };
}
