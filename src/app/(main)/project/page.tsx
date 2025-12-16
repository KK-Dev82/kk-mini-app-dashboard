"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchProjects,
  createProject,
  type ProjectsResponse,
  type CreateProjectPayload,
  type ProjectListItem,
} from "../../lib/projectService";

import ProjectCard from "./components/ProjectCard";
import ProjectModal, { type NewProjectPayload } from "./components/ProjectModal";

function parseISODate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function durationMonths(p: ProjectListItem) {
  const s = parseISODate(p.startDate);
  const e = parseISODate(p.dueDate);
  if (!s || !e) return null;

  const sm = s.getUTCFullYear() * 12 + s.getUTCMonth();
  const em = e.getUTCFullYear() * 12 + e.getUTCMonth();

  if (em < sm) return null;
  return em - sm + 1;
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
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ search
  const [query, setQuery] = useState("");

  // ✅ ระยะเวลา (เดือน): 0 = ไม่กรอง
  const [durationFilter, setDurationFilter] = useState<number>(0);

  // ✅ รวมโปรเจกต์ที่ไม่มีวัน
  const [includeNoDate, setIncludeNoDate] = useState(true);

  const load = async () =>
    fetchProjects()
      .then(setData)
      .catch((err) => console.error("Failed to load projects", err));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (payload: NewProjectPayload) => {
    try {
      setSaving(true);

      const body: CreateProjectPayload = {
        name: payload.name,
        description: payload.description,
        key: payload.key, // (key = trelloTag) ถ้าซ้ำ backend จะ 409
        trelloTag: payload.trelloTag,
        status: payload.status,
        startDate: payload.startDate ?? null,
        dueDate: payload.dueDate ?? null,
      };

      await createProject(body);
      await load();
    } catch (e) {
      console.error(e);

      // ✅ ทำข้อความให้เข้าใจง่ายขึ้นนิดนึง
      const msg = e instanceof Error ? e.message : "Create project failed";
      if (String(msg).includes("already exists") || String(msg).includes("(409)")) {
        alert("Trello Tag/Key ซ้ำในระบบครับ ❌\nลองเปลี่ยน Trello Tag ให้ไม่ซ้ำ แล้วสร้างใหม่");
      } else {
        alert(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const items = data?.items ?? [];

    return items.filter((p) => {
      // 1) search
      if (!includesText(p, query)) return false;

      const hasAnyDate = !!p.startDate || !!p.dueDate;

      // 2) ไม่มีวันเลย
      if (!hasAnyDate) return includeNoDate;

      // 3) ถ้าไม่เลือก “ระยะเวลา” ก็ไม่กรองเพิ่ม
      if (durationFilter <= 0) return true;

      // 4) ต้องมีทั้ง start/due ถึงจะคำนวณระยะเวลาได้
      const dm = durationMonths(p);
      if (dm == null) return false;

      return dm === durationFilter;
    });
  }, [data, query, durationFilter, includeNoDate]);

  if (!data) return <div className="p-6 text-sm text-slate-500">Loading...</div>;

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Project</h1>
            <p className="text-xs text-slate-500">
              แสดง {filtered.length} จาก {data.items.length} โปรเจกต์
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            disabled={saving}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
          >
            <span className="mr-1 text-base leading-none">＋</span>
            New Project
          </button>
        </div>

        {/* ✅ Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-700">ค้นหา</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="ค้นหาชื่อโปรเจกต์ / รายละเอียด / key"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                ระยะเวลา (เดือน)
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={durationFilter}
                onChange={(e) => setDurationFilter(Number(e.target.value))}
              >
                <option value={0}>ทั้งหมด</option>
                {Array.from({ length: 12 }).map((_, i) => {
                  const m = i + 1;
                  return (
                    <option key={m} value={m}>
                      {m} เดือน
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-400">
                เลือก 1 = start/due อยู่เดือนเดียวกัน, เลือก 2 = คร่อม 2 เดือน ฯลฯ
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeNoDate}
              onChange={(e) => setIncludeNoDate(e.target.checked)}
            />
            รวมโปรเจกต์ที่ยังไม่กำหนดวันเริ่ม/สิ้นสุด
          </label>
        </div>

        <div className="space-y-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              ไม่พบโปรเจกต์ตามเงื่อนไขที่เลือก
            </div>
          ) : null}
        </div>
      </div>

      <ProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
