// src/app/(main)/project/components/ProjectCard.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ProjectListItem, ProjectMemberApi } from "../../../lib/projectService";
import {
  projectStatusBadgeClass,
  projectStatusLabelTH,
  fetchProjectMembers, // ✅ เพิ่ม
} from "../../../lib/projectService";
import {
  EllipsisHorizontalIcon,
  FolderIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type Props = {
  project: ProjectListItem;
  members?: ProjectMemberApi[]; // ✅ เผื่อ parent ส่งมา (fallback)
  onEdit?: (project: ProjectListItem) => void;
};

function fmtShortTH(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dateRange(start?: string | null, end?: string | null) {
  const s = fmtShortTH(start);
  const e = fmtShortTH(end);
  if (s && e) return `${s} - ${e}`;
  return s || e || "";
}

function avatarText(name?: string | null, email?: string | null) {
  const ch = (name?.trim()?.[0] || email?.trim()?.[0] || "?").toUpperCase();
  return ch;
}

export default function ProjectCard({ project, members = [], onEdit }: Props) {
  const range = dateRange(project.startDate, project.dueDate);
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ members (โหลดเองจาก API)
  const [membersData, setMembersData] = useState<ProjectMemberApi[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  // ปิดเมนูเมื่อคลิกข้างนอก / กด ESC
  useEffect(() => {
    if (!menuOpen) return;

    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.closest?.("[data-project-menu]") ||
        t.closest?.("[data-project-menu-btn]")
      )
        return;
      setMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // ✅ โหลดสมาชิกเมื่อ card แสดง / project เปลี่ยน
  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setMembersLoading(true);
      setMembersError("");

      try {
        const res = await fetchProjectMembers(project.id);
        if (cancelled) return;
        setMembersData(res ?? []);
      } catch (e) {
        if (cancelled) return;
        setMembersError(e instanceof Error ? e.message : "โหลดสมาชิกไม่สำเร็จ");
        setMembersData([]);
      } finally {
        if (cancelled) return;
        setMembersLoading(false);
      }
    }

    if (project?.id) loadMembers();

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  // ✅ ถ้า parent ส่ง members มาแล้ว ให้ใช้ของ parent แทนได้ (optional)
  const effectiveMembers = membersData.length ? membersData : members;

  const memberDisplay = useMemo(() => {
    const list = (effectiveMembers ?? [])
      .map((m) => ({
        id: m.id,
        name: (m as any).name as string | undefined,
        email: (m as any).email as string | undefined,
      }))
      .filter((m) => m.id);

    return list;
  }, [effectiveMembers]);

  const show = memberDisplay.slice(0, 3);
  const extra = Math.max(0, memberDisplay.length - show.length);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-start justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <FolderIcon className="h-5 w-5" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={{ pathname: "/project/task", query: { projectKey: project.key } }}
              className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition"
            >
              {project.name}
            </Link>

            {project.status ? (
              <span
                className={projectStatusBadgeClass(project.status)}
                title={project.status}
              >
                {projectStatusLabelTH(project.status)}
              </span>
            ) : null}
          </div>

          {project.description ? (
            <p className="text-xs text-slate-500">{project.description}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {range ? (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 border border-slate-200">
                <CalendarDaysIcon className="h-4 w-4" />
                {range}
              </div>
            ) : null}

            {/* ✅ สมาชิกในโปรเจกต์ */}
            <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 border border-slate-200">
              <UserGroupIcon className="h-4 w-4" />

              {membersLoading ? (
                <span className="text-slate-400">กำลังโหลด…</span>
              ) : membersError ? (
                <span className="text-red-500">โหลดสมาชิกไม่สำเร็จ</span>
              ) : memberDisplay.length === 0 ? (
                <span className="text-slate-400">ยังไม่มีสมาชิก</span>
              ) : (
                <div className="inline-flex items-center gap-1">
                  <div className="flex -space-x-2">
                    {show.map((m) => (
                      <span
                        key={m.id}
                        title={m.name || m.email || m.id}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white bg-slate-200 text-[10px] font-semibold text-slate-700"
                      >
                        {avatarText(m.name, m.email)}
                      </span>
                    ))}
                    {extra > 0 ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white bg-slate-300 text-[10px] font-semibold text-slate-700">
                        +{extra}
                      </span>
                    ) : null}
                  </div>

                  <span className="ml-1 text-slate-600">{memberDisplay.length} คน</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          data-project-menu-btn
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="project actions"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div
            data-project-menu
            className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-20"
          >
            <button
              type="button"
              disabled={!onEdit}
              onClick={() => {
                setMenuOpen(false);
                onEdit?.(project);
              }}
              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              แก้ไข
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
