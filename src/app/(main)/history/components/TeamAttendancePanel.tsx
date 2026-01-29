"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import {
  fetchMyCheckinHistoryPage,
  fetchCheckinHistoryByUserIdPage,
  type CheckinHistoryItem,
  type PaginationMeta,
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

function userMatches(u: UserApi, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const name = (u.name || "").toLowerCase();
  const email = (u.email || "").toLowerCase();
  const id = (u.id || "").toLowerCase();
  return name.includes(query) || email.includes(query) || id.includes(query);
}

function UserAutocompleteDropdown({
  users,
  value,
  onChange,
  loading,
  disabled,
  placeholder = "Select a user",
}: {
  users: UserApi[];
  value: string;
  onChange: (id: string) => void;
  loading: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => users.find((u) => u.id === value) ?? null,
    [users, value]
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    setQuery(selected ? userLabel(selected) : "");
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const list = users.filter((u) => userMatches(u, query));
    if (value) {
      const idx = list.findIndex((u) => u.id === value);
      if (idx > 0) {
        const copy = list.slice();
        const [pick] = copy.splice(idx, 1);
        copy.unshift(pick);
        return copy;
      }
    }
    return list;
  }, [users, query, value]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function commitSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  function clearSelect() {
    onChange("");
    setQuery("");
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={[
          "flex h-10 items-center gap-2 rounded-xl border bg-white px-3 pr-9 text-sm",
          disabled ? "border-slate-200 opacity-60" : "border-slate-200",
        ].join(" ")}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          placeholder={loading ? "Loading users…" : placeholder}
          disabled={disabled || loading}
          className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
        />

        {!!value && !disabled && !loading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearSelect();
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-lg p-1 hover:bg-slate-50"
            title="Clear"
          >
            <XMarkIcon className="h-4 w-4 text-slate-400" />
          </button>
        )}

        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="max-h-72 overflow-auto py-1">
            {loading ? (
              <div className="px-3 py-2 text-sm text-slate-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No results</div>
            ) : (
              filtered.map((u) => {
                const isSelected = u.id === value;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => commitSelect(u.id)}
                    className={[
                      "flex w-full items-start gap-3 px-3 py-2 text-left text-sm",
                      isSelected ? "bg-blue-50" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">
                        {(u.name || "").trim() || u.email || u.id}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {u.email || u.id}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
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

// ✅ default ของ API (ใช้แค่คำนวณ UI เผื่อ backend ไม่ส่ง meta.limit)
const API_DEFAULT_LIMIT = 20;

export default function TeamAttendancePanel() {
  const [mode, setMode] = useState<Mode>("me");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [users, setUsers] = useState<UserApi[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [data, setData] = useState<CheckinHistoryItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Worksites
  const [worksites, setWorksites] = useState<WorksiteApi[]>([]);
  const [worksitesLoading, setWorksitesLoading] = useState(false);
  const [worksitesError, setWorksitesError] = useState<string | null>(null);

  // ✅ modal
  const [openCreateWorksite, setOpenCreateWorksite] = useState(false);
  const [openManageWorksites, setOpenManageWorksites] = useState(false);

  // Filters (client filter)
  const [worksiteFilter, setWorksiteFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StatusUI>("ALL");

  // ✅ Server pagination
  const [page, setPage] = useState<number>(1);

  // กัน request เก่าทับ request ใหม่
  const reqSeqRef = useRef(0);

  // ✅ เก็บ limit จาก API (ถ้า meta.limit มา จะอัปเดต)
  const apiLimitRef = useRef<number>(API_DEFAULT_LIMIT);

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

  async function loadHistory(m: Mode, userId: string | undefined, pageNum: number) {
    const currentSeq = ++reqSeqRef.current;

    try {
      setLoading(true);
      setError(null);

      // ✅ ไม่ส่ง limit -> ให้ API ใช้ default ของมันเอง
      const res =
        m === "me"
          ? await fetchMyCheckinHistoryPage({ page: pageNum })
          : await fetchCheckinHistoryByUserIdPage((userId ?? "").trim(), {
            page: pageNum,
          });

      if (currentSeq !== reqSeqRef.current) return;

      setData(res.items ?? []);
      setMeta(res.meta ?? { page: pageNum });

      if (typeof res.meta?.limit === "number" && res.meta.limit > 0) {
        apiLimitRef.current = res.meta.limit;
      }
    } catch (e) {
      console.error(e);
      if (currentSeq !== reqSeqRef.current) return;

      setError("Failed to load check-in history");
      setData([]);
      setMeta(null);
    } finally {
      if (currentSeq !== reqSeqRef.current) return;
      setLoading(false);
    }
  }

  // load initial
  useEffect(() => {
    loadUsers();
    loadWorksites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mode change reset
  useEffect(() => {
    setPage(1);
    setWorksiteFilter("ALL");
    setStatusFilter("ALL");

    if (mode === "me") {
      setSelectedUserId("");
    } else {
      setData([]);
      setMeta(null);
      setLoading(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // fetch when mode/selected/page changed
  useEffect(() => {
    if (mode === "me") {
      loadHistory("me", undefined, page);
      return;
    }

    if (!selectedUserId) {
      setData([]);
      setMeta(null);
      setLoading(false);
      setError(null);
      return;
    }

    loadHistory("user", selectedUserId, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedUserId, page]);

  const rows = useMemo<Row[]>(() => {
    const list = data
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

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
    const set = new Set<string>();

    for (const w of worksites) {
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
  }, [worksiteFilter, statusFilter]);

  const currentPage = meta?.page ?? page;
  const perPage = meta?.limit ?? apiLimitRef.current;

  const showingFrom =
    filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const showingTo =
    filtered.length === 0 ? 0 : (currentPage - 1) * perPage + filtered.length;

  const total =
    typeof meta?.total === "number"
      ? meta.total
      : // fallback
      showingTo;

  const disablePrev = currentPage <= 1 || loading;

  const disableNext = loading
    ? true
    : typeof meta?.totalPages === "number"
      ? currentPage >= meta.totalPages
      : data.length < perPage;

  const tableRows = useMemo<AttendanceTableRow[]>(() => {
    return filtered.map((r) => ({
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
  }, [filtered]);

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
          <button
            type="button"
            onClick={() => setOpenCreateWorksite(true)}
            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:opacity-95"
          >
            + Create Worksite
          </button>

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
            <UserAutocompleteDropdown
              users={users}
              value={selectedUserId}
              loading={usersLoading}
              disabled={false}
              onChange={(id) => {
                setSelectedUserId(id);
                setPage(1);
              }}
            />

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
          showSelectUserHint={mode === "user" && !selectedUserId && !loading}
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={total}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() =>
            setPage((p) =>
              typeof meta?.totalPages === "number"
                ? Math.min(meta.totalPages, p + 1)
                : p + 1
            )
          }
          disablePrev={disablePrev}
          disableNext={disableNext}
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

          if (ws?.name) setWorksiteFilter(ws.name);

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
