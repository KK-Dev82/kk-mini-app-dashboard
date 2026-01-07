"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import AppDatePicker from "../../component/datepicker/AppDatePicker";

import type { ProjectApi, ProjectStatus } from "../../../lib/projectService";
import {
  fetchProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  type ProjectMemberApi,
  type ProjectMemberRole,
} from "../../../lib/projectService";

import { fetchUsers, type UserApi } from "../../../lib/userService";

import {
  fetchProjectPhases,
  createProjectPhase,
  type ProjectPhaseApi,
  type CreateProjectPhasePayload,
} from "../../../lib/ganttService";

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

  // ✅ return ProjectApi เพื่อเอา id ไป add members ต่อ
  onCreate?: (data: NewProjectPayload) => Promise<ProjectApi>;
  onUpdate?: (id: string, data: NewProjectPayload) => Promise<ProjectApi>;

  initial?: ProjectApi | null;
};

function parseISOToDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toISOFromDateNoShift(d?: Date | null) {
  if (!d) return null;
  // ✅ ใช้ UTC 12:00:00 กัน timezone shift
  const utc = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
  );
  return utc.toISOString();
}

function normalizeTag(raw: string) {
  return raw.trim().toUpperCase();
}

function isValidEnglishTag(tag: string) {
  return /^[A-Z0-9_-]+$/.test(tag);
}

const STATUS_OPTIONS: Array<{ value: ProjectStatus; labelTH: string }> = [
  { value: "PLANNING", labelTH: "วางแผน" },
  { value: "ACTIVE", labelTH: "ดำเนินการ" },
  { value: "ON_HOLD", labelTH: "หยุดชั่วคราว" },
  { value: "COMPLETED", labelTH: "เสร็จสิ้น" },
  { value: "CANCELLED", labelTH: "ยกเลิก" },
];

const ROLE_OPTIONS: Array<{ value: ProjectMemberRole; label: string }> = [
  { value: "PROJECT_MANAGER", label: "PROJECT_MANAGER" },
  { value: "DEVELOPER", label: "DEVELOPER" },
  { value: "DESIGNER", label: "DESIGNER" },
  { value: "TESTER", label: "TESTER" },
  { value: "MEMBER", label: "MEMBER" },
];

function normalizeRole(role?: ProjectMemberRole | null): ProjectMemberRole {
  const ok = ROLE_OPTIONS.some((r) => r.value === role);
  return ok ? (role as ProjectMemberRole) : "MEMBER";
}

type FormState = {
  name: string;
  description: string;
  trelloTag: string;
  status: ProjectStatus;
  startDate: Date | null;
  dueDate: Date | null;
};

function buildInitialForm(initial?: ProjectApi | null): FormState {
  if (!initial) {
    return {
      name: "",
      description: "",
      trelloTag: "",
      status: "PLANNING",
      startDate: null,
      dueDate: null,
    };
  }

  return {
    name: initial.name ?? "",
    description: initial.description ?? "",
    trelloTag: (initial.trelloTag ?? "").toUpperCase(),
    status: (initial.status ?? "PLANNING") as ProjectStatus,
    startDate: parseISOToDate(initial.startDate),
    dueDate: parseISOToDate(initial.dueDate),
  };
}

function avatarText(name?: string | null, email?: string | null) {
  return (name?.[0] || email?.[0] || "?").toUpperCase();
}

// ✅ helper: ดึง userId จาก ProjectMemberApi (กัน schema ต่างกัน)
function getMemberUserId(m: ProjectMemberApi): string | undefined {
  const anyM = m as any;
  return anyM.userId ?? anyM.user?.id ?? anyM.user?.userId ?? anyM.idUser;
}

