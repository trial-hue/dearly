'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export interface Problem {
  title: string;
  status: number;
  detail?: string;
}

export class ApiError extends Error {
  constructor(public readonly problem: Problem) {
    super(problem.detail ?? problem.title);
  }
}

/** JSON request helper: throws ApiError with the server's problem document on a non-2xx status. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    method: rest.method ?? (json !== undefined ? 'POST' : 'GET'),
    headers: {
      ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(rest.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    let problem: Problem = { title: res.statusText || 'Request failed', status: res.status };
    try {
      problem = { ...problem, ...(await res.json()) };
    } catch {
      // keep the default problem
    }
    throw new ApiError(problem);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Run an API call, refresh the server-rendered page afterwards, surface errors. */
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(
      name: string,
      fn: () => Promise<T>,
      opts: { refresh?: boolean } = {},
    ): Promise<T | null> => {
      setBusy(name);
      setError(null);
      try {
        const out = await fn();
        if (opts.refresh !== false) router.refresh();
        return out;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        return null;
      } finally {
        setBusy(null);
      }
    },
    [router],
  );

  return { run, busy, error, clearError: () => setError(null) };
}
