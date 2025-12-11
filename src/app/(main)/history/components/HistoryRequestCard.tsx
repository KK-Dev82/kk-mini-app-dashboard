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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* top: avatar + name + type */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {employee.initials}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">
            {employee.name}
          </p>
          <p className="text-xs text-slate-500">
            {leaveType} • {dayType}
          </p>
        </div>
      </div>

      {/* date */}
      <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
        <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
        <span>{dateLabel}</span>
      </div>

      {/* reason */}
      <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
        <DocumentTextIcon className="h-4 w-4 text-slate-400" />
        <span>{reason}</span>
      </div>

      {/* submitted at */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <ClockIcon className="h-4 w-4 text-slate-400" />
        <span>Submitted {submittedAt}</span>
      </div>
    </div>
  );
}
