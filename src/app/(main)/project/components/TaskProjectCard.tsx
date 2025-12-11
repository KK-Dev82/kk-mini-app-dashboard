// src/app/(main)/project/components/TaskProjectCard.tsx

import Link from "next/link";
import type { TaskProject } from "../../../lib/tasksService";
import {
  EllipsisHorizontalIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type Props = {
  project: TaskProject;
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
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-start justify-between gap-4">
      {/* ซ้าย: icon + ข้อมูลโปรเจกต์ */}
      <div className="flex items-start gap-3">
        {/* Icon โฟลเดอร์ */}
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-lg">
          📁
        </div>

        <div className="space-y-1">
          {/* ชื่อโปรเจกต์ (กดแล้วไป /project/task?projectId=...) */}
          <div className="flex items-center gap-2">
            <Link
              href={{
                pathname: "/project/task",
                query: { projectId: String(project.id) },
              }}
              className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition"
            >
              {project.name}
            </Link>
          </div>

          {/* คำอธิบาย */}
          <p className="text-xs text-slate-500">{project.description}</p>

          {/* teams + ช่วงวันที่ */}
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

      {/* ขวา: ปุ่มเมนู 3 จุด */}
      <button className="mt-1 text-slate-400 hover:text-slate-600">
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
