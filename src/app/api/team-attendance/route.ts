import { NextResponse } from "next/server";
import type { AttendanceStatus } from "../../lib/teamAttendanceService";

type Member = {
  id: number;
  name: string;
  initials: string;
  note?: string;
  status: AttendanceStatus;
  attendanceDate: string;
};

function calcStats(members: Member[]) {
  return members.reduce(
    (acc, m) => {
      if (m.status === "ON_TIME") acc.onTime += 1;
      if (m.status === "LATE") acc.late += 1;
      if (m.status === "ABSENT") acc.absent += 1;
      if (m.status === "LEAVE") acc.leave += 1;
      return acc;
    },
    { onTime: 0, late: 0, absent: 0, leave: 0 }
  );
}

function pickDayData(date: string): Member[] {

  const day10: Member[] = [
    {
      id: 1,
      name: "Alex Johnson",
      initials: "AJ",
      note: "Checked in",
      status: "ON_TIME",
      attendanceDate: "2025-10-08",
    },
    {
      id: 2,
      name: "Mike Wilson",
      initials: "MW",
      note: "Not checked in",
      status: "ABSENT",
      attendanceDate: "2025-10-10",
    },
    {
      id: 3,
      name: "Emma Davis",
      initials: "ED",
      note: "Not checked in",
      status: "ABSENT",
      attendanceDate: "2025-10-10",
    },
    {
      id: 4,
      name: "James Brown",
      initials: "JB",
      note: "Not checked in",
      status: "ABSENT",
      attendanceDate: "2025-10-10",
    },
    {
      id: 5,
      name: "Lisa Garcia",
      initials: "LG",
      note: "Not checked in",
      status: "ABSENT",
      attendanceDate: "2025-10-10",
    },
  ];

  const day09: Member[] = [
    {
      id: 6,
      name: "Sarah Chen",
      initials: "SC",
      note: "Not checked in",
      status: "ABSENT",
      attendanceDate: "2025-10-09",
    },
    {
      id: 7,
      name: "David Kim",
      initials: "DK",
      note: "Not checked in",
      status: "ABSENT",
      attendanceDate: "2025-10-09",
    },
    {
      id: 8,
      name: "Anna Rodriguez",
      initials: "AR",
      note: "Not checked in",
      status: "ABSENT",
      attendanceDate: "2025-10-09",
    },
    {
      id: 9,
      name: "Tom Harris",
      initials: "TH",
      note: "Not checked in",
      status: "ABSENT",
      attendanceDate: "2025-10-09",
    },
  ];

  // ✅ เลือกตาม date ที่ขอ
  if (date === "2025-10-10") return day10;
  if (date === "2025-10-09") return day09;

  // today -> ให้ mock เป็น 2025-10-10 ไปก่อน (backend จริงค่อยใช้วันจริง)
  if (date === "today") return day10;

  // ถ้าเป็น YYYY-MM-DD อื่นๆ แต่ไม่มี mock -> ส่งว่าง
  return [];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // date:
  // - "all" = ส่งหลายวัน (ใช้ทำ divider)
  // - "today" หรือ "YYYY-MM-DD" = ส่งวันเดียว
  const date = searchParams.get("date") ?? "today";
  const memberId = searchParams.get("memberId");

  const allMembers = [
    "Alex Johnson",
    "Mike Wilson",
    "Emma Davis",
    "James Brown",
    "Lisa Garcia",
    "Sarah Chen",
    "David Kim",
    "Anna Rodriguez",
    "Tom Harris",
  ].length;

  let members: Member[] = [];

  if (date === "all") {
    members = [...pickDayData("2025-10-10"), ...pickDayData("2025-10-09")];
  } else {
    members = pickDayData(date);
  }

  // filter by member
  const list = memberId
    ? members.filter((m) => String(m.id) === String(memberId))
    : members;

  // stats: ถ้า date=all จะเป็นภาพรวมทุกวันที่ส่งมา
  const stats = calcStats(members);

  return NextResponse.json({
    dateLabel: date === "today" ? "Today" : date, // UI อาจไม่ใช้แล้วก็ได้ เพราะเรามี attendanceDate ต่อ record
    totalMembers: allMembers,
    stats,
    members: list,
  });
}
