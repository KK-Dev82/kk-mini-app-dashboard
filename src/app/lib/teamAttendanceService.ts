// src/lib/teamAttendanceService.ts
import { apiGet } from "./apiClient";

export type AttendanceStatus = "ON_TIME" | "LATE" | "ABSENT" | "LEAVE";

export type TeamAttendanceMember = {
  id: number;
  name: string;
  initials: string;
  note?: string; // เช่น "Not checked in"
  status: AttendanceStatus;
};

export type TeamAttendanceStats = {
  onTime: number;
  late: number;
  absent: number;
  leave: number;
};

export type TeamAttendanceResponse = {
  dateLabel: string;     // "Today"
  totalMembers: number;  // 9
  stats: TeamAttendanceStats;
  members: TeamAttendanceMember[];
};

/** ใช้ดึงข้อมูล Team Attendance (mock api ตอนนี้) */
export async function fetchTeamAttendance(params?: {
  date?: string;   // e.g. "today" หรือ "2025-12-13"
  memberId?: number;
}): Promise<TeamAttendanceResponse> {
  const qs = new URLSearchParams();
  if (params?.date) qs.set("date", params.date);
  if (params?.memberId) qs.set("memberId", String(params.memberId));

  const path =
    qs.toString().length > 0
      ? `/api/team-attendance?${qs.toString()}`
      : `/api/team-attendance`;

  return apiGet<TeamAttendanceResponse>(path);
}
