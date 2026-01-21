// home/components/gantt/PhaseTasksModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import {
  fetchProjectPhaseById,
  type PhaseTaskApi,
  type ProjectPhaseDetailApi,
  type GanttTaskApi,
  type GanttTaskColor,
} from "../../../../lib/ganttService";

import { fmtThaiDate, toDateOnly } from "../../../component/ganttchart/ganttUtils";
import GanttRowLayout from "../../../component/ganttchart/GanttRowLayout";

// internal helpers/components
import {
  isoToYMD,
  clampNum,
  diffDays,
  addDays,
  startOfDayLocal,
} from "./_internal/dateUtils";
import {
  SprintHeaderReal,
  SprintTimeline,
  type DayBar,
} from "./_internal/SprintTimelineParts";

const TASK_COLORS: GanttTaskColor[] = [
  "blue",
  "green",
  "orange",
  "purple",
  "pink",
  "red",
  "slate",
];

const COLOR_MAP: Record<GanttTaskColor, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  red: "bg-rose-500",
  orange: "bg-amber-500",
  purple: "bg-fuchsia-500",
  slate: "bg-slate-700",
  pink: "bg-pink-500",
};

const TASK_LEFT_WIDTH = 240;
const SPRINT_DAYS = 14;

function phaseTaskToGanttTask(t: PhaseTaskApi): GanttTaskApi | null {
  const s = isoToYMD((t.startDate ?? t.dueDate) ?? null);
  const e = isoToYMD((t.dueDate ?? t.startDate) ?? null);
  if (!s || !e) return null;

  // กันกรณีสลับวัน
  const sd = toDateOnly(s);
  const ed = toDateOnly(e);
  const startDate = sd <= ed ? s : e;
  const endDate = sd <= ed ? e : s;

  // orderIndex อาจไม่มีในบาง response (กัน TS + กัน runtime)
  const orderIndex = (t as { orderIndex?: unknown }).orderIndex;
  const idx = typeof orderIndex === "number" ? orderIndex : 0;

  return {
    id: t.id,
    title: (t.title ?? (t as any).name ?? "Task").toString(),
    startDate,
    endDate,
    color: TASK_COLORS[Math.abs(idx) % TASK_COLORS.length],
  };
}

