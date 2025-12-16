"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ProjectApi, ProjectStatus } from "../../../lib/projectService";

export type NewProjectPayload = {
  name: string;
  description: string;

  trelloTag: string;

  // ✅ map ให้ backend
  key: string;

  status?: ProjectStatus;
  startDate?: string | null; // ✅ ISO string
  dueDate?: string | null;   // ✅ ISO string
};

export type UpdateProjectPayload = Partial<Omit<NewProjectPayload, "key">> & {
  id: string;
  key?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;

  onCreate?: (data: NewProjectPayload) => void;

  initial?: ProjectApi | null;
  onUpdate?: (data: UpdateProjectPayload) => void;
};

function toDateInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ✅ allow only English (A-Z, 0-9, _ , -) no spaces */
function normalizeTag(raw: string) {
  return raw.trim().toUpperCase();
}
function isValidEnglishTag(tag: string) {
  return /^[A-Z0-9_-]+$/.test(tag);
}

/** ✅ date input (YYYY-MM-DD) -> ISO (start-of-day / end-of-day) */
function toISOStartFromDateInput(v?: string) {
  const s = (v ?? "").trim();
  if (!s) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
function toISOEndFromDateInput(v?: string) {
  const s = (v ?? "").trim();
  if (!s) return null;
  const d = new Date(`${s}T23:59:59.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function ProjectModal({
  open,
  onClose,
  onCreate,
  initial,
  onUpdate,
}: Props) {
  const isEdit = !!initial?.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [trelloTag, setTrelloTag] = useState("");

  const [status, setStatus] = useState<ProjectStatus>("PLANNING");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [dueDate, setDueDate] = useState("");     // YYYY-MM-DD

  const [touchedTag, setTouchedTag] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    setSubmitError("");
    setTouchedTag(false);

    if (initial) {
      setName(initial.name ?? "");
      setDescription(initial.description ?? "");
      setTrelloTag((initial.trelloTag ?? "").toUpperCase());

      setStatus((initial.status ?? "PLANNING") as ProjectStatus);
      setStartDate(toDateInput(initial.startDate));
      setDueDate(toDateInput(initial.dueDate));
    } else {
      setName("");
      setDescription("");
      setTrelloTag("");

      setStatus("PLANNING");
      setStartDate("");
      setDueDate("");
    }
  }, [open, initial]);

  const title = useMemo(
    () => (isEdit ? "Edit Project" : "Create New Project"),
    [isEdit]
  );

  const tagError = useMemo(() => {
    const v = normalizeTag(trelloTag);
    if (!v) return "กรุณากรอก Trello Tag";
    if (!isValidEnglishTag(v))
      return "กรอกได้เฉพาะ A-Z, 0-9, _ , - (ห้ามเว้นวรรค/ภาษาไทย)";
    return "";
  }, [trelloTag]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setTouchedTag(true);

    const normTag = normalizeTag(trelloTag);

    if (!normTag) {
      setSubmitError("กรุณากรอก Trello Tag ก่อนสร้างโปรเจกต์");
      return;
    }
    if (!isValidEnglishTag(normTag)) {
      setSubmitError("Trello Tag ไม่ถูกต้อง: ต้องเป็นภาษาอังกฤษเท่านั้น");
      return;
    }

    // ✅ แปลง date -> ISO ก่อนส่ง
    const startISO = toISOStartFromDateInput(startDate);
    const dueISO = toISOEndFromDateInput(dueDate);

    const payloadBase: NewProjectPayload = {
      name: name.trim(),
      description: description.trim(),

      trelloTag: normTag,
      key: normTag, // ✅ map key = trelloTag

      status,
      startDate: startISO,
      dueDate: dueISO,
    };

    if (isEdit && initial?.id) {
      onUpdate?.({
        id: initial.id,
        ...payloadBase,
        key: payloadBase.key,
      });
    } else {
      onCreate?.(payloadBase);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Name</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="E-commerce Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Description
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="รายละเอียดของโปรเจกต์"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* trelloTag (only) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Trello Tag <span className="text-red-500">*</span>
            </label>
            <input
              className={[
                "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                "focus:ring-1",
                touchedTag && tagError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
              ].join(" ")}
              placeholder="ECOM"
              value={trelloTag}
              onChange={(e) => {
                const raw = e.target.value;
                const up = raw.toUpperCase().replace(/\s+/g, "");
                setTrelloTag(up);
              }}
              onBlur={() => setTouchedTag(true)}
              required
              inputMode="latin"
              autoCapitalize="characters"
            />
            <p className="text-[11px] text-slate-400">
              * หมายเหตุ: ต้องกรอกเป็นภาษาอังกฤษเท่านั้น (A-Z, 0-9, _ , -) และห้ามเว้นวรรค
            </p>
            {touchedTag && tagError ? (
              <p className="text-[11px] text-red-600">{tagError}</p>
            ) : null}
          </div>

          {/* status */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Status
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                <option value="PLANNING">PLANNING — วางแผน</option>
                <option value="ACTIVE">ACTIVE — ดำเนินการ</option>
                <option value="ON_HOLD">ON_HOLD — หยุดชั่วคราว</option>
                <option value="COMPLETED">COMPLETED — เสร็จสิ้น</option>
                <option value="CANCELLED">CANCELLED — ยกเลิก</option>
              </select>
            </div>
            <div />
          </div>

          {/* start + due */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Start date
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Due date
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={startDate || undefined}
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
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {isEdit ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
