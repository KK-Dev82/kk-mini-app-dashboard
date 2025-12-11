"use client";

import { useEffect, useState } from "react";
import {
  fetchTasksOverview,
  type TasksOverview,
} from "../../lib/tasksService";

import TaskProjectCard from "./components/TaskProjectCard";
import NewTaskModal, { type NewTaskPayload } from "./components/NewTaskModal";

export default function TaskPage() {
  const [data, setData] = useState<TasksOverview | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchTasksOverview()
      .then(setData)
      .catch((err) => console.error("Failed to load tasks", err));
  }, []);

  const handleCreate = (payload: NewTaskPayload) => {
    console.log("NEW TASK:", payload);
  };

  if (!data) return <div className="p-6 text-sm text-slate-500">Loading...</div>;

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Project</h1>
            <p className="text-xs text-slate-500">{data.items.length} projects</p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition"
          >
            <span className="mr-1 text-base leading-none">＋</span>
            New Project
          </button>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {data.items.map((project) => (
            <TaskProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      <NewTaskModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
