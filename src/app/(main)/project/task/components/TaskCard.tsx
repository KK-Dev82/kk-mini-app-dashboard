"use client";

import React, { useMemo } from "react";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { TrelloCard } from "../../../../lib/trelloService";

const DUE_SOON_DAYS = 2;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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

function dueBadgeStyle(start?: string | null, due?: string | null) {
  const label = fmtDateRange(start, due);

  if (!due) return { className: "bg-white/15 text-white/70", label };

  const dueDate = new Date(due);
  if (Number.isNaN(dueDate.getTime()))
    return { className: "bg-white/15 text-white/70", label };

  const today = startOfDay(new Date());
  const dueDay = startOfDay(dueDate);
  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      className: "bg-red-500/25 text-red-100 ring-1 ring-red-400/30",
      label,
    };
  }

  if (diffDays <= DUE_SOON_DAYS) {
    return {
      className: "bg-amber-400/25 text-amber-100 ring-1 ring-amber-300/30",
      label,
    };
  }

  return { className: "bg-white/15 text-white/70", label };
}

function progressPercent(card: TrelloCard) {
  const total = card.badges?.checkItems ?? 0;
  const done = card.badges?.checkItemsChecked ?? 0;
  if (!total) return null;
  const pct = Math.round((done / total) * 100);
  return { total, done, pct };
}

function ProgressBar({ pct }: { pct: number }) {
  const barColor = pct === 100 ? "bg-emerald-400" : "bg-white/70";

  return (
    <div className="h-2 w-36 rounded-full bg-white/15 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function TaskCard({
  card,
  movedRef,
  onOpen,
}: {
  card: TrelloCard;
  movedRef: React.MutableRefObject<{ moved: boolean }>;
  onOpen: (card: TrelloCard) => void;
}) {
  const dateBadge = useMemo(
    () => dueBadgeStyle(card.start, card.due),
    [card.start, card.due]
  );

  const p = progressPercent(card);

  return (
    <button
      type="button"
      className="block w-full text-left rounded-xl bg-white/10 p-3 hover:bg-white/15 transition"
      title={card.desc}
      onClick={(ev) => {
        if (movedRef.current.moved) return; // กัน drag แล้วคลิก
        ev.preventDefault();
        onOpen(card); // ✅ เปิด modal
      }}
    >
      <div className="text-sm font-medium leading-snug">{card.name}</div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
        {/* ✅ progress bar + % */}
        {p && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-1">
            <CheckCircleIcon
              className={`h-4 w-4 ${p.pct === 100 ? "text-emerald-400" : ""}`}
            />
            <div className="flex items-center gap-2">
              <ProgressBar pct={p.pct} />
              <span className="min-w-[36px] text-right text-[11px] text-white/70">
                {p.pct}%
              </span>
            </div>
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
    </button>
  );
}
