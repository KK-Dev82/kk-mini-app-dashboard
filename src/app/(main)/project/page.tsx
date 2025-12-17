"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchProjects,
  fetchProjectByKey,
  createProject,
  updateProject,
  // fetchProjectMembers, // ❌ ปิดไว้ก่อน เพราะยัง 401 (ยังไม่ login)
  type ProjectsResponse,
  type CreateProjectPayload,
  type UpdateProjectPayload,
  type ProjectApi,
  type ProjectListItem,
  // type ProjectMemberApi,
} from "../../lib/projectService";

import ProjectCard from "./components/ProjectCard";
import ProjectModal, { type NewProjectPayload } from "./components/ProjectModal";
import ProjectFilters, {
  type ProjectFiltersValue,
} from "./components/ProjectFilters";

/**
 * ✅ ไฟล์ LoadingUI.tsx ของคุณ "ไม่มี default export"
 * ต้อง import แบบ named exports
 */
import { PageLoadingOverlay } from "../component/loading/LoadingUI";

/**
 * ✅ useAsyncLoader ของคุณ ถ้าเป็น named export ให้ใช้แบบนี้
 * (ถ้าไฟล์คุณ export default จริง ค่อยเปลี่ยนเป็น import useAsyncLoader from ...)
 */
import { useAsyncLoader } from "../component/loading/useAsyncLoader";

function parseISODate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function includesText(p: ProjectListItem, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    (p.name ?? "").toLowerCase().includes(s) ||
    (p.description ?? "").toLowerCase().includes(s) ||
    (p.key ?? "").toLowerCase().includes(s)
  );
}

export default function ProjectPage() {
  const [data, setData] = useState<ProjectsResponse | null>(null);

  // create modal
  const [open, setOpen] = useState(false);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectApi | null>(null);

  const [saving, setSaving] = useState(false);

  // ✅ loading กลาง (จาก hook ของคุณ)
  const { loading, run } = useAsyncLoader();

  const [filters, setFilters] = useState<ProjectFiltersValue>({
    query: "",
    includeNoDate: true,
    monthFilter: 0,
    yearFilter: 0,
  });

  // ✅ โหลดเฉพาะ projects ก่อน (ปิด members ไปก่อนกันแดง 401)
  const load = async () => {
    await run(async () => {
      const projects = await fetchProjects();
      setData(projects);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (
    payload: NewProjectPayload
  ): Promise<ProjectApi> => {
    setSaving(true);
    try {
      const body: CreateProjectPayload = {
        name: payload.name,
        description: payload.description,
        key: payload.key,
        trelloTag: payload.trelloTag,
        status: payload.status,
        startDate: payload.startDate ?? null,
        dueDate: payload.dueDate ?? null,
      };

      const created = await createProject(body);
      await load();
      return created;
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Create project failed";
      if (
        String(msg).includes("already exists") ||
        String(msg).includes("(409)")
      ) {
        alert(
          "Trello Tag/Key ซ้ำในระบบครับ ❌\nลองเปลี่ยน Trello Tag ให้ไม่ซ้ำ แล้วสร้างใหม่"
        );
      } else {
        alert(msg);
      }
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (
    id: string,
    payload: NewProjectPayload
  ): Promise<ProjectApi> => {
    setSaving(true);
    try {
      const body: UpdateProjectPayload = {
        name: payload.name,
        description: payload.description,
        status: payload.status,
        startDate: payload.startDate ?? null,
        dueDate: payload.dueDate ?? null,
      };

      const updated = await updateProject(id, body);
      await load();
      return updated;
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Update project failed";
      alert(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (p: ProjectListItem) => {
    try {
      setSaving(true);
      const full = await fetchProjectByKey(p.key);
      setEditing(full);
      setEditOpen(true);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Load project for edit failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const yearOptions = useMemo(() => {
    const items = data?.items ?? [];
    const years = new Set<number>();

    for (const p of items) {
      const d = parseISODate(p.startDate) ?? parseISODate(p.dueDate);
      if (!d) continue;
      years.add(d.getUTCFullYear());
    }

    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];

    return items.filter((p) => {
      if (!includesText(p, filters.query)) return false;

      const hasAnyDate = !!p.startDate || !!p.dueDate;
      if (!hasAnyDate) return filters.includeNoDate;

      const anchor = parseISODate(p.startDate) ?? parseISODate(p.dueDate);
      if (!anchor) return filters.includeNoDate;

      const m = anchor.getUTCMonth() + 1;
      const y = anchor.getUTCFullYear();

      if (filters.yearFilter > 0 && y !== filters.yearFilter) return false;
      if (filters.monthFilter > 0 && m !== filters.monthFilter) return false;

      return true;
    });
  }, [data, filters]);

  return (
    <>
      {/* ✅ Loading Overlay กลาง */}
      <PageLoadingOverlay
        show={loading || saving}
        label={saving ? "กำลังบันทึก..." : "กำลังโหลด..."}
      />

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Project</h1>
            <p className="text-xs text-slate-500">
              แสดง {filtered.length} จาก {data?.items?.length ?? 0} โปรเจกต์
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            disabled={saving || loading}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
          >
            <span className="mr-1 text-base leading-none">＋</span>
            New Project
          </button>
        </div>

        <ProjectFilters
          value={filters}
          onChange={setFilters}
          yearOptions={yearOptions}
        />

        {!data ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            กำลังโหลด...
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                // ✅ ปิด members ไปก่อน => จะไม่ยิง GET /members แล้วไม่แดง
                members={[]}
                onEdit={openEdit}
              />
            ))}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                ไม่พบโปรเจกต์ตามเงื่อนไขที่เลือก
              </div>
            ) : null}
          </div>
        )}
      </div>

      <ProjectModal open={open} onClose={() => setOpen(false)} onCreate={handleCreate} />

      <ProjectModal
        open={editOpen}
        initial={editing}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onUpdate={handleUpdate}
      />
    </>
  );
}
