// home/components/gantt/_internal/SprintTimelineParts.tsx
"use client";

import { useMemo } from "react";
import GanttRowLayout from "../../../../component/ganttchart/GanttRowLayout";
import { addDaysLocal, clampNum } from "./dateUtils";

const LABEL_SHIFT_PX = 6;

// ✅ เดือนตัวแรก (segment แรก) ให้ชิดซ้ายแบบเดิมของคุณ (ตรงกับเลขวัน)
const MONTH_LABEL_START_SHIFT_PX = LABEL_SHIFT_PX + 20;

// ✅ เส้นขึ้นเดือนใหม่: ปรับให้ "ไม่สูงไป" + ลงมาหน่อย + ชัด
const MONTH_DIVIDER_WIDTH_PX = 1;
const MONTH_DIVIDER_HEIGHT_PX = 24;
const MONTH_DIVIDER_BOTTOM_PX = 17;

type MonthSegment = { key: string; label: string; start: number; end: number };

function fmtMonthYearEN(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }); // Jan 2026
}

function fmtDayNum(d: Date) {
  return String(d.getDate());
}

function buildMonthSegments(
  sprintStartDate: Date,
  sprintDays: number
): MonthSegment[] {
  const segs: MonthSegment[] = [];
  if (sprintDays <= 0) return segs;

  let segStart = 0;

  const base = addDaysLocal(sprintStartDate, 0);
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

export function SprintHeaderReal({
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
          {/* Month labels */}
          <div className="relative h-10 mb-1">
            {monthSegments.map((seg) => {
              const leftPct = (seg.start / denom) * 100;
              const widthPct =
                sprintDays <= 1
                  ? 100
                  : ((seg.end - seg.start + 1) / sprintDays) * 100;

              // ✅ เดือนตัวแรก: ใช้แบบเดิมของคุณ (ตรงแล้ว)
              if (seg.start === 0) {
                return (
                  <div
                    key={seg.key}
                    className="absolute top-0 text-xs font-semibold text-slate-500 whitespace-nowrap"
                    style={{
                      left: `calc(${leftPct}% - ${MONTH_LABEL_START_SHIFT_PX}px)`,
                      width: `${widthPct}%`,
                    }}
                  >
                    {seg.label}
                  </div>
                );
              }

              // ✅ เดือนใหม่: แสดง badge วันแบบฝั่งซ้าย
              const monthStartDate = addDaysLocal(sprintStartDate, seg.start);
              const boundaryPct = (seg.start / denom) * 100;

              return (
                <div
                  key={seg.key}
                  className="absolute top-0 flex flex-col items-center whitespace-nowrap"
                  style={{
                    left: `${boundaryPct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="text-xs font-semibold text-slate-500">
                    {fmtMonthYearEN(monthStartDate)}
                  </div>

                  <div className="mt-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-[0_1px_0_rgba(0,0,0,0.04)] leading-none">
                    {fmtDayNum(monthStartDate)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day ticks */}
          <div className="relative h-14">
            <div className="absolute left-0 right-0 bottom-[14px] border-t border-slate-200/80" />

            {/* ✅ Month divider overlay (สีน้ำเงินเข้ม + glow) */}
            <div className="absolute inset-0 pointer-events-none">
              {days.map((d, dayIndex) => {
                const showMonthDivider = dayIndex !== 0 && d.getDate() === 1;
                if (!showMonthDivider) return null;

                const boundaryPct = (dayIndex / denom) * 100;

                return (
                  <div
                    key={`month-divider-${dayIndex}`}
                    className="absolute -translate-x-1/2 rounded-full bg-blue-900 shadow-[0_0_0_1px_rgba(30,58,138,0.35),0_0_10px_rgba(30,58,138,0.35)]"
                    style={{
                      left: `${boundaryPct}%`,
                      bottom: `${MONTH_DIVIDER_BOTTOM_PX}px`,
                      width: `${MONTH_DIVIDER_WIDTH_PX}px`,
                      height: `${MONTH_DIVIDER_HEIGHT_PX}px`,
                    }}
                  />
                );
              })}
            </div>

            <div className="absolute inset-0">
              {days.map((d, dayIndex) => {
                const leftPct = (dayIndex / denom) * 100;

                const isMonthDivider = dayIndex !== 0 && d.getDate() === 1;

                const isMajor = majorSet.has(dayIndex);
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
                    style={{ left: `${leftPct}%`, transform: "translateX(-50%)" }}
                  >
                    {/* ✅ สำคัญ: ถ้าเป็นวันขึ้นเดือนใหม่ ให้ "ไม่วาด tick เดิม" เพื่อกันซ้อนกับเส้นเดือนใหม่ */}
                    {!isMonthDivider && (
                      <div
                        className={`rounded-full ${tickCls}`}
                        style={{ width: `${tickW}px`, height: `${tickH}px` }}
                      />
                    )}

                    {/* ✅ กันซ้อน: major underline ไม่ต้องโชว์ถ้าวันนั้นเป็นเดือนใหม่ (มี badge วันอยู่ข้างบนแล้ว) */}
                    {!isMonthDivider && isMajor && (
                      <div className="mx-auto mt-[3px] h-[2px] w-[10px] rounded-full bg-slate-200/80" />
                    )}

                    {/* ✅ กันซ้อน: กล่องวันของ major ไม่ต้องโชว์ถ้าวันนั้นเป็นเดือนใหม่ (badge วันอยู่ใน month label แล้ว) */}
                    {!isMonthDivider && isMajor && (
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

export type DayBar = {
  id: string;
  title: string;
  startDay: number;
  endDay: number;
  className: string;
};

export function SprintTimeline({
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
