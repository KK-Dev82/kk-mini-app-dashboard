"use client";

import React, { useMemo } from "react";

export const MONTH_OPTIONS = [
  { value: 1, label: "มกราคม" },
  { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" },
  { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" },
  { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" },
  { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" },
  { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" },
  { value: 12, label: "ธันวาคม" },
] as const;

export type ProjectFiltersValue = {
  query: string;
  monthFilter: number; // 0 = ทั้งหมด
  yearFilter: number; // 0 = ทั้งหมด (value เป็น ค.ศ.)
  includeNoDate: boolean;

  // ✅ เพิ่ม
  showArchived: boolean;
};

type Props = {
  value: ProjectFiltersValue;
  onChange: (next: ProjectFiltersValue) => void;

  // ปีจากข้อมูลจริง (เป็น ค.ศ.)
  yearOptions: number[];

  // ปรับข้อความ hint ใต้ dropdown ปีได้
  yearHint?: string;
};

export default function ProjectFilters({
  value,
  onChange,
  yearOptions,
  yearHint = "ปีจะแสดงเป็น พ.ศ. (อิงจาก startDate)",
}: Props) {
  const inputBase =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none " +
    "focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white";

  // แปลงเป็นตัวเลือก พ.ศ. แต่ value ยังเป็น ค.ศ.
  const yearOptionsBE = useMemo(
    () =>
      yearOptions.map((y) => ({
        ad: y,
        be: y + 543,
      })),
    [yearOptions]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-1 space-y-1">
          <label className="text-xs font-medium text-slate-700">ค้นหา</label>
          <input
            className={inputBase}
            placeholder="ค้นหาชื่อโปรเจกต์ / รายละเอียด / key"
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">เดือน</label>
          <select
            className={inputBase}
            value={value.monthFilter}
            onChange={(e) => onChange({ ...value, monthFilter: Number(e.target.value) })}
          >
            <option value={0}>ทั้งหมด</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">ปี</label>
          <select
            className={inputBase}
            value={value.yearFilter}
            onChange={(e) => onChange({ ...value, yearFilter: Number(e.target.value) })}
          >
            <option value={0}>ทั้งหมด</option>
            {yearOptionsBE.map((y) => (
              <option key={y.ad} value={y.ad}>
                {y.be}
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-400">{yearHint}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={value.includeNoDate}
              onChange={(e) => onChange({ ...value, includeNoDate: e.target.checked })}
            />
            รวมโปรเจกต์ที่ยังไม่กำหนดวันเริ่ม/สิ้นสุด
          </label>

          {/* ✅ แสดง Archived */}
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={value.showArchived}
              onChange={(e) => onChange({ ...value, showArchived: e.target.checked })}
            />
            แสดงโปรเจกต์ที่ถูก Archive
          </label>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange({
              query: "",
              monthFilter: 0,
              yearFilter: 0,
              includeNoDate: true,
              showArchived: false,
            })
          }
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          ล้างตัวกรอง
        </button>
      </div>
    </div>
  );
}
