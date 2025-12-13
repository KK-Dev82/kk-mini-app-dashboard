"use client";

import { useSearchParams } from "next/navigation";
import TaskStatsSummary from "./components/TaskStatsSummary";

export default function TaskPage() {
  const sp = useSearchParams();
  const projectId = sp.get("projectId") ?? "-";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Project Tasks</h1>
      <p className="text-xs text-slate-500 mb-4">
        Tasks ID: <span className="font-medium text-slate-700">{projectId}</span>
      </p>

      <TaskStatsSummary />
    </div>
  );
}
