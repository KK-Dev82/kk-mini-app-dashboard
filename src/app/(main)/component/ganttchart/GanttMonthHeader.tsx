// ../../component/ganttchart/GanttMonthHeader.tsx
"use client";

import GanttRowLayout from "./GanttRowLayout";
import { MONTHS_TH } from "./ganttUtils";

export default function GanttMonthHeader({
  leftLabel,
  leftWidth,
}: {
  leftLabel: string;
  leftWidth?: number;
}) {
  return (
    <GanttRowLayout
      left={<div className="text-xs font-semibold text-slate-500">{leftLabel}</div>}
      right={
        <div className="grid grid-cols-12">
          {MONTHS_TH.map((m) => (
            <div
              key={m}
              className="text-center text-[11px] font-semibold text-slate-500"
            >
              {m}
            </div>
          ))}
        </div>
      }
      leftWidth={leftWidth}
    />
  );
}
