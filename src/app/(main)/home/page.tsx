import AttendanceSummaryCard from "./components/AttendanceSummaryCard";
import PendingLeaveCard from "./components/PendingLeaveCard";
import TeamTasksCard from "./components/TeamTasksCard";
import { fetchDashboardOverview } from "../../lib/dashboardService";

export default async function HomePage() {
  const data = await fetchDashboardOverview();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <AttendanceSummaryCard summary={data.attendance} />
      <PendingLeaveCard items={data.pendingLeaves} />
      <TeamTasksCard teamTasks={data.teamTasks} />
    </div>
  );
}
