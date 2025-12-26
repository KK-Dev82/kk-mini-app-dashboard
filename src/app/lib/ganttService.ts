// src/lib/ganttService.ts

export type GanttTaskColor =
  | "green"
  | "blue"
  | "red"
  | "orange"
  | "purple"
  | "slate"
  | "pink";

export type GanttTaskApi = {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: GanttTaskColor;
};

export type GanttProjectApi = {
  id: string;
  projectName: string;
  tag: string; // เช่น "Mobile", "Web", "Internal"
  tasks: GanttTaskApi[];
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchGanttYear(year: number): Promise<GanttProjectApi[]> {
  await sleep(200);

  return [
    {
      id: "p1",
      projectName: "Satit BUU Admissions",
      tag: "Web",
      tasks: [
        {
          id: "t1",
          title: "Planning",
          startDate: `${year}-01-10`,
          endDate: `${year}-05-05`,
          color: "blue",
        },
        {
          id: "t2",
          title: "UI Build",
          startDate: `${year}-02-06`,
          endDate: `${year}-05-20`,
          color: "green",
        },
        {
          id: "t3",
          title: "QA + UAT",
          startDate: `${year}-05-21`,
          endDate: `${year}-06-30`,
          color: "orange",
        },
        {
          id: "t4",
          title: "Release",
          startDate: `${year}-07-05`,
          endDate: `${year}-07-25`,
          color: "red",
        },
      ],
    },
    {
      id: "p2",
      projectName: "HR Attendance",
      tag: "Internal",
      tasks: [
        {
          id: "t5",
          title: "Backend API",
          startDate: `${year}-03-01`,
          endDate: `${year}-04-15`,
          color: "purple",
        },
        {
          id: "t6",
          title: "Dashboard",
          startDate: `${year}-04-10`,
          endDate: `${year}-06-10`,
          color: "blue",
        },
        {
          id: "t7",
          title: "Gantt Migration",
          startDate: `${year}-08-01`,
          endDate: `${year}-09-15`,
          color: "pink",
        },
      ],
    },
    {
      id: "p3",
      projectName: "China International School Website",
      tag: "Web",
      tasks: [
        {
          id: "t8",
          title: "Content + SEO",
          startDate: `${year}-01-01`,
          endDate: `${year}-03-20`,
          color: "orange",
        },
        {
          id: "t9",
          title: "Calendar UI",
          startDate: `${year}-03-21`,
          endDate: `${year}-04-10`,
          color: "red",
        },
        {
          id: "t10",
          title: "Stabilize",
          startDate: `${year}-10-01`,
          endDate: `${year}-12-20`,
          color: "slate",
        },
      ],
    },
    {
      id: "p4",
      projectName: "Cross-year Example",
      tag: "Demo",
      tasks: [
        {
          id: "t11",
          title: "Long Run",
          startDate: `${year}-02-15`,
          endDate: `${year}-05-10`,
          color: "green",
        },
        {
          id: "t12",
          title: "Shot Run",
          startDate: `${year}-06-15`,
          endDate: `${year}-11-10`,
          color: "blue",
        },
      ],
    },
    {
      id: "p5",
      projectName: "Test Cross-year 2",
      tag: "Test",
      tasks: [
        {
          id: "t11",
          title: "Long Run",
          startDate: `${year}-05-15`,
          endDate: `${year}-07-10`,
          color: "green",
        },
        {
          id: "t12",
          title: "Shot Run",
          startDate: `${year}-08-15`,
          endDate: `${year}-12 -10`,
          color: "blue",
        },
      ],
    },
    {
      id: "p6",
      projectName: "Test Cross-year 2",
      tag: "Test",
      tasks: [
        {
          id: "t11",
          title: "Long Run",
          startDate: `${year}-05-15`,
          endDate: `${year}-07-10`,
          color: "green",
        },
        {
          id: "t12",
          title: "Shot Run",
          startDate: `${year}-08-15`,
          endDate: `${year}-12 -10`,
          color: "blue",
        },
      ],
    },
    {
      id: "p7",
      projectName: "Test Cross-year 2",
      tag: "Test",
      tasks: [
        {
          id: "t11",
          title: "Long Run",
          startDate: `${year}-05-15`,
          endDate: `${year}-07-10`,
          color: "green",
        },
        {
          id: "t12",
          title: "Shot Run",
          startDate: `${year}-08-15`,
          endDate: `${year}-12 -10`,
          color: "blue",
        },
      ],
    },
  ];
}