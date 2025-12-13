// src/lib/tasksService.ts
import { apiGet } from "./apiClient";

export type TaskStatus = "Active" | "On Hold" | "Completed";

export type TaskProject = {
  id: number | string;
  name: string;
  description: string;
  teamsCount: number;
  status: TaskStatus;
  startDate: string; // ISO string
  endDate: string;   // ISO string
};

export type TasksStats = {
  total: number;
  active: number;
  onHold: number;
  completed: number;
};

export type TasksOverview = {
  stats: TasksStats;
  items: TaskProject[];
};

// shape ที่ API ส่งจริง ๆ
type TasksApiResponse = {
  items: TaskProject[];
};

export async function fetchTasksOverview(): Promise<TasksOverview> {
  const data = await apiGet<TasksApiResponse>("/api/tasks");

  const active = data.items.filter((p) => p.status === "Active").length;
  const onHold = data.items.filter((p) => p.status === "On Hold").length;
  const completed = data.items.filter((p) => p.status === "Completed").length;

  return {
    stats: {
      total: data.items.length,
      active,
      onHold,
      completed,
    },
    items: data.items,
  };
}
