"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export type TaskCreatePayload = {
  name: string;
  description?: string;
  /** "" = ไม่อยู่ใน Phase */
  phaseId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  memberIds?: string[];
  subtasks?: string[];
};

type Member = { id: string; name: string; avatarText?: string };

// ✅ Phase ต้องมี startDate/dueDate เพื่อเช็คช่วงวันที่
type Phase = {
  id: string;
  name: string;
  startDate?: string | null; // ISO
  dueDate?: string | null; // ISO
};

type Props = {
  open: boolean;
  onClose: () => void;

  /**
   * ✅ modal นี้ไม่ยิง phase เองแล้ว
   * ให้ parent ทำ POST+PATCH ทั้งหมด แล้วค่อยสร้าง Trello card / set state
   */
  onCreate: (data: TaskCreatePayload) => Promise<{ id: string }>;

  members?: Member[];
  phases?: Phase[];
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900",
        "outline-none focus:ring-2",
        "border-slate-200 focus:border-blue-500 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function TextareaBase(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900",
        "outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function MembersDropdown({
  members,
  value,
  onChange,
  disabled,
}: {
  members: Member[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  const selected = useMemo(
    () => members.filter((m) => value.includes(m.id)),
    [members, value]
  );

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={[
          "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-2">
          {disabled ? (
            <span className="text-slate-500">กำลังโหลดรายชื่อ…</span>
          ) : selected.length === 0 ? (
            <span className="text-slate-500">เลือกสมาชิก</span>
          ) : (
            selected.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                  {(m.avatarText ?? m.name?.[0] ?? "?").toUpperCase()}
                </span>
                {m.name}
              </span>
            ))
          )}
        </div>
        <ChevronDownIcon className="h-5 w-5 text-slate-500" />
      </button>

      {!disabled && open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="close members dropdown"
          />
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            {members.length === 0 ? (
              <div className="px-2 py-2 text-sm text-slate-500">ไม่พบสมาชิก</div>
            ) : (
              members.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(m.id)}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                    {(m.avatarText ?? m.name?.[0] ?? "?").toUpperCase()}
                  </span>
                  <span className="text-slate-800">{m.name}</span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PhaseDropdown({
  phases,
  value,
  onChange,
  disabled,
}: {
  phases: Phase[];
  value: string; // "" = no phase
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => phases.find((p) => p.id === value) ?? null,
    [phases, value]
  );

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={[
          "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          {!selected ? (
            <span className="text-slate-500">เลือก Phase</span>
          ) : (
            <span className="text-slate-800">{selected.name}</span>
          )}
        </div>
        <ChevronDownIcon className="h-5 w-5 text-slate-500" />
      </button>

      {!disabled && open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="close phase dropdown"
          />
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={[
                "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50",
                value === "" ? "bg-slate-100" : "",
              ].join(" ")}
            >
              ไม่อยู่ใน Phase
            </button>

            <div className="my-1 h-px bg-slate-100" />

            {phases.length === 0 ? (
              <div className="px-2 py-2 text-sm text-slate-500">ไม่พบ Phase</div>
            ) : (
              phases.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={[
                    "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50",
                    p.id === value ? "bg-slate-100" : "",
                  ].join(" ")}
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function isoToDateOnly(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isDateStrValid(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export default function TaskModal({
  open,
  onClose,
  onCreate,
  members,
  phases,
}: Props) {
  const memberOptions = useMemo<Member[]>(() => members ?? [], [members]);
  const membersReady = (members ?? []).length > 0;

  const phaseOptions = useMemo<Phase[]>(() => phases ?? [], [phases]);
  const phasesReady = (phases ?? []).length > 0;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [phaseId, setPhaseId] = useState<string>(""); // "" = no phase
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([""]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPhase = useMemo(
    () => phaseOptions.find((p) => p.id === phaseId) ?? null,
    [phaseOptions, phaseId]
  );

  const phaseMin = useMemo(
    () => isoToDateOnly(selectedPhase?.startDate ?? null),
    [selectedPhase?.startDate]
  );
  const phaseMax = useMemo(
    () => isoToDateOnly(selectedPhase?.dueDate ?? null),
    [selectedPhase?.dueDate]
  );

  const startOutOfPhase = useMemo(() => {
    if (!selectedPhase || !phaseMin || !phaseMax) return false;
    if (!startDate || !isDateStrValid(startDate)) return false;
    return startDate < phaseMin || startDate > phaseMax;
  }, [selectedPhase, phaseMin, phaseMax, startDate]);

  const endOutOfPhase = useMemo(() => {
    if (!selectedPhase || !phaseMin || !phaseMax) return false;
    if (!endDate || !isDateStrValid(endDate)) return false;
    return endDate < phaseMin || endDate > phaseMax;
  }, [selectedPhase, phaseMin, phaseMax, endDate]);

  const rangeInvalid = useMemo(() => {
    if (!startDate || !endDate) return false;
    if (!isDateStrValid(startDate) || !isDateStrValid(endDate)) return false;
    return startDate > endDate;
  }, [startDate, endDate]);

  if (!open) return null;

  const addSubtask = () => setSubtasks((prev) => [...prev, ""]);
  const removeSubtask = (idx: number) =>
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  const updateSubtask = (idx: number, v: string) =>
    setSubtasks((prev) => prev.map((x, i) => (i === idx ? v : x)));

  const resetForm = () => {
    setName("");
    setDescription("");
    setPhaseId("");
    setStartDate("");
    setEndDate("");
    setMemberIds([]);
    setHasSubtasks(false);
    setSubtasks([""]);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("กรุณากรอกชื่อ Task");
      return;
    }

    if (rangeInvalid) {
      setError("Due Date ต้องไม่ก่อน Start Date");
      return;
    }

    const cleanedSubtasks = hasSubtasks
      ? subtasks.map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      setSubmitting(true);

      await onCreate({
        name: trimmedName,
        description: description.trim() || undefined,
        phaseId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        memberIds,
        subtasks: cleanedSubtasks,
      });

      resetForm();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "บันทึก Task ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      {/* ✅ จำกัดความสูงตาม viewport + ทำให้ modal เลื่อนได้ภายใน */}
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header (ไม่เลื่อน) */}
        <div className="flex flex-none items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">เพิ่มการ์ดใหม่</h2>
            <p className="text-xs text-slate-500">
              กรอกข้อมูลแล้วกด Create เพื่อสร้างการ์ด
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form wrapper */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Body (เลื่อนเฉพาะส่วนนี้) */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>ชื่อ Task</Label>
                <InputBase
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรอกชื่อ Task"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>รายละเอียด</Label>
              <TextareaBase
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="อธิบายงานคร่าว ๆ ..."
                disabled={submitting}
              />
            </div>

            <div className="mt-4">
              <Label>Phase</Label>
              <PhaseDropdown
                phases={phaseOptions}
                value={phaseId}
                onChange={setPhaseId}
                disabled={!phasesReady}
              />
              {!phasesReady && (
                <div className="mt-1 text-[11px] text-slate-500">
                  กำลังโหลด Phase...
                </div>
              )}

              {selectedPhase && phaseMin && phaseMax ? (
                <div className="mt-1 text-[11px] text-slate-500">
                  ช่วง Phase: {phaseMin} – {phaseMax}
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Start Date</Label>
                <InputBase
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                  className={
                    startOutOfPhase || rangeInvalid
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
                      : ""
                  }
                />
                {startOutOfPhase ? (
                  <div className="mt-1 text-[11px] text-red-600">
                    วันที่อยู่นอกช่วงของ Phase
                  </div>
                ) : null}
              </div>

              <div>
                <Label>Due Date</Label>
                <InputBase
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitting}
                  className={
                    endOutOfPhase || rangeInvalid
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
                      : ""
                  }
                />
                {endOutOfPhase ? (
                  <div className="mt-1 text-[11px] text-red-600">
                    วันที่อยู่นอกช่วงของ Phase
                  </div>
                ) : null}
              </div>
            </div>

            {rangeInvalid ? (
              <div className="mt-2 text-[11px] text-red-600">
                Due Date ต้องไม่ก่อน Start Date
              </div>
            ) : null}

            <div className="mt-4">
              <Label>Assignees</Label>
              <MembersDropdown
                members={memberOptions}
                value={memberIds}
                onChange={setMemberIds}
                disabled={!membersReady}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Checklist / Subtasks
                  </div>
                  <div className="text-xs text-slate-500">
                    เปิดใช้งานเพื่อเพิ่มรายการย่อย
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHasSubtasks((v) => !v)}
                  className={[
                    "relative inline-flex h-7 w-12 items-center rounded-full transition",
                    hasSubtasks ? "bg-blue-600" : "bg-slate-300",
                  ].join(" ")}
                  aria-label="toggle subtasks"
                >
                  <span
                    className={[
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                      hasSubtasks ? "translate-x-6" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>

              {hasSubtasks && (
                <div className="mt-4 space-y-2">
                  {subtasks.map((s, idx) => (
                    <div key={idx} className="flex gap-2">
                      <InputBase
                        placeholder={`Subtask ${idx + 1}`}
                        value={s}
                        onChange={(e) => updateSubtask(idx, e.target.value)}
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => removeSubtask(idx)}
                        className="rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-100"
                        disabled={submitting || subtasks.length === 1}
                        title="ลบ"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addSubtask}
                    className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    disabled={submitting}
                  >
                    + เพิ่มรายการย่อย
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer (ไม่เลื่อน) */}
          <div className="flex flex-none items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
