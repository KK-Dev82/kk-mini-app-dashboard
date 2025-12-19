import type { TaskItem } from "../../lib/dashboardService";
import {
  UserIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

type Props = {
  task: TaskItem;
};

const priorityStyles: Record<
  TaskItem["priority"],
  { bg: string; text: string }
> = {
  low: { bg: "bg-sky-50", text: "text-sky-600" },
  medium: { bg: "bg-amber-50", text: "text-amber-600" },
  high: { bg: "bg-rose-50", text: "text-rose-600" },
};

const statusStyles: Record<
  TaskItem["status"],
  { bg: string; text: string }
> = {
  "To Do": { bg: "bg-slate-100", text: "text-slate-700" },
  "In Progress": { bg: "bg-amber-50", text: "text-amber-600" },
  Done: { bg: "bg-emerald-50", text: "text-emerald-600" },
};

const getProgressPercent = (t: TaskItem) =>
  t.subTasksTotal > 0
    ? Math.round((t.subTasksCompleted / t.subTasksTotal) * 100)
    : 0;

export default function TaskCard({ task }: Props) {
  const pStyle = priorityStyles[task.priority];
  const sStyle = statusStyles[task.status];
  const progress = getProgressPercent(task);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      {/* Top row: priority + title + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* Priority badge */}
            <span
              className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${pStyle.bg} ${pStyle.text}`}
            >
              {task.priority}
            </span>

            {/* Overdue badge */}
            {task.isOverdue && (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-[2px] text-[11px] font-medium text-rose-600 border border-rose-100">
                Overdue
              </span>
            )}
          </div>

          <div className="text-sm font-semibold text-slate-800">
            {task.title}
          </div>

          <div className="text-xs text-slate-500 line-clamp-2">
            {task.description}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border whitespace-nowrap ${sStyle.bg} ${sStyle.text} border-transparent`}
        >
          {task.status}
        </span>
      </div>

      {/* Progress */}
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

      {/* Footer row: assignee + due date */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <UserIcon className="h-4 w-4 text-slate-400" />
          {task.assignee}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
          Due {task.dueDate}
        </span>
      </div>
    </div>
  );
}