export default function PhaseTasksModal({
  open,
  onBack,
  onCloseAll, // ไม่โชว์ปุ่ม X ในหน้านี้
  projectId,
  phaseId,
  phaseTitle,
  year, // ไม่ใช้
}: {
  open: boolean;
  onBack: () => void;
  onCloseAll?: () => void;
  projectId: string;
  phaseId: string;
  phaseTitle: string;
  year: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // ✅ แก้ warning: setState ใน effect ให้ย้ายไป microtask/raf
  useEffect(() => {
    // ปิด
    if (!open) {
      queueMicrotask(() => setVisible(false));

      const t = window.setTimeout(() => {
        queueMicrotask(() => setMounted(false));
      }, 220);

      return () => window.clearTimeout(t);
    }

    // เปิด
    queueMicrotask(() => setMounted(true));
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ProjectPhaseDetailApi | null>(null);
  const reqRef = useRef(0);

  // backend คำนวณ tasks ตาม sprint ให้แล้ว → เปลี่ยน sprintIndex แล้ว refetch
  const [sprintIndex, setSprintIndex] = useState(0);
  const TASKS_LIMIT_PER_SPRINT = 50;

  // ✅ reset sprint เมื่อเปิดหรือ phase เปลี่ยน (ย้าย setState ไป microtask)
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setSprintIndex(0));
  }, [open, phaseId]);

  // ✅ โหลด phase + tasks (แก้ warning โดยย้าย setState ไป microtask)
  useEffect(() => {
    if (!open) return;
    if (!projectId || !phaseId) return;

    const seq = ++reqRef.current;

    queueMicrotask(() => {
      setLoading(true);
      setPhase(null);

      fetchProjectPhaseById(
        projectId,
        phaseId,
        sprintIndex + 1, // swagger: sprint เริ่มที่ 1
        TASKS_LIMIT_PER_SPRINT
      )
        .then((res) => {
          if (seq !== reqRef.current) return;
          setPhase(res);
        })
        .finally(() => {
          if (seq === reqRef.current) setLoading(false);
        });
    });
  }, [open, projectId, phaseId, sprintIndex]);

  const phaseRange = useMemo(() => {
    const sYMD = isoToYMD(phase?.startDate ?? null);
    const eYMD = isoToYMD(phase?.dueDate ?? null);
    if (!sYMD || !eYMD) return null;

    const s = toDateOnly(sYMD);
    const e = toDateOnly(eYMD);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

    const totalDays = diffDays(e, s) + 1;
    if (totalDays <= 0) return null;

    return { start: s, end: e, totalDays, startYMD: sYMD, endYMD: eYMD };
  }, [phase]);

  const sprintCount = useMemo(() => {
    if (!phaseRange) return 0;
    return Math.max(1, Math.ceil(phaseRange.totalDays / SPRINT_DAYS));
  }, [phaseRange]);

  // clamp sprintIndex เมื่อ sprintCount เปลี่ยน (อันนี้เป็น setState ใน effect แต่เป็น functional update + กัน loop)
  useEffect(() => {
    if (sprintCount <= 0) return;
    // ใช้ functional update เพื่อกัน cascading
    setSprintIndex((i) => clampNum(i, 0, sprintCount - 1));
  }, [sprintCount]);

  const sprintRange = useMemo(() => {
    if (!phaseRange) return null;

    const startDay = sprintIndex * SPRINT_DAYS;
    const endDay = Math.min(phaseRange.totalDays - 1, startDay + SPRINT_DAYS - 1);

    const startDate = addDays(phaseRange.start, startDay);
    const endDate = addDays(phaseRange.start, endDay);

    const sprintDays = endDay - startDay + 1;

    return {
      sprintIndex,
      sprintCount,
      startDay,
      endDay,
      sprintDays,
      startDate, // Date จริงไว้ใช้ทำหัวไม้บรรทัด
      startYMD: isoToYMD(startDate.toISOString())!,
      endYMD: isoToYMD(endDate.toISOString())!,
    };
  }, [phaseRange, sprintIndex, sprintCount]);

  const taskRows = useMemo(() => {
    if (!phase?.tasks || !phaseRange || !sprintRange) return [];

    const sprintStartDate = addDays(phaseRange.start, sprintRange.startDay);

    return phase.tasks
      .map((t, i) => ({ raw: t, idx: i }))
      .map(({ raw, idx }) => {
        const gt = phaseTaskToGanttTask(raw as any);
        if (!gt) return null;

        const s = toDateOnly(gt.startDate);
        const e = toDateOnly(gt.endDate);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

        const startDay = diffDays(s, sprintStartDate);
        const endDay = diffDays(e, sprintStartDate);

        const clampedStart = clampNum(startDay, 0, sprintRange.sprintDays - 1);
        const clampedEnd = clampNum(endDay, 0, sprintRange.sprintDays - 1);

        // ✅ แก้ TS: orderIndex อาจไม่มีบน type
        const rawOrderIndex = (raw as { orderIndex?: unknown }).orderIndex;
        const order = typeof rawOrderIndex === "number" ? rawOrderIndex : idx;

        const color = TASK_COLORS[Math.abs(order) % TASK_COLORS.length];

        return {
          key: `${gt.id}-s${sprintRange.sprintIndex}`,
          id: gt.id,
          title: gt.title,
          startDate: gt.startDate,
          endDate: gt.endDate,
          startDay: clampedStart,
          endDay: Math.max(clampedStart, clampedEnd),
          colorClass: COLOR_MAP[color],
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [phase, phaseRange, sprintRange]);

  const canPrev = sprintRange ? sprintRange.sprintIndex > 0 : false;
  const canNext = sprintRange
    ? sprintRange.sprintIndex < sprintRange.sprintCount - 1
    : false;

  if (!mounted) return null;

  return (
    <div
      className={[
        "absolute inset-0 bg-white",
        "transition-transform duration-200 ease-out",
        visible ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      aria-hidden={!open}
    >
      <div className="h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
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

              {phaseRange && sprintRange && (
                <div className="mt-1 text-xs text-slate-500">
                  ช่วง Phase: {fmtThaiDate(phaseRange.startYMD)} –{" "}
                  {fmtThaiDate(phaseRange.endYMD)}
                  <span className="ml-2 text-slate-400">
                    ({phaseRange.totalDays} วัน)
                  </span>

                  <div className="mt-1 text-slate-600">
                    <span className="font-semibold">
                      Sprint {sprintRange.sprintIndex + 1}/{sprintRange.sprintCount}
                    </span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span>
                      {fmtThaiDate(sprintRange.startYMD)} –{" "}
                      {fmtThaiDate(sprintRange.endYMD)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-10 w-10" />
        </div>

        {/* Top Bar */}
        <div className="shrink-0 bg-white px-6 pt-5">
          <div className="mb-3 text-sm font-semibold text-slate-900">Tasks</div>

          {phaseRange && sprintRange ? (
            <SprintHeaderReal
              leftLabel="Task"
              leftWidth={TASK_LEFT_WIDTH}
              sprintStartDate={startOfDayLocal(sprintRange.startDate)}
              sprintDays={sprintRange.sprintDays}
            />
          ) : (
            <div className="text-xs text-slate-500">ยังไม่กำหนดช่วง Phase</div>
          )}

          <div className="mt-3 border-t border-slate-200" />
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="space-y-4">
            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-700">
                  กำลังโหลด tasks
                </div>
                <div className="mt-1 text-xs text-slate-500">โปรดรอสักครู่...</div>
              </div>
            )}

            {!loading && (!phaseRange || !sprintRange) && (
              <div className="text-sm text-slate-400">ยังไม่มีช่วง Phase</div>
            )}

            {!loading && phaseRange && sprintRange && taskRows.length === 0 && (
              <div className="text-sm text-slate-400">Sprint นี้ไม่มี Task</div>
            )}

            {!loading &&
              phaseRange &&
              sprintRange &&
              taskRows.map((t) => {
                const bars: DayBar[] = [
                  {
                    id: t.key,
                    title: t.title,
                    startDay: t.startDay,
                    endDay: t.endDay,
                    className: t.colorClass,
                  },
                ];

                return (
                  <div
                    key={t.key}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <GanttRowLayout
                      left={
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {t.title}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {fmtThaiDate(t.startDate)} – {fmtThaiDate(t.endDate)}
                          </div>
                        </div>
                      }
                      right={
                        <SprintTimeline
                          bars={bars}
                          sprintDays={sprintRange.sprintDays}
                          height={52}
                          barHeight={40}
                        />
                      }
                      leftWidth={TASK_LEFT_WIDTH}
                    />
                  </div>
                );
              })}
          </div>

          <div className="h-4" />
        </div>

        {/* Footer */}
        {phaseRange && sprintRange && (
          <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSprintIndex((i) => Math.max(0, i - 1))}
                disabled={!canPrev}
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-white",
                  canPrev
                    ? "border-slate-200 hover:bg-slate-50"
                    : "border-slate-100 opacity-40",
                ].join(" ")}
                aria-label="Previous sprint"
                title="Previous sprint"
              >
                <ChevronLeftIcon className="h-5 w-5 text-slate-700" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setSprintIndex((i) => Math.min(sprintCount - 1, i + 1))
                }
                disabled={!canNext}
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-white",
                  canNext
                    ? "border-slate-200 hover:bg-slate-50"
                    : "border-slate-100 opacity-40",
                ].join(" ")}
                aria-label="Next sprint"
                title="Next sprint"
              >
                <ChevronRightIcon className="h-5 w-5 text-slate-700" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}