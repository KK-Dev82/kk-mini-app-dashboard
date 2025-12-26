import type { GanttTaskApi } from "../../../lib/ganttService";

export type GanttProjectWithTasks = {
  id: string;
  tag: string;
  projectName: string;
  projectStartDate: string; // YYYY-MM-DD
  projectEndDate: string; // YYYY-MM-DD
  tasks: GanttTaskApi[];
};
