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

// ✅ แก้: PUT ห้ามส่ง trelloTag (และปกติ key ก็ไม่ควรแก้)
export type UpdateProjectPayload = Partial<{
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  isActive: boolean;
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

export async function createProject(payload: CreateProjectPayload): Promise<ProjectApi> {
  console.log("[projectService.createProject payload]", payload);
  return apiPost<ProjectApi>("/projects", payload);
}

export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<ProjectApi> {
  // ✅ กันพลาด: ส่งเฉพาะ field ที่ backend อนุญาตจริง ๆ
  const safe: UpdateProjectPayload = {
    name: payload.name,
    description: payload.description,
    status: payload.status,
    startDate: payload.startDate ?? null,
    dueDate: payload.dueDate ?? null,
    isActive: payload.isActive,
  };

  console.log("[projectService.updateProject payload]", { id, ...safe });
  return apiPut<ProjectApi>(`/projects/${encodeURIComponent(id)}`, safe);
}

/* =========================
 * API: Project Members
 * ========================= */

export type ProjectMemberRole =
  | "PROJECT_MANAGER"
  | "DEVELOPER"
  | "DESIGNER"
  | "TESTER"
  | "MEMBER";

export function isProjectMemberRole(v: any): v is ProjectMemberRole {
  return (
    v === "PROJECT_MANAGER" ||
    v === "DEVELOPER" ||
    v === "DESIGNER" ||
    v === "TESTER" ||
    v === "MEMBER"
  );
}

export type ProjectMemberApi = {
  id: string;
  userId?: string;
  email?: string;
  name?: string;
  picture?: string | null;
  trelloMemberId?: string | null;
  role: ProjectMemberRole;
};

type ProjectMemberRaw = any;

function normalizeProjectMember(raw: ProjectMemberRaw): ProjectMemberApi | null {
  if (!raw) return null;

  const roleRaw = raw.role;
  const role: ProjectMemberRole = isProjectMemberRole(roleRaw) ? roleRaw : "MEMBER";

  const userId: string | undefined =
    raw.userId ??
    raw.user?.id ??
    raw.user?.userId ??
    raw.profile?.id ??
    raw.memberId ??
    undefined;

  const id: string =
    raw.id ??
    raw.projectMemberId ??
    raw.memberId ??
    raw.trelloMemberId ??
    userId ??
    "";

  if (!id) return null;

  const name: string | undefined =
    raw.name ??
    raw.fullName ??
    raw.user?.name ??
    raw.user?.fullName ??
    raw.profile?.name ??
    undefined;

  const email: string | undefined =
    raw.email ??
    raw.user?.email ??
    raw.profile?.email ??
    undefined;

  const trelloMemberId: string | null | undefined =
    raw.trelloMemberId ?? raw.user?.trelloMemberId ?? null;

  const picture: string | null | undefined =
    raw.picture ?? raw.user?.picture ?? raw.profile?.picture ?? null;

  return {
    id,
    userId,
    name,
    email,
    trelloMemberId,
    picture,
    role,
  };
}

export async function fetchProjectMembers(projectId: string): Promise<ProjectMemberApi[]> {
  const res = await apiGet<any[]>(
    `/projects/${encodeURIComponent(projectId)}/members`,
    { noAuth: true }
  );

  return (res ?? []).map(normalizeProjectMember).filter(Boolean) as ProjectMemberApi[];
}

export async function addProjectMember(
  projectId: string,
  payload: { userId: string; role: ProjectMemberRole }
): Promise<ProjectMemberApi> {
  const safeRole: ProjectMemberRole = isProjectMemberRole(payload.role)
    ? payload.role
    : "MEMBER";

  const created = await apiPost<any>(
    `/projects/${encodeURIComponent(projectId)}/members`,
    { userId: payload.userId, role: safeRole },
    { noAuth: true }
  );

  const norm = normalizeProjectMember(created);
  if (!norm) return { id: payload.userId, userId: payload.userId, role: safeRole };
  return norm;
}

export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<{ success?: boolean }> {
  return apiDelete<{ success?: boolean }>(
    `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`,
    { noAuth: true }
  );
}

// ✅ PUT role ต้องใช้ token (proxy จะใส่ให้)
export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: ProjectMemberRole
): Promise<ProjectMemberApi> {
  const safeRole: ProjectMemberRole = isProjectMemberRole(role) ? role : "MEMBER";

  const updated = await apiPut<any>(
    `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}/role`,
    { role: safeRole }
  );

  const norm = normalizeProjectMember(updated);
  if (!norm) return { id: userId, userId, role: safeRole };
  return norm;
}
