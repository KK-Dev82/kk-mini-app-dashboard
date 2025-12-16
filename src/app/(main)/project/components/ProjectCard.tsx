// src/app/(main)/project/components/ProjectCard.tsx
import Link from "next/link";
import type { ProjectListItem } from "../../../lib/projectService";
import {
  projectStatusBadgeClass,
  projectStatusLabelTH,
} from "../../../lib/projectService";
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

export default function ProjectCard({ project }: Props) {
  const range = dateRange(project.startDate, project.dueDate);

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

            {/* ✅ Status badge (ไทย) */}
            {project.status ? (
              <span
                className={projectStatusBadgeClass(project.status)}
                title={project.status}
              >
                {projectStatusLabelTH(project.status)}
              </span>
            ) : null}
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
