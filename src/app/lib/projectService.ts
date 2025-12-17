// src/app/lib/projectService.ts
import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

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
 * API: Projects
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

/* =========================
 * API: Project Members
 * ========================= */

/**
 * ตอนนี้ backend role รองรับจริงแค่ "DEVELOPER"
 * (กันยิงค่าอื่นแล้ว 400)
 */
export type ProjectMemberRole = "DEVELOPER";

export type ProjectMemberApi = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  trelloMemberId?: string | null;
  role: ProjectMemberRole;
};

/** GET /projects/{id}/members (ต้อง auth -> ตอนนี้ยังไม่ login จะ 401) */
export async function fetchProjectMembers(
  projectId: string
): Promise<ProjectMemberApi[]> {
  return apiGet<ProjectMemberApi[]>(
    `/projects/${encodeURIComponent(projectId)}/members`
  );
}

/**
 * ✅ SAFE: ถ้า 401/unauthorized ให้ return [] เพื่อไม่ให้หน้าแดง/throw
 * ใช้ตัวนี้ตอน render ProjectCard / หน้า list ช่วงที่ยังไม่ทำ login
 */
export async function fetchProjectMembersSafe(
  projectId: string
): Promise<ProjectMemberApi[]> {
  try {
    const members = await fetchProjectMembers(projectId);
    return members ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("(401)") ||
      msg.includes("401") ||
      msg.toLowerCase().includes("unauthorized")
    ) {
      return [];
    }
    console.warn("fetchProjectMembers failed:", msg);
    return [];
  }
}

/**
 * ✅ POST /projects/{id}/members (no auth required)
 * body: { userId, role }
 */
export async function addProjectMember(
  projectId: string,
  payload: { userId: string; role: ProjectMemberRole }
): Promise<ProjectMemberApi> {
  return apiPost<ProjectMemberApi>(
    `/projects/${encodeURIComponent(projectId)}/members`,
    payload
  );
}

/** (เก็บไว้เผื่อใช้) POST /projects/{id}/members/auth */
export async function addProjectMemberWithAuth(
  projectId: string,
  payload: { userId: string; role: ProjectMemberRole }
): Promise<ProjectMemberApi> {
  return apiPost<ProjectMemberApi>(
    `/projects/${encodeURIComponent(projectId)}/members/auth`,
    payload
  );
}

/** DELETE /projects/{id}/members/{userId} */
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<{ success?: boolean }> {
  return apiDelete<{ success?: boolean }>(
    `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(
      userId
    )}`
  );
}

/** PUT /projects/{id}/members/{userId}/role  body: { role } */
export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: ProjectMemberRole
): Promise<ProjectMemberApi> {
  return apiPut<ProjectMemberApi>(
    `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(
      userId
    )}/role`,
    { role }
  );
}
