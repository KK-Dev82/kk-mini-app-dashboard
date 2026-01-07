// PhaseTasksModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";

import {
  fetchProjectPhaseById,
  type PhaseTaskApi,
  type ProjectPhaseDetailApi,
  type GanttTaskApi,
  type GanttTaskColor,
} from "../../../lib/ganttService";

import { clamp, fmtThaiDate, monthIndex, toDateOnly } from "../../component/ganttchart/ganttUtils";
import GanttMonthHeader from "../../component/ganttchart/GanttMonthHeader";
import GanttTimeline, { type GanttTimelineBar } from "../../component/ganttchart/GanttTimeline";
import GanttRowLayout from "../../component/ganttchart/GanttRowLayout";

const TASK_COLORS: GanttTaskColor[] = ["blue", "green", "orange", "purple", "pink", "red", "slate"];

function isoToYMD(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function phaseTaskToGanttTask(t: PhaseTaskApi): GanttTaskApi | null {
  const s = isoToYMD(t.startDate ?? null);
  const e = isoToYMD(t.dueDate ?? null);
  if (!s || !e) return null;

  const idx = typeof t.orderIndex === "number" ? t.orderIndex : 0;
  return {
    id: t.id,
    title: (t.title ?? t.name ?? "Task").toString(),
    startDate: s,
    endDate: e,
    color: TASK_COLORS[Math.abs(idx) % TASK_COLORS.length],
  };
}

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

  return {
    id: t.id,
    title: t.title,
    startM: clamp(monthIndex(sClamped), 0, 11),
    endM: clamp(monthIndex(eClamped), 0, 11),
    colorClass: COLOR_MAP[t.color],
    startDate: t.startDate,
    endDate: t.endDate,
  };
}

export default function PhaseTasksModal({
  open,
  onBack,
  onCloseAll,
  projectId,
  phaseId,
  phaseTitle,
  year,
}: {
  open: boolean;               // true = สไลด์เข้ามา, false = สไลด์ออก
  onBack: () => void;          // ✅ ลูกศรกลับไปหน้า Phases
  onCloseAll?: () => void;     // (optional) ปิดทั้ง modal ใหญ่
  projectId: string;
  phaseId: string;
  phaseTitle: string;
  year: number;
}) {
  // ---------- slide lifecycle (mount/unmount หลัง animation) ----------
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = window.setTimeout(() => setMounted(false), 220);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // ---------- data ----------
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ProjectPhaseDetailApi | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    const seq = ++reqRef.current;
    setLoading(true);
    setPhase(null);

    fetchProjectPhaseById(projectId, phaseId)
      .then((res) => {
        if (seq !== reqRef.current) return;
        setPhase(res);
      })
      .finally(() => {
        if (seq === reqRef.current) setLoading(false);
      });
  }, [open, projectId, phaseId]);

  const taskRows = useMemo(() => {
    if (!phase?.tasks) return [];
    return phase.tasks
      .map((t) => phaseTaskToGanttTask(t))
      .filter((x): x is GanttTaskApi => Boolean(x))
      .map((t) => mapTaskToBar(t, year))
      .filter((x): x is TaskBar => Boolean(x));
  }, [phase, year]);

  if (!mounted) return null;

  return (
    // ✅ สำคัญ: parent ต้องเป็น relative แล้ว panel นี้จะ absolute ทับได้
    <div
      className={[
        "absolute inset-0 bg-white",
        "transition-transform duration-200 ease-out",
        visible ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      aria-hidden={!open}
    >
      <div className="h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
              aria-label="Back"
            >
              <ChevronLeftIcon className="h-5 w-5 text-slate-700" />
            </button>

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">
                Tasks in: {phaseTitle}
              </div>

              {phase?.startDate && phase?.dueDate && (
                <div className="mt-1 text-xs text-slate-500">
                  ช่วง Phase: {fmtThaiDate(isoToYMD(phase.startDate) ?? "")} –{" "}
                  {fmtThaiDate(isoToYMD(phase.dueDate) ?? "")}
                </div>
              )}
            </div>
          </div>

          {onCloseAll ? (
            <button
              type="button"
              onClick={onCloseAll}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-slate-700" />
            </button>
          ) : (
            <div className="h-10 w-10" />
          )}
        </div>

        {/* Body (scroll) */}
        <div className="h-[calc(100%-64px)] overflow-auto">
          <div className="px-6 py-5">
            <div className="mb-3 text-sm font-semibold text-slate-900">Tasks</div>

            <GanttMonthHeader leftLabel="Task" />
            <div className="mt-3 border-t border-slate-200" />

            <div className="mt-4 space-y-4">
              {loading && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-700">กำลังโหลด tasks</div>
                  <div className="mt-1 text-xs text-slate-500">โปรดรอสักครู่...</div>
                </div>
              )}

              {!loading && taskRows.length === 0 && (
                <div className="text-sm text-slate-400">ไม่มี task ในปีนี้</div>
              )}

              {!loading &&
                taskRows.map((t) => {
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
                    <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <GanttRowLayout
                        left={
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{t.title}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {fmtThaiDate(t.startDate)} – {fmtThaiDate(t.endDate)}
                            </div>
                          </div>
                        }
                        right={<GanttTimeline bars={bars} laneHeight={52} barHeight={40} height={52} />}
                      />
                    </div>
                  );
                })}
            </div>

            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
