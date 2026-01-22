// src/app/lib/dashboardService.ts
import "server-only";

type TrelloLabel = { id: string; name: string; color: string | null };

type TrelloChecklistItem = {
  id: string;
  name: string;
  state: "complete" | "incomplete" | string;
};

type TrelloChecklist = {
  id: string;
  name: string;
  checkItems: TrelloChecklistItem[];
};

type TrelloCard = {
  id: string;
  name: string;
  desc: string;

  listName?: string;
  closed: boolean;

  // ✅ start เพื่อรองรับงานเหลื่อมเดือน (start -> due)
  start?: string | null;
  due: string | null;

  idMembers: string[];
  labels: TrelloLabel[];
  checklists: TrelloChecklist[];
};

type TrelloMember = {
  id: string;
  username: string;
  fullName: string;
};

type UserApi = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  trelloMemberId?: string | null;
  role?: string | null;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string;

  priority: "low" | "medium" | "high";
  status: string;

  subTasksCompleted: number;
  subTasksTotal: number;

  assignee: string;

  // ✅ ให้ UI ใช้ทำ overlap เดือน
  startDate: string; // YYYY-MM-DD | "-"
  dueDate: string; // YYYY-MM-DD | "-"
  isOverdue: boolean;
};

export type TeamTasks = {
  summary: { inProgress: number; overdue: number };
  tasks: TaskItem[];
  tag: string;
};

export type DashboardOverview = {
  teamTasks: TeamTasks;
};

const DAY_MS = 86400000;
const SEVEN_DAYS = 7;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "";

const API_TOKEN = process.env.API_TOKEN?.trim() || "";

/** ✅ ให้การนับวันตรงกับไทย */
const APP_TZ = "Asia/Bangkok";
const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function joinUrl(base: string, path: string) {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

async function backendGet<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL (or API_BASE_URL)");

  const url = joinUrl(API_BASE, path);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(API_TOKEN ? { authorization: `Bearer ${API_TOKEN}` } : {}),
    },
    cache: "no-store",
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`GET ${url} failed (${res.status})\n${raw}`);

  return (raw ? JSON.parse(raw) : null) as T;
}

/** ✅ Date -> YYYY-MM-DD ตาม timezone ของแอป (ไทย) */
function dateToYMDInTZ(d: Date): string {
  return ymdFmt.format(d); // en-CA => YYYY-MM-DD
}

/** ✅ ISO -> YYYY-MM-DD (อิง Asia/Bangkok กันวันเลื่อน) */
function isoToYMD(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return dateToYMDInTZ(d);
}

/** YYYY-MM-DD -> day number (UTC day) */
function ymdToUtcDay(ymd: string): number | null {
  const [y, m, d] = ymd.split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** ✅ วันนี้ตามเวลาไทย -> day number */
function todayAppDay(): number {
  const ymd = dateToYMDInTZ(new Date());
  const day = ymdToUtcDay(ymd);
  if (day == null) throw new Error("Invalid today date");
  return day;
}

function pickPriority(labels: TrelloLabel[]): "low" | "medium" | "high" {
  const names = (labels ?? []).map((l) => (l.name || "").toLowerCase());
  if (names.some((n) => n.includes("high"))) return "high";
  if (names.some((n) => n.includes("medium"))) return "medium";
  if (names.some((n) => n.includes("low"))) return "low";

  const colors = (labels ?? []).map((l) => (l.color || "").toLowerCase());
  if (colors.includes("red")) return "high";
  if (colors.includes("orange") || colors.includes("yellow")) return "medium";
  if (colors.includes("green") || colors.includes("blue")) return "low";

  return "medium";
}

function countChecklist(card: TrelloCard) {
  let total = 0;
  let done = 0;

  for (const cl of card.checklists ?? []) {
    for (const it of cl.checkItems ?? []) {
      total += 1;
      if (it.state === "complete") done += 1;
    }
  }

  return { total, done };
}

/** ✅ เลือกชื่อ assignee: ใช้ user.name ก่อน แล้วค่อย fallback */
function resolveAssigneeNames(params: {
  memberIds: string[];
  userByTrelloId: Map<string, UserApi>;
  trelloNameById: Map<string, string>;
}): string {
  const { memberIds, userByTrelloId, trelloNameById } = params;
  if (!memberIds?.length) return "Unassigned";

  return memberIds
    .map((mid) => userByTrelloId.get(mid)?.name || trelloNameById.get(mid) || mid)
    .join(", ");
}

function computeDueMeta(dueIso: string | null, todayDay: number) {
  const dueYmd = isoToYMD(dueIso);
  const dueDay = dueYmd ? ymdToUtcDay(dueYmd) : null;

  const diff = dueDay == null ? null : dueDay - todayDay;
  const isOverdue = diff != null && diff < 0;

  const isDueSoon = diff != null && diff >= 0 && diff <= SEVEN_DAYS;

  return { dueYmd, dueDay, diff, isOverdue, isDueSoon };
}

function computeStartDate(startIso?: string | null, dueYmd?: string | null) {
  const startYmd = isoToYMD(startIso ?? null);
  // ✅ fallback: ถ้าไม่มี start ให้ใช้ due เป็นงานวันเดียว
  return startYmd ?? (dueYmd ?? "-");
}

/**
 * ✅ ดึงทุกการ์ด + map user ให้ตรงด้วย /users
 * ✅ นับ dueSoon/overdue แบบเดิม (อิง due เทียบ today ไทย)
 * ✅ ส่ง startDate ให้ UI ทำ logic เหลื่อมเดือน/overlap ได้
 */
export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const [cards, trelloMembers, users] = await Promise.all([
    backendGet<TrelloCard[]>("/trello/cards"),
    backendGet<TrelloMember[]>("/trello/members"),
    backendGet<UserApi[]>("/users"),
  ]);

  const trelloNameById = new Map<string, string>(
    (trelloMembers ?? []).map((m) => [m.id, m.fullName || m.username || m.id])
  );

  const userByTrelloId = new Map<string, UserApi>();
  for (const u of users ?? []) {
    const tid = (u.trelloMemberId ?? "").trim();
    if (tid) userByTrelloId.set(tid, u);
  }

  const today = todayAppDay();

  let dueSoonCount = 0;
  let overdueCount = 0;

  const tasks: TaskItem[] = [];

  for (const c of cards ?? []) {
    if (c.closed) continue;

    const { dueYmd, isOverdue, isDueSoon } = computeDueMeta(c.due, today);

    if (isOverdue) overdueCount += 1;
    if (isDueSoon) dueSoonCount += 1;

    const startDate = computeStartDate(c.start, dueYmd);
    const { total, done } = countChecklist(c);

    tasks.push({
      id: c.id,
      title: c.name,
      description: c.desc || "",

      priority: pickPriority(c.labels ?? []),
      status: c.listName || "To Do",

      subTasksCompleted: done,
      subTasksTotal: total,

      assignee: resolveAssigneeNames({
        memberIds: c.idMembers ?? [],
        userByTrelloId,
        trelloNameById,
      }),

      startDate,
      dueDate: dueYmd ?? "-",
      isOverdue,
    });
  }

  return {
    teamTasks: {
      tag: "ALL",
      summary: {
        inProgress: dueSoonCount,
        overdue: overdueCount,
      },
      tasks,
    },
  };
}