function ProjectModalInner({
  initial,
  onClose,
  onCreate,
  onUpdate,
}: {
  initial?: ProjectApi | null;
  onClose: () => void;
  onCreate?: (data: NewProjectPayload) => Promise<ProjectApi>;
  onUpdate?: (id: string, data: NewProjectPayload) => Promise<ProjectApi>;
}) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(initial));
  const [touchedTag, setTouchedTag] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // members
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  const [allUsers, setAllUsers] = useState<UserApi[]>([]);
  const [initialMembers, setInitialMembers] = useState<ProjectMemberApi[]>([]);
  // ✅ เก็บ null เพื่อ "ติ๊กออก" โดยไม่ลบ key (กัน UI หาย)
  const [selected, setSelected] = useState<Record<
    string,
    ProjectMemberRole | null
  >>({});
  const [userQuery, setUserQuery] = useState("");

  const isEdit = !!initial?.id;

  // =========================
  // ✅ PHASE UI/STATE
  // =========================
  const [phasesLoading, setPhasesLoading] = useState(false);
  const [phasesError, setPhasesError] = useState("");
  const [phases, setPhases] = useState<ProjectPhaseApi[]>([]);

  const [enableAddPhase, setEnableAddPhase] = useState(false);
  const [phaseName, setPhaseName] = useState("");
  const [phaseStartDate, setPhaseStartDate] = useState<Date | null>(null);
  const [phaseDueDate, setPhaseDueDate] = useState<Date | null>(null);
  const [phaseSaving, setPhaseSaving] = useState(false);
  const [phaseSubmitError, setPhaseSubmitError] = useState("");

  const resetPhaseForm = () => {
    setPhaseName("");
    setPhaseStartDate(null);
    setPhaseDueDate(null);
    setPhaseSubmitError("");
  };

  const refreshPhases = async (projectId: string) => {
    setPhasesLoading(true);
    setPhasesError("");
    try {
      const res = await fetchProjectPhases(projectId);
      setPhases(res ?? []);
    } catch (e) {
      setPhasesError(e instanceof Error ? e.message : "โหลด phases ไม่สำเร็จ");
    } finally {
      setPhasesLoading(false);
    }
  };

  useEffect(() => {
    setForm(buildInitialForm(initial));
    setTouchedTag(false);
    setSubmitError("");
    setSubmitting(false);

    setMembersError("");
    setInitialMembers([]);
    setSelected({});
    setUserQuery("");

    // phases reset
    setEnableAddPhase(false);
    resetPhaseForm();
    setPhases([]);
    setPhasesError("");
    setPhasesLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  // โหลด users (ทั้ง create/edit)
  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    setMembersError("");

    fetchUsers()
      .then((users) => {
        if (cancelled) return;
        setAllUsers(users ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setMembersError(e instanceof Error ? e.message : "โหลด users ไม่สำเร็จ");
      })
      .finally(() => {
        if (cancelled) return;
        setMembersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ ถ้า edit: โหลด members เดิมมา sync เข้า selected (ใช้ userId ไม่ใช่ memberId)
  useEffect(() => {
    if (!isEdit || !initial?.id) return;

    let cancelled = false;
    setMembersLoading(true);
    setMembersError("");

    fetchProjectMembers(initial.id)
      .then((members) => {
        if (cancelled) return;
        setInitialMembers(members ?? []);

        const next: Record<string, ProjectMemberRole | null> = {};
        (members ?? []).forEach((m) => {
          const uid = getMemberUserId(m);
          if (uid) next[uid] = normalizeRole(m.role);
        });
        setSelected(next);
      })
      .catch((e) => {
        if (cancelled) return;
        setMembersError(e instanceof Error ? e.message : "โหลดสมาชิกไม่สำเร็จ");
      })
      .finally(() => {
        if (cancelled) return;
        setMembersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, initial?.id]);

  // ✅ ถ้า edit: โหลด phases จาก ganttService
  useEffect(() => {
    if (!isEdit || !initial?.id) return;

    let cancelled = false;
    setPhasesLoading(true);
    setPhasesError("");

    fetchProjectPhases(initial.id)
      .then((res) => {
        if (cancelled) return;
        setPhases(res ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setPhasesError(e instanceof Error ? e.message : "โหลด phases ไม่สำเร็จ");
      })
      .finally(() => {
        if (cancelled) return;
        setPhasesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, initial?.id]);

  const tagError = useMemo(() => {
    const v = normalizeTag(form.trelloTag);
    if (!v) return "กรุณากรอก Trello Tag";
    if (!isValidEnglishTag(v))
      return "กรอกได้เฉพาะ A-Z, 0-9, _ , - (ห้ามเว้นวรรค/ภาษาไทย)";
    return "";
  }, [form.trelloTag]);

  const dateError = useMemo(() => {
    if (
      form.startDate &&
      form.dueDate &&
      form.dueDate.getTime() < form.startDate.getTime()
    ) {
      return "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม";
    }
    return "";
  }, [form.startDate, form.dueDate]);

  const filteredUsers = useMemo(() => {
    const s = userQuery.trim().toLowerCase();
    if (!s) return allUsers;
    return allUsers.filter((u) => {
      return (
        (u.name ?? "").toLowerCase().includes(s) ||
        (u.email ?? "").toLowerCase().includes(s)
      );
    });
  }, [allUsers, userQuery]);

  // ✅ ไม่ delete key แล้ว แต่ set เป็น null แทน (ติ๊กออก)
  const toggleUser = (userId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const isChecked = next[userId] != null; // null/undefined = ไม่เลือก
      next[userId] = isChecked ? null : "MEMBER"; // ✅ default role
      return next;
    });
  };

  const changeRole = (userId: string, role: ProjectMemberRole) => {
    setSelected((prev) => ({ ...prev, [userId]: normalizeRole(role) }));
  };

  // ✅ sync members ในโหมด edit (diff) — before/after ใช้ userId เหมือนกัน
  const applyMembersDiff = async (projectId: string) => {
    const before = new Map<string, ProjectMemberRole>();
    initialMembers.forEach((m) => {
      const uid = getMemberUserId(m);
      if (uid) before.set(uid, normalizeRole(m.role));
    });

    const after = new Map<string, ProjectMemberRole>();
    Object.entries(selected).forEach(([uid, role]) => {
      if (role == null) return; // ติ๊กออก
      after.set(uid, normalizeRole(role));
    });

    const toAdd: Array<{ userId: string; role: ProjectMemberRole }> = [];
    const toRemove: string[] = [];
    const toUpdateRole: Array<{ userId: string; role: ProjectMemberRole }> = [];

    for (const [uid, role] of after.entries()) {
      if (!before.has(uid)) toAdd.push({ userId: uid, role });
      else {
        const prevRole = before.get(uid);
        if (prevRole && prevRole !== role) toUpdateRole.push({ userId: uid, role });
      }
    }
    for (const uid of before.keys()) {
      if (!after.has(uid)) toRemove.push(uid);
    }

    await Promise.all([
      ...toAdd.map((p) => addProjectMember(projectId, p)),
      ...toRemove.map((uid) => removeProjectMember(projectId, uid)),
      ...toUpdateRole.map((p) => updateProjectMemberRole(projectId, p.userId, p.role)),
    ]);
  };

  // ✅ add members ในโหมด create (เพิ่มอย่างเดียว)
  const applyMembersForCreate = async (projectId: string) => {
    const toAdd = Object.entries(selected)
      .filter(([, role]) => role != null)
      .map(([userId, role]) => ({
        userId,
        role: normalizeRole(role as ProjectMemberRole),
      }));
    if (toAdd.length === 0) return;
    await Promise.all(toAdd.map((p) => addProjectMember(projectId, p)));
  };

  // ✅ สร้าง Phase (POST /projects/{projectId}/phases) จาก ganttService
  const handleCreatePhase = async () => {
    if (!initial?.id) return;

    setPhaseSubmitError("");

    const name = phaseName.trim();
    if (!name) return setPhaseSubmitError("กรุณากรอกชื่อ Phase");
    if (!phaseStartDate || !phaseDueDate)
      return setPhaseSubmitError("กรุณาเลือก Start date และ Due date");
    if (phaseDueDate.getTime() < phaseStartDate.getTime())
      return setPhaseSubmitError("Due date ต้องไม่ก่อน Start date");

    // ✅ สำคัญ: orderIndex ต้องเป็น integer (แก้ 400)
    const nextOrderIndex =
      phases.length === 0
        ? 0
        : Math.max(...phases.map((p) => p.orderIndex ?? -1)) + 1;

    const payload: CreateProjectPhasePayload = {
      name,
      description: null,
      orderIndex: nextOrderIndex, // ✅ required
      status: "NOT_STARTED",
      startDate: toISOFromDateNoShift(phaseStartDate),
      dueDate: toISOFromDateNoShift(phaseDueDate),
    };

    setPhaseSaving(true);
    try {
      const created = await createProjectPhase(initial.id, payload);

      // ✅ แทรกเข้าลิสต์ แล้ว sort ตาม orderIndex
      setPhases((prev) =>
        [...prev, created].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        )
      );

      resetPhaseForm();
      setEnableAddPhase(false);
    } catch (e) {
      setPhaseSubmitError(e instanceof Error ? e.message : "สร้าง Phase ไม่สำเร็จ");
    } finally {
      setPhaseSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setTouchedTag(true);

    const normTag = normalizeTag(form.trelloTag);

    if (!isEdit) {
      if (!normTag) return setSubmitError("กรุณากรอก Trello Tag");
      if (!isValidEnglishTag(normTag))
        return setSubmitError("Trello Tag ต้องเป็นภาษาอังกฤษเท่านั้น");
    }
    if (dateError) return setSubmitError(dateError);

    const payload: NewProjectPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      trelloTag: normTag,
      key: normTag,
      status: form.status,
      startDate: toISOFromDateNoShift(form.startDate),
      dueDate: toISOFromDateNoShift(form.dueDate),
    };

    setSubmitting(true);
    try {
      if (isEdit && initial?.id) {
        await onUpdate?.(initial.id, payload);
        await applyMembersDiff(initial.id);

        onClose();
        window.location.reload();
      } else {
        const created = await onCreate?.(payload);
        if (!created?.id) throw new Error("Create success but missing project id");
        await applyMembersForCreate(created.id);

        onClose();
        window.location.reload();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none " +
    "focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const phasesSorted = useMemo(() => {
    return [...phases].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [phases]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl bg-white shadow-xl border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "แก้ไขโปรเจกต์" : "สร้างโปรเจกต์ใหม่"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            disabled={submitting}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">ชื่อโปรเจกต์</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">รายละเอียด</label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Trello Tag <span className="text-red-500">*</span>
            </label>
            <input
              className={[
                "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1",
                !isEdit && touchedTag && tagError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500",
                isEdit ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "bg-white",
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
              required={!isEdit}
              disabled={isEdit || submitting}
              pattern="[A-Za-z0-9_-]+"
            />
            {!isEdit ? (
              <p className="text-[11px] text-slate-400">
                * หมายเหตุ: ต้องกรอกเป็นภาษาอังกฤษเท่านั้น (A-Z, 0-9, _ , -) และห้ามเว้นวรรค
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">* Trello Tag แก้ไม่ได้ (ใช้ผูกงาน/บอร์ด)</p>
            )}
            {!isEdit && touchedTag && tagError ? (
              <p className="text-[11px] text-red-600">{tagError}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">สถานะ</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))
                }
                disabled={submitting}
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
              <AppDatePicker
                value={form.startDate}
                onChange={(d) => setForm((p) => ({ ...p, startDate: d }))}
                placeholder="วัน/เดือน/ปี"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">วันที่สิ้นสุด</label>
              <AppDatePicker
                value={form.dueDate}
                onChange={(d) => setForm((p) => ({ ...p, dueDate: d }))}
                placeholder="วัน/เดือน/ปี"
                minDate={form.startDate ?? undefined}
                disabled={submitting}
              />
            </div>
          </div>

          {/* =========================
              ✅ PHASE UI (ตามรูปที่ต้องการ)
              เฉพาะตอน Edit เท่านั้น
             ========================= */}
          {isEdit && initial?.id && (
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">การเพิ่ม Phase</div>
                  <div className="text-[11px] text-slate-500">
                    เปิดใช้งานเพื่อเพิ่ม Phase (ชื่อ + Start date + Due date)
                  </div>
                </div>

                {/* toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setEnableAddPhase((v) => !v);
                    setPhaseSubmitError("");
                  }}
                  className={[
                    "relative inline-flex h-7 w-12 items-center rounded-full transition",
                    enableAddPhase ? "bg-blue-600" : "bg-slate-300",
                  ].join(" ")}
                  aria-label="toggle add phase"
                  disabled={submitting}
                >
                  <span
                    className={[
                      "inline-block h-6 w-6 transform rounded-full bg-white transition",
                      enableAddPhase ? "translate-x-5" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>

              {enableAddPhase && (
                <div className="space-y-3">
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="ชื่อ Phase"
                    value={phaseName}
                    onChange={(e) => setPhaseName(e.target.value)}
                    disabled={phaseSaving || submitting}
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Start date</label>
                      <AppDatePicker
                        value={phaseStartDate}
                        onChange={(d) => setPhaseStartDate(d)}
                        placeholder="วัน/เดือน/ปี"
                        disabled={phaseSaving || submitting}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Due date</label>
                      <AppDatePicker
                        value={phaseDueDate}
                        onChange={(d) => setPhaseDueDate(d)}
                        placeholder="วัน/เดือน/ปี"
                        minDate={phaseStartDate ?? undefined}
                        disabled={phaseSaving || submitting}
                      />
                    </div>
                  </div>

                  {phaseSubmitError ? (
                    <div className="text-[11px] font-medium text-red-600">{phaseSubmitError}</div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreatePhase}
                      disabled={phaseSaving || submitting}
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {phaseSaving ? "กำลังเพิ่ม..." : "+ เพิ่ม Phase"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        resetPhaseForm();
                        setEnableAddPhase(false);
                      }}
                      disabled={phaseSaving || submitting}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      ยกเลิก
                    </button>

                    <button
                      type="button"
                      onClick={() => refreshPhases(initial.id)}
                      disabled={phaseSaving || submitting || phasesLoading}
                      className="ml-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      title="refresh phases"
                    >
                      รีเฟรช
                    </button>
                  </div>
                </div>
              )}

              {/* list phases */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2 text-xs font-semibold text-slate-700 border-b border-slate-100 flex items-center justify-between">
                  <span>Phases</span>
                  {phasesLoading ? <span className="text-slate-500">กำลังโหลด…</span> : null}
                </div>

                {phasesError ? (
                  <div className="p-4 text-sm text-red-700">{phasesError}</div>
                ) : phasesLoading ? (
                  <div className="p-4 text-sm text-slate-500">กำลังโหลด…</div>
                ) : phasesSorted.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">ยังไม่มี Phase</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {phasesSorted.map((p) => (
                      <div key={p.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400">
                            order: {p.orderIndex ?? 0}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {p.startDate ? new Date(p.startDate).toLocaleDateString("th-TH") : "-"} –{" "}
                          {p.dueDate ? new Date(p.dueDate).toLocaleDateString("th-TH") : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MEMBERS */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">สมาชิกในโปรเจกต์</div>
                <div className="text-[11px] text-slate-500">
                  เลือกสมาชิกได้เลย — ตอนกด “สร้าง/บันทึก” ระบบจะ sync ให้ทันที
                </div>
              </div>
              <div className="text-xs text-slate-500">
                เลือกแล้ว {Object.values(selected).filter((v) => v != null).length} คน
              </div>
            </div>

            {membersError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {membersError}
              </div>
            ) : null}

            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="ค้นหาชื่อ / email เพื่อเพิ่มสมาชิก"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              disabled={membersLoading || submitting}
            />

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-2 text-xs font-semibold text-slate-700 border-b border-slate-100">
                ผู้ใช้ทั้งหมด
              </div>

              <div className="max-h-[320px] overflow-auto">
                {membersLoading ? (
                  <div className="p-4 text-sm text-slate-500">กำลังโหลด…</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">ไม่พบผู้ใช้</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const checked = selected[u.id] != null;

                      const safeValue = checked
                        ? normalizeRole(selected[u.id] as ProjectMemberRole)
                        : "MEMBER";

                      return (
                        <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUser(u.id)}
                              className="h-4 w-4 rounded border-slate-300"
                              disabled={submitting}
                            />

                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                              {avatarText(u.name, u.email)}
                            </span>

                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 truncate">{u.name}</div>
                              <div className="text-xs text-slate-500 truncate">{u.email}</div>
                            </div>
                          </label>

                          {checked ? (
                            <select
                              className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={safeValue}
                              onChange={(e) => changeRole(u.id, e.target.value as ProjectMemberRole)}
                              disabled={submitting}
                              title="Role"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400">* ลบสมาชิก = เอาติ๊กออก (ตอนกดบันทึกจะ sync ให้)</div>
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
              disabled={submitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "สร้าง"}
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
