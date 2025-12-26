// GanttYearWidget.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { fetchProjects, type ProjectListItem } from "../../../lib/projectService";

import type { GanttProjectWithTasks } from "../../component/ganttchart/ganttTypes";
import ProjectGanttModal from "./ProjectGanttModal";

import GanttTimeline, {
  type GanttTimelineBar,
} from "../../component/ganttchart/GanttTimeline";
import GanttRowLayout from "../../component/ganttchart/GanttRowLayout";
import GanttMonthHeader from "../../component/ganttchart/GanttMonthHeader";

import {
  fmtThaiDate,
  mapRangeToProjectBar,
  type ProjectBar,
} from "../../component/ganttchart/ganttUtils";

import {
  InlineLoading,
  PageLoadingOverlay,
} from "../../component/loading/LoadingUI";

const PROJECT_COLORS = [
  {
    bar: "from-blue-500 to-indigo-600",
    tag: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    ring: "focus:ring-blue-300",
  },
  {
    bar: "from-emerald-500 to-teal-600",
    tag: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    ring: "focus:ring-emerald-300",
  },
  {
    bar: "from-rose-500 to-pink-600",
    tag: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    ring: "focus:ring-rose-300",
  },
  {
    bar: "from-amber-500 to-orange-600",
    tag: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    ring: "focus:ring-amber-300",
  },
  {
    bar: "from-violet-500 to-purple-600",
    tag: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    ring: "focus:ring-violet-300",
  },
  {
    bar: "from-cyan-500 to-sky-600",
    tag: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
    ring: "focus:ring-cyan-300",
  },
] as const;

type ProjectColor = (typeof PROJECT_COLORS)[number];

function hashStringToIndex(str: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % mod;
}

function getProjectColor(projectId: string): ProjectColor {
  return PROJECT_COLORS[hashStringToIndex(projectId, PROJECT_COLORS.length)];
}

