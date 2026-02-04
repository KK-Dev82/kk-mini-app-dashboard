"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type {
  TrelloCard,
  TrelloMember,
  TrelloList,
} from "../../../../lib/trelloService";
import {
  updateTrelloCard,
  assignTrelloMember,
  unassignTrelloMember,
  updateChecklistItemState,
  type ChecklistItemState,
  assignTrelloCardToPhase,
} from "../../../../lib/trelloService";

import AppDatePicker from "../../../component/datepicker/AppDatePicker";

type PhaseOption = { id: string; name: string };

function fmtTH(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pct(card: TrelloCard) {
  const total = card.badges?.checkItems ?? 0;
  const done = card.badges?.checkItemsChecked ?? 0;
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function toISOFromDate(d?: Date | null) {
  if (!d) return undefined;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return undefined;
  x.setUTCHours(9, 0, 0, 0);
  return x.toISOString();
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function is404UnassignError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return (
    msg.includes("404") || msg.includes("Cannot POST") || msg.includes("/unassign")
  );
}

function stripPhaseTag(desc?: string | null) {
  if (!desc) return "";
  return desc.replace(/\[PHASE:[^\]]+\]\s*/gi, "").trim();
}

/** ---------- Checklist Draft Helpers ---------- */

function buildChecklistStateMap(card: TrelloCard): Record<string, ChecklistItemState> {
  const m: Record<string, ChecklistItemState> = {};
  for (const cl of card.checklists ?? []) {
    for (const it of cl.checkItems ?? []) {
      m[it.id] = it.state === "complete" ? "complete" : "incomplete";
    }
  }
  return m;
}

function computeBadgesFromChecklists(card: TrelloCard) {
  let total = 0;
  let done = 0;

  for (const cl of card.checklists ?? []) {
    for (const it of cl.checkItems ?? []) {
      total += 1;
      if (it.state === "complete") done += 1;
    }
  }

  return {
    ...(card.badges ?? {}),
    checkItems: total,
    checkItemsChecked: done,
  };
}

function applyChecklistDraftToCard(
  card: TrelloCard,
  draft: Record<string, ChecklistItemState>
): TrelloCard {
  const next: TrelloCard = {
    ...card,
    checklists: (card.checklists ?? []).map((cl) => ({
      ...cl,
      checkItems: (cl.checkItems ?? []).map((it) => {
        const s = draft[it.id];
        if (!s) return it;
        return { ...it, state: s };
      }),
    })),
  };

  return {
    ...next,
    badges: computeBadgesFromChecklists(next),
  };
}

// จำกัดจำนวน request พร้อมกัน (กันช้า/กันโดน rate limit)
async function asyncPool<T, R>(
  limit: number,
  arr: T[],
  worker: (item: T, index: number) => Promise<R>
) {
  const ret: R[] = new Array(arr.length);
  let idx = 0;

  const runners = new Array(Math.min(limit, arr.length)).fill(null).map(async () => {
    while (idx < arr.length) {
      const current = idx++;
      ret[current] = await worker(arr[current], current);
    }
  });

  await Promise.all(runners);
  return ret;
}

export default function TaskDetailModal({
  open,
  onClose,
  card,
  members,
  projectTag,
  lists,
  phases,
  onUpdated,
  onReload,
}: {
  open: boolean;
  onClose: () => void;
  card: TrelloCard | null;
  members: TrelloMember[];
  projectTag?: string;
  lists: TrelloList[];
  phases: PhaseOption[];
  onUpdated: (next: TrelloCard) => void;
  onReload: () => void | Promise<void>;
}) {
  const memberMap = useMemo(() => {
    const m = new Map<string, TrelloMember>();
    for (const x of members ?? []) m.set(x.id, x);
    return m;
  }, [members]);

  const selectedMembers = useMemo(() => {
    const ids = card?.idMembers ?? [];
    return ids.map((id) => memberMap.get(id)).filter(Boolean) as TrelloMember[];
  }, [card?.idMembers, memberMap]);

  const progress = useMemo(() => (card ? pct(card) : 0), [card]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  // ✅ checklist: draft + confirm
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [checklistErr, setChecklistErr] = useState<string>("");
  const [checklistDraft, setChecklistDraft] = useState<Record<string, ChecklistItemState>>(
    {}
  );
  const checklistOriginalRef = useRef<Record<string, ChecklistItemState>>({});

  const [form, setForm] = useState<{
    listId: string;
    name: string;
    desc: string;
    startDate: Date | null;
    dueDate: Date | null;
    memberIds: string[];
    phaseId: string; // "" = remove phase (ถ้า backend รองรับ)
  }>({
    listId: "",
    name: "",
    desc: "",
    startDate: null,
    dueDate: null,
    memberIds: [],
    phaseId: "",
  });

  const phaseNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of phases ?? []) m.set(p.id, p.name);
    return m;
  }, [phases]);

  useEffect(() => {
    if (!card) return;

    setEditing(false);
    setErr("");
    setSaving(false);

    // ✅ reset checklist draft
    setChecklistSaving(false);
    setChecklistErr("");
    const initMap = buildChecklistStateMap(card);
    checklistOriginalRef.current = initMap;
    setChecklistDraft(initMap);

    const initialPhaseId = String(((card as any).phaseId as string | undefined) ?? "").trim();

    setForm({
      listId: (card as any).idList ?? "",
      name: card.name ?? "",
      desc: stripPhaseTag(card.desc ?? ""),
      startDate: card.start ? new Date(card.start) : null,
      dueDate: card.due ? new Date(card.due) : null,
      memberIds: uniq(card.idMembers ?? []),
      phaseId: initialPhaseId,
    });
  }, [card?.id]);

  // ✅ ต้องอยู่ "ก่อน" early return เสมอ (แก้ Hook order warning)
  const cardPhaseId = useMemo(() => {
    return String(((card as any)?.phaseId as string | undefined) ?? "").trim();
  }, [card]);

  const cardPhaseName = useMemo(() => {
    return String(((card as any)?.phaseName as string | undefined) ?? "").trim();
  }, [card]);

  const displayPhaseName = useMemo(() => {
    if (!card) return "";
    if (editing) {
      const id = (form.phaseId ?? "").trim();
      return id ? phaseNameMap.get(id) ?? "" : "";
    }
    if (cardPhaseName) return cardPhaseName;
    if (cardPhaseId) return phaseNameMap.get(cardPhaseId) ?? "";
    return "";
  }, [card, editing, form.phaseId, phaseNameMap, cardPhaseId, cardPhaseName]);

  // ✅ diff checklist changes (draft vs original)
  const checklistChanges = useMemo(() => {
    if (!card) return [];
    const original = checklistOriginalRef.current;
    const draft = checklistDraft;

    const changes: { id: string; state: ChecklistItemState }[] = [];
    for (const [id, state] of Object.entries(draft)) {
      const prev = original[id];
      if (!prev) continue;
      if (prev !== state) changes.push({ id, state });
    }
    return changes;
  }, [card, checklistDraft]);

  const pendingCount = checklistChanges.length;

  // ✅ early return หลัง hook ทั้งหมด
  if (!open || !card) return null;

  const canSave = form.listId.trim() && form.name.trim();

  const toggleMember = (id: string) => {
    setForm((p) => {
      const has = p.memberIds.includes(id);
      const next = has ? p.memberIds.filter((x) => x !== id) : [...p.memberIds, id];
      return { ...p, memberIds: uniq(next) };
    });
  };

  // ✅ toggle ใน draft (ไม่ยิง API)
  const handleToggleChecklistDraft = (checkItemId: string) => {
    if (checklistSaving) return;

    setChecklistErr("");

    const current = checklistDraft[checkItemId] ?? "incomplete";
    const nextState: ChecklistItemState = current === "complete" ? "incomplete" : "complete";

    const nextDraft = { ...checklistDraft, [checkItemId]: nextState };
    setChecklistDraft(nextDraft);

    // ✅ อัปเดต UI ทันที (progress เปลี่ยนทันที)
    onUpdated(applyChecklistDraftToCard(card, nextDraft));
  };

  const handleResetChecklistChanges = () => {
    const original = checklistOriginalRef.current;
    setChecklistErr("");
    setChecklistDraft(original);
    onUpdated(applyChecklistDraftToCard(card, original));
  };

  // ✅ ยิง API ตอนกด “ยืนยัน” เท่านั้น
  const handleConfirmChecklistUpdate = async () => {
    if (!card?.id) return;
    if (pendingCount === 0) return;

    try {
      setChecklistErr("");
      setChecklistSaving(true);

      const concurrency = 8;

      const results = await asyncPool(concurrency, checklistChanges, async (it) => {
        try {
          await updateChecklistItemState(card.id, it.id, it.state);
          return { id: it.id, ok: true as const };
        } catch (e) {
          return {
            id: it.id,
            ok: false as const,
            error: e instanceof Error ? e.message : String(e ?? "failed"),
          };
        }
      });

      const failed = results.filter((x) => !x.ok);

      if (failed.length > 0) {
        setChecklistErr(`อัปเดตไม่สำเร็จ ${failed.length} รายการ`);
        // เพื่อความชัวร์ ดึงของจริงจาก server
        await onReload();
        return;
      }

      // ✅ commit draft -> original
      checklistOriginalRef.current = { ...checklistDraft };

      // ✅ reload ทีเดียว
      await onReload();
    } finally {
      setChecklistSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setErr("");
      if (!canSave) {
        setErr("กรุณากรอกชื่อ และเลือกคอลัมน์ (list)");
        return;
      }

      setSaving(true);

      const cleanDesc = stripPhaseTag(form.desc ?? "");

      // 1) update trello card details
      const updated = await updateTrelloCard(card.id, {
        listId: form.listId.trim(),
        name: form.name.trim(),
        desc: cleanDesc,
        startDate: toISOFromDate(form.startDate),
        dueDate: toISOFromDate(form.dueDate),
      });

      // 2) sync members
      const prev = new Set(card.idMembers ?? []);
      const next = new Set(form.memberIds ?? []);
      const toAdd = Array.from(next).filter((id) => !prev.has(id));
      const toRemove = Array.from(prev).filter((id) => !next.has(id));

      for (const memberId of toAdd) {
        await assignTrelloMember(card.id, memberId);
      }

      for (const memberId of toRemove) {
        try {
          await unassignTrelloMember(card.id, memberId);
        } catch (e) {
          if (is404UnassignError(e)) continue;
          throw e;
        }
      }

      // 3) sync phase
      let createdTaskId: string | undefined;

      const nextPhaseId = (form.phaseId ?? "").trim();
      const nextPhaseName = nextPhaseId ? phaseNameMap.get(nextPhaseId) ?? "" : "";

      if (nextPhaseId) {
        const res = await assignTrelloCardToPhase(card.id, nextPhaseId);
        createdTaskId = res?.task?.id;
      }

      // 4) optimistic patch (สำคัญ: ใส่ phaseName ด้วย)
      onUpdated({
        ...card,
        ...updated,
        idMembers: uniq(form.memberIds ?? []),

        ...(createdTaskId ? { taskId: createdTaskId } : {}),

        ...(nextPhaseId
          ? { phaseId: nextPhaseId, phaseName: nextPhaseName }
          : { phaseId: "", phaseName: "" }),
      } as any);

      // 5) refetch
      await onReload();

      setEditing(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update card failed";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const shownDesc = stripPhaseTag(card.desc);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {!!projectTag && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                  [{projectTag}]
                </span>
              )}
              {(card.labels ?? []).map((lb) => (
                <span
                  key={lb.id}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"
                  title={lb.color ?? ""}
                >
                  {lb.name || lb.color || "label"}
                </span>
              ))}
              <span className="rounded-full bg-indigo-400/20 px-3 py-1 text-xs text-indigo-100 ring-1 ring-indigo-300/20">
                Phase: {displayPhaseName ? displayPhaseName : "(ไม่อยู่ใน Phase)"}
              </span>
            </div>

            {!editing ? (
              <h2 className="text-lg font-semibold leading-snug">{card.name}</h2>
            ) : (
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                placeholder="Task title"
                disabled={saving}
              />
            )}

            <div className="text-xs text-white/60">
              Start: {fmtTH(card.start)} • Due: {fmtTH(card.due)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="space-y-2">
              <div className="text-sm font-semibold text-white/90">สมาชิก</div>
              {selectedMembers.length === 0 ? (
                <div className="text-sm text-white/60">-</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                        {(m.initials || m.fullName?.[0] || m.username?.[0] || "?")
                          .toString()
                          .toUpperCase()}
                      </span>
                      <span className="text-white/90">{m.fullName || m.username}</span>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <div className="text-sm font-semibold text-white/90">คำอธิบาย</div>
              {!editing ? (
                <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80 whitespace-pre-wrap">
                  {shownDesc ? shownDesc : "-"}
                </div>
              ) : (
                <textarea
                  value={form.desc}
                  onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
                  rows={5}
                  className="w-full rounded-2xl bg-white/10 p-4 text-sm text-white/90 outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="รายละเอียด..."
                  disabled={saving}
                />
              )}
            </section>

            {/* ✅ CHECKLIST */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">
                  ขั้นตอนการทำงาน (Checklist)
                </div>
                <div className="text-xs text-white/60">
                  {progress}% ({card.badges?.checkItemsChecked ?? 0}/
                  {card.badges?.checkItems ?? 0})
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400/80 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {(card.checklists ?? []).length === 0 ? (
                <div className="text-sm text-white/60">-</div>
              ) : (
                <div className="space-y-3">
                  {card.checklists.map((cl) => (
                    <div key={cl.id} className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white/90">
                        {cl.name || "Checklist"}
                      </div>

                      <div className="mt-3 space-y-2">
                        {(cl.checkItems ?? []).map((it) => {
                          const draftState =
                            checklistDraft[it.id] ??
                            (it.state === "complete" ? "complete" : "incomplete");

                          const done = draftState === "complete";
                          const orig = checklistOriginalRef.current[it.id];
                          const dirty = orig ? orig !== draftState : false;

                          return (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => handleToggleChecklistDraft(it.id)}
                              disabled={checklistSaving}
                              className={[
                                "w-full text-left flex items-start gap-3 rounded-xl px-2 py-1",
                                "hover:bg-white/5 transition",
                                checklistSaving ? "opacity-60 cursor-not-allowed" : "",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border",
                                  done
                                    ? "border-emerald-300/50 bg-emerald-400/20"
                                    : "border-white/20 bg-white/5",
                                ].join(" ")}
                                aria-hidden
                              >
                                {done ? "✓" : ""}
                              </span>

                              <div
                                className={[
                                  "text-sm flex items-center gap-2",
                                  done ? "text-white/70 line-through" : "text-white/85",
                                ].join(" ")}
                              >
                                <span>{it.name}</span>
                                {dirty ? (
                                  <span className="text-[11px] rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-100 ring-1 ring-amber-300/20">
                                    ยังไม่บันทึก
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ✅ action bar: ยืนยันทีเดียว */}
              {pendingCount > 0 ? (
                <div className="rounded-2xl bg-amber-400/10 p-3 ring-1 ring-amber-300/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-amber-100">
                      มีการเปลี่ยนแปลง {pendingCount} รายการ (ยังไม่บันทึก)
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleResetChecklistChanges}
                        disabled={checklistSaving}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white/85 hover:bg-white/15 disabled:opacity-60"
                      >
                        ยกเลิกการเปลี่ยนแปลง
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmChecklistUpdate}
                        disabled={checklistSaving}
                        className="rounded-xl bg-emerald-500/80 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {checklistSaving ? "กำลังอัปเดต..." : "ยืนยันการอัปเดต"}
                      </button>
                    </div>
                  </div>

                  {checklistErr ? (
                    <div className="mt-2 rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-100 ring-1 ring-red-400/20">
                      {checklistErr}
                    </div>
                  ) : null}
                </div>
              ) : checklistErr ? (
                <div className="rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-100 ring-1 ring-red-400/20">
                  {checklistErr}
                </div>
              ) : null}
            </section>
          </div>

          {/* right */}
          <aside className="space-y-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm font-semibold text-white/90">การทำงาน</div>

              <div className="mt-3 space-y-3">
                <a
                  href={card.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl bg-white/10 px-4 py-2 text-sm text-white/85 hover:bg-white/15"
                >
                  เปิดใน Trello
                </a>

                {!editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm text-white/85 hover:bg-white/15"
                  >
                    แก้ไขการ์ด
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* phase picker */}
                    <div className="space-y-1">
                      <div className="text-xs text-white/60">Phase</div>
                      <select
                        value={form.phaseId}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, phaseId: e.target.value }))
                        }
                        className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10"
                        disabled={saving}
                      >
                        <option value="" className="text-slate-900">
                          (ไม่อยู่ใน Phase)
                        </option>
                        {(phases ?? []).map((p) => (
                          <option key={p.id} value={p.id} className="text-slate-900">
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* list */}
                    <div className="space-y-1">
                      <div className="text-xs text-white/60">คอลัมน์ (List)</div>
                      <select
                        value={form.listId}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, listId: e.target.value }))
                        }
                        className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10"
                        disabled={saving}
                      >
                        {(lists ?? []).filter((l) => !l.closed).map((l) => (
                          <option key={l.id} value={l.id} className="text-slate-900">
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* members picker */}
                    <div className="space-y-1">
                      <div className="text-xs text-white/60">Assignees</div>
                      <div className="max-h-40 overflow-y-auto rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
                        {(members ?? []).length === 0 ? (
                          <div className="px-2 py-2 text-xs text-white/50">ไม่มีสมาชิก</div>
                        ) : (
                          (members ?? []).map((m) => {
                            const checked = form.memberIds.includes(m.id);
                            return (
                              <label
                                key={m.id}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-white/20 bg-white/10"
                                  checked={checked}
                                  onChange={() => toggleMember(m.id)}
                                  disabled={saving}
                                />
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold">
                                  {(m.initials ||
                                    m.fullName?.[0] ||
                                    m.username?.[0] ||
                                    "?")
                                    .toString()
                                    .toUpperCase()}
                                </span>
                                <span className="text-sm text-white/85">
                                  {m.fullName || m.username}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* dates */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-xs text-white/60">Start</div>
                        <AppDatePicker
                          value={form.startDate}
                          onChange={(d) => setForm((p) => ({ ...p, startDate: d }))}
                          placeholder="เลือกวันที่เริ่ม"
                          disabled={saving}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-white/60">Due</div>
                        <AppDatePicker
                          value={form.dueDate}
                          onChange={(d) => setForm((p) => ({ ...p, dueDate: d }))}
                          placeholder="เลือกวันที่สิ้นสุด"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    {err ? (
                      <div className="rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-100 ring-1 ring-red-400/20">
                        {err}
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="flex-1 rounded-xl bg-white/10 px-4 py-2 text-sm text-white/85 hover:bg-white/15"
                        disabled={saving}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 rounded-xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                        disabled={saving || !canSave}
                      >
                        {saving ? "Saving..." : "บันทึก"}
                      </button>
                    </div>

                    <div className="text-[11px] text-white/40">
                      * ตอนนี้ backend ยังไม่มี unassign → เอาสมาชิกออกอาจยังไม่ sync แต่จะไม่ทำให้บันทึกล้ม
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
