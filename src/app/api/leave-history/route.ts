import { NextResponse } from "next/server";

export async function GET() {
    const data = {
        total: 3,
        items: [
            {
                id: 1,
                employee: {
                    id: 101,
                    name: "Mike Wilson",
                    initials: "MW",
                },
                leaveType: "Vacation",
                dayType: "Full Day",
                startDate: "Dec 12, 2025",
                endDate: "Dec 15, 2025",
                reason: "Annual vacation",
                submittedAt: "Dec 11, 1:34 PM",
            },
            {
                id: 2,
                employee: {
                    id: 102,
                    name: "Emma Davis",
                    initials: "ED",
                },
                leaveType: "Sick Leave",
                dayType: "Full Day",
                startDate: "Dec 10, 2025",
                endDate: null,
                reason: "Feeling unwell, doctor appointment",
                submittedAt: "Dec 11, 12:34 PM",
            },
            {
                id: 3,
                employee: {
                    id: 103,
                    name: "James Brown",
                    initials: "JB",
                },
                leaveType: "Personal",
                dayType: "Half Day (AM)",
                startDate: "Dec 17, 2025",
                endDate: null,
                reason: "Personal appointment",
                submittedAt: "Dec 10, 1:34 PM",
            },
            {
                id: 4,
                employee: {
                    id: 103,
                    name: "James Brown",
                    initials: "JB",
                },
                leaveType: "Personal",
                dayType: "Half Day (AM)",
                startDate: "Dec 17, 2025",
                endDate: null,
                reason: "Personal appointment",
                submittedAt: "Dec 10, 1:34 PM",
            },
        ],
    };

    return NextResponse.json(data);
}
