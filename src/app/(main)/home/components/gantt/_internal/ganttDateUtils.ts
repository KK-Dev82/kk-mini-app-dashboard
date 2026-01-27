// home/components/gantt/_internal/dateUtils.ts

export function isoToYMD(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function diffDays(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((da - db) / ms);
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days); // ข้ามเดือน/ปีให้เอง
  return x;
}

export function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDaysLocal(d: Date, days: number) {
  const x = startOfDayLocal(d);
  x.setDate(x.getDate() + days);
  return x;
}
