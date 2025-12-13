// src/lib/apiClient.ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const isServer = typeof window === "undefined";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (isServer ? "http://localhost:3000" : "");

const PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "";

const joinUrl = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+/, "")))
    .join("/");

async function apiRequest<T>(
  path: string,
  method: HttpMethod,
  body?: unknown
) {
  const url = joinUrl(BASE, PREFIX, path);

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API ${method} ${url} failed (${res.status})`);
  }

  return (await res.json()) as T;
}

export const apiGet = <T>(path: string) =>
  apiRequest<T>(path, "GET");

export const apiPost = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, "POST", body);

export const apiPut = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, "PUT", body);
