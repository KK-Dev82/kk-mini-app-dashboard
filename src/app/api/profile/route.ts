import { NextResponse } from "next/server";

export async function GET() {
  const profile = {
    id: 1,
    name: "Sarah Chen",
    initials: "SC",
    title: "Project Manager",
    email: "pm@company.com",
    department: "Engineering",
    role: "Project Manager",
    teamName: "Frontend Team",
    teamMembers: [
      { id: 101, name: "Alex Johnson", initials: "AJ" },
      { id: 102, name: "Mike Wilson", initials: "MW" },
      { id: 103, name: "Emma Davis", initials: "ED" },
      { id: 104, name: "James Brown", initials: "JB" },
      { id: 105, name: "Lisa Green", initials: "LG" },
    ],
  };

  return NextResponse.json(profile);
}
