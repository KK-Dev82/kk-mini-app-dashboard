// src/lib/todaysAttendanceService.ts
import { apiGet } from "./apiClient";

/** ---------- Enums (ตามที่คุณให้มา) ---------- */
export type CheckinType = "CHECK_IN" | "CHECK_OUT" | "LEAVE";
export type LocationType = "ONSITE" | "OFFSITE";
export type LeaveType = "SICK_LEAVE" | "PERSONAL_LEAVE" | "ANNUAL_LEAVE" | "NONE";

/** ---------- API Types ---------- */
export type DailyUser = {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
};

export type DailyCheckin = {
  id: string;
  type: CheckinType;
  location: LocationType;
  leaveType: LeaveType;
  latitude: string;
  longitude: string;
  distance: string;
  photo: string | null;
  reason: string | null;
  notes: string | null;
  isSystemGenerated: boolean;
  createdAt: string;

  userId: string;
  worksiteId: string | null;
  worksite: any | null; // ยังไม่ชัดเจน schema จริง
  user?: { id: string; name: string; email: string };
};

export type DailyAttendanceItem = {
  user: DailyUser;
  status: string; // เช่น NOT_CHECKED_IN / CHECKED_OUT / ...
  nextAction?: "CHECK_IN" | "CHECK_OUT";
  message?: string;

  latestCheckin?: DailyCheckin | null;
  todayCheckins: DailyCheckin[];
};

export async function fetchTodaysAttendance(): Promise<DailyAttendanceItem[]> {
  // ✅ endpoint นี้ no-auth → สั่ง proxy ไม่ต้องใส่ token
  return apiGet<DailyAttendanceItem[]>("/checkin/daily", { noAuth: true });
}
