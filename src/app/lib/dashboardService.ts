// src/lib/dashboardService.ts
import { apiGet } from "./apiClient";

/* ---------- Types ---------- */

export type AttendanceSummary = {
  onTime: number;
  late: number;
  leave: number;
  outside: number;
};

export type LeaveItem = {
  id: number | string;
  name: string;
  type: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
};

export type TeamTasksSummary = {
  inProgress: number;
  overdue: number;
};

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "To Do" | "In Progress" | "Done";

export type TaskItem = {
  id: number | string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  isOverdue: boolean;
  subTasksCompleted: number;
  subTasksTotal: number;
  assignee: string;
  dueDate: string; // string ไปก่อน ไว้ค่อยเปลี่ยนเป็น Date ก็ได้
};

export type TeamTasks = {
  summary: TeamTasksSummary;
  tasks: TaskItem[];
};

export type DashboardOverview = {
  attendance: AttendanceSummary;
  pendingLeaves: LeaveItem[];
  teamTasks: TeamTasks;
};

/* ---------- Service function ---------- */

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  return apiGet<DashboardOverview>("/api/dashboard");
}
