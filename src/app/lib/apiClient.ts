// src/lib/apiClient.ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const joinUrl = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+/, "")))
    .join("/");

// ✅ เพิ่ม: ดึง token จาก storage (ถ้าคุณมี login เก็บไว้)
function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") ?? ""; // <- เปลี่ยน key ให้ตรงของคุณ
}

type ApiOptions = {
  token?: string;
  noAuth?: boolean; // ✅ เพิ่มจริง
  headers?: Record<string, string>;
};

async function apiRequest<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  options?: ApiOptions
) {
  const url = joinUrl("/api/proxy", path);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options?.headers,
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";

  // ✅ แนบ Authorization เฉพาะเมื่อไม่ตั้ง noAuth
  if (!options?.noAuth) {
    const token = options?.token ?? getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
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
    throw new Error(`API ${method} ${url} failed (${res.status})\n${raw}`);
  }

  return contentType.includes("application/json")
    ? (JSON.parse(raw) as T)
    : (raw as T);
}

export const apiGet = <T>(path: string, options?: ApiOptions) =>
  apiRequest<T>(path, "GET", undefined, options);

export const apiPost = <T>(path: string, body: unknown, options?: ApiOptions) =>
  apiRequest<T>(path, "POST", body, options);

export const apiPut = <T>(path: string, body: unknown, options?: ApiOptions) =>
  apiRequest<T>(path, "PUT", body, options);

export const apiPatch = <T>(path: string, body: unknown, options?: ApiOptions) =>
  apiRequest<T>(path, "PATCH", body, options);

export const apiDelete = <T>(path: string, options?: ApiOptions) =>
  apiRequest<T>(path, "DELETE", undefined, options);
