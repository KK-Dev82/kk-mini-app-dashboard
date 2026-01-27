// home/components/gantt/ProjectGanttModal.tsx
"use client";

import { useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import type { GanttTaskApi } from "../../../../lib/ganttService";
import type { GanttProjectWithTasks } from "../../../component/ganttchart/ganttTypes";

import { fmtThaiDate } from "../../../component/ganttchart/ganttUtils";

import GanttMonthHeader from "../../../component/ganttchart/GanttMonthHeader";
import GanttTimeline, { type GanttTimelineBar } from "../../../component/ganttchart/GanttTimeline";
import GanttRowLayout from "../../../component/ganttchart/GanttRowLayout";

import PhaseTasksModal from "./PhaseTasksSprintPanel";

// ✅ NEW: mapping utils
import { mapTaskToBar, type TaskBar } from "./_internal/ganttTaskBarMapper";

type Stage = "phases" | "tasks";

export default function ProjectGanttModal({
  open,
  onClose,
  project,
  year,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  project: GanttProjectWithTasks | null;
  year: number;
  loading?: boolean;
}) {
  const phaseRows = useMemo(() => {
    if (!project) return [];
    return (project.tasks ?? [])
      .map((t: GanttTaskApi) => mapTaskToBar(t, year))
      .filter((x): x is TaskBar => Boolean(x));
  }, [project, year]);

  // ✅ multi-stage state
  const [stage, setStage] = useState<Stage>("phases");
  const [activePhase, setActivePhase] = useState<{ phaseId: string; phaseTitle: string } | null>(null);

  if (!open || !project) return null;

  const openPhaseTasks = (phaseId: string, phaseTitle: string) => {
    setActivePhase({ phaseId, phaseTitle });
    setStage("tasks");
  };

  const backToPhases = () => {
    setStage("phases");
  };

  const closeAll = () => {
    setStage("phases");
    setActivePhase(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40" role="dialog" aria-modal="true">
      {/* overlay click ปิดทั้ง modal */}
      <button type="button" className="absolute inset-0" aria-label="Close overlay" onClick={closeAll} />

      <div className="absolute inset-x-0 top-10 mx-auto w-[min(1400px,calc(100%-24px))]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {project.tag}
                </span>
                <div className="truncate text-sm font-semibold text-slate-900">{project.projectName}</div>
              </div>

              <div className="mt-1 text-xs text-slate-500">
                ช่วงโปรเจกต์: {fmtThaiDate(project.projectStartDate)} – {fmtThaiDate(project.projectEndDate)}
              </div>
            </div>

            <button
              type="button"
              onClick={closeAll}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          {/* Body = container ของ slide pages */}
          <div className="relative">
            <div
              className={[
                "flex w-[200%] transition-transform duration-200 ease-out",
                stage === "tasks" ? "-translate-x-1/2" : "translate-x-0",
              ].join(" ")}
            >
              {/* PAGE 1: PHASES */}
              <div className="w-1/2 px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Phases</div>
                  {loading && <div className="text-xs font-medium text-slate-500">กำลังโหลด...</div>}
                </div>

                <GanttMonthHeader leftLabel="Phase" />
                <div className="mt-3 border-t border-slate-200" />

                <div className="mt-4 space-y-4">
                  {loading && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-700">กำลังโหลด phase</div>
                      <div className="mt-1 text-xs text-slate-500">โปรดรอสักครู่...</div>
                    </div>
                  )}

                  {!loading && phaseRows.length === 0 && (
                    <div className="text-sm text-slate-400">ไม่มี phase ในปีนี้</div>
                  )}

                  {!loading &&
                    phaseRows.map((t) => {
                      const bars: GanttTimelineBar[] = [
                        {
                          id: t.id,
                          title: t.title,
                          startM: t.startM,
                          endM: t.endM,
                          className: t.colorClass,
                          lane: 0,
                          onClick: () => openPhaseTasks(t.id, t.title),
                        },
                      ];

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => openPhaseTasks(t.id, t.title)}
                          className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition"
                        >
                          <GanttRowLayout
                            left={
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">{t.title}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {fmtThaiDate(t.startDate)} – {fmtThaiDate(t.endDate)}
                                </div>
                              </div>
                            }
                            right={<GanttTimeline bars={bars} laneHeight={52} barHeight={40} height={52} />}
                          />
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* PAGE 2: TASKS */}
              <div className="w-1/2 relative">
                <div className="relative h-full min-h-[520px]">
                  <PhaseTasksModal
                    open={stage === "tasks"}
                    onBack={backToPhases}
                    onCloseAll={closeAll}
                    projectId={project.id}
                    phaseId={activePhase?.phaseId ?? ""}
                    phaseTitle={activePhase?.phaseTitle ?? ""}
                    year={year}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
