"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
// import { fetchTeamAttendance } from "../../../lib/teamAttendanceService";

type AttendanceSummary = {
  onTime: number;
  late: number;
  leave: number;
  outside: number;
};

const config = [
  { key: "onTime", label: "On Time", icon: ClockIcon },
  { key: "late", label: "Late", icon: ExclamationTriangleIcon },
  { key: "leave", label: "Leave", icon: UserGroupIcon },
  { key: "outside", label: "Outside", icon: ArrowTrendingUpIcon },
] as const;

export default function AttendanceSummaryCard() {
  const router = useRouter();
  const TARGET_PATH = "/history?tab=attendance";

  const [summary, setSummary] = useState<AttendanceSummary>({
    onTime: 0,
    late: 0,
    leave: 0,
    outside: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchTeamAttendance({ date: "today" });
        if (cancelled) return;

        setSummary({
          onTime: res.stats?.onTime ?? 0,
          late: res.stats?.late ?? 0,
          leave: res.stats?.leave ?? 0,
          outside: (res.stats as any)?.outside ?? 0,
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load attendance summary");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="border-t border-slate-100 px-6 py-6 text-sm text-slate-500">
          Loading…
        </div>
      );
    }
    if (error) {
      return (
        <div className="border-t border-slate-100 px-6 py-6 text-sm text-rose-600">
          {error}
        </div>
      );
    }

    return (
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {config.map((item) => {
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
      </div>
    );
  }, [loading, error, summary]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Today&apos;s Attendance
        </h2>

        {/* ✅ กดแล้วไปหน้านี้ + เปิดแท็บ attendance */}
        <button
          onClick={() => router.push(TARGET_PATH)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View All
        </button>
      </div>

      {content}
    </section>
  );
}
