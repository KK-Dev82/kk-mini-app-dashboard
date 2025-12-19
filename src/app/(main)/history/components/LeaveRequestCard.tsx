"use client";

import {
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import type { LeaveHistoryRecord } from "../../../lib/leaveHistoryService";

type Props = {
  item: LeaveHistoryRecord;
};

export default function HistoryRequestCard({ item }: Props) {
  const { employee, leaveType, dayType, startDate, endDate, reason, submittedAt } =
    item;

  const dateLabel = endDate ? `${startDate} → ${endDate}` : startDate;

  return (
    <div className="h-full min-h-[150px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* top */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {employee.initials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {employee.name}
          </p>
          <p className="truncate text-xs text-slate-500">
            {leaveType} • {dayType}
          </p>
        </div>
      </div>

      {/* content */}
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{dateLabel}</span>
        </div>

        <div className="flex items-start gap-2">
          <DocumentTextIcon className="mt-[2px] h-4 w-4 shrink-0 text-slate-400" />
          <span className="line-clamp-2">{reason}</span>
        </div>
      </div>

      {/* footer */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">Submitted {submittedAt}</span>
      </div>
    </div>
  );
}
