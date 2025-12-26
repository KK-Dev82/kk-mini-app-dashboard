// ../../component/ganttchart/ganttUtils.ts
import type { GanttTaskApi } from "../../../lib/ganttService";

export const MONTHS_TH = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

export function toDateOnly(ymd: string) {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function monthIndex(d: Date) {
  return d.getMonth();
}

export function fmtThaiDate(ymd: string) {
  const dt = toDateOnly(ymd);
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dt);
}

export function computeProjectRangeFromTasks(tasks: GanttTaskApi[]) {
  let min: Date | null = null;
  let max: Date | null = null;

  for (const t of tasks) {
    const s = toDateOnly(t.startDate);
    const e = toDateOnly(t.endDate);

    if (!min || s < min) min = s;
    if (!max || e > max) max = e;
  }

  const now = new Date();
  min = min ?? now;
  max = max ?? now;

  const startYMD = `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(min.getDate()).padStart(2, "0")}`;

  const endYMD = `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(max.getDate()).padStart(2, "0")}`;

  return { startYMD, endYMD };
}

export type ProjectBar = {
  startM: number;
  endM: number;
};

export function mapRangeToProjectBar(
  startDate: string,
  endDate: string,
  year: number
): ProjectBar | null {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const s = toDateOnly(startDate);
  const e = toDateOnly(endDate);

  if (e < yearStart || s > yearEnd) return null;

  const sClamped = s < yearStart ? yearStart : s;
  const eClamped = e > yearEnd ? yearEnd : e;

  const startM = clamp(monthIndex(sClamped), 0, 11);
  const endM = clamp(monthIndex(eClamped), 0, 11);

  return { startM, endM };
}
