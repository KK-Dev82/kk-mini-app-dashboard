// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import type { DashboardOverview } from "../../lib/dashboardService";

export async function GET() {
  const data: DashboardOverview = {
    attendance: {
      onTime: 0,
      late: 0,
      leave: 0,
      outside: 0,
    },
    pendingLeaves: [
      {
        id: 1,
        name: "Mike Wilson",
        type: "Vacation",
        date: "2025-12-11",
        status: "Pending",
      },
      {
        id: 2,
        name: "Emma Davis",
        type: "Sick",
        date: "2025-12-09",
        status: "Pending",
      },
      {
        id: 3,
        name: "James Brown",
        type: "Personal",
        date: "2025-12-16",
        status: "Pending",
      },
    ],
    teamTasks: {
      summary: {
        inProgress: 2,
        overdue: 4,
      },
      tasks: [
        {
          id: 1,
          title: "Team meeting preparation",
          description:
            "Prepare presentation slides and agenda for the weekly team sync meeting.",
          priority: "low",
          status: "In Progress",
          isOverdue: false,
          subTasksCompleted: 1,
          subTasksTotal: 2,
          assignee: "Alex Johnson",
          dueDate: "2025-01-12",
        },
        {
          id: 2,
          title: "Complete quarterly report",
          description:
            "Prepare and finalize the Q4 financial report including all department summaries.",
          priority: "high",
          status: "In Progress",
          isOverdue: true,
          subTasksCompleted: 1,
          subTasksTotal: 4,
          assignee: "Alex Johnson",
          dueDate: "2025-01-20",
        },
        {
          id: 3,
          title: "Code review for feature branch",
          description:
            "Review pull request #234 for the new authentication module.",
          priority: "medium",
          status: "In Progress",
          isOverdue: true,
          subTasksCompleted: 1,
          subTasksTotal: 3,
          assignee: "Alex Johnson",
          dueDate: "2025-01-21",
        },
        {
          id: 4,
          title: "Review project documentation",
          description:
            "Go through all project documentation and ensure compliance with new standards.",
          priority: "medium",
          status: "To Do",
          isOverdue: true,
          subTasksCompleted: 0,
          subTasksTotal: 2,
          assignee: "Alex Johnson",
          dueDate: "2025-01-25",
        },
        {
          id: 5,
          title: "Client onboarding setup",
          description:
            "Set up new client accounts, configure access permissions, and prepare welcome materials.",
          priority: "high",
          status: "To Do",
          isOverdue: true,
          subTasksCompleted: 0,
          subTasksTotal: 3,
          assignee: "Alex Johnson",
          dueDate: "2025-01-30",
        },
        {
          id: 6,
          title: "Code review for feature branch",
          description:
            "Review pull request #234 for the new authentication module.",
          priority: "medium",
          status: "In Progress",
          isOverdue: true,
          subTasksCompleted: 1,
          subTasksTotal: 3,
          assignee: "Alex Johnson",
          dueDate: "2025-01-21",
        },
      ],
    },
  };

  return NextResponse.json(data);
}
