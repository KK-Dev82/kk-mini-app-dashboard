"use client";

import { useCallback, useState } from "react";

export function useAsyncLoader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      const msg = e?.message ?? "Something went wrong";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run, setError };
}
