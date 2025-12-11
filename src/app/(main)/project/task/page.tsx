// src/app/(main)/project/task/page.tsx

import TaskStatsSummary from "./components/TaskStatsSummary";

type TaskPageProps = {
  searchParams?: {
    projectId?: string | string[];
  };
};

export default function TaskPage(props: TaskPageProps) {
  let projectId = "-";

  if (props.searchParams && props.searchParams.projectId) {
    const raw = props.searchParams.projectId;
    projectId = Array.isArray(raw) ? raw[0] : raw;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* หัวข้อหน้า */}
      <h1 className="text-xl font-semibold mb-1">Project Tasks</h1>
      <p className="text-xs text-slate-500 mb-4">
        Project ID:{" "}
        <span className="font-medium text-slate-700">{projectId}</span>
      </p>

      {/* Kanban 3 คอลัมน์: กำลังทำ / เสร็จ / ยังไม่เริ่ม */}
      <TaskStatsSummary />

      {/* ตรงนี้ไว้ map การ์ดจริงในอนาคต */}
    </div>
  );
}
