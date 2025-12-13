// src/lib/tasksService.ts

export type TaskProject = {
  id: number | string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  teamsCount: number;
};

export type TaskColumnKey = "doing" | "todo" | "done";

export type TaskItem = {
  id: string;
  projectId: string;
  column: TaskColumnKey;

  tag: string;
  name: string;
  statusColor: "green" | "yellow" | "orange" | "red" | "purple" | "blue";
  startDate?: string;
  endDate?: string;
  description?: string;
  memberIds: string[];
  subtasks: string[];

  createdAt: string;
};

// payload จาก modal
export type CreateTaskInput = Omit<TaskItem, "id" | "createdAt">;

// ====== Toggle: เปลี่ยนเป็น "http" ตอนมี backend จริง ======
const DRIVER: "mock" | "http" = "mock";

// ====== (1) MOCK STORAGE (localStorage) ======
const LS_KEY = "mini_task_items_v1";

function readAll(): TaskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as TaskItem[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: TaskItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ====== (2) PUBLIC API ======

export async function fetchTasksByProject(projectId: string) {
  if (DRIVER === "http") {
    // TODO: ต่อ backend จริง
    // return apiClient.get(`/projects/${projectId}/tasks`);
    throw new Error("HTTP driver not implemented yet");
  }

  const all = readAll();
  return all.filter((t) => t.projectId === String(projectId));
}

export async function createTask(input: CreateTaskInput) {
  if (DRIVER === "http") {
    // TODO: ต่อ backend จริง
    // return apiClient.post(`/projects/${input.projectId}/tasks`, input);
    throw new Error("HTTP driver not implemented yet");
  }

  const all = readAll();
  const next: TaskItem = {
    ...input,
    id: uid(),
    projectId: String(input.projectId),
    createdAt: new Date().toISOString(),
  };
  const updated = [next, ...all];
  writeAll(updated);
  return next;
}

export async function moveTask(taskId: string, column: TaskColumnKey) {
  if (DRIVER === "http") {
    // TODO: apiClient.patch(`/tasks/${taskId}`, { column })
    throw new Error("HTTP driver not implemented yet");
  }

  const all = readAll();
  const updated = all.map((t) => (t.id === taskId ? { ...t, column } : t));
  writeAll(updated);
  return updated.find((t) => t.id === taskId) ?? null;
}

export async function deleteTask(taskId: string) {
  if (DRIVER === "http") {
    // TODO: apiClient.delete(`/tasks/${taskId}`)
    throw new Error("HTTP driver not implemented yet");
  }

  const all = readAll();
  const updated = all.filter((t) => t.id !== taskId);
  writeAll(updated);
  return true;
}
