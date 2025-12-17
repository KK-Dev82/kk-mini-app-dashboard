// src/lib/dashboardService.ts

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
  dueDate: string;
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

/* ---------- MOCK DATA ---------- */

const MOCK_OVERVIEW: DashboardOverview = {
  attendance: {
    onTime: 12,
    late: 3,
    leave: 2,
    outside: 1,
  },
  pendingLeaves: [
    { id: 1, name: "John Doe", type: "Sick Leave", date: "2025-12-17", status: "Pending" },
    { id: 2, name: "May Kyser", type: "Vacation", date: "2025-12-18", status: "Pending" },
  ],
  teamTasks: {
    summary: { inProgress: 5, overdue: 1 },
    tasks: [
      {
        id: 101,
        title: "Design Project UI",
        description: "Refine project card and modal UX",
        priority: "high",
        status: "In Progress",
        isOverdue: false,
        subTasksCompleted: 2,
        subTasksTotal: 5,
        assignee: "Admin User",
        dueDate: "2025-12-25",
      },
      {
        id: 102,
        title: "Fix members list",
        description: "Wire GET /projects/{id}/members after auth",
        priority: "medium",
        status: "To Do",
        isOverdue: true,
        subTasksCompleted: 0,
        subTasksTotal: 3,
        assignee: "Jatuporn Srimongkol",
        dueDate: "2025-12-15",
      },
    ],
  },
};

/* ---------- Service function ---------- */

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  // ✅ mock: ไม่ยิง API ไม่ผ่าน proxy ไม่เจอ parse URL error
  return MOCK_OVERVIEW;
}
