import type { TasksStats } from "../../../lib/tasksService";

type Props = {
  stats: TasksStats;
};

const config = [
  { key: "active", label: "Active" },
  { key: "onHold", label: "On Hold" },
  { key: "completed", label: "Completed" },
] as const;

export default function TaskStatsSummary({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {config.map((item, idx) => {
        const value = stats[item.key];

        const isHighlighted = item.key === "onHold"; // กล่องกลางไฮไลต์
        const baseClasses =
          "rounded-2xl border px-6 py-4 flex flex-col justify-center";

        const highlight = isHighlighted
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-slate-50";

        return (
          <div key={item.key} className={`${baseClasses} ${highlight}`}>
            <div className="text-xl font-semibold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}
