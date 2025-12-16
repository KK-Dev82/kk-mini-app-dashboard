// src/app/(main)/project/components/ProjectCard.tsx
import Link from "next/link";
import type { ProjectListItem } from "../../../lib/projectService";
import {
  EllipsisHorizontalIcon,
  FolderIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

type Props = {
  project: ProjectListItem;
};

function fmtShortTH(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function dateRange(start?: string | null, end?: string | null) {
  const s = fmtShortTH(start);
  const e = fmtShortTH(end);
  if (s && e) return `${s} - ${e}`;
  return s || e || "";
}

function statusBadge(status?: string, isActive?: boolean) {
  // ปรับสีได้ตามใจ
  if (isActive === false) {
    return { text: "INACTIVE", cls: "bg-slate-100 text-slate-600 border-slate-200" };
  }

  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE" || s === "IN_PROGRESS") {
    return { text: s || "ACTIVE", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (s === "PLANNING") {
    return { text: "PLANNING", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (s === "DONE") {
    return { text: "DONE", cls: "bg-sky-50 text-sky-700 border-sky-200" };
  }
  return { text: s || "UNKNOWN", cls: "bg-slate-50 text-slate-700 border-slate-200" };
}

export default function ProjectCard({ project }: Props) {
  const range = dateRange(project.startDate, project.dueDate);
  const st = statusBadge(project.status, project.isActive);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-start justify-between">
      <div className="flex items-start gap-3">
        {/* Project icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <FolderIcon className="h-5 w-5" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={{
                pathname: "/project/task",
                query: { projectKey: project.key },
              }}
              className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition"
            >
              {project.name}
            </Link>

            {/* ✅ Status badge */}
            <span
              className={[
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                st.cls,
              ].join(" ")}
              title={project.status ?? ""}
            >
              {st.text}
            </span>
          </div>

          {/* ✅ description */}
          {project.description ? (
            <p className="text-xs text-slate-500">{project.description}</p>
          ) : null}

          {/* ✅ date range */}
          {range ? (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 border border-slate-200">
              <CalendarDaysIcon className="h-4 w-4" />
              {range}
            </div>
          ) : null}
        </div>
      </div>

      <button type="button" className="text-slate-400 hover:text-slate-600">
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
