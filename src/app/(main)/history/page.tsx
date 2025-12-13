"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  fetchLeaveHistory,
  type LeaveHistoryRecord,
  type LeaveHistoryResponse,
} from "../../lib/leaveHistoryService";
import HistoryRequestCard from "./components/LeaveRequestCard";
import TeamAttendancePanel from "./components/TeamAttendancePanel";

type ViewKey = "leave" | "attendance";

function TopTabs({
  active,
  leaveCount,
  onChange,
}: {
  active: ViewKey;
  leaveCount: number;
  onChange: (t: ViewKey) => void;
}) {
  return (
    <div className="rounded-2xl bg-slate-100 p-1">
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onChange("leave")}
          className={[
            "flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition",
            active === "leave"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:bg-white/60",
          ].join(" ")}
        >
          <span>Leave Requests</span>
          {leaveCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
              {leaveCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange("attendance")}
          className={[
            "flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition",
            active === "attendance"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:bg-white/60",
          ].join(" ")}
        >
          Team Attendance
        </button>
      </div>
    </div>
  );
}

export default function LeaveHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ derive view จาก URL ตรงๆ (ไม่ใช้ state เลย)
  const tabParam = searchParams.get("tab");
  const view: ViewKey = tabParam === "attendance" ? "attendance" : "leave";

  const [data, setData] = useState<LeaveHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function changeView(next: ViewKey) {
    const qs = new URLSearchParams(Array.from(searchParams.entries()));
    qs.set("tab", next);
    router.replace(`${pathname}?${qs.toString()}`);
  }

  useEffect(() => {
    fetchLeaveHistory()
      .then((res) => setData(res))
      .catch((err) => {
        console.error("Failed to fetch leave history:", err);
        setError("Failed to load history");
      });
  }, []);

  const leaveItems: LeaveHistoryRecord[] = useMemo(() => data?.items ?? [], [data]);
  const leaveCount = leaveItems.length;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-red-500">
        {error}
      </div>
    );
  }

  const isLoadingLeave = !data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <TopTabs active={view} leaveCount={leaveCount} onChange={changeView} />

      <div className="mt-4">
        {view === "leave" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isLoadingLeave ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading…
              </div>
            ) : leaveItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                No records
              </div>
            ) : (
              leaveItems.map((item) => (
                <HistoryRequestCard key={item.id} item={item} />
              ))
            )}
          </div>
        ) : (
          <TeamAttendancePanel />
        )}
      </div>
    </div>
  );
}
