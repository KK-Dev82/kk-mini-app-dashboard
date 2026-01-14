// home/components/gantt/_internal/projectGanttMap.ts

import type { GanttTaskApi, GanttTaskColor } from "../../../../../lib/ganttService";
import { clamp, monthIndex, toDateOnly } from "../../../../component/ganttchart/ganttUtils";

export const COLOR_MAP: Record<GanttTaskColor, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  red: "bg-rose-500",
  orange: "bg-amber-500",
  purple: "bg-fuchsia-500",
  slate: "bg-slate-700",
  pink: "bg-pink-500",
};

export type TaskBar = {
  id: string;
  title: string;
  startM: number;
  endM: number;
  colorClass: string;
  startDate: string;
  endDate: string;
};

export function mapTaskToBar(t: GanttTaskApi, year: number): TaskBar | null {
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
