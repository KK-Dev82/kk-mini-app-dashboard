"use client";

import { Fragment } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export type StatusUI = "ONSITE" | "OFFSITE" | "LEAVE" | "UNKNOWN";

export type AttendanceTableRow = {
  key: string;

  employeeName: string;
  employeeSub: string;
  employeePicture?: string | null;

  typeText: string;

  status: StatusUI;
  statusText: string;

  worksiteName: string;
  timeLabel: string;
  distanceLabel: string;

  // ถ้าจะให้เปิดดู raw json
  raw?: unknown;
};

function statusPill(status: StatusUI) {
  if (status === "ONSITE") return "bg-emerald-100 text-emerald-800";
  if (status === "OFFSITE") return "bg-sky-100 text-sky-800";
  if (status === "LEAVE") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function gpsDot(status: StatusUI) {
  if (status === "ONSITE") return "bg-emerald-500";
  if (status === "OFFSITE") return "bg-amber-400";
  return "bg-slate-300";
}

function initialsFrom(name?: string, sub?: string) {
  const raw = (name || sub || "").trim();
  if (!raw) return "U";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
}

export default function AttendanceRecordsTable({
  rows,
  loading,

  openKey,
  onToggleOpenKey,

  emptyText = "No records",
  loadingText = "Loading…",
  selectUserText = "Please select a user",
  showSelectUserHint = false,

  showingFrom,
  showingTo,
  total,

  onPrev,
  onNext,
  disablePrev,
  disableNext,
}: {
  rows: AttendanceTableRow[];
  loading: boolean;

  openKey: string | null;
  onToggleOpenKey: (key: string) => void;

  emptyText?: string;
  loadingText?: string;
  selectUserText?: string;
  showSelectUserHint?: boolean;

  showingFrom: number;
  showingTo: number;
  total: number;

  onPrev: () => void;
  onNext: () => void;
  disablePrev: boolean;
  disableNext: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full border-collapse">
          <thead className="bg-slate-50">
            <tr className="text-left text-[11px] font-semibold text-slate-500">
              <th className="px-5 py-4">EMPLOYEE</th>
              <th className="px-5 py-4">TYPE</th>
              <th className="px-5 py-4">STATUS</th>
              <th className="px-5 py-4">WORKSITE</th>
              <th className="px-5 py-4">TIME</th>
              <th className="px-5 py-4">DISTANCE</th>
              <th className="px-5 py-4">GPS</th>
              <th className="px-5 py-4 text-right">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                  {loadingText}
                </td>
              </tr>
            ) : showSelectUserHint ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                  {selectUserText}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const init = initialsFrom(r.employeeName, r.employeeSub);

                return (
                  <Fragment key={r.key}>
                    <tr className="text-sm text-slate-700">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {r.employeePicture ? (
                            <img
                              src={r.employeePicture}
                              alt={r.employeeName}
                              className="h-10 w-10 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                              {init}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">
                              {r.employeeName}
                            </div>
                            <div className="truncate text-xs text-slate-500">{r.employeeSub}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">{r.typeText}</td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            statusPill(r.status),
                          ].join(" ")}
                        >
                          {r.statusText}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">{r.worksiteName}</td>
                      <td className="px-5 py-4">{r.timeLabel}</td>
                      <td className="px-5 py-4 text-slate-600">{r.distanceLabel}</td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            "inline-block h-2.5 w-2.5 rounded-full",
                            gpsDot(r.status),
                          ].join(" ")}
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-50"
                          onClick={() => onToggleOpenKey(r.key)}
                          title="Details"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-slate-500" />
                        </button>
                      </td>
                    </tr>

                    {openKey === r.key && (
                      <tr>
                        <td colSpan={8} className="bg-slate-50 px-5 py-5">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Raw (API)</div>
                            <pre className="mt-3 overflow-auto text-[11px] text-slate-700">
{JSON.stringify(r.raw ?? r, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          Showing {showingFrom}-{showingTo} of {total} records
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={disablePrev}
            className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={disableNext}
            className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
