"use client";

import React, { useEffect, useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { TrelloCard, TrelloMember, TrelloList } from "../../../../lib/trelloService";
import {
  updateTrelloCard,
  assignTrelloMember,
  unassignTrelloMember,
  updateChecklistItemState,
  type ChecklistItemState,
} from "../../../../lib/trelloService";

import AppDatePicker from "../../../component/datepicker/AppDatePicker";

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
  return msg.includes("404") || msg.includes("Cannot POST") || msg.includes("/unassign");
}

export default function TaskDetailModal({
  open,
  onClose,
  card,
  members,
  projectTag,
  lists,
  onUpdated,
  onReload,
}: {
  open: boolean;
  onClose: () => void;
  card: TrelloCard | null;
  members: TrelloMember[];
  projectTag?: string;
  lists: TrelloList[];
  onUpdated: (next: TrelloCard) => void;

  /** ✅ หลังบันทึก/ติ๊ก checklist ให้ refetch cards ใหม่ */
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

  // ✅ loading ของ checklist (กันกดรัว)
  const [checkingId, setCheckingId] = useState<string>("");

  const [form, setForm] = useState<{
    listId: string;
    name: string;
    desc: string;
    startDate: Date | null;
    dueDate: Date | null;
    memberIds: string[];
  }>({
    listId: "",
    name: "",
    desc: "",
    startDate: null,
    dueDate: null,
    memberIds: [],
  });

  useEffect(() => {
    if (!card) return;

    setEditing(false);
    setErr("");
    setSaving(false);
    setCheckingId("");

    setForm({
      listId: (card as any).idList ?? "",
      name: card.name ?? "",
      desc: card.desc ?? "",
      startDate: card.start ? new Date(card.start) : null,
      dueDate: card.due ? new Date(card.due) : null,
      memberIds: uniq(card.idMembers ?? []),
    });
  }, [card?.id]);

  if (!open || !card) return null;

  const canSave = form.listId.trim() && form.name.trim();

  const toggleMember = (id: string) => {
    setForm((p) => {
      const has = p.memberIds.includes(id);
      const next = has ? p.memberIds.filter((x) => x !== id) : [...p.memberIds, id];
      return { ...p, memberIds: uniq(next) };
    });
  };

  /** ✅ Optimistic update checklist state ใน UI ก่อน */
  const patchChecklistItem = (checkItemId: string, nextState: ChecklistItemState) => {
    const nextCard: TrelloCard = {
      ...card,
      checklists: (card.checklists ?? []).map((cl) => ({
        ...cl,
        checkItems: (cl.checkItems ?? []).map((it) =>
          it.id === checkItemId ? { ...it, state: nextState } : it
        ),
      })),
    };
    onUpdated(nextCard);
  };

  /** ✅ กดติ๊ก checklist แล้ว call PUT */
  const handleToggleChecklist = async (checkItemId: string, currentState: string) => {
    if (!card?.id) return;

    const nextState: ChecklistItemState =
      currentState === "complete" ? "incomplete" : "complete";

    try {
      setErr("");
      setCheckingId(checkItemId);

      // 1) optimistic UI
      patchChecklistItem(checkItemId, nextState);

      // 2) call API
      await updateChecklistItemState(card.id, checkItemId, nextState);

      // 3) refetch เพื่อให้ badges/progress ตรง backend (แทน F5)
      await onReload();
    } catch (e) {
      // rollback (ถ้า error ให้กลับไป state เดิม)
      patchChecklistItem(checkItemId, currentState === "complete" ? "complete" : "incomplete");

      const msg = e instanceof Error ? e.message : "Update checklist failed";
      setErr(msg);
    } finally {
      setCheckingId("");
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

      // 1) update card details
      const updated = await updateTrelloCard(card.id, {
        listId: form.listId.trim(),
        name: form.name.trim(),
        desc: form.desc ?? "",
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

      // backend ยังไม่มี unassign → ไม่ให้ save พัง
      for (const memberId of toRemove) {
        try {
          await unassignTrelloMember(card.id, memberId);
        } catch (e) {
          if (is404UnassignError(e)) continue;
          throw e;
        }
      }

      // 3) optimistic patch
      onUpdated({
        ...card,
        ...updated,
        idMembers: uniq(form.memberIds ?? []),
      });

      // 4) refetch (เอา checklist/badges กลับมาครบ)
      await onReload();

      setEditing(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update card failed";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/10">
        {/* header */}
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

        {/* body */}
        <div className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[1fr_320px]">
          {/* left */}
          <div className="space-y-6">
            {/* members */}
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

            {/* desc */}
            <section className="space-y-2">
              <div className="text-sm font-semibold text-white/90">คำอธิบาย</div>
              {!editing ? (
                <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80 whitespace-pre-wrap">
                  {card.desc?.trim() ? card.desc : "-"}
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

            {/* checklist */}
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
                          const done = it.state === "complete";
                          const busy = checkingId === it.id;

                          return (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => handleToggleChecklist(it.id, it.state)}
                              disabled={busy}
                              className={[
                                "w-full text-left flex items-start gap-3 rounded-xl px-2 py-1",
                                "hover:bg-white/5 transition",
                                busy ? "opacity-60 cursor-not-allowed" : "",
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
                                  "text-sm",
                                  done ? "text-white/70 line-through" : "text-white/85",
                                ].join(" ")}
                              >
                                {it.name}
                                {busy ? <span className="ml-2 text-xs text-white/40">...</span> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    {/* list */}
                    <div className="space-y-1">
                      <div className="text-xs text-white/60">คอลัมน์ (List)</div>
                      <select
                        value={form.listId}
                        onChange={(e) => setForm((p) => ({ ...p, listId: e.target.value }))}
                        className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10"
                        disabled={saving}
                      >
                        {(lists ?? [])
                          .filter((l) => !l.closed)
                          .map((l) => (
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
                                  {(m.initials || m.fullName?.[0] || m.username?.[0] || "?")
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
