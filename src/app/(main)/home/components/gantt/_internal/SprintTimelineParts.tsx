// home/components/gantt/_internal/SprintTimelineParts.tsx
"use client";

import { useMemo } from "react";
import GanttRowLayout from "../../../../component/ganttchart/GanttRowLayout";
import { addDaysLocal, clampNum } from "./dateUtils";

const LABEL_SHIFT_PX = 6;

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
                    <div className="relative h-6 mb-1">
                        {monthSegments.map((seg) => {
                            const leftPct = (seg.start / denom) * 100;
                            const widthPct =
                                sprintDays <= 1 ? 100 : ((seg.end - seg.start + 1) / sprintDays) * 100;

                            return (
                                <div
                                    key={seg.key}
                                    className="absolute top-0 text-xs font-semibold text-slate-500"
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                >
                                    {seg.label}
                                </div>
                            );
                        })}
                    </div>

                    <div className="relative h-11">
                        <div className="absolute left-0 right-0 bottom-[14px] border-t border-slate-200/80" />

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

                                const showMonthDivider = dayIndex !== 0 && d.getDate() === 1;

                                return (
                                    <div
                                        key={`tick-${dayIndex}`}
                                        className="absolute bottom-[14px]"
                                        style={{ left: `${leftPct}%`, transform: "translateX(-50%)" }}
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
                            style={{ top, left: `${leftPct}%`, width: `${widthPct}%`, height: barHeight }}
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
