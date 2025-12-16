"use client";

import { useMemo, useState, type FormEvent } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ProjectApi, ProjectStatus } from "../../../lib/projectService";

export type NewProjectPayload = {
  name: string;
  description: string;
  trelloTag: string;
  key: string;

  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: NewProjectPayload) => void;
  initial?: ProjectApi | null;
};

/**
 * ✅ ISO -> YYYY-MM-DD สำหรับ <input type="date">
 * ใช้ UTC เพื่อกันวันเพี้ยน (timezone shift)
 */
function toDateInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeTag(raw: string) {
  return raw.trim().toUpperCase();
}
function isValidEnglishTag(tag: string) {
  return /^[A-Z0-9_-]+$/.test(tag);
}

/**
 * ✅ YYYY-MM-DD -> ISO
 * ใช้เที่ยงวัน UTC (12:00Z) กัน timezone shift ข้ามวัน/ข้ามปี
 */
function toISODateNoShift(v?: string) {
  const s = (v ?? "").trim();
  if (!s) return null;

  // s = "YYYY-MM-DD"
  const [yy, mm, dd] = s.split("-").map((x) => Number(x));
  if (!yy || !mm || !dd) return null;

  const d = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0, 0));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const STATUS_OPTIONS: Array<{ value: ProjectStatus; labelTH: string }> = [
  { value: "PLANNING", labelTH: "วางแผน" },
  { value: "ACTIVE", labelTH: "ดำเนินการ" },
  { value: "ON_HOLD", labelTH: "หยุดชั่วคราว" },
  { value: "COMPLETED", labelTH: "เสร็จสิ้น" },
  { value: "CANCELLED", labelTH: "ยกเลิก" },
];

type FormState = {
  name: string;
  description: string;
  trelloTag: string;
  status: ProjectStatus;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
};

function buildInitialForm(initial?: ProjectApi | null): FormState {
  if (!initial) {
    return {
      name: "",
      description: "",
      trelloTag: "",
      status: "PLANNING",
      startDate: "",
      dueDate: "",
    };
  }

  return {
    name: initial.name ?? "",
    description: initial.description ?? "",
    trelloTag: (initial.trelloTag ?? "").toUpperCase(),
    status: (initial.status ?? "PLANNING") as ProjectStatus,
    startDate: toDateInput(initial.startDate),
    dueDate: toDateInput(initial.dueDate),
  };
}

function ProjectModalInner({
  initial,
  onClose,
  onCreate,
}: {
  initial?: ProjectApi | null;
  onClose: () => void;
  onCreate?: (data: NewProjectPayload) => void;
}) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(initial));
  const [touchedTag, setTouchedTag] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const tagError = useMemo(() => {
    const v = normalizeTag(form.trelloTag);
    if (!v) return "กรุณากรอก Trello Tag";
    if (!isValidEnglishTag(v))
      return "กรอกได้เฉพาะ A-Z, 0-9, _ , - (ห้ามเว้นวรรค/ภาษาไทย)";
    return "";
  }, [form.trelloTag]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setTouchedTag(true);

    const normTag = normalizeTag(form.trelloTag);
    if (!normTag) return setSubmitError("กรุณากรอก Trello Tag");
    if (!isValidEnglishTag(normTag))
      return setSubmitError("Trello Tag ต้องเป็นภาษาอังกฤษเท่านั้น");

    const payload: NewProjectPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      trelloTag: normTag,
      key: normTag,
      status: form.status,

      // ✅ กันปีโดด/วันโดด
      startDate: toISODateNoShift(form.startDate),
      dueDate: toISODateNoShift(form.dueDate),
    };

    console.log("[ProjectModal submit payload]", payload);

    onCreate?.(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">สร้างโปรเจกต์ใหม่</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">ชื่อโปรเจกต์</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">รายละเอียด</label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Trello Tag <span className="text-red-500">*</span>
            </label>
            <input
              className={[
                "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1",
                touchedTag && tagError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
              ].join(" ")}
              placeholder="ECOM"
              value={form.trelloTag}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  trelloTag: e.target.value.toUpperCase().replace(/\s+/g, ""),
                }))
              }
              onBlur={() => setTouchedTag(true)}
              required
              // ✅ inputMode: ไม่มี "text" (เลยทำให้แดง)
              inputMode={undefined}
              autoCapitalize="characters"
              pattern="[A-Za-z0-9_-]+"
              title="กรอกได้เฉพาะ A-Z, 0-9, _ , - (ห้ามเว้นวรรค/ภาษาไทย)"
            />
            <p className="text-[11px] text-slate-400">
              * หมายเหตุ: ต้องกรอกเป็นภาษาอังกฤษเท่านั้น (A-Z, 0-9, _ , -) และห้ามเว้นวรรค
            </p>
            {touchedTag && tagError ? (
              <p className="text-[11px] text-red-600">{tagError}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">สถานะ</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))
                }
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.labelTH}
                  </option>
                ))}
              </select>
            </div>
            <div />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">วันที่เริ่ม</label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">วันที่สิ้นสุด</label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                min={form.startDate || undefined}
              />
            </div>
          </div>

          {submitError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
            >
              สร้าง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectModal(props: Props) {
  const { open, initial } = props;
  if (!open) return null;
  const modalKey = `${open}-${initial?.id ?? "new"}`;
  return <ProjectModalInner key={modalKey} {...props} />;
}
