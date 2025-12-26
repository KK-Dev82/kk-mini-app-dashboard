// ProjectGanttModal.tsx
"use client";

import { useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { GanttTaskApi, GanttTaskColor } from "../../../lib/ganttService";

import type { GanttProjectWithTasks } from "../../component/ganttchart/ganttTypes";
import { clamp, fmtThaiDate, monthIndex, toDateOnly } from "../../component/ganttchart/ganttUtils";

import GanttMonthHeader from "../../component/ganttchart/GanttMonthHeader";
import GanttTimeline, { type GanttTimelineBar } from "../../component/ganttchart/GanttTimeline";
import GanttRowLayout from "../../component/ganttchart/GanttRowLayout";

const COLOR_MAP: Record<GanttTaskColor, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  red: "bg-rose-500",
  orange: "bg-amber-500",
  purple: "bg-fuchsia-500",
  slate: "bg-slate-700",
  pink: "bg-pink-500",
};

type TaskBar = {
  id: string;
  title: string;
  startM: number;
  endM: number;
  colorClass: string;
  startDate: string;
  endDate: string;
};

function mapTaskToBar(t: GanttTaskApi, year: number): TaskBar | null {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const s = toDateOnly(t.startDate);
  const e = toDateOnly(t.endDate);

  if (e < yearStart || s > yearEnd) return null;

  const sClamped = s < yearStart ? yearStart : s;
  const eClamped = e > yearEnd ? yearEnd : e;

  const startM = clamp(monthIndex(sClamped), 0, 11);
  const endM = clamp(monthIndex(eClamped), 0, 11);

  return {
    id: t.id,
    title: t.title,
    startM,
    endM,
    colorClass: COLOR_MAP[t.color],
    startDate: t.startDate,
    endDate: t.endDate,
  };
}

export default function ProjectGanttModal({
  open,
  onClose,
  project,
  year,
}: {
  open: boolean;
  onClose: () => void;
  project: GanttProjectWithTasks | null;
  year: number;
}) {
  const taskRows = useMemo(() => {
    if (!project) return [];
    return project.tasks
      .map((t) => mapTaskToBar(t, year))
      .filter((x): x is TaskBar => Boolean(x));
  }, [project, year]);

  if (!open || !project) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close overlay"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 top-10 mx-auto w-[min(1400px,calc(100%-24px))]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {project.tag}
                </span>
                <div className="truncate text-sm font-semibold text-slate-900">
                  {project.projectName}
                </div>
              </div>

              <div className="mt-1 text-xs text-slate-500">
                ช่วงโปรเจกต์: {fmtThaiDate(project.projectStartDate)} –{" "}
                {fmtThaiDate(project.projectEndDate)}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <div className="mb-3 text-sm font-semibold text-slate-900">Sub Tasks</div>

            <GanttMonthHeader leftLabel="Task" />

            <div className="mt-3 border-t border-slate-200" />

            <div className="mt-4 space-y-4">
              {taskRows.length === 0 && (
                <div className="text-sm text-slate-400">ไม่มี sub task ในปีนี้</div>
              )}

              {taskRows.map((t) => {
                const bars: GanttTimelineBar[] = [
                  {
                    id: t.id,
                    title: t.title,
                    startM: t.startM,
                    endM: t.endM,
                    className: t.colorClass,
                    lane: 0,
                  },
                ];

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <GanttRowLayout
                      left={
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {t.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {fmtThaiDate(t.startDate)} – {fmtThaiDate(t.endDate)}
                          </div>
                        </div>
                      }
                      right={
                        <GanttTimeline
                          bars={bars}
                          laneHeight={52}
                          barHeight={40}
                          height={52}
                        />
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-2xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
