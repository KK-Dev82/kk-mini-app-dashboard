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

  status?: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayload = {
  name: string;
  description: string;
  key: string;
  trelloTag: string;

  status?: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
  isActive?: boolean;
};

export type UpdateProjectPayload = Partial<
  Omit<CreateProjectPayload, "key"> // ปกติ key ไม่ควรแก้
>;

export type ProjectListItem = Pick<
  ProjectApi,
  "id" | "name" | "description" | "key" | "status" | "startDate" | "dueDate" | "isActive"
>;

export type ProjectsResponse = {
  items: ProjectListItem[];
};

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
  return apiPost<ProjectApi>("/projects", payload);
}

/** ✅ PUT (แก้ project) */
export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<ProjectApi> {
  return apiPut<ProjectApi>(`/projects/${encodeURIComponent(id)}`, payload);
}
