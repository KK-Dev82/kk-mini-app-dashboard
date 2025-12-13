"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import {
  fetchTeamAttendance,
  type TeamAttendanceResponse,
  type AttendanceStatus as ApiStatus,
} from "../../../lib/teamAttendanceService";

type AttendanceStatusUI = "On Time" | "Late" | "Absent" | "Leave";

type MemberUI = {
  id: number;
  name: string;
  initials: string;
  note?: string;
  status: AttendanceStatusUI;
  attendanceDate: string;
};

const STATUS_STYLES: Record<
  AttendanceStatusUI,
  { pill: string; text: string }
> = {
  "On Time": { pill: "bg-emerald-50", text: "text-emerald-700" },
  Late: { pill: "bg-amber-50", text: "text-amber-700" },
  Absent: { pill: "bg-rose-50", text: "text-rose-700" },
  Leave: { pill: "bg-sky-50", text: "text-sky-700" },
};

function apiStatusToUI(s: ApiStatus): AttendanceStatusUI {
  if (s === "ON_TIME") return "On Time";
  if (s === "LATE") return "Late";
  if (s === "ABSENT") return "Absent";
  return "Leave";
}

function formatThaiDate(iso: string) {
  // iso: YYYY-MM-DD
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: AttendanceStatusUI;
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
  const [activeStatus, setActiveStatus] = useState<AttendanceStatusUI | "All">(
    "All"
  );

  const [data, setData] = useState<TeamAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ filters
  const [dateValue, setDateValue] = useState<string>("today"); // today | YYYY-MM-DD | all
  const [memberId, setMemberId] = useState<string>("all"); // all | "1" | "2"...

  // ✅ Date options: Today + ย้อนหลัง 7 วัน + All (สำหรับโชว์หลายวัน/เส้นคั่นวัน)
  const dateOptions = useMemo(() => {
    const out: Array<{ value: string; label: string }> = [
      { value: "today", label: "Today" },
      { value: "all", label: "All Days" }, // ✅ โชว์รวมหลายวันเพื่อเห็น divider
    ];

    const fmt = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    const now = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ value: iso, label: fmt.format(d) });
    }
    return out;
  }, []);

  // ✅ โหลดข้อมูลตาม filter
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchTeamAttendance({
          date: dateValue,
          memberId: memberId === "all" ? undefined : Number(memberId),
        });

        if (!cancelled) setData(res);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load attendance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateValue, memberId]);

  // ✅ map API -> UI (ต้องมี attendanceDate)
  const members: MemberUI[] = useMemo(() => {
    const list = data?.members ?? [];
    return list.map((m: any) => ({
      id: m.id,
      name: m.name,
      initials: m.initials,
      note: m.note,
      status: apiStatusToUI(m.status),
      attendanceDate: m.attendanceDate ?? (data?.dateLabel === "Today" ? new Date().toISOString().slice(0, 10) : String(data?.dateLabel ?? "today")),
    }));
  }, [data]);

  const counts = useMemo(() => {
    if (data?.stats) {
      return {
        onTime: data.stats.onTime,
        late: data.stats.late,
        absent: data.stats.absent,
        leave: data.stats.leave,
      };
    }

    const base = { onTime: 0, late: 0, absent: 0, leave: 0 };
    for (const m of members) {
      if (m.status === "On Time") base.onTime += 1;
      if (m.status === "Late") base.late += 1;
      if (m.status === "Absent") base.absent += 1;
      if (m.status === "Leave") base.leave += 1;
    }
    return base;
  }, [data, members]);

  // ✅ กรองตามสเตตัส (การ์ดสถิติ)
  const filtered = useMemo(() => {
    if (activeStatus === "All") return members;
    return members.filter((m) => m.status === activeStatus);
  }, [members, activeStatus]);

  // ✅ group ตามวัน เพื่อทำเส้นคั่นวัน
  const groupedByDate = useMemo(() => {
    return filtered.reduce<Record<string, MemberUI[]>>((acc, item) => {
      const key = item.attendanceDate;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filtered]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort(
      (a, b) => new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()
    );
  }, [groupedByDate]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Team Attendance
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {data?.totalMembers ?? members.length} team members
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* filters */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Date */}
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

        {/* Member */}
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Members</option>
            {(data?.members ?? []).map((m: any) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* stats */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <StatCard
          label="On Time"
          value={counts.onTime}
          active={activeStatus === "On Time"}
          onClick={() =>
            setActiveStatus((s) => (s === "On Time" ? "All" : "On Time"))
          }
        />
        <StatCard
          label="Late"
          value={counts.late}
          active={activeStatus === "Late"}
          onClick={() => setActiveStatus((s) => (s === "Late" ? "All" : "Late"))}
        />
        <StatCard
          label="Absent"
          value={counts.absent}
          active={activeStatus === "Absent"}
          onClick={() =>
            setActiveStatus((s) => (s === "Absent" ? "All" : "Absent"))
          }
        />
        <StatCard
          label="Leave"
          value={counts.leave}
          active={activeStatus === "Leave"}
          onClick={() =>
            setActiveStatus((s) => (s === "Leave" ? "All" : "Leave"))
          }
        />
      </div>

      {/* ✅ list + เส้นคั่นวัน */}
      <div className="mt-4 space-y-6">
        {sortedDates.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No records
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="space-y-3">
              {/* Date Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {formatThaiDate(date)}
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Items for that date */}
              {groupedByDate[date].map((m) => {
                const st = STATUS_STYLES[m.status];
                return (
                  <div
                    key={`${date}-${m.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_0_rgba(15,23,42,0.02)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {m.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {m.note ?? ""}
                        </div>
                      </div>
                    </div>

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-medium",
                        st.pill,
                        st.text,
                      ].join(" ")}
                    >
                      {m.status}
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
