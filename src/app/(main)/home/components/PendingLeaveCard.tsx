import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import type { LeaveItem } from "../../../lib/dashboardService";

type Props = {
  items: LeaveItem[];
};

export default function PendingLeaveCard({ items }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">
            Pending Leave
          </h2>
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 text-[11px] font-medium text-white">
            {items.length}
          </span>
        </div>

        <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Review
        </button>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 space-y-2">
        {items.map((leave) => (
          <div
            key={leave.id}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold text-slate-800">
                {leave.name}
              </div>
              <div className="text-xs text-slate-500">
                {leave.type} • {leave.date}
              </div>
            </div>

            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-100">
              {leave.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
