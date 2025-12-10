import type { TaskProject } from "../../../lib/tasksService";
import {
  EllipsisHorizontalIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type Props = {
  project: TaskProject;
};

const statusStyles: Record<
  TaskProject["status"],
  { bg: string; text: string }
> = {
  Active: { bg: "bg-emerald-50", text: "text-emerald-600" },
  "On Hold": { bg: "bg-amber-50", text: "text-amber-600" },
  Completed: { bg: "bg-slate-100", text: "text-slate-700" },
};

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);

  const formatMonth = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short" });
  const day = (d: Date) => d.getDate();
  const year = (d: Date) => d.getFullYear();

  if (year(s) === year(e)) {
    return `${formatMonth(s)} ${day(s)} - ${formatMonth(e)} ${day(e)}, ${year(
      e
    )}`;
  }
  return `${formatMonth(s)} ${day(s)}, ${year(s)} - ${formatMonth(e)} ${day(
    e
  )}, ${year(e)}`;
}

export default function TaskProjectCard({ project }: Props) {
  const style = statusStyles[project.status];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-start justify-between gap-4">
      {/* ซ้าย: icon + text */}
      <div className="flex items-start gap-3">
        {/* icon project */}
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-lg">
          📁
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              {project.name}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${style.bg} ${style.text}`}
            >
              {project.status}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {project.description}
          </p>

          <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              {project.teamsCount} teams
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDaysIcon className="h-4 w-4" />
              {formatDateRange(project.startDate, project.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* ขวา: เมนูจุด 3 จุด */}
      <button className="mt-1 text-slate-400 hover:text-slate-600">
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
