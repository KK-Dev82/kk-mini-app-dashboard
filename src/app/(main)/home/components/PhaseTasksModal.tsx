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

// ✅ ปรับเฉพาะหน้า PhaseTasksModal ให้ชิดซ้ายขึ้น
const TASK_LEFT_WIDTH = 240;

// ---------- date helpers (day-scale, local only) ----------
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
  // a - b in days (date-only)
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

// ---------- day timeline UI (local) ----------
type DayBar = {
  id: string;
  title: string;
  startDay: number; // 0..totalDays-1
  endDay: number; // 0..totalDays-1
  className: string;
};

function DayHeader({
  leftLabel,
  leftWidth,
  phaseStart,
  totalDays,
}: {
  leftLabel: string;
  leftWidth: number;
  phaseStart: Date;
  totalDays: number;
}) {
  // ✅ แสดง tick ทุก 7 วัน (1,8,15,...) เป็น “เลขวัน” เท่านั้น (ไม่เอาเดือน/ปี)
  const ticks = useMemo(() => {
    if (totalDays <= 0) return [];
    const step = 7;

    const arr: { day: number; label: string }[] = [];
    for (let d = 0; d < totalDays; d += step) {
      const date = addDays(phaseStart, d);
      arr.push({ day: d, label: String(date.getDate()) }); // ✅ แค่เลขวัน
    }

    // ใส่ปลายทางด้วยถ้ายังไม่มี
    if (totalDays > 1) {
      const last = totalDays - 1;
      const lastDate = addDays(phaseStart, last);
      const lastLabel = String(lastDate.getDate()); // ✅ แค่เลขวัน
      const hasLast = arr.some((x) => x.day === last);
      if (!hasLast) arr.push({ day: last, label: lastLabel });
    }

    return arr;
  }, [phaseStart, totalDays]);

  return (
    <GanttRowLayout
      left={<div className="text-xs font-semibold text-slate-500">{leftLabel}</div>}
      right={
        <div className="relative h-7">
          {/* เส้นแบ่ง (ทุก 7 วัน) */}
          <div className="absolute inset-0">
            {ticks.map((t) => {
              const leftPct = totalDays <= 1 ? 0 : (t.day / totalDays) * 100;
              return (
                <div
                  key={`line-${t.day}`}
                  className="absolute top-0 bottom-0 border-l border-slate-200/70"
                  style={{ left: `${leftPct}%` }}
                />
              );
            })}
          </div>

          {/* label (เลขวัน) */}
          <div className="absolute inset-0">
            {ticks.map((t) => {
              const leftPct = totalDays <= 1 ? 0 : (t.day / totalDays) * 100;
              return (
                <div
                  key={`label-${t.day}`}
                  className="absolute -top-0.5 text-[11px] font-semibold text-slate-500"
                  style={{ left: `${leftPct}%`, transform: "translateX(-10%)" }}
                >
                  {t.label}
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

function DayTimeline({
  bars,
  totalDays,
  height = 52,
  barHeight = 40,
  showWeekSeparators = true,
}: {
  bars: DayBar[];
  totalDays: number;
  height?: number;
  barHeight?: number;
  showWeekSeparators?: boolean;
}) {
  const ticks = useMemo(() => {
    if (!showWeekSeparators || totalDays <= 0) return [];
    const step = 7;
    const arr: number[] = [];
    for (let d = 0; d < totalDays; d += step) arr.push(d);
    return arr;
  }, [showWeekSeparators, totalDays]);

  return (
    <div className="relative w-full" style={{ height }}>
      {/* week separators */}
      {showWeekSeparators && (
        <div className="absolute inset-0">
          {ticks.map((d) => {
            const leftPct = totalDays <= 1 ? 0 : (d / totalDays) * 100;
            return (
              <div
                key={d}
                className="absolute top-0 bottom-0 border-l border-slate-200/70"
                style={{ left: `${leftPct}%` }}
              />
            );
          })}
        </div>
      )}

      {/* bars */}
      <div className="absolute inset-0">
        {bars.map((b) => {
          const start = clampNum(b.startDay, 0, Math.max(0, totalDays - 1));
          const end = clampNum(b.endDay, 0, Math.max(0, totalDays - 1));
          const safeEnd = Math.max(start, end);

          const leftPct = totalDays <= 1 ? 0 : (start / totalDays) * 100;
          const widthPct =
            totalDays <= 1 ? 100 : ((safeEnd - start + 1) / totalDays) * 100;

          const top = (height - barHeight) / 2;

          const shared =
            "absolute rounded-lg px-4 flex items-center text-[11px] font-medium text-white shadow-sm hover:brightness-110 transition-all";

          return (
            <div
              key={b.id}
              className={[shared, b.className].join(" ")}
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
  onCloseAll,
  projectId,
  phaseId,
  phaseTitle,
  year, // (ยังรับไว้ได้ แต่หน้านี้ไม่ใช้แล้ว)
}: {
  open: boolean; // true = สไลด์เข้ามา, false = สไลด์ออก
  onBack: () => void; // ✅ ลูกศรกลับไปหน้า Phases
  onCloseAll?: () => void; // (optional) ปิดทั้ง modal ใหญ่
  projectId: string;
  phaseId: string;
  phaseTitle: string;
  year: number;
}) {
  // ---------- slide lifecycle ----------
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

  // ✅ phase range -> day scale
  const phaseRange = useMemo(() => {
    const sYMD = isoToYMD(phase?.startDate ?? null);
    const eYMD = isoToYMD(phase?.dueDate ?? null);
    if (!sYMD || !eYMD) return null;

    const s = toDateOnly(sYMD);
    const e = toDateOnly(eYMD);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

    const totalDays = diffDays(e, s) + 1; // inclusive
    if (totalDays <= 0) return null;

    return { start: s, end: e, totalDays, startYMD: sYMD, endYMD: eYMD };
  }, [phase]);

  // ✅ map tasks -> day offsets (clamp inside phase)
  const taskRows = useMemo(() => {
    if (!phase?.tasks || !phaseRange) return [];

    return phase.tasks
      .map((t) => phaseTaskToGanttTask(t))
      .filter((x): x is GanttTaskApi => Boolean(x))
      .map((t) => {
        const s = toDateOnly(t.startDate);
        const e = toDateOnly(t.endDate);

        const startDay = clampNum(
          diffDays(s, phaseRange.start),
          0,
          phaseRange.totalDays - 1
        );
        const endDay = clampNum(
          diffDays(e, phaseRange.start),
          0,
          phaseRange.totalDays - 1
        );

        return {
          id: t.id,
          title: t.title,
          startDate: t.startDate,
          endDate: t.endDate,
          startDay,
          endDay,
          colorClass: COLOR_MAP[t.color],
        };
      });
  }, [phase, phaseRange]);

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

              {phaseRange && (
                <div className="mt-1 text-xs text-slate-500">
                  ช่วง Phase: {fmtThaiDate(phaseRange.startYMD)} –{" "}
                  {fmtThaiDate(phaseRange.endYMD)}{" "}
                  <span className="ml-1 text-slate-400">
                    ({phaseRange.totalDays} วัน)
                  </span>
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

        {/* Body */}
        <div className="h-[calc(100%-64px)] overflow-auto">
          <div className="px-6 py-5">
            <div className="mb-3 text-sm font-semibold text-slate-900">
              Tasks
            </div>

            {/* ✅ Day header (อิงช่วง Phase) + แสดง “เลขวัน” เท่านั้น */}
            {phaseRange ? (
              <DayHeader
                leftLabel="Task"
                leftWidth={TASK_LEFT_WIDTH}
                phaseStart={phaseRange.start}
                totalDays={phaseRange.totalDays}
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
                  <div className="mt-1 text-xs text-slate-500">
                    โปรดรอสักครู่...
                  </div>
                </div>
              )}

              {!loading && (!phaseRange || taskRows.length === 0) && (
                <div className="text-sm text-slate-400">
                  ไม่มี task หรือยังไม่มีช่วง Phase
                </div>
              )}

              {!loading &&
                phaseRange &&
                taskRows.map((t) => {
                  const bars: DayBar[] = [
                    {
                      id: t.id,
                      title: t.title,
                      startDay: t.startDay,
                      endDay: t.endDay,
                      className: t.colorClass,
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
                          <DayTimeline
                            bars={bars}
                            totalDays={phaseRange.totalDays}
                            height={52}
                            barHeight={40}
                            showWeekSeparators
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
      </div>
    </div>
  );
}
