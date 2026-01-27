import AttendanceSummaryCard from "./components/TodayAttendanceCard";
import PendingLeaveCard from "./components/PendingLeaveRequestsCard";
import TeamTasksCard from "./components/TeamTasksOverviewCard";
import { fetchDashboardOverview } from "../../lib/dashboardService";
import GanttYearWidget from "./components/ProjectGanttYearOverlay";

export default async function HomePage() {
  const data = await fetchDashboardOverview();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <AttendanceSummaryCard />
      <PendingLeaveCard />
      <GanttYearWidget />
      <TeamTasksCard teamTasks={data.teamTasks} />
    </div>
  );
}
