"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

import {
  fetchTodaysAttendance,
  type DailyAttendanceItem,
  type DailyCheckin,
  type LeaveType,
  type LocationType,
} from "../../../lib/todaysAttendanceService";

import AttendanceRecordsTable, {
  type AttendanceTableRow,
  type StatusUI,
} from "../../component/AttendanceRecordsTable";

/** ---------- UI helpers ---------- */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function msToHm(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

function fmtDistance(raw?: string | null) {
  const n = Number(raw ?? "");
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}km`;
  return `${Math.round(n)}m`;
}

function leaveLabel(t: LeaveType) {
  switch (t) {
    case "SICK_LEAVE":
      return "Sick";
    case "PERSONAL_LEAVE":
      return "Personal";
    case "ANNUAL_LEAVE":
      return "Annual";
    default:
      return "Leave";
  }
}

function statusBadge(item: DailyAttendanceItem): {
  text: string;
  ui: StatusUI;
} {
  const latest = item.latestCheckin ?? null;

  const hasLeave =
    (latest?.type === "LEAVE" && latest.leaveType !== "NONE") ||
    item.todayCheckins.some((c) => c.type === "LEAVE" && c.leaveType !== "NONE");

  if (hasLeave) {
    const leave =
      item.todayCheckins.find((c) => c.type === "LEAVE" && c.leaveType !== "NONE") ??
      latest;
    const txt =
      leave && leave.type === "LEAVE"
        ? `LEAVE - ${leaveLabel(leave.leaveType)}`
        : "LEAVE";
    return { text: txt, ui: "LEAVE" };
  }

  if (latest?.location === "ONSITE") return { text: "ONSITE", ui: "ONSITE" };
  if (latest?.location === "OFFSITE") return { text: "OFFSITE", ui: "OFFSITE" };

  return { text: "NOT CHECKED", ui: "UNKNOWN" };
}

function pickFirstOfType(checkins: DailyCheckin[], type: DailyCheckin["type"]) {
  const sorted = [...checkins].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return sorted.find((c) => c.type === type) ?? null;
}

function pickLastOfType(checkins: DailyCheckin[], type: DailyCheckin["type"]) {
  const sorted = [...checkins].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return sorted.reverse().find((c) => c.type === type) ?? null;
}

function typeTextFrom(latest?: DailyCheckin | null) {
  if (!latest) return "—";
  if (latest.type === "CHECK_IN") return "CHECK_IN";
  if (latest.type === "CHECK_OUT") return "CHECK_OUT";
  if (latest.type === "LEAVE") return latest.leaveType !== "NONE" ? "LEAVE" : "—";
  return "—";
}

function worksiteNameFrom(latest?: DailyCheckin | null) {
  const ws = latest?.worksite as any;
  const name = ws?.name || ws?.title || ws?.worksiteName;
  if (typeof name === "string" && name.trim()) return name.trim();
  if (latest?.worksiteId) return `#${latest.worksiteId}`;
  return "—";
}

type Summary = {
  checkIn: number;
  checkOut: number;
  leave: number;
  notChecked: number;

  onsite: number;
  offsite: number;
};

const summaryConfig = [
  { key: "checkIn", label: "CHECK_IN", icon: ClockIcon },
  { key: "checkOut", label: "CHECK_OUT", icon: ArrowTrendingUpIcon },
  { key: "leave", label: "LEAVE", icon: UserGroupIcon },
  { key: "notChecked", label: "NOT_CHECKED", icon: ExclamationTriangleIcon },
] as const;

