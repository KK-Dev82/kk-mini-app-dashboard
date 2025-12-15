"use client";

import { useMemo, useState, FormEvent } from "react";
import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export type TaskStatusColor =
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "blue";

export type TaskCreatePayload = {
  tag: string;
  name: string;
  statusColor: TaskStatusColor;
  startDate?: string;
  endDate?: string;
  description?: string;
  memberIds: string[];
  subtasks: string[];
};

type Member = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: TaskCreatePayload) => void;

  // optional: ส่งสมาชิกมาจาก parent ได้ (ถ้าไม่ส่ง จะใช้ mock)
  members?: Member[];
};

const STATUS_COLORS: { key: TaskStatusColor; className: string }[] = [
  { key: "green", className: "bg-emerald-600" },
  { key: "yellow", className: "bg-amber-500" },
  { key: "orange", className: "bg-orange-600" },
  { key: "red", className: "bg-red-600" },
  { key: "purple", className: "bg-purple-600" },
  { key: "blue", className: "bg-blue-600" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-slate-700">{children}</label>
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
        "w-full min-h-[110px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900",
        "outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

/** Multi-select dropdown (simple & clean) */
function MembersDropdown({
  members,
  value,
  onChange,
}: {
  members: Member[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedNames = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m.name]));
    return value.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [members, value]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <div className="flex items-center justify-between">
          <span className={selectedNames.length ? "text-slate-900" : "text-slate-400"}>
            {selectedNames.length ? selectedNames.join(", ") : "เลือกสมาชิก"}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-slate-500" />
        </div>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="close members dropdown"
          />
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            {members.map((m) => (
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
                <span className="text-slate-800">{m.name}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TaskModal({ open, onClose, onCreate, members }: Props) {
  const memberList: Member[] =
    members ??
    [
      { id: "u1", name: "Golf" },
      { id: "u2", name: "Mint" },
      { id: "u3", name: "Boss" },
      { id: "u4", name: "Dev Team" },
    ];

  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [statusColor, setStatusColor] = useState<TaskStatusColor>("green");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const [memberIds, setMemberIds] = useState<string[]>([]);

  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([""]);

  if (!open) return null;

  const addSubtask = () => setSubtasks((p) => [...p, ""]);
  const updateSubtask = (idx: number, v: string) =>
    setSubtasks((p) => p.map((x, i) => (i === idx ? v : x)));

  const submit = (e: FormEvent) => {
    e.preventDefault();

    onCreate({
      tag: tag.trim(),
      name: name.trim(),
      statusColor,
      startDate,
      endDate,
      description: description.trim(),
      memberIds,
      subtasks: hasSubtasks ? subtasks.map((s) => s.trim()).filter(Boolean) : [],
    });

    onClose();
  };

  const selectedClass =
    STATUS_COLORS.find((x) => x.key === statusColor)?.className ?? "bg-emerald-600";

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="close overlay"
      />

      <form
        onSubmit={submit}
        className="relative mx-auto mt-10 w-[92%] max-w-3xl rounded-3xl bg-white p-6 shadow-2xl"
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">เพิ่ม Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="close"
          >
            <XMarkIcon className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        {/* content */}
        <div className="mt-5 space-y-5">
          {/* row 1: Tag / Name */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Tag</FieldLabel>
              <InputBase placeholder="Enter [ tag ]" value={tag} onChange={(e) => setTag(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>ชื่อ Task</FieldLabel>
              <InputBase
                placeholder="Enter task name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* row 2: Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>Status (สี)</FieldLabel>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">สีที่เลือก</span>
                <span className={`h-3 w-12 rounded-full ${selectedClass}`} />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {STATUS_COLORS.map((c) => {
                const active = c.key === statusColor;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setStatusColor(c.key)}
                    className={[
                      "h-9 rounded-2xl",
                      c.className,
                      active ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-90 hover:opacity-100",
                    ].join(" ")}
                    aria-label={`status-${c.key}`}
                  />
                );
              })}
            </div>
          </div>

          {/* row 3: Dates */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Start Date</FieldLabel>
              <InputBase type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>End Date</FieldLabel>
              <InputBase type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* row 4: Members dropdown */}
          <div className="space-y-1.5">
            <FieldLabel>สมาชิก</FieldLabel>
            <MembersDropdown members={memberList} value={memberIds} onChange={setMemberIds} />
          </div>

          {/* row 5: Description */}
          <div className="space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <TextareaBase
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* row 6: Subtask toggle + list */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Subtask</p>
                <p className="text-[11px] text-slate-500">เปิดเพื่อเพิ่มรายการย่อย</p>
              </div>

              {/* ✅ Toggle */}
              <button
                type="button"
                onClick={() => setHasSubtasks((v) => !v)}
                className={[
                  "relative inline-flex h-7 w-12 items-center rounded-full transition",
                  hasSubtasks ? "bg-blue-600" : "bg-slate-200",
                ].join(" ")}
                aria-pressed={hasSubtasks}
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
                  <InputBase
                    key={idx}
                    placeholder={`Subtask ${idx + 1}`}
                    value={s}
                    onChange={(e) => updateSubtask(idx, e.target.value)}
                  />
                ))}

                <button
                  type="button"
                  onClick={addSubtask}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  + เพิ่ม Subtask
                </button>
              </div>
            )}
          </div>

        </div>

        {/* footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-6 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
