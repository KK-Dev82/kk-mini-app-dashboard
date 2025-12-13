// src/app/api/tasks/route.ts
import { NextResponse } from "next/server";
import type { TaskProject } from "../../lib/projectService";

type TasksApiResponse = {
  items: TaskProject[];
};

export async function GET() {
  const items: TaskProject[] = [
    {
      id: 1,
      name: "E-Commerce Platform",
      description: "Build a complete e-commerce platform with payment integration",
      teamsCount: 1,
      status: "Active",
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    },
    {
      id: 2,
      name: "Mobile App Development",
      description: "Develop iOS and Android mobile applications",
      teamsCount: 1,
      status: "Active",
      startDate: "2024-02-01",
      endDate: "2024-08-31",
    },
    {
      id: 3,
      name: "CRM System Upgrade",
      description: "Upgrade existing CRM system with new features",
      teamsCount: 0,
      status: "On Hold",
      startDate: "2024-03-01",
      endDate: "2024-05-31",
    },
    {
      id: 4,
      name: "CRM System Upgrade",
      description: "Upgrade existing CRM system with new features",
      teamsCount: 0,
      status: "On Hold",
      startDate: "2024-03-01",
      endDate: "2024-05-31",
    },
    {
      id: 5,
      name: "CRM System Upgrade",
      description: "Upgrade existing CRM system with new features",
      teamsCount: 0,
      status: "On Hold",
      startDate: "2024-03-01",
      endDate: "2024-05-31",
    },
  ];

  const res: TasksApiResponse = { items };

  return NextResponse.json(res);
}
