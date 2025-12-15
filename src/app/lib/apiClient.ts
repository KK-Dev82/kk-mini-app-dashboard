// src/lib/apiClient.ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * joinUrl("/api/proxy", "projects")
 * => /api/proxy/projects
 */
const joinUrl = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .map((p, i) =>
      i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+/, "")
    )
    .join("/");

/**
 * ยิง API ผ่าน Next.js proxy เท่านั้น
 * ❌ ห้ามยิง ngrok ตรง ๆ
 */
async function apiRequest<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  options?: {
    token?: string;
    headers?: Record<string, string>;
  }
) {
  // ✅ same-origin เสมอ
  const url = joinUrl("/api/proxy", path);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options?.headers,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // รองรับ endpoint 🔒
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const raw = await res.text();

  if (!res.ok) {
    throw new Error(
      `API ${method} ${url} failed (${res.status})\n${raw}`
    );
  }

  // กันกรณี backend ส่ง text/plain
  return contentType.includes("application/json")
    ? (JSON.parse(raw) as T)
    : (raw as T);
}

/* ---------- Helper Methods ---------- */

export const apiGet = <T>(
  path: string,
  options?: { token?: string }
) => apiRequest<T>(path, "GET", undefined, options);

export const apiPost = <T>(
  path: string,
  body: unknown,
  options?: { token?: string }
) => apiRequest<T>(path, "POST", body, options);

export const apiPut = <T>(
  path: string,
  body: unknown,
  options?: { token?: string }
) => apiRequest<T>(path, "PUT", body, options);

export const apiPatch = <T>(
  path: string,
  body: unknown,
  options?: { token?: string }
) => apiRequest<T>(path, "PATCH", body, options);

export const apiDelete = <T>(
  path: string,
  options?: { token?: string }
) => apiRequest<T>(path, "DELETE", undefined, options);
