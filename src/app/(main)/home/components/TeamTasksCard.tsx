"use client";

import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import type { TeamTasks } from "../../../lib/dashboardService";
import TaskCard from "../../component/TaskCard";

type Props = {
  teamTasks: TeamTasks;
};

const MAX_TASKS = 10;

export default function TeamTasksCard({ teamTasks }: Props) {
  const router = useRouter();

  // ✅ เปลี่ยน path ให้ตรงหน้า project ของคุณ
  // ตัวอย่าง:
  // - "/project"
  // - "/projects"
  // - `/project?projectId=${teamTasks.projectId}`
  const TARGET_PATH = "/project";

  const { summary, tasks } = teamTasks;

  // จำกัดจำนวนงานที่เอามาใช้บน dashboard
  const limited = tasks.slice(0, MAX_TASKS);

  // ฝั่งซ้าย: In Progress อย่างเดียว
  const inProgressTasks = limited.filter((t) => t.status === "In Progress");

  // งานที่เหลือที่ไม่ใช่ In Progress
  const remaining = limited.filter((t) => t.status !== "In Progress");

  // ฝั่งขวา: Overdue จากงานที่เหลือ (จะได้ไม่ซ้ำกับฝั่งซ้าย)
  const overdueTasks = remaining.filter((t) => t.isOverdue);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-md">
      {/* Header */}
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

      {/* Summary row */}
      <div className="border-t border-slate-100 px-4 pt-4 pb-3 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-2xl font-semibold text-slate-900">
            {summary.inProgress}
          </div>
          <div className="text-xs text-slate-500 mt-1">In Progress</div>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
          <div className="text-2xl font-semibold text-rose-600">
            {summary.overdue}
          </div>
          <div className="text-xs text-rose-500 mt-1">Overdue</div>
        </div>
      </div>

      {/* 2 columns: In Progress | Overdue */}
      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* In Progress column */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 mb-1">
            In Progress
          </div>
          {inProgressTasks.length === 0 && (
            <div className="text-xs text-slate-400">No tasks in progress.</div>
          )}
          {inProgressTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Overdue column */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-rose-500 mb-1">Overdue</div>
          {overdueTasks.length === 0 && (
            <div className="text-xs text-slate-400">No overdue tasks.</div>
          )}
          {overdueTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </section>
  );
}
