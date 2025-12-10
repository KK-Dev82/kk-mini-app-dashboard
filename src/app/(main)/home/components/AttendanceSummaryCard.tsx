import {
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import type { AttendanceSummary } from "../../../lib/dashboardService";

const config = [
  { key: "onTime",  label: "On Time",  icon: ClockIcon },
  { key: "late",    label: "Late",     icon: ExclamationTriangleIcon },
  { key: "leave",  label: "Leave",   icon: UserGroupIcon },
  { key: "outside", label: "Outside",  icon: ArrowTrendingUpIcon },
] as const;

type Props = {
  summary: AttendanceSummary;
};

export default function AttendanceSummaryCard({ summary }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Today&apos;s Attendance
        </h2>
        <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
          View All
        </button>
      </div>

      <div className="border-t border-slate-100 px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {config.map((item) => {
            const Icon = item.icon;
            const value = summary[item.key]; // ดึงตัวเลขจาก JSON

            return (
              <div
                key={item.key}
                className="flex flex-col items-center rounded-xl bg-slate-50 px-3 py-3"
              >
                <Icon className="h-5 w-5 text-slate-400 mb-1" />
                <div className="text-lg font-semibold text-slate-900">
                  {value}
                </div>
                <div className="text-[11px] text-slate-500">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