export default function AttendanceSummaryCard() {
  const router = useRouter();
  const TARGET_PATH = "/history?tab=attendance";

  const [rows, setRows] = useState<DailyAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ONSITE" | "OFFSITE" | "LEAVE" | "NOT_CHECKED"
  >("ALL");

  // table states
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchTodaysAttendance();
        if (cancelled) return;

        setRows(res ?? []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load today attendance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // reset pagination when filter/data changes
  useEffect(() => {
    setPage(0);
    setOpenKey(null);
  }, [statusFilter, rows.length]);

  const summary: Summary = useMemo(() => {
    const s: Summary = {
      checkIn: 0,
      checkOut: 0,
      leave: 0,
      notChecked: 0,
      onsite: 0,
      offsite: 0,
    };

    for (const it of rows) {
      const hasLeave =
        (it.latestCheckin?.type === "LEAVE" && it.latestCheckin.leaveType !== "NONE") ||
        it.todayCheckins.some((c) => c.type === "LEAVE" && c.leaveType !== "NONE");

      if (hasLeave) {
        s.leave += 1;
        continue;
      }

      const lastIn = pickLastOfType(it.todayCheckins, "CHECK_IN");
      const lastOut = pickLastOfType(it.todayCheckins, "CHECK_OUT");

      if (lastOut) s.checkOut += 1;
      else if (lastIn) s.checkIn += 1;
      else s.notChecked += 1;

      const loc = (it.latestCheckin?.location ?? null) as LocationType | null;
      if (loc === "ONSITE") s.onsite += 1;
      if (loc === "OFFSITE") s.offsite += 1;
    }

    return s;
  }, [rows]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return rows;

    return rows.filter((it) => {
      const badge = statusBadge(it).text;

      if (statusFilter === "LEAVE") return badge.startsWith("LEAVE");
      if (statusFilter === "NOT_CHECKED") return badge === "NOT CHECKED";
      if (statusFilter === "ONSITE") return badge === "ONSITE";
      if (statusFilter === "OFFSITE") return badge === "OFFSITE";
      return true;
    });
  }, [rows, statusFilter]);

  const tableRowsAll: AttendanceTableRow[] = useMemo(() => {
    return filtered.map((it) => {
      const badge = statusBadge(it);

      const firstIn = pickFirstOfType(it.todayCheckins, "CHECK_IN");
      const lastOut = pickLastOfType(it.todayCheckins, "CHECK_OUT");

      const inTime = formatTime(firstIn?.createdAt ?? null);
      const outTime = formatTime(lastOut?.createdAt ?? null);

      const hours =
        firstIn && lastOut
          ? msToHm(
            new Date(lastOut.createdAt).getTime() -
            new Date(firstIn.createdAt).getTime()
          )
          : "—";

      const latest = it.latestCheckin ?? lastOut ?? firstIn;
      const distanceLabel = fmtDistance(latest?.distance ?? null);

      const timeLabel =
        inTime === "—" && outTime === "—"
          ? "—"
          : outTime === "—"
            ? `${inTime}`
            : `${inTime} → ${outTime} (${hours})`;

      return {
        key: it.user.id,

        employeeName: it.user.name,
        employeeSub: it.user.email,
        employeePicture: it.user.picture ?? null,

        typeText: typeTextFrom(latest ?? null),

        status: badge.ui,
        statusText: badge.text,

        worksiteName: worksiteNameFrom(latest ?? null),
        timeLabel,
        distanceLabel,

        raw: it,
      };
    });
  }, [filtered]);

  const total = tableRowsAll.length;
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageRows = tableRowsAll.slice(start, end);

  const showingFrom = total === 0 ? 0 : start + 1;
  const showingTo = total === 0 ? 0 : Math.min(end, total);

  const disablePrev = page <= 0;
  const disableNext = end >= total;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Today&apos;s Attendance
        </h2>

        <button
          onClick={() => router.push(TARGET_PATH)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View All
        </button>
      </div>

      {/* ===== Summary ===== */}
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {summaryConfig.map((item) => {
            const Icon = item.icon;
            const value = summary[item.key];

            return (
              <div
                key={item.key}
                className="flex flex-col items-center rounded-xl bg-slate-50 px-3 py-3"
              >
                <Icon className="mb-1 h-5 w-5 text-slate-400" />
                <div className="text-lg font-semibold text-slate-900">
                  {value}
                </div>
                <div className="text-[11px] text-slate-500">{item.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
            Onsite: {summary.onsite}
          </span>
          <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">
            Offsite: {summary.offsite}
          </span>
        </div>
      </div>

      {/* ===== Employee Attendance Records (ใช้ AttendanceRecordsTable) ===== */}
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-800">
            Employee Attendance Records
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ONSITE">Onsite</option>
              <option value="OFFSITE">Offsite</option>
              <option value="LEAVE">Leave</option>
              <option value="NOT_CHECKED">Not Checked</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : (
          <AttendanceRecordsTable
            rows={pageRows}
            loading={loading}
            openKey={openKey}
            onToggleOpenKey={(key) => setOpenKey((prev) => (prev === key ? null : key))}
            emptyText="No records"
            loadingText="Loading…"
            showSelectUserHint={false}
            showingFrom={showingFrom}
            showingTo={showingTo}
            total={total}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => (disableNext ? p : p + 1))}
            disablePrev={disablePrev}
            disableNext={disableNext}
          />
        )}
      </div>
    </section>
  );
}