/** ISO -> YYYY-MM-DD (กัน timezone/เวลา) */
function isoToYMD(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  // ใช้ค่า "วันที่" ใน UTC เพื่อกัน shift
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ProjectRow = GanttProjectWithTasks & {
  bar: ProjectBar | null;
  color: ProjectColor;
  // สำหรับ label เล็ก ๆ ใต้ชื่อ (optional)
  rawStartISO: string | null;
  rawDueISO: string | null;
};

export default function GanttYearWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(() => new Date().getFullYear());

  // เก็บ list จาก /projects
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selected, setSelected] = useState<GanttProjectWithTasks | null>(null);

  // ป้องกัน race
  const reqSeqRef = useRef(0);

  const refetch = async (opts?: { silent?: boolean }) => {
    if (!open) return;

    const seq = ++reqSeqRef.current;
    if (!opts?.silent) setLoading(true);

    try {
      const res = await fetchProjects(); // ✅ GET /projects
      if (seq !== reqSeqRef.current) return;

      // ✅ เอาเฉพาะ active ก็ได้ (ถ้าอยากให้ archived ไม่ขึ้น)
      const items = (res?.items ?? []).filter((p) => p.isActive !== false);

      setProjects(items);
    } finally {
      if (!opts?.silent && seq === reqSeqRef.current) setLoading(false);
    }
  };

  // fetch when open + year changes
  useEffect(() => {
    if (!open) return;
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, year]);

  // lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // (optional) auto refresh
  useEffect(() => {
    if (!open) return;

    let timer: number | null = null;
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => {
        refetch({ silent: true });
      }, 45_000);
    };

    const onFocus = () => refetch({ silent: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refetch({ silent: true });
        start();
      } else {
        stop();
      }
    };

    start();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, year]);

  const rows: ProjectRow[] = useMemo(() => {
    return projects.map((p) => {
      const startYMD = isoToYMD(p.startDate);
      const endYMD = isoToYMD(p.dueDate);

      // ถ้าไม่มีวันเลย -> ไม่มี bar
      const bar = startYMD && endYMD ? mapRangeToProjectBar(startYMD, endYMD, year) : null;

      return {
        id: p.id,
        // ✅ tag บน pill: เอา trelloTag หรือ status ก็ได้
        tag: (p.key || "Project").toUpperCase(),
        projectName: p.name,
        projectStartDate: startYMD ?? "",
        projectEndDate: endYMD ?? "",
        tasks: [], // ✅ หน้านี้ยังไม่ดึง sub tasks
        bar,
        color: getProjectColor(p.id),
        rawStartISO: p.startDate ?? null,
        rawDueISO: p.dueDate ?? null,
      };
    });
  }, [projects, year]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">Dashboard</div>
          <div className="text-sm text-slate-500">Overview</div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <CalendarDaysIcon className="h-5 w-5" />
          Open Gantt
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-white" role="dialog" aria-modal="true">
          <PageLoadingOverlay show={loading} label="กำลังโหลด Gantt Chart..." />

          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50">
                  <CalendarDaysIcon className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Gantt Chart</div>
                  <div className="text-xs text-slate-500">ม.ค. – ธ.ค. (รายปี)</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setSelected(null);
                    setYear((y) => y - 1);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous year"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-slate-700" />
                </button>

                <div className="flex min-w-[220px] items-center justify-center gap-3 text-center">
                  <div className="text-sm font-semibold text-slate-900">ปี {year + 543}</div>

                  {loading && (
                    <div className="rounded-xl bg-slate-900 px-2 py-1">
                      <InlineLoading label="กำลังโหลด..." />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setSelected(null);
                    setYear((y) => y + 1);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Next year"
                >
                  <ChevronRightIcon className="h-5 w-5 text-slate-700" />
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                  className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5 text-slate-700" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-[calc(100vh-140px)] overflow-auto">
            <div className="mx-auto max-w-[1600px] px-6 py-6">
              <GanttMonthHeader leftLabel="Tag / Project" leftWidth={360} />

              <div className="mt-3 border-t border-slate-200" />

              <div className="mt-4 space-y-4">
                {!loading && rows.length === 0 && (
                  <div className="text-sm text-slate-500">No data</div>
                )}

                {!loading &&
                  rows.map((row) => {
                    const bars: GanttTimelineBar[] = row.bar
                      ? [
                          {
                            id: row.id,
                            title: row.projectName,
                            startM: row.bar.startM,
                            endM: row.bar.endM,
                            className: `bg-gradient-to-r ${row.color.bar} focus:outline-none focus:ring-1 ${row.color.ring}`,
                            onClick: () => setSelected(row),
                            lane: 0,
                          },
                        ]
                      : [];

                    return (
                      <div
                        key={row.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                      >
                        <GanttRowLayout
                          left={
                            <div className="flex items-center gap-3">
                              <span
                                className={[
                                  "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold",
                                  row.color.tag,
                                ].join(" ")}
                              >
                                {row.tag}
                              </span>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {row.projectName}
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {/* ✅ ถ้าไม่มีวัน ให้แสดงข้อความแทน */}
                                  {row.projectStartDate && row.projectEndDate
                                    ? `${fmtThaiDate(row.projectStartDate)} – ${fmtThaiDate(
                                        row.projectEndDate
                                      )}`
                                    : "ยังไม่กำหนดช่วงเวลา"}
                                </div>
                              </div>
                            </div>
                          }
                          right={
                            <GanttTimeline bars={bars} laneHeight={52} barHeight={40} height={52} />
                          }
                          leftWidth={360}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-[1600px] items-center justify-end gap-2 px-6 py-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setSelected(null);
                  setYear(new Date().getFullYear());
                }}
                className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ปีปัจจุบัน
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="h-10 rounded-2xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>

          <ProjectGanttModal
            open={Boolean(selected)}
            onClose={() => setSelected(null)}
            project={selected}
            year={year}
          />
        </div>
      )}
    </>
  );
}
