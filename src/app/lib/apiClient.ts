// src/lib/apiClient.ts
const getBaseUrl = () => {
  // ถ้าตั้งค่า endpoint backend จริงไว้ ก็ใช้ค่านี้
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // ถ้าไม่มี และตอนนี้รันบน server → ต้องใช้ absolute URL
  if (typeof window === "undefined") {
    // dev: ใช้ localhost ไปก่อน
    return "http://localhost:3000";
  }

  // ถ้าอยู่บน browser ใช้ relative path ได้
  return "";
};

const API_BASE_URL = getBaseUrl();

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    ...init,
  });

  if (!res.ok) {
    throw new Error(`API GET ${path} failed with status ${res.status}`);
  }

  return (await res.json()) as T;
}
