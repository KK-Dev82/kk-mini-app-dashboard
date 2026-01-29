// src/lib/checkinHistoryService.ts
import { apiGet } from "./apiClient";

export enum CheckinType {
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
  LEAVE = "LEAVE",
}

export enum LocationType {
  ONSITE = "ONSITE",
  OFFSITE = "OFFSITE",
}

export enum LeaveType {
  SICK_LEAVE = "SICK_LEAVE",
  PERSONAL_LEAVE = "PERSONAL_LEAVE",
  ANNUAL_LEAVE = "ANNUAL_LEAVE",
  NONE = "NONE",
}

export type WorksiteApi = {
  id: string;
  name: string;
  description?: string | null;
  latitude: string | number;
  longitude: string | number;
  radius: number;

  checkinStartTime?: string | null;
  checkinEndTime?: string | null;
  checkoutStartTime?: string | null;
  checkoutEndTime?: string | null;

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CheckinHistoryItem = {
  id: string;

  type: CheckinType;
  location: LocationType;
  leaveType: LeaveType;

  latitude: string | number;
  longitude: string | number;
  distance: string | number;

  photo: string | null;
  reason: string | null;
  notes: string | null;
  isSystemGenerated: boolean;

  createdAt: string;

  userId: string;
  worksiteId: string | null;
  worksite: WorksiteApi | null;
};

export type PaginationMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type CheckinHistoryParams = {
  page?: number | string;
  limit?: number | string;
};

export type CheckinHistoryPage = {
  items: CheckinHistoryItem[];
  meta: PaginationMeta | null;
};

type HistoryWrapped = {
  data?: CheckinHistoryItem[];
  items?: CheckinHistoryItem[];
  meta?: PaginationMeta;

  // เผื่อ backend วางไว้ที่ root
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type HistoryRaw = CheckinHistoryItem[] | HistoryWrapped;

function withQuery(path: string, params?: CheckinHistoryParams) {
  if (!params) return path;

  const sp = new URLSearchParams();
  if (params.page !== undefined && params.page !== null && params.page !== "")
    sp.set("page", String(params.page));
  if (params.limit !== undefined && params.limit !== null && params.limit !== "")
    sp.set("limit", String(params.limit));

  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

function normalize(raw: HistoryRaw): CheckinHistoryPage {
  if (Array.isArray(raw)) {
    return { items: raw, meta: null };
  }

  const items =
    (Array.isArray(raw.data) && raw.data) ||
    (Array.isArray(raw.items) && raw.items) ||
    [];

  const metaFromRoot: PaginationMeta | null =
    raw.page !== undefined ||
    raw.limit !== undefined ||
    raw.total !== undefined ||
    raw.totalPages !== undefined
      ? {
          page: raw.page,
          limit: raw.limit,
          total: raw.total,
          totalPages: raw.totalPages,
        }
      : null;

  return {
    items,
    meta: raw.meta ?? metaFromRoot,
  };
}

/**
 * ✅ Paged (แนะนำใช้กับหน้า Attendance)
 */
export async function fetchMyCheckinHistoryPage(
  params?: CheckinHistoryParams
): Promise<CheckinHistoryPage> {
  const path = withQuery("/checkin/history", params);
  const raw = await apiGet<HistoryRaw>(path, { noAuth: true });
  return normalize(raw);
}

export async function fetchCheckinHistoryByUserIdPage(
  userId: string,
  params?: CheckinHistoryParams
): Promise<CheckinHistoryPage> {
  const safe = encodeURIComponent(userId);
  const path = withQuery(`/checkin/user/${safe}/history`, params);
  const raw = await apiGet<HistoryRaw>(path, { noAuth: true });
  return normalize(raw);
}

/**
 * ✅ ของเดิม (ยังคงไว้ เผื่อที่อื่นเรียก)
 */
export async function fetchMyCheckinHistory(
  params?: CheckinHistoryParams
): Promise<CheckinHistoryItem[]> {
  const { items } = await fetchMyCheckinHistoryPage(params);
  return items;
}

export async function fetchCheckinHistoryByUserId(
  userId: string,
  params?: CheckinHistoryParams
): Promise<CheckinHistoryItem[]> {
  const { items } = await fetchCheckinHistoryByUserIdPage(userId, params);
  return items;
}