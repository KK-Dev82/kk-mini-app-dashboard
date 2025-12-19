// ปรับ import ให้ตรงกับไฟล์ apiClient.ts ของโปรเจกต์คุณ
// ถ้าใช้ชื่อ apiClient แทน apiGet ก็เปลี่ยนตรงนี้ตัวเดียว
import { apiGet } from "./apiClient";

export type TeamMember = {
  id: number;
  name: string;
  initials: string;
};

export type UserProfile = {
  id: number;
  name: string;
  initials: string;
  title: string;       // แถบสีฟ้าใต้ชื่อ (เช่น Project Manager)
  email: string;
  department: string;
  role: string;
  teamName: string;
  teamMembers: TeamMember[];
};

export async function fetchUserProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>("/api/profile");
}
