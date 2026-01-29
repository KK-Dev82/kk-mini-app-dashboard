"use client";

import { useState } from "react";
import { apiPost } from "../../../lib/apiClient";
import type { WhitelistCheckApi } from "../../../lib/userService";

type Row = {
  id: string;
  email: string;
  role?: string | null;

  // ✅ เพิ่ม 2 ฟิลด์นี้ (มาจาก /users เมื่อ email match)
  name?: string | null;
  picture?: string | null;
};

type Props = {
  users: Row[];
  whitelistByUserId: Record<string, WhitelistCheckApi | null>;
  loading: boolean;
  error: string | null;
  onChanged?: () => Promise<void> | void;
};

export default function AuthWhitelistTable({
  users,
  whitelistByUserId,
  loading,
  error,
  onChanged,
}: Props) {
  // ✅ Confirm Delete Modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  function onClickDelete(email: string) {
    setDeleteErr(null);
    setDeleteEmail(email);
    setDeleteOpen(true);
  }

  function onCloseDelete() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteEmail("");
    setDeleteErr(null);
  }

  async function onConfirmDelete() {
    setDeleteErr(null);
    if (!deleteEmail) return;

    setDeleting(true);
    try {
      // ⚠️ ไม่แก้ service: ยิงตรงจากหน้านี้เหมือนเดิม
      await apiPost("/auth/whitelist/remove", { email: deleteEmail });

      setDeleteOpen(false);
      setDeleteEmail("");
      await onChanged?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/\(403\)/.test(msg) || /403/.test(msg)) {
        setDeleteErr("เฉพาะ ADMIN เท่านั้นที่ลบ whitelist ได้");
      } else {
        setDeleteErr(msg);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* ✅ Confirm Delete Modal */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCloseDelete();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-5">
              <div className="text-base font-semibold text-slate-800">
                ยืนยันการลบ Whitelist
              </div>

              <div className="mt-2 text-sm text-slate-600">
                ต้องการลบอีเมลนี้ออกจาก whitelist ใช่ไหม?
              </div>

              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-rose-700/80">Email</span>
                  <span className="font-medium text-rose-800">{deleteEmail}</span>
                </div>
              </div>

              {deleteErr && (
                <div className="mt-3 text-sm text-rose-600 whitespace-pre-wrap">
                  {deleteErr}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={onCloseDelete}
                  disabled={deleting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={onConfirmDelete}
                  disabled={deleting}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {error ? (
          <div className="px-4 py-6 text-sm text-red-600 whitespace-pre-wrap">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium w-[72px]">Picture</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Whitelist</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const w = whitelistByUserId[u.id];

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60">
                        {/* ✅ picture: ถ้าไม่มี -> ไม่แสดงอะไร */}
                        <td className="px-4 py-3">
                          {u.picture ? (
                            <img
                              src={u.picture}
                              alt={u.name || u.email || "user"}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : null}
                        </td>

                        {/* ✅ name: ถ้าไม่ match -> เป็น "-" */}
                        <td className="px-4 py-3 text-slate-800">
                          {u.name ? (
                            <span className="font-medium">{u.name}</span>
                          ) : (
                            <span className="text-slate-400">ผู้ใช้ยังไม่ได้ซิงค์กับระบบ</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-800">{u.email || "-"}</td>

                        <td className="px-4 py-3 text-slate-700">{u.role || "-"}</td>

                        <td className="px-4 py-3">
                          {w?.allowed ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Allowed
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onClickDelete(u.email)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
