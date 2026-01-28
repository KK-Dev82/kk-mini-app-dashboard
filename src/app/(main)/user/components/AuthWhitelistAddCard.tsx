"use client";

import { useState } from "react";
import { addAuthWhitelist, type WhitelistRole } from "../../../lib/userService";

type Props = {
  onChanged?: () => Promise<void> | void; // ให้ page reload list
};

export default function AuthWhitelistAddCard({ onChanged }: Props) {
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<WhitelistRole>("USER");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);

  // ✅ Confirm Add Modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string>("");
  const [confirmRole, setConfirmRole] = useState<WhitelistRole>("USER");

  function onClickAdd() {
    setAddMsg(null);
    setAddErr(null);

    const email = addEmail.trim();
    if (!email || !email.includes("@")) {
      setAddErr("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setConfirmEmail(email);
    setConfirmRole(addRole);
    setConfirmOpen(true);
  }

  async function onConfirmAdd() {
    setAddMsg(null);
    setAddErr(null);

    setAdding(true);
    try {
      await addAuthWhitelist({ email: confirmEmail, role: confirmRole });

      setAddMsg("เพิ่มเข้า whitelist แล้ว");
      setAddEmail("");
      setConfirmOpen(false);

      await onChanged?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      if (/\(403\)/.test(msg) || /403/.test(msg)) {
        setAddErr("เฉพาะ ADMIN เท่านั้นที่เพิ่ม whitelist ได้");
      } else {
        setAddErr(msg);
      }
    } finally {
      setAdding(false);
    }
  }

  function onCloseConfirm() {
    if (adding) return;
    setConfirmOpen(false);
  }

  return (
    <>
      {/* ✅ Confirm Add Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCloseConfirm();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-5">
              <div className="text-base font-semibold text-slate-800">
                ยืนยันการเพิ่ม Whitelist
              </div>

              <div className="mt-2 text-sm text-slate-600">
                ต้องการเพิ่มอีเมลนี้เข้า whitelist ใน role นี้จริงๆใช่ไหม?
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-800">{confirmEmail}</span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium text-slate-800">{confirmRole}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={onCloseConfirm}
                  disabled={adding}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={onConfirmAdd}
                  disabled={adding}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {adding ? "Adding..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-800">
              Authentication Whitelist
            </div>
            <div className="text-xs text-slate-500">
              เพิ่ม email เข้า whitelist (Admin only)
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600">Email</label>
            <input
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="sm:w-44">
            <label className="block text-xs font-medium text-slate-600">Role</label>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as WhitelistRole)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <button
            onClick={onClickAdd}
            disabled={adding}
            className="sm:self-end rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Add
          </button>
        </div>

        {addErr && (
          <div className="mt-3 text-sm text-rose-600 whitespace-pre-wrap">{addErr}</div>
        )}
        {addMsg && <div className="mt-3 text-sm text-emerald-700">{addMsg}</div>}
      </div>
    </>
  );
}
