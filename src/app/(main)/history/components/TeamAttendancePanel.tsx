"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import {
  fetchMyCheckinHistory,
  fetchCheckinHistoryByUserId,
  type CheckinHistoryItem,
} from "../../../lib/checkinHistoryService";

type Mode = "me" | "user";
type TypeUI = "CHECK_IN" | "CHECK_OUT" | "OTHER";

function toTypeUI(t: string): TypeUI {
  if (t === "CHECK_IN") return "CHECK_IN";
  if (t === "CHECK_OUT") return "CHECK_OUT";
  return "OTHER";
}

const TYPE_STYLES: Record<TypeUI, { pill: string; text: string }> = {
  CHECK_IN: { pill: "bg-emerald-50", text: "text-emerald-700" },
  CHECK_OUT: { pill: "bg-amber-50", text: "text-amber-700" },
  OTHER: { pill: "bg-slate-100", text: "text-slate-700" },
};

function formatThaiDate(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

function formatTimeHHmm(isoDateTime: string) {
  const d = new Date(isoDateTime);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isoDateOnly(isoDateTime: string) {
  return isoDateTime.slice(0, 10);
}

function withinLastNDays(dateIso: string, n: number) {
  const d = new Date(dateIso + "T00:00:00").getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= n;
}

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl border p-3 text-left transition",
        active
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="text-lg font-semibold text-slate-900 leading-none">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{label}</div>
    </button>
  );
}

export default function TeamAttendancePanel() {
  const [mode, setMode] = useState<Mode>("me");
  const [userId, setUserId] = useState<string>("");

  const [dateValue, setDateValue] = useState<string>("last7"); // today | last7 | all
  const [activeType, setActiveType] = useState<TypeUI | "All">("All");

  const [data, setData] = useState<CheckinHistoryItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const dateOptions = useMemo(
    () => [
      { value: "today", label: "Today" },
      { value: "last7", label: "Last 7 Days" },
      { value: "all", label: "All" },
    ],
    []
  );

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res =
        mode === "me"
          ? await fetchMyCheckinHistory()
          : await fetchCheckinHistoryByUserId(userId.trim());

      setData(res ?? []);
    } catch (e) {
      console.error(e);
      setError("Failed to load check-in history");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "me") {
      load();
    } else {
      setData(null);
      setLoading(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const filteredByDate = useMemo(() => {
    const list = data ?? [];
    if (dateValue === "all") return list;

    if (dateValue === "today") {
      const todayIso = new Date().toISOString().slice(0, 10);
      return list.filter((x) => isoDateOnly(x.createdAt) === todayIso);
    }

    return list.filter((x) => withinLastNDays(isoDateOnly(x.createdAt), 7));
  }, [data, dateValue]);

  const normalized = useMemo(() => {
    return filteredByDate.map((x) => ({
      ...x,
      _date: isoDateOnly(x.createdAt),
      _time: formatTimeHHmm(x.createdAt),
      _type: toTypeUI(String(x.type)),
    }));
  }, [filteredByDate]);

  const counts = useMemo(() => {
    let inCount = 0;
    let outCount = 0;
    let other = 0;
    for (const x of normalized) {
      if (x._type === "CHECK_IN") inCount += 1;
      else if (x._type === "CHECK_OUT") outCount += 1;
      else other += 1;
    }
    return { inCount, outCount, other, total: normalized.length };
  }, [normalized]);

  const filteredByType = useMemo(() => {
    if (activeType === "All") return normalized;
    return normalized.filter((x) => x._type === activeType);
  }, [normalized, activeType]);

  const groupedByDate = useMemo(() => {
    return filteredByType.reduce<Record<string, typeof filteredByType>>(
      (acc, item) => {
        const key = item._date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {}
    );
  }, [filteredByType]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort(
      (a, b) =>
        new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()
    );
  }, [groupedByDate]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Check-in History
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {mode === "me"
              ? "GET /checkin/history (proxy uses env token)"
              : "GET /checkin/user/{userId}/history (no auth)"}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => {
            const blob = new Blob([JSON.stringify(filteredByType, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `checkin-history-${mode}-${new Date()
              .toISOString()
              .slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("me")}
          className={[
            "rounded-xl border px-4 py-2 text-sm font-medium transition text-left",
            mode === "me"
              ? "border-blue-200 bg-blue-50 text-slate-900"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
          ].join(" ")}
        >
          My History (Auth)
          <div className="mt-0.5 text-[11px] text-slate-500">
            /checkin/history
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("user")}
          className={[
            "rounded-xl border px-4 py-2 text-sm font-medium transition text-left",
            mode === "user"
              ? "border-blue-200 bg-blue-50 text-slate-900"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
          ].join(" ")}
        >
          By User ID (Public)
          <div className="mt-0.5 text-[11px] text-slate-500">
            /checkin/user/{`{userId}`}/history
          </div>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative">
          <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {dateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={mode !== "user"}
            placeholder={mode === "user" ? "Enter userId (required)" : "Disabled"}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {mode === "user" && (
            <button
              type="button"
              onClick={() => load()}
              disabled={!userId.trim()}
              className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Load User History
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard
          label="Check-in"
          value={counts.inCount}
          active={activeType === "CHECK_IN"}
          onClick={() =>
            setActiveType((s) => (s === "CHECK_IN" ? "All" : "CHECK_IN"))
          }
        />
        <StatCard
          label="Check-out"
          value={counts.outCount}
          active={activeType === "CHECK_OUT"}
          onClick={() =>
            setActiveType((s) => (s === "CHECK_OUT" ? "All" : "CHECK_OUT"))
          }
        />
        <StatCard
          label="Other"
          value={counts.other}
          active={activeType === "OTHER"}
          onClick={() =>
            setActiveType((s) => (s === "OTHER" ? "All" : "OTHER"))
          }
        />
      </div>

      <div className="mt-4 space-y-6">
        {sortedDates.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No records
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="space-y-3">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {formatThaiDate(date)}
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {groupedByDate[date]
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((x: any) => {
                  const st = TYPE_STYLES[x._type];
                  return (
                    <div
                      key={x.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">
                            {x.worksite?.name ?? "Worksite"}
                          </div>
                          <div className="text-xs text-slate-500">
                            • {x._time}
                          </div>
                        </div>

                        <div className="mt-1 text-xs text-slate-600">
                          Distance:{" "}
                          <span className="font-medium text-slate-900">
                            {Number(x.distance ?? 0).toFixed(1)} m
                          </span>
                          {x.worksite?.radius != null && (
                            <>
                              {" "}
                              • Radius:{" "}
                              <span className="font-medium text-slate-900">
                                {Number(x.worksite.radius).toFixed(0)} m
                              </span>
                            </>
                          )}
                        </div>

                        {x.notes ? (
                          <div className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {x.notes}
                          </div>
                        ) : null}
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                          st.pill,
                          st.text,
                        ].join(" ")}
                      >
                        {x._type === "OTHER" ? String(x.type) : x._type}
                      </span>
                    </div>
                  );
                })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
