"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import {
  fetchMyCheckinHistory,
  fetchCheckinHistoryByUserId,
  type CheckinHistoryItem,
  CheckinType,
  LocationType,
  LeaveType,
} from "../../../lib/checkinHistoryService";

import { fetchUsers, type UserApi } from "../../../lib/userService";

import AttendanceRecordsTable, {
  type AttendanceTableRow,
  type StatusUI,
} from "../../component/AttendanceRecordsTable";

import CreateWorksiteModal from "./CreateWorksiteModal";
import ManageWorksitesModal from "./ManageWorksitesModal";

import { fetchWorksites, type WorksiteApi } from "../../../lib/worksiteService";

type Mode = "me" | "user";

function toNumber(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function formatFull(isoDateTime?: string | null) {
  if (!isoDateTime) return "—";
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH");
}

function fmtDistance(meters?: unknown) {
  const m = toNumber(meters);
  if (!m) return "—";
  if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
  return `${Math.round(m)}m`;
}

function leaveLabel(leaveType: LeaveType) {
  switch (leaveType) {
    case LeaveType.SICK_LEAVE:
      return "SICK";
    case LeaveType.PERSONAL_LEAVE:
      return "PERSONAL";
    case LeaveType.ANNUAL_LEAVE:
      return "ANNUAL";
    case LeaveType.NONE:
      return "—";
    default:
      return String(leaveType);
  }
}

function calcStatus(ev?: CheckinHistoryItem): StatusUI {
  if (!ev) return "UNKNOWN";
  if (ev.type === CheckinType.LEAVE) return "LEAVE";
  if (ev.location === LocationType.ONSITE) return "ONSITE";
  if (ev.location === LocationType.OFFSITE) return "OFFSITE";
  return "UNKNOWN";
}

function calcStatusText(ev?: CheckinHistoryItem): string {
  if (!ev) return "UNKNOWN";
  if (ev.type === CheckinType.LEAVE) {
    const lt = leaveLabel(ev.leaveType);
    return lt === "—" ? "LEAVE" : `LEAVE - ${lt}`;
  }
  return ev.location ?? "UNKNOWN";
}

function typeLabel(t?: CheckinType | string | null) {
  const u = String(t ?? "").toUpperCase();
  if (u === "CHECK_IN") return "CHECK-IN";
  if (u === "CHECK_OUT") return "CHECK-OUT";
  if (u === "LEAVE") return "LEAVE";
  return u || "—";
}

function userLabel(u: UserApi) {
  const name = (u.name || "").trim();
  const email = (u.email || "").trim();
  if (name && email) return `${name} (${email})`;
  return name || email || u.id;
}

type Row = {
  key: string;
  item: CheckinHistoryItem;

  employeeName: string;
  employeeSub: string;
  employeePicture?: string | null;

  worksiteName: string;

  status: StatusUI;
  statusText: string;

  timeLabel: string;
  distanceLabel: string;
};

export default function TeamAttendancePanel() {
  const [mode, setMode] = useState<Mode>("me");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [users, setUsers] = useState<UserApi[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [data, setData] = useState<CheckinHistoryItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openKey, setOpenKey] = useState<string | null>(null);

  // ✅ Worksites (Admin only) สำหรับ dropdown filter
  const [worksites, setWorksites] = useState<WorksiteApi[]>([]);
  const [worksitesLoading, setWorksitesLoading] = useState(false);
  const [worksitesError, setWorksitesError] = useState<string | null>(null);

  // ✅ modal state
  const [openCreateWorksite, setOpenCreateWorksite] = useState(false);
  const [openManageWorksites, setOpenManageWorksites] = useState(false);

  // Filters
  const [worksiteFilter, setWorksiteFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StatusUI>("ALL");

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState<number>(1);

  // กัน request เก่าทับ request ใหม่ (เวลาสลับ user รัวๆ)
  const reqSeqRef = useRef(0);

  const userMap = useMemo(() => {
    const m = new Map<string, UserApi>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  async function loadUsers() {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await fetchUsers();
      setUsers(res ?? []);
    } catch (e) {
      console.error(e);
      setUsers([]);
      setUsersError("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }

  // ✅ return list เผื่อเอาไปเช็ค filter reset หลังจัดการ worksites
  async function loadWorksites(): Promise<WorksiteApi[]> {
    try {
      setWorksitesLoading(true);
      setWorksitesError(null);
      const res = await fetchWorksites();
      const list = res ?? [];
      setWorksites(list);
      return list;
    } catch (e) {
      console.error(e);
      setWorksites([]);
      setWorksitesError("Failed to load worksites");
      return [];
    } finally {
      setWorksitesLoading(false);
    }
  }

  async function loadHistory(m: Mode, userId?: string) {
    const currentSeq = ++reqSeqRef.current;

    try {
      setLoading(true);
      setError(null);

      const res =
        m === "me"
          ? await fetchMyCheckinHistory()
          : await fetchCheckinHistoryByUserId((userId ?? "").trim());

      if (currentSeq !== reqSeqRef.current) return;
      setData(res ?? []);
    } catch (e) {
      console.error(e);
      if (currentSeq !== reqSeqRef.current) return;

      setError("Failed to load check-in history");
      setData(null);
    } finally {
      if (currentSeq !== reqSeqRef.current) return;
      setLoading(false);
    }
  }

  // โหลด users + worksites (admin)
  useEffect(() => {
    loadUsers();
    loadWorksites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ตอนเปิดหน้า: default เป็น "me"
  useEffect(() => {
    loadHistory("me");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เปลี่ยน mode
  useEffect(() => {
    setPage(1);
    setOpenKey(null);
    setWorksiteFilter("ALL");
    setStatusFilter("ALL");

    if (mode === "me") {
      setSelectedUserId("");
      loadHistory("me");
    } else {
      setData([]);
      setLoading(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const rows = useMemo<Row[]>(() => {
    const list = (data ?? []).slice().sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list.map((it) => {
      const status = calcStatus(it);
      const statusText = calcStatusText(it);

      const worksiteName =
        it.worksite?.name ??
        (it.location === LocationType.OFFSITE
          ? "OFFSITE"
          : it.worksiteId
          ? `Worksite ${it.worksiteId}`
          : "—");

      const u = userMap.get(it.userId);

      const employeeName =
        (u?.name || "").trim() ||
        (u?.email || "").trim() ||
        (mode === "me" ? "Me" : `User ${it.userId}`);

      const employeeSub =
        (u?.email || "").trim() ||
        (mode === "me" ? "Check-in History" : "Public user history");

      return {
        key: it.id,
        item: it,

        employeeName,
        employeeSub,
        employeePicture: u?.picture ?? null,

        worksiteName,
        status,
        statusText,
        timeLabel: formatFull(it.createdAt),
        distanceLabel:
          it.type === CheckinType.LEAVE ? "—" : fmtDistance(it.distance),
      };
    });
  }, [data, mode, userMap]);

  const worksiteOptions = useMemo(() => {
    // UX: เอารายชื่อจาก master worksites (admin) เป็นหลัก
    // แล้ว merge กับค่าที่เจอในประวัติ (เช่น OFFSITE / —) เพื่อไม่ให้ filter แล้วหาไม่เจอ
    const set = new Set<string>();

    for (const w of worksites) {
      // ถ้าอยากให้แสดง inactive ด้วย ให้เอาเงื่อนไขนี้ออก
      if (w.isActive === false) continue;
      if (w.name) set.add(w.name);
    }

    for (const r of rows) set.add(r.worksiteName || "—");

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, worksites]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (worksiteFilter !== "ALL" && r.worksiteName !== worksiteFilter)
        return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, worksiteFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
    setOpenKey(null);
  }, [worksiteFilter, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const showingFrom = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(total, safePage * PAGE_SIZE);

  // ✅ map เป็น UI rows สำหรับ component กลาง
  const tableRows = useMemo<AttendanceTableRow[]>(() => {
    return paged.map((r) => ({
      key: r.key,
      employeeName: r.employeeName,
      employeeSub: r.employeeSub,
      employeePicture: r.employeePicture ?? null,

      typeText: typeLabel(r.item.type),

      status: r.status,
      statusText: r.statusText,

      worksiteName: r.worksiteName,
      timeLabel: r.timeLabel,
      distanceLabel: r.distanceLabel,

      raw: r.item,
    }));
  }, [paged]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 px-6 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Employee Attendance Records
          </h2>
          {worksitesError && (
            <div className="mt-1 text-xs text-rose-600">{worksitesError}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Create worksite button */}
          <button
            type="button"
            onClick={() => setOpenCreateWorksite(true)}
            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:opacity-95"
          >
            + Create Worksite
          </button>

          {/* Manage worksites */}
          <button
            type="button"
            onClick={() => setOpenManageWorksites(true)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Manage
          </button>

          {/* Worksite filter */}
          <div className="relative">
            <select
              value={worksiteFilter}
              onChange={(e) => setWorksiteFilter(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 hover:bg-slate-50"
              disabled={loading || worksitesLoading}
            >
              <option value="ALL">
                {worksitesLoading ? "Loading worksites…" : "All Worksites"}
              </option>
              {worksiteOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              <option value="ALL">All Status</option>
              <option value="ONSITE">Onsite</option>
              <option value="OFFSITE">Offsite</option>
              <option value="LEAVE">Leave</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Mode */}
      <div className="px-6 pt-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("me")}
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-medium transition text-left",
              mode === "me"
                ? "border-blue-200 bg-blue-50 text-slate-900"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
            ].join(" ")}
          >
            My History (Auth)
          </button>

          <button
            type="button"
            onClick={() => setMode("user")}
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-medium transition text-left",
              mode === "user"
                ? "border-blue-200 bg-blue-50 text-slate-900"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
            ].join(" ")}
          >
            By User (Dropdown)
          </button>
        </div>

        {mode === "user" && (
          <div className="mt-3">
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  const uid = e.target.value;
                  setSelectedUserId(uid);
                  setOpenKey(null);
                  setPage(1);

                  if (!uid) {
                    setData([]);
                    setError(null);
                    setLoading(false);
                    return;
                  }
                  loadHistory("user", uid);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-700 hover:bg-slate-50"
                disabled={usersLoading}
              >
                <option value="">
                  {usersLoading ? "Loading users…" : "Select a user"}
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {userLabel(u)}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {usersError && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-rose-600">
                {usersError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-6 pb-6 pt-5">
        <AttendanceRecordsTable
          rows={tableRows}
          loading={loading}
          openKey={openKey}
          onToggleOpenKey={(key) => setOpenKey((k) => (k === key ? null : key))}
          showSelectUserHint={mode === "user" && !selectedUserId && !loading}
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={total}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          disablePrev={safePage <= 1 || loading}
          disableNext={safePage >= totalPages || loading}
        />

        {error && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-rose-600">
            {error}
          </div>
        )}
      </div>

      <CreateWorksiteModal
        open={openCreateWorksite}
        onClose={() => setOpenCreateWorksite(false)}
        onCreated={async (ws) => {
          const latest = await loadWorksites();

          // ถ้าสร้างใหม่สำเร็จ: ตั้ง filter ไปที่ตัวที่สร้าง
          if (ws?.name) setWorksiteFilter(ws.name);

          // กันเคส list ใหม่ไม่มีชื่อ (เผื่อ api ไม่คืน name)
          if (ws?.name) {
            const activeNames = new Set(
              latest.filter((w) => w.isActive !== false).map((w) => w.name)
            );
            if (!activeNames.has(ws.name)) setWorksiteFilter("ALL");
          }
        }}
      />

      <ManageWorksitesModal
        open={openManageWorksites}
        onClose={() => setOpenManageWorksites(false)}
        onChanged={async () => {
          const latest = await loadWorksites();

          // กันเคสกำลัง filter อยู่ที่ worksite ที่ถูก deactivate
          if (worksiteFilter !== "ALL") {
            const activeNames = new Set(
              latest.filter((w) => w.isActive !== false).map((w) => w.name)
            );
            if (!activeNames.has(worksiteFilter)) {
              setWorksiteFilter("ALL");
            }
          }
        }}
      />
    </div>
  );
}
