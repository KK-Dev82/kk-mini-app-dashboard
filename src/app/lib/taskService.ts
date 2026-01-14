// src/lib/taskService.ts
import { apiPatch, apiPost } from "./apiClient";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskApi = {
  id: string;
  title: string;
  description?: string | null;

  projectId: string;
  phaseId?: string | null;

  assignedUserId?: string | null;
  dueDate?: string | null;

  priority?: TaskPriority | null;

  createdAt?: string;
  updatedAt?: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  projectId: string;

  phaseId?: string | null;

  assignedUserId?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority | null;
};

export async function createTask(payload: CreateTaskPayload): Promise<TaskApi> {
  return apiPost<TaskApi>("/tasks", payload, { useEnvToken: true });
}

export async function assignTaskToPhase(
  taskId: string,
  phaseId: string
): Promise<TaskApi> {
  return apiPatch<TaskApi>(
    `/tasks/${encodeURIComponent(taskId)}/assign-phase`,
    { phaseId },
    { useEnvToken: true }
  );
}

export async function removeTaskFromPhase(taskId: string): Promise<TaskApi> {
  return apiPatch<TaskApi>(
    `/tasks/${encodeURIComponent(taskId)}/remove-phase`,
    {},
    { useEnvToken: true }
  );
}
