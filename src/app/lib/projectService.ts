// src/app/lib/projectService.ts
import { apiGet, apiPost, apiPut } from "./apiClient";

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type ProjectApi = {
  id: string;
  name: string;
  description: string | null;
  key: string;
  trelloBoardId?: string | null;
  trelloTag: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayload = {
  name: string;
  description: string;
  key: string;
  trelloTag: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
};

export type UpdateProjectPayload = Partial<{
  name: string;
  description: string;
  trelloTag: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
}>;

export type ProjectListItem = Pick<
  ProjectApi,
  "id" | "name" | "description" | "key" | "status" | "startDate" | "dueDate" | "isActive"
>;

export type ProjectsResponse = {
  items: ProjectListItem[];
};

export const PROJECT_STATUS_TH: Record<ProjectStatus, string> = {
  PLANNING: "วางแผน",
  ACTIVE: "ดำเนินการ",
  ON_HOLD: "หยุดชั่วคราว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export function projectStatusLabelTH(status?: ProjectStatus | null): string {
  if (!status) return "";
  return PROJECT_STATUS_TH[status] ?? status;
}

export function projectStatusBadgeClass(status?: ProjectStatus | null): string {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium";

  switch (status) {
    case "PLANNING":
      return `${base} bg-amber-50 text-amber-700 border-amber-200`;
    case "ACTIVE":
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    case "ON_HOLD":
      return `${base} bg-orange-50 text-orange-700 border-orange-200`;
    case "COMPLETED":
      return `${base} bg-sky-50 text-sky-700 border-sky-200`;
    case "CANCELLED":
      return `${base} bg-red-50 text-red-700 border-red-200`;
    default:
      return `${base} bg-slate-50 text-slate-700 border-slate-200`;
  }
}

/* =========================
 * API
 * ========================= */

export async function fetchProjects(): Promise<ProjectsResponse> {
  const projects = await apiGet<ProjectApi[]>("/projects");

  return {
    items: (projects ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      key: p.key,
      status: p.status,
      startDate: p.startDate,
      dueDate: p.dueDate,
      isActive: p.isActive,
    })),
  };
}

export async function fetchProjectByKey(key: string): Promise<ProjectApi> {
  return apiGet<ProjectApi>(`/projects/key/${encodeURIComponent(key)}`);
}

export async function createProject(
  payload: CreateProjectPayload
): Promise<ProjectApi> {
  console.log("[projectService.createProject payload]", payload);
  return apiPost<ProjectApi>("/projects", payload);
}

export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<ProjectApi> {
  console.log("[projectService.updateProject payload]", { id, ...payload });
  return apiPut<ProjectApi>(`/projects/${encodeURIComponent(id)}`, payload);
}
