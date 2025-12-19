"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

const MAX_SHOW = 10;

type LeaveItem = {
  id: string;
  employee: { name: string };
  leaveType: string;
  startDate: string;
  endDate?: string | null;
};

function buildDateText(item: LeaveItem) {
  const s = item.startDate;
  const e = item.endDate ?? "";
  return e ? `${s} - ${e}` : s;
}

export default function PendingLeaveCard() {
  const router = useRouter();
  const items: LeaveItem[] = [];
  const totalCount = items.length;

  const displayItems = useMemo(() => {
    return items.slice(0, MAX_SHOW);
  }, [items]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">Pending Leave</h2>

          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 text-[11px] font-medium text-white">
            {totalCount}
          </span>
        </div>

        <button
          type="button"
          onClick={() => router.push("/history?tab=leave")}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Review
        </button>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 space-y-2">
        {displayItems.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No records
          </div>
        ) : (
          displayItems.map((leave) => (
            <div key={leave.id} className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">
                {leave.employee.name}
              </div>
              <div className="text-xs text-slate-500">
                {leave.leaveType} • {buildDateText(leave)}
              </div>
            </div>
          ))
        )}

        {totalCount > MAX_SHOW && (
          <div className="pt-1 text-xs text-slate-500">
            Showing {MAX_SHOW} of {totalCount}
          </div>
        )}
      </div>
    </section>
  );
}
