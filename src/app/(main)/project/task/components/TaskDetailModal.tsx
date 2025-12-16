"use client";

import React, { useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { TrelloCard, TrelloMember } from "../../../../lib/trelloService";

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

export default function TaskDetailModal({
  open,
  onClose,
  card,
  members,
  projectTag,
}: {
  open: boolean;
  onClose: () => void;
  card: TrelloCard | null;
  members: TrelloMember[];
  projectTag?: string;
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

  if (!open || !card) return null;

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

            <h2 className="text-lg font-semibold leading-snug">{card.name}</h2>

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
                      <span className="text-white/90">
                        {m.fullName || m.username}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* desc */}
            <section className="space-y-2">
              <div className="text-sm font-semibold text-white/90">คำอธิบาย</div>
              <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80 whitespace-pre-wrap">
                {card.desc?.trim() ? card.desc : "-"}
              </div>
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
                    <div
                      key={cl.id}
                      className="rounded-2xl bg-white/5 p-4"
                    >
                      <div className="text-sm font-semibold text-white/90">
                        {cl.name || "Checklist"}
                      </div>

                      <div className="mt-3 space-y-2">
                        {(cl.checkItems ?? []).map((it) => {
                          const done = it.state === "complete";
                          return (
                            <div
                              key={it.id}
                              className="flex items-start gap-3 rounded-xl bg-white/0 px-2 py-1"
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
                                  done
                                    ? "text-white/70 line-through"
                                    : "text-white/85",
                                ].join(" ")}
                              >
                                {it.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* right (เหมือนแถบด้านขวา Trello) */}
          <aside className="space-y-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm font-semibold text-white/90">
                การทำงาน
              </div>

              <div className="mt-3 space-y-2">
                <a
                  href={card.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl bg-white/10 px-4 py-2 text-sm text-white/85 hover:bg-white/15"
                >
                  เปิดใน Trello
                </a>

                <div className="rounded-xl bg-white/5 px-4 py-3 text-xs text-white/60">
                  * ถ้าจะทำ “แก้ไขสมาชิก/วัน/Checklist ใน modal” เดี๋ยวต้องเพิ่ม
                  endpoint update ที่ฝั่ง API ด้วย
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
