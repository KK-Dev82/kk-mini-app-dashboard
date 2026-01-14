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

/**
 * ✅ Task ที่อยู่ใน ProjectPhaseApi.tasks (ตาม swagger ของ GET /projects/{projectId}/phases)
 * ใช้สำหรับ map phase <-> trello card ด้วย trelloCardId
 */
export type ProjectPhaseTaskApi = {
  id: string;
  trelloCardId?: string | null;

  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;

  assignedUserId?: string | null;
  worksiteId?: string | null;

  projectId?: string | null;
  phaseId?: string | null;

  startDate?: string | null; // ISO
  dueDate?: string | null; // ISO
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

  // ✅ แก้จาก unknown[] -> typed (มี trelloCardId)
  tasks?: ProjectPhaseTaskApi[];
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

  // ✅ เผื่อ detail endpoint ส่ง trelloCardId มาด้วย (ไม่บังคับ)
  trelloCardId?: string | null;
};

export type ProjectPhaseDetailApi = ProjectPhaseApi & {
  tasks?: PhaseTaskApi[];
};

/**
 * ✅ swagger: GET /projects/{projectId}/phases/{id}?sprint=1&limit=50
 * sprint/limit = required ตามที่บอก
 */
export async function fetchProjectPhaseById(
  projectId: string,
  phaseId: string,
  sprint: number,
  limit: number
): Promise<ProjectPhaseDetailApi> {
  const qs = new URLSearchParams({
    sprint: String(sprint),
    limit: String(limit),
  }).toString();

  return apiGet<ProjectPhaseDetailApi>(
    `/projects/${encodeURIComponent(projectId)}/phases/${encodeURIComponent(
      phaseId
    )}?${qs}`,
    { useEnvToken: true }
  );
}
