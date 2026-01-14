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
  x.setDate(x.getDate() + days); // ✅ ข้ามเดือน/ปีให้เอง (ไม่บั๊ก 28/29/30/31)
  return x;
}

function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDaysLocal(d: Date, days: number) {
  const x = startOfDayLocal(d);
  x.setDate(x.getDate() + days);
  return x;
}

function fmtMonthYearEN(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }); // Jan 2026
}

function fmtDayNum(d: Date) {
  return String(d.getDate()); // 27, 28, 1...
}

// ✅ FIX: startDate อาจเป็น null → fallback ใช้ dueDate (ให้เป็นงาน 1 วันก็ยังดี)
function phaseTaskToGanttTask(t: PhaseTaskApi): GanttTaskApi | null {
  const s = isoToYMD((t.startDate ?? t.dueDate) ?? null);
  const e = isoToYMD((t.dueDate ?? t.startDate) ?? null);
  if (!s || !e) return null;

  // กันกรณีสลับวัน
  const sd = toDateOnly(s);
  const ed = toDateOnly(e);
  const startDate = sd <= ed ? s : e;
  const endDate = sd <= ed ? e : s;

  const idx = typeof t.orderIndex === "number" ? t.orderIndex : 0;

  return {
    id: t.id,
    title: (t.title ?? t.name ?? "Task").toString(),
    startDate,
    endDate,
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

type MonthSegment = { key: string; label: string; start: number; end: number };

function buildMonthSegments(sprintStartDate: Date, sprintDays: number): MonthSegment[] {
  const segs: MonthSegment[] = [];
  if (sprintDays <= 0) return segs;

  let segStart = 0;
  let base = addDaysLocal(sprintStartDate, 0);
  let curMonth = base.getMonth();
  let curYear = base.getFullYear();

  for (let i = 0; i < sprintDays; i++) {
    const d = addDaysLocal(sprintStartDate, i);
    const m = d.getMonth();
    const y = d.getFullYear();

    if (m !== curMonth || y !== curYear) {
      const prevEnd = i - 1;
      const labelDate = addDaysLocal(sprintStartDate, segStart);
      segs.push({
        key: `${curYear}-${curMonth}-${segStart}`,
        label: fmtMonthYearEN(labelDate),
        start: segStart,
        end: prevEnd,
      });

      segStart = i;
      curMonth = m;
      curYear = y;
    }
  }

  const labelDate = addDaysLocal(sprintStartDate, segStart);
  segs.push({
    key: `${curYear}-${curMonth}-${segStart}`,
    label: fmtMonthYearEN(labelDate),
    start: segStart,
    end: sprintDays - 1,
  });

  return segs;
}

/**
 * ✅ Sprint Header แบบ “วันจริง”
 * - แถวบน: เดือน (แบ่ง segment อัตโนมัติ)
 * - แถวล่าง: ไม้บรรทัด + label เป็นเลขวันจริง
 */
function SprintHeaderReal({
  leftLabel,
  leftWidth,
  sprintStartDate,
  sprintDays,
}: {
  leftLabel: string;
  leftWidth: number;
  sprintStartDate: Date;
  sprintDays: number;
}) {
  const denom = Math.max(1, sprintDays - 1);

  const days = useMemo(() => {
    return Array.from({ length: Math.max(0, sprintDays) }, (_, i) =>
      addDaysLocal(sprintStartDate, i)
    );
  }, [sprintStartDate, sprintDays]);

  const monthSegments = useMemo(() => {
    return buildMonthSegments(sprintStartDate, sprintDays);
  }, [sprintStartDate, sprintDays]);

  // major ticks: วันแรก, วันกลาง(วันที่ 7), วันสุดท้าย (ถ้ามี)
  const majorSet = useMemo(() => {
    const s = new Set<number>();
    if (sprintDays > 0) s.add(0);
    if (sprintDays >= 7) s.add(6);
    if (sprintDays > 1) s.add(sprintDays - 1);
    return s;
  }, [sprintDays]);

  return (
    <GanttRowLayout
      left={<div className="text-xs font-semibold text-slate-500">{leftLabel}</div>}
      right={
        <div className="relative">
          {/* Month row */}
          <div className="relative h-6 mb-1">
            {monthSegments.map((seg) => {
              const leftPct = (seg.start / denom) * 100;
              const widthPct =
                sprintDays <= 1 ? 100 : ((seg.end - seg.start + 1) / sprintDays) * 100;

              return (
                <div
                  key={seg.key}
                  className="absolute top-0 text-xs font-semibold text-slate-500"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                >
                  {seg.label}
                </div>
              );
            })}
          </div>

          {/* Ruler row */}
          <div className="relative h-11">
            <div className="absolute left-0 right-0 bottom-[14px] border-t border-slate-200/80" />

            {/* ticks + month separators */}
            <div className="absolute inset-0">
              {days.map((d, dayIndex) => {
                const leftPct = (dayIndex / denom) * 100;
                const isMajor = majorSet.has(dayIndex);
                const isMedium = !isMajor && dayIndex % 2 === 0;

                const tickH = isMajor ? 22 : isMedium ? 14 : 9;
                const tickW = isMajor ? 2 : 1;

                const tickCls = isMajor
                  ? "bg-slate-700/90"
                  : isMedium
                    ? "bg-slate-400/90"
                    : "bg-slate-300/90";

                // เส้นแบ่งเดือน: ถ้าวันนี้เป็นวันที่ 1 และไม่ใช่วันแรกของ sprint
                const showMonthDivider = dayIndex !== 0 && d.getDate() === 1;

                return (
                  <div
                    key={`tick-${dayIndex}`}
                    className="absolute bottom-[14px]"
                    style={{
                      left: `${leftPct}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {showMonthDivider && (
                      <div className="absolute -bottom-[14px] left-1/2 h-[32px] w-[1px] -translate-x-1/2 bg-slate-200" />
                    )}

                    <div
                      className={`rounded-full ${tickCls}`}
                      style={{ width: `${tickW}px`, height: `${tickH}px` }}
                    />

                    {isMajor && (
                      <div className="mx-auto mt-[3px] h-[2px] w-[10px] rounded-full bg-slate-200/80" />
                    )}

                    {/* labels: โชว์เลข “วันจริง” เฉพาะ major */}
                    {isMajor && (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: "50%",
                          transform: `translateX(calc(-50% - ${LABEL_SHIFT_PX}px))`,
                          bottom: "38px",
                        }}
                      >
                        <div className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-[0_1px_0_rgba(0,0,0,0.04)] leading-none whitespace-nowrap">
                          {fmtDayNum(d)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

  // ✅ backend คำนวณ tasks ตาม sprint ให้แล้ว → เปลี่ยน sprintIndex แล้ว refetch
  const [sprintIndex, setSprintIndex] = useState(0);

  const TASKS_LIMIT_PER_SPRINT = 50;

  useEffect(() => {
    if (!open) return;
    if (!projectId || !phaseId) return;

    const seq = ++reqRef.current;
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
    const endDay = Math.min(
      phaseRange.totalDays - 1,
      startDay + SPRINT_DAYS - 1
    );

    const startDate = addDays(phaseRange.start, startDay);
    const endDate = addDays(phaseRange.start, endDay);

    const sprintDays = endDay - startDay + 1;

    return {
      sprintIndex,
      sprintCount,
      startDay,
      endDay,
      sprintDays,
      startDate, // ✅ เก็บ Date จริงไว้ใช้ทำหัวไม้บรรทัด
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
        const gt = phaseTaskToGanttTask(raw);
        if (!gt) return null;

        const s = toDateOnly(gt.startDate);
        const e = toDateOnly(gt.endDate);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

        const startDay = diffDays(s, sprintStartDate);
        const endDay = diffDays(e, sprintStartDate);

        const clampedStart = clampNum(startDay, 0, sprintRange.sprintDays - 1);
        const clampedEnd = clampNum(endDay, 0, sprintRange.sprintDays - 1);

        const order = typeof raw.orderIndex === "number" ? raw.orderIndex : idx;
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

        {/* Top Bar (Title + Sprint Ruler) คงที่ */}
        <div className="shrink-0 bg-white px-6 pt-5">
          <div className="mb-3 text-sm font-semibold text-slate-900">Tasks</div>

          {phaseRange && sprintRange ? (
            <SprintHeaderReal
              leftLabel="Task"
              leftWidth={TASK_LEFT_WIDTH}
              sprintStartDate={startOfDayLocal(sprintRange.startDate)} // ✅ วันจริงเริ่มของ sprint
              sprintDays={sprintRange.sprintDays}
            />
          ) : (
            <div className="text-xs text-slate-500">ยังไม่กำหนดช่วง Phase</div>
          )}

          <div className="mt-3 border-t border-slate-200" />
        </div>

        {/* Scroll เฉพาะรายการ Task */}
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

        {/* Footer: เปลี่ยน Sprint อยู่ล่าง (คงที่) */}
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
