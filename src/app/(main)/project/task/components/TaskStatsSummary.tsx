import {
  EllipsisHorizontalIcon,
  PlusIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

export default function TaskStatsSummary() {
  const columns = [
    { key: "doing", label: "สิ่งที่ต้องทำ" },
    { key: "todo", label: "กำลังทำ" },
    { key: "done", label: "เสร็จ" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {columns.map((col) => (
        <div
          key={col.key}
          className="rounded-2xl bg-slate-900 text-white p-4 h-[160px] flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{col.label}</h3>
            <button className="text-slate-300 hover:text-white">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button className="flex items-center gap-1 text-sm text-white/80 hover:text-white">
              <PlusIcon className="h-4 w-4" />
              เพิ่มการ์ด
            </button>

            <CalendarDaysIcon className="h-4 w-4 text-white/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
