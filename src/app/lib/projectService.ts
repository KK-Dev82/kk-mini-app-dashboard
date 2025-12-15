// src/app/lib/projectService.ts
import { apiGet, apiPost } from "./apiClient";

/** shape ที่ backend /projects ส่งมา (ตาม swagger) */
export type ProjectApi = {
  id: string;
  name: string;
  description: string;
  key: string;
  trelloTag: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** POST body (ไม่มี trelloBoardId) */
export type CreateProjectPayload = {
  name: string;
  description: string;
  key: string;
  trelloTag: string;
};

/** ✅ UI/list ใช้ข้อมูลจริงเท่านั้น */
export type ProjectListItem = Pick<ProjectApi, "id" | "name" | "description" | "key">;

export type ProjectsResponse = {
  items: ProjectListItem[];
};

/** ✅ GET /projects (list) */
export async function fetchProjects(): Promise<ProjectsResponse> {
  const projects = await apiGet<ProjectApi[]>("/projects");

  return {
    items: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      key: p.key,
    })),
  };
}

/** ✅ GET /projects/key/{key} */
export async function fetchProjectByKey(key: string): Promise<ProjectApi> {
  return apiGet<ProjectApi>(`/projects/key/${encodeURIComponent(key)}`);
}

/** ✅ POST /projects */
export async function createProject(payload: CreateProjectPayload): Promise<ProjectApi> {
  return apiPost<ProjectApi>("/projects", payload);
}
