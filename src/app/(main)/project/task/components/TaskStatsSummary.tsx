"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EllipsisHorizontalIcon,
  PlusIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import TaskModal from "./TaskModal";
import {
  fetchTrelloCardsByTag,
  type TrelloCard,
} from "../../../../lib/trelloService";

const columns = [
  { key: "todo", label: "สิ่งที่ต้องทำ" },
  { key: "doing", label: "กำลังทำ" },
  { key: "done", label: "เสร็จ" },
] as const;

type Props = {
  projectTag: string; // เช่น ECOM / ELEARN / MOBILE
};

function normalizeListName(v?: string | null) {
  return (v ?? "").trim().toLowerCase();
}

function listNameToColumnKey(listName?: string | null) {
  const n = normalizeListName(listName);

  if (n === "to do" || n === "todo") return "todo";
  if (n === "doing" || n === "in progress") return "doing";
  if (n === "done" || n === "complete" || n === "completed") return "done";

  if (n === "สิ่งที่ต้องทำ") return "todo";
  if (n === "กำลังทำ") return "doing";
  if (n === "เสร็จ") return "done";

  // ไม่รู้จักจริง ๆ
  return null;
}

function fmtShortTH(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
}

function fmtDateRange(start?: string | null, due?: string | null) {
  const s = fmtShortTH(start);
  const e = fmtShortTH(due);
  if (s && e) return `${s} - ${e}`;
  return s || e || "";
}

/* ─────────────────────────────────────────────
 *  DUE BADGE COLOR
 *  - เลยกำหนด = แดง
 *  - ใกล้หมด (ภายใน N วัน รวมวันนี้) = เหลือง
 * ───────────────────────────────────────────── */
const DUE_SOON_DAYS = 2; // ปรับได้ตามต้องการ

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dueBadgeStyle(start?: string | null, due?: string | null) {
  const label = fmtDateRange(start, due);

  // ถ้าไม่มี due หรือแปลงไม่ได้ -> ใช้สีเดิม
  if (!due) {
    return { className: "bg-white/15 text-white/70", label };
  }

  const dueDate = new Date(due);
  if (Number.isNaN(dueDate.getTime())) {
    return { className: "bg-white/15 text-white/70", label };
  }

  const today = startOfDay(new Date());
  const dueDay = startOfDay(dueDate);

  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / 86400000);

  // เลยกำหนด
  if (diffDays < 0) {
    return {
      className: "bg-red-500/25 text-red-100 ring-1 ring-red-400/30",
      label,
    };
  }

  // ใกล้หมด (รวมวันนี้)
  if (diffDays <= DUE_SOON_DAYS) {
    return {
      className: "bg-amber-400/25 text-amber-100 ring-1 ring-amber-300/30",
      label,
    };
  }

  // ปกติ
  return { className: "bg-white/15 text-white/70", label };
}

function progressText(card: TrelloCard) {
  const checkItems = card.badges?.checkItems ?? 0;
  const checked = card.badges?.checkItemsChecked ?? 0;
  return checkItems ? `${checked}/${checkItems}` : "";
}

export default function TaskStatsSummary({ projectTag }: Props) {
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [activeColumn, setActiveColumn] =
    useState<(typeof columns)[number]["key"]>("todo");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    fetchTrelloCardsByTag(projectTag)
      .then((data) => {
        if (cancelled) return;
        setCards((data ?? []).filter((c) => !c.closed));
      })
      .catch((e) => console.error("Failed to load trello cards by tag", e))
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectTag]);

  const grouped = useMemo(() => {
    const byCol: Record<"todo" | "doing" | "done", TrelloCard[]> = {
      todo: [],
      doing: [],
      done: [],
    };

    for (const c of cards) {
      const colKey = listNameToColumnKey((c as any).listName);

      if (colKey) byCol[colKey].push(c);
      else {
        console.warn("Unknown listName:", (c as any).listName, c);
      }
    }

    (Object.keys(byCol) as Array<keyof typeof byCol>).forEach((k) => {
      byCol[k].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
    });

    return byCol;
  }, [cards]);

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.key}
            className="rounded-2xl bg-slate-900 text-white p-4 min-h-[180px] flex flex-col shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-[11px] text-white/60">
                  {loading ? "..." : grouped[col.key].length}
                </span>
              </div>

              <button className="text-slate-300 hover:text-white">
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="text-xs text-white/60">Loading…</div>
              ) : grouped[col.key].length === 0 ? (
                <div className="text-xs text-white/50">ยังไม่มีการ์ด</div>
              ) : (
                grouped[col.key].map((card) => {
                  const prog = progressText(card);
                  const dateBadge = dueBadgeStyle(card.start, card.due);

                  return (
                    <a
                      key={card.id}
                      href={card.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl bg-white/10 p-3 hover:bg-white/15 transition"
                      title={card.desc}
                    >
                      <div className="text-sm font-medium leading-snug">
                        {card.name}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                        {!!prog && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
                            <CheckCircleIcon className="h-4 w-4" />
                            {prog}
                          </span>
                        )}

                        {!!card.idMembers?.length && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
                            <UserGroupIcon className="h-4 w-4" />
                            {card.idMembers.length}
                          </span>
                        )}

                        {!!dateBadge.label && (
                          <span
                            className={[
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                              dateBadge.className,
                            ].join(" ")}
                          >
                            <CalendarDaysIcon className="h-4 w-4" />
                            {dateBadge.label}
                          </span>
                        )}
                      </div>
                    </a>
                  );
                })
              )}
            </div>

            <div className="mt-auto pt-3">
              <button
                onClick={() => {
                  setActiveColumn(col.key);
                  setOpen(true);
                }}
                className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
              >
                <PlusIcon className="h-4 w-4" />
                เพิ่มการ์ด
              </button>
            </div>
          </div>
        ))}
      </div>

      <TaskModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(data) => {
          console.log("create task in:", activeColumn, data, "tag:", projectTag);
        }}
      />
    </>
  );
}
