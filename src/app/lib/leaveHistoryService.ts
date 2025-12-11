// ถ้า apiClient ของคุณชื่อฟังก์ชันไม่ตรง แก้ import ตรงนี้ตัวเดียวพอ
import { apiGet } from "./apiClient";

/** shape ข้อมูลประวัติการลา 1 รายการ */
export type LeaveHistoryRecord = {
  id: number;
  employee: {
    id: number;
    name: string;
    initials: string;
  };
  leaveType: string;   // Vacation / Sick Leave / Personal
  dayType: string;     // Full Day / Half Day (AM/PM)
  startDate: string;   // แสดงในรูปแบบที่ format แล้ว เช่น "Dec 12, 2025"
  endDate?: string | null;
  reason: string;
  submittedAt: string; // "Dec 11, 1:34 PM"
};

export type LeaveHistoryResponse = {
  total: number;
  items: LeaveHistoryRecord[];
};

/** ดึงประวัติการลาทั้งหมด (mock API) */
export async function fetchLeaveHistory(): Promise<LeaveHistoryResponse> {
  // ถ้าไม่มี apiGet ให้ใช้ fetch("/api/leave-history") แทนได้
  return apiGet<LeaveHistoryResponse>("/api/leave-history");
}
