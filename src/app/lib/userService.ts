// src/app/lib/userService.ts
import { apiGet, apiPost } from "./apiClient";

export type UserApi = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  trelloMemberId?: string | null;
  role?: string | null;
};

export async function fetchUsers(options?: { token?: string }): Promise<UserApi[]> {
  return apiGet<UserApi[]>("/users", options);
}

/** =========================
 *  Auth Whitelist (Admin list)
 *  ========================= */
export type WhitelistEntryApi = {
  id?: string;
  email: string;
  role: "USER" | "ADMIN" | string;
  createdAt?: string;
  updatedAt?: string;
};

// ✅ NEW: ดึง whitelist ทั้งหมด (Admin only)
export async function fetchAuthWhitelist(options?: { token?: string }): Promise<WhitelistEntryApi[]> {
  // ถ้า response เป็น array ก็ได้เลย
  // ถ้า backend ห่อมาเป็น {items: []} หรือ {data: []} ก็รองรับไว้
  const res = await apiGet<any>("/auth/whitelist", options);

  if (Array.isArray(res)) return res as WhitelistEntryApi[];
  if (Array.isArray(res?.items)) return res.items as WhitelistEntryApi[];
  if (Array.isArray(res?.data)) return res.data as WhitelistEntryApi[];

  return [];
}

/** =========================
 *  Auth Whitelist (public check)
 *  ========================= */
export type WhitelistCheckApi = {
  allowed: boolean;
  role?: string | null;
  message?: string;
};

export async function checkAuthWhitelist(email: string): Promise<WhitelistCheckApi> {
  const qs = new URLSearchParams({ email }).toString();
  return apiGet<WhitelistCheckApi>(`/auth/whitelist-check?${qs}`, { noAuth: true });
}

export type WhitelistRole = "USER" | "ADMIN";

export type WhitelistAddPayload = {
  email: string;
  role: WhitelistRole;
};

export async function addAuthWhitelist(payload: WhitelistAddPayload) {
  return apiPost(`/auth/whitelist/add`, payload);
}
