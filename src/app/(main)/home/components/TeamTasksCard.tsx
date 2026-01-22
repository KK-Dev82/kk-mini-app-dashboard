"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  UserIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

import type { TeamTasks, TaskItem } from "../../../lib/dashboardService";

type Props = {
  teamTasks: TeamTasks;
};

const MAX_TASKS_BEFORE_SCROLL = 10;

/**
 * ✅ NEW RULE:
 * - เดือนอิง "startDate" (ถ้าไม่มี startDate ให้ fallback เป็น dueDate)
 * - ฝั่งซ้าย (Due Soon 7 days): นับช่วง startDate -> dueDate (inclusive) <= 7 และไม่ overdue
 * - ฝั่งขวา (Overdue): today > dueDate (day-only)
 */
const MAX_DURATION_DAYS = 7;
const DAY_MS = 86400000;

type BadgeStyle = { bg: string; text: string };

const priorityStyles: Record<TaskItem["priority"], BadgeStyle> = {
  low: { bg: "bg-sky-50", text: "text-sky-600" },
  medium: { bg: "bg-amber-50", text: "text-amber-600" },
  high: { bg: "bg-rose-50", text: "text-rose-600" },
};

const statusStyles: Record<string, BadgeStyle> = {
  "To Do": { bg: "bg-slate-100", text: "text-slate-700" },
  TODO: { bg: "bg-slate-100", text: "text-slate-700" },

  "In Progress": { bg: "bg-amber-50", text: "text-amber-700" },
  "IN PROGRESS": { bg: "bg-amber-50", text: "text-amber-700" },

  Done: { bg: "bg-emerald-50", text: "text-emerald-700" },
  DONE: { bg: "bg-emerald-50", text: "text-emerald-700" },

  TEST: { bg: "bg-indigo-50", text: "text-indigo-700" },
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD -> utc day number */
function ymdToUtcDay(ymd: string): number | null {
  const [y, m, d] = ymd.split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** today (local) -> utc day number (day-only) */
function todayLocalDay(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

/** YYYY-MM-DD -> "YYYY-MM" */
function ymdToMonthKey(ymd: string): string | null {
  const [y, m] = ymd.split("-");
  const yy = Number(y);
  const mm = Number(m);
  if (!yy || !mm) return null;
  return `${yy}-${pad2(mm)}`;
}

/** current month key (local) -> "YYYY-MM" */
function currentMonthKeyLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

/** inclusive duration days between day numbers (safe even if swapped) */
function durationInclusiveDays(aDay: number, bDay: number): number {
  const minD = Math.min(aDay, bDay);
  const maxD = Math.max(aDay, bDay);
  return maxD - minD + 1;
}

function getProgressPercent(t: TaskItem) {
  return t.subTasksTotal > 0
    ? Math.round((t.subTasksCompleted / t.subTasksTotal) * 100)
    : 0;
}

/** Inline TaskCard */
function TaskCard({
  task,
  showProgress,
}: {
  task: TaskItem;
  showProgress: boolean;
}) {
  const pStyle = priorityStyles[task.priority] ?? priorityStyles.medium;
  const sStyle = statusStyles[task.status] ?? statusStyles["To Do"];
  const progress = getProgressPercent(task);
  const hasProgress = showProgress && task.subTasksTotal > 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${pStyle.bg} ${pStyle.text}`}
            >
              {task.priority}
            </span>

            {task.isOverdue && (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-[2px] text-[11px] font-medium text-rose-600 border border-rose-100">
                Overdue
              </span>
            )}
          </div>

          <div className="text-sm font-semibold text-slate-800 truncate">
            {task.title}
          </div>

          {!!task.description && (
            <div className="text-xs text-slate-500 line-clamp-2">
              {task.description}
            </div>
          )}
        </div>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border whitespace-nowrap ${sStyle.bg} ${sStyle.text} border-transparent`}
        >
          {task.status}
        </span>
      </div>

      {/* Progress: แสดงเฉพาะเมื่อมี checklist จริง */}
      {hasProgress && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Subtasks: {task.subTasksCompleted}/{task.subTasksTotal}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <UserIcon className="h-4 w-4 text-slate-400" />
          {task.assignee || "Unassigned"}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
          Due {task.dueDate || "-"}
        </span>
      </div>
    </div>
  );
}

export default function TeamTasksCard({ teamTasks }: Props) {
  const router = useRouter();
  const TARGET_PATH = "/project";

  const { tasks } = teamTasks;

  const {
    dueSoonTasks,
    overdueTasks,
    dueSoonCount,
    overdueCount,
    thisMonthTotal,
    overlapCount,
  } = useMemo(() => {
    const today = todayLocalDay();
    const currentMonthKey = currentMonthKeyLocal();

    type WithMeta = {
      t: TaskItem;

      hasStart: boolean;
      hasDue: boolean;

      startDay: number | null;
      dueDay: number | null;

      startMonthKey: string | null;
      dueMonthKey: string | null;

      isOverdue: boolean;
      durationDays: number | null; // inclusive: start->due
    };

    const normalized: WithMeta[] = (tasks ?? [])
      .map((t) => {
        const startRaw = (t.startDate ?? "").trim();
        const dueRaw = (t.dueDate ?? "").trim();

        const startYMD = startRaw && startRaw !== "-" ? startRaw : "";
        const dueYMD = dueRaw && dueRaw !== "-" ? dueRaw : "";

        const startDay0 = startYMD ? ymdToUtcDay(startYMD) : null;
        const dueDay0 = dueYMD ? ymdToUtcDay(dueYMD) : null;

        // ถ้าไม่มีทั้งคู่ ตัดทิ้ง
        if (startDay0 == null && dueDay0 == null) return null;

        const hasStart = startDay0 != null;
        const hasDue = dueDay0 != null;

        // ✅ เดือนนับตาม startDate (ถ้าไม่มี startDate ให้ fallback เป็น dueDate)
        const startMonthKey =
          (startYMD ? ymdToMonthKey(startYMD) : null) ??
          (dueYMD ? ymdToMonthKey(dueYMD) : null);

        const dueMonthKey = dueYMD ? ymdToMonthKey(dueYMD) : null;

        // คำนวณ overdue: today > dueDate
        const isOverdue = hasDue && (dueDay0 as number) < today;

        // คำนวณ duration (ต้องมี start+due จริงเท่านั้น)
        const durationDays =
          hasStart && hasDue
            ? durationInclusiveDays(startDay0 as number, dueDay0 as number)
            : null;

        return {
          t,
          hasStart,
          hasDue,
          startDay: startDay0,
          dueDay: dueDay0,
          startMonthKey,
          dueMonthKey,
          isOverdue,
          durationDays,
        } satisfies WithMeta;
      })
      .filter(Boolean) as WithMeta[];

    // ✅ เดือนนี้แบบ "อิง startDate month"
    const thisMonth = normalized.filter(({ startMonthKey }) => {
      return startMonthKey === currentMonthKey;
    });

    // ✅ นับจำนวนงานที่เหลื่อมเดือน (startMonth != dueMonth) แต่ยังนับอยู่เดือน start
    const overlapCount0 = thisMonth.filter(({ hasStart, hasDue, startMonthKey, dueMonthKey }) => {
      if (!hasStart || !hasDue) return false;
      if (!startMonthKey || !dueMonthKey) return false;
      return startMonthKey !== dueMonthKey;
    }).length;

    // ✅ ฝั่งซ้าย: duration(start->due) <= 7 และไม่ overdue
    const dueSoon = thisMonth
      .filter(({ hasStart, hasDue, durationDays, isOverdue }) => {
        if (!hasStart || !hasDue) return false;
        if (isOverdue) return false;
        return (durationDays ?? Number.POSITIVE_INFINITY) <= MAX_DURATION_DAYS;
      })
      .sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0))
      .map(({ t, isOverdue }) => ({
        ...t,
        isOverdue,
      }));

    // ✅ ฝั่งขวา: today > dueDate (และอยู่ในเดือน start)
    const overdue = thisMonth
      .filter(({ hasDue, isOverdue }) => hasDue && isOverdue)
      .sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0))
      .map(({ t, isOverdue }) => ({
        ...t,
        isOverdue,
      }));

    return {
      dueSoonTasks: dueSoon,
      overdueTasks: overdue,
      dueSoonCount: dueSoon.length,
      overdueCount: overdue.length,
      thisMonthTotal: thisMonth.length,
      overlapCount: overlapCount0,
    };
  }, [tasks]);

  const dueSoonScrollClass =
    dueSoonTasks.length > MAX_TASKS_BEFORE_SCROLL
      ? "max-h-[60vh] overflow-y-auto pr-2"
      : "";

  const overdueScrollClass =
    overdueTasks.length > MAX_TASKS_BEFORE_SCROLL
      ? "max-h-[60vh] overflow-y-auto pr-2"
      : "";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">Team Tasks</h2>
        </div>

        <button
          type="button"
          onClick={() => router.push(TARGET_PATH)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View All
        </button>
      </div>

      <div className="border-t border-slate-100 px-4 pt-4 pb-3 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-2xl font-semibold text-slate-900">
            {dueSoonCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Due Soon
          </div>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
          <div className="text-2xl font-semibold text-rose-600">
            {overdueCount}
          </div>
          <div className="text-xs text-rose-500 mt-1">Overdue</div>
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Due Soon */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 mb-1">
            Due Soon (duration ≤ {MAX_DURATION_DAYS} days)
          </div>

          {dueSoonTasks.length === 0 ? (
            <div className="text-xs text-slate-400">
              No tasks with duration ≤ {MAX_DURATION_DAYS} days in this month.
            </div>
          ) : (
            <div className={`flex flex-col gap-3 ${dueSoonScrollClass}`}>
              {dueSoonTasks.map((task) => (
                <TaskCard key={task.id} task={task} showProgress={true} />
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-rose-500 mb-1">Overdue</div>

          {overdueTasks.length === 0 ? (
            <div className="text-xs text-slate-400">No overdue tasks.</div>
          ) : (
            <div className={`flex flex-col gap-3 ${overdueScrollClass}`}>
              {overdueTasks.map((task) => (
                <TaskCard key={task.id} task={task} showProgress={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
