"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export type TaskCreatePayload = {
  name: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  memberIds?: string[];
  subtasks?: string[];
};

type Member = { id: string; name: string; avatarText?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: TaskCreatePayload) => void | Promise<void>;
  members?: Member[];
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
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900",
        "outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
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
              <div className="px-2 py-2 text-sm text-slate-500">
                ไม่พบสมาชิก
              </div>
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

export default function TaskModal({ open, onClose, onCreate, members }: Props) {
  // ✅ เอา fallback JS/K ออก เพื่อไม่ให้หลอกตา
  const memberOptions = useMemo<Member[]>(() => members ?? [], [members]);
  const membersReady = (members ?? []).length > 0;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [memberIds, setMemberIds] = useState<string[]>([]);

  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([""]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const addSubtask = () => setSubtasks((prev) => [...prev, ""]);
  const removeSubtask = (idx: number) =>
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  const updateSubtask = (idx: number, v: string) =>
    setSubtasks((prev) => prev.map((x, i) => (i === idx ? v : x)));

  const resetForm = () => {
    setName("");
    setDescription("");
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

    const cleanedSubtasks = hasSubtasks
      ? subtasks.map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      setSubmitting(true);

      await onCreate({
        name: trimmedName,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        memberIds,
        subtasks: cleanedSubtasks,
      });

      resetForm();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "สร้างการ์ดไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
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

        <form onSubmit={handleSubmit} className="px-6 py-5">
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

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Start Date</Label>
              <InputBase
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <InputBase
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

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

          <div className="mt-6 flex items-center justify-end gap-3">
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
