// PhaseTasksModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import {
  fetchProjectPhaseById,
  type PhaseTaskApi,
  type ProjectPhaseDetailApi,
  type GanttTaskApi,
  type GanttTaskColor,
} from "../../../lib/ganttService";

import { fmtThaiDate, toDateOnly } from "../../component/ganttchart/ganttUtils";
import GanttRowLayout from "../../component/ganttchart/GanttRowLayout";

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

// ✅ ปรับ offset เพื่อให้ “ตัวเลข” ตรงกับเส้นมากขึ้น (ชดเชยกล่อง label)
const LABEL_SHIFT_PX = 6;

// ---------- date helpers ----------
function isoToYMD(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function diffDays(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((da - db) / ms);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
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

// ---------- sprint timeline UI ----------
type DayBar = {
  id: string;
  title: string;
  startDay: number; // 0..sprintDays-1
  endDay: number; // 0..sprintDays-1
  className: string;
};

/**
 * ✅ Sprint Header แบบ “ไม้บรรทัด” (สวยขึ้น)
 * - baseline เนียนขึ้น
 * - ขีดเล็กทุกวัน + ขีดกลางทุก 2 วัน
 * - ขีดใหญ่วัน 1 / 7 / วันสุดท้าย
 * - เลขอยู่ “บนหัวขีดใหญ่” + ชดเชยซ้ายเล็กน้อยให้ตรงเส้น
 */
function SprintHeader({
  leftLabel,
  leftWidth,
  sprintDays,
}: {
  leftLabel: string;
  leftWidth: number;
  sprintDays: number;
}) {
  const denom = Math.max(1, sprintDays - 1);

  const { dayIndexes, majorSet } = useMemo(() => {
    const dayIndexes = Array.from(
      { length: Math.max(0, sprintDays) },
      (_, i) => i
    );

    const majorSet = new Set<number>();
    if (sprintDays > 0) {
      majorSet.add(0); // day 1
      if (sprintDays >= 7) majorSet.add(6); // day 7 (index 6)
      majorSet.add(sprintDays - 1); // last day
    }

    return { dayIndexes, majorSet };
  }, [sprintDays]);

  const labels = useMemo(() => {
    const items: { dayIndex: number; text: string }[] = [];
    if (sprintDays >= 1) items.push({ dayIndex: 0, text: "1" });
    if (sprintDays >= 7) items.push({ dayIndex: 6, text: "7" });
    if (sprintDays >= 2)
      items.push({ dayIndex: sprintDays - 1, text: String(sprintDays) });

    const m = new Map<number, string>();
    items.forEach((x) => m.set(x.dayIndex, x.text));
    return Array.from(m.entries())
      .map(([dayIndex, text]) => ({ dayIndex, text }))
      .sort((a, b) => a.dayIndex - b.dayIndex);
  }, [sprintDays]);

  return (
    <GanttRowLayout
      left={
        <div className="text-xs font-semibold text-slate-500">{leftLabel}</div>
      }
      right={
        <div className="relative h-11">
          {/* baseline */}
          <div className="absolute left-0 right-0 bottom-[14px] border-t border-slate-200/80" />

          {/* ticks */}
          <div className="absolute inset-0">
            {dayIndexes.map((dayIndex) => {
              const leftPct = (dayIndex / denom) * 100;
              const isMajor = majorSet.has(dayIndex);

              // minor/medium/major like a real ruler
              const isMedium = !isMajor && dayIndex % 2 === 0;
              const tickH = isMajor ? 22 : isMedium ? 14 : 9;
              const tickW = isMajor ? 2 : 1;

              const tickCls = isMajor
                ? "bg-slate-700/90"
                : isMedium
                ? "bg-slate-400/90"
                : "bg-slate-300/90";

              return (
                <div
                  key={`tick-${dayIndex}`}
                  className="absolute bottom-[14px]"
                  style={{
                    left: `${leftPct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    className={`rounded-full ${tickCls}`}
                    style={{ width: `${tickW}px`, height: `${tickH}px` }}
                  />
                  {isMajor && (
                    <div className="mx-auto mt-[3px] h-[2px] w-[10px] rounded-full bg-slate-200/80" />
                  )}
                </div>
              );
            })}
          </div>

          {/* labels */}
          <div className="absolute inset-0">
            {labels.map((l) => {
              const leftPct = (l.dayIndex / denom) * 100;

              return (
                <div
                  key={`label-${l.dayIndex}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${leftPct}%`,
                    // ✅ ชดเชยไปทางซ้ายอีกนิดให้เลข “ตรงเส้น” (ปรับ LABEL_SHIFT_PX ได้)
                    transform: `translateX(calc(-50% - ${LABEL_SHIFT_PX}px))`,
                    bottom: "38px",
                  }}
                >
                  <div className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-[0_1px_0_rgba(0,0,0,0.04)] leading-none whitespace-nowrap">
                    {l.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }
      leftWidth={leftWidth}
    />
  );
}

function SprintTimeline({
  bars,
  sprintDays,
  height = 52,
  barHeight = 40,
}: {
  bars: DayBar[];
  sprintDays: number;
  height?: number;
  barHeight?: number;
}) {
  return (
    <div className="relative w-full" style={{ height }}>
      <div className="absolute inset-0">
        {bars.map((b) => {
          const start = clampNum(b.startDay, 0, Math.max(0, sprintDays - 1));
          const end = clampNum(b.endDay, 0, Math.max(0, sprintDays - 1));
          const safeEnd = Math.max(start, end);

          const leftPct = sprintDays <= 1 ? 0 : (start / sprintDays) * 100;
          const widthPct =
            sprintDays <= 1 ? 100 : ((safeEnd - start + 1) / sprintDays) * 100;

          const top = (height - barHeight) / 2;

          return (
            <div
              key={b.id}
              className={[
                "absolute rounded-lg px-4 flex items-center text-[11px] font-medium text-white shadow-sm hover:brightness-110 transition-all",
                b.className,
              ].join(" ")}
              style={{
                top,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: barHeight,
              }}
              title={b.title}
              role="img"
              aria-label={b.title}
            >
              <span className="truncate">{b.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
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

  const [sprintIndex, setSprintIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSprintIndex(0);
  }, [open, phaseId]);

  useEffect(() => {
    if (sprintCount <= 0) return;
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
      startYMD: isoToYMD(startDate.toISOString())!,
      endYMD: isoToYMD(endDate.toISOString())!,
    };
  }, [phaseRange, sprintIndex, sprintCount]);

  const taskRows = useMemo(() => {
    if (!phase?.tasks || !phaseRange || !sprintRange) return [];

    return phase.tasks
      .map((t) => phaseTaskToGanttTask(t))
      .filter((x): x is GanttTaskApi => Boolean(x))
      .map((t) => {
        const s = toDateOnly(t.startDate);
        const e = toDateOnly(t.endDate);

        const taskStart = clampNum(
          diffDays(s, phaseRange.start),
          0,
          phaseRange.totalDays - 1
        );
        const taskEnd = clampNum(
          diffDays(e, phaseRange.start),
          0,
          phaseRange.totalDays - 1
        );

        const ovStart = Math.max(taskStart, sprintRange.startDay);
        const ovEnd = Math.min(taskEnd, sprintRange.endDay);
        if (ovEnd < ovStart) return null;

        const idx = phase.tasks.findIndex((pt) => pt.id === t.id);
        const color = TASK_COLORS[Math.abs(idx) % TASK_COLORS.length];

        return {
          key: `${t.id}-s${sprintRange.sprintIndex}`,
          id: t.id,
          title: t.title,
          startDate: t.startDate,
          endDate: t.endDate,
          startDay: ovStart - sprintRange.startDay,
          endDay: ovEnd - sprintRange.startDay,
          cutLeft: taskStart < sprintRange.startDay,
          cutRight: taskEnd > sprintRange.endDay,
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

          {/* ไม่แสดง X ซ้ำ */}
          <div className="h-10 w-10" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-5">
            <div className="mb-3 text-sm font-semibold text-slate-900">Tasks</div>

            {phaseRange && sprintRange ? (
              <SprintHeader
                leftLabel="Task"
                leftWidth={TASK_LEFT_WIDTH}
                sprintDays={sprintRange.sprintDays}
              />
            ) : (
              <div className="text-xs text-slate-500">ยังไม่กำหนดช่วง Phase</div>
            )}

            <div className="mt-3 border-t border-slate-200" />

            <div className="mt-4 space-y-4">
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
                              {(t.cutLeft || t.cutRight) && (
                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                  ต่อเนื่อง
                                </span>
                              )}
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

            <div className="h-6" />
          </div>
        </div>

        {/* Footer: เปลี่ยน Sprint อยู่ล่าง */}
        {phaseRange && sprintRange && (
          <div className="border-t border-slate-100 bg-white px-6 py-4">
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
                onClick={() => setSprintIndex((i) => Math.min(sprintCount - 1, i + 1))}
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
