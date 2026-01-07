// src/lib/ganttService.ts
import { apiGet, apiPost } from "./apiClient";

export type GanttTaskColor =
  | "green"
  | "blue"
  | "red"
  | "orange"
  | "purple"
  | "slate"
  | "pink";

export type GanttTaskApi = {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: GanttTaskColor;
};

/** จาก swagger: GET /projects/{projectId}/phases */
export type ProjectPhaseApi = {
  id: string;
  name: string;
  description?: string | null;
  orderIndex?: number | null;
  status?: string | null;
  startDate: string | null; // ISO
  dueDate: string | null; // ISO
  deliverDate?: string | null;
  trelloListId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  projectId: string;
  tasks?: unknown[];
};

export async function fetchProjectPhases(
  projectId: string
): Promise<ProjectPhaseApi[]> {
  return apiGet<ProjectPhaseApi[]>(
    `/projects/${encodeURIComponent(projectId)}/phases`,
    { useEnvToken: true }
  );
}

/** ✅ จาก swagger: POST /projects/{projectId}/phases */
export type CreateProjectPhasePayload = {
  name: string;
  description?: string | null;
  orderIndex: number; // ✅ required (backend บังคับ int)
  status?: string | null; // e.g. "NOT_STARTED"
  startDate?: string | null; // ISO
  dueDate?: string | null; // ISO
  deliverDate?: string | null;
  trelloListId?: string | null;
};

export async function createProjectPhase(
  projectId: string,
  payload: CreateProjectPhasePayload
): Promise<ProjectPhaseApi> {
  return apiPost<ProjectPhaseApi>(
    `/projects/${encodeURIComponent(projectId)}/phases`,
    payload,
    { useEnvToken: true }
  );
}

/** จาก swagger: GET /projects/{projectId}/phases/{id} */
export type PhaseTaskApi = {
  id: string;
  name?: string | null;
  title?: string | null;
  startDate?: string | null; // ISO
  dueDate?: string | null; // ISO
  status?: string | null;
  orderIndex?: number | null;
};

export type ProjectPhaseDetailApi = ProjectPhaseApi & {
  tasks?: PhaseTaskApi[];
};

export async function fetchProjectPhaseById(
  projectId: string,
  phaseId: string
): Promise<ProjectPhaseDetailApi> {
  return apiGet<ProjectPhaseDetailApi>(
    `/projects/${encodeURIComponent(projectId)}/phases/${encodeURIComponent(
      phaseId
    )}`,
    { useEnvToken: true }
  );
}
