"use client";

import { useEffect, useState } from "react";
import {
  fetchAuthWhitelist,
  type WhitelistCheckApi,
  type WhitelistEntryApi,
} from "../../lib/userService";

import AuthWhitelistAddCard from "./components/AuthWhitelistAddCard";
import AuthWhitelistTable from "./components/AuthWhitelistTable";

type DisplayUser = {
  id: string;
  email: string;
  role?: string | null;
};

function toDisplayUser(entry: WhitelistEntryApi): DisplayUser {
  const email = entry.email ?? "";
  return {
    id: entry.id ?? email,
    email,
    role: entry.role ?? null,
  };
}

export default function UserPage() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingWhitelist, setCheckingWhitelist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [whitelistByUserId, setWhitelistByUserId] = useState<
    Record<string, WhitelistCheckApi | null>
  >({});

  async function loadWhitelist() {
    setLoading(true);
    setError(null);
    setCheckingWhitelist(true);

    try {
      const entries = await fetchAuthWhitelist();
      const list = (Array.isArray(entries) ? entries : []).map(toDisplayUser);
      setUsers(list);

      // ทุกตัวใน list = อยู่ใน whitelist => Allowed
      const status: Record<string, WhitelistCheckApi> = {};
      for (const u of list) {
        status[u.id] = { allowed: true, role: u.role ?? null, message: "Allowed" };
      }
      setWhitelistByUserId(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setUsers([]);
      setWhitelistByUserId({});
    } finally {
      setLoading(false);
      setCheckingWhitelist(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadWhitelist();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">User</h1>
            <p className="mt-1 text-sm text-slate-500">รายชื่อผู้ใช้งานในระบบ</p>
          </div>

          <div className="text-xs text-slate-500">
            {loading
              ? "Loading..."
              : `${users.length} users${checkingWhitelist ? " • checking..." : ""}`}
          </div>
        </div>

        {/* ✅ รูปที่ 1 */}
        <AuthWhitelistAddCard onChanged={loadWhitelist} />

        {/* ✅ รูปที่ 2 */}
        <AuthWhitelistTable
          users={users}
          whitelistByUserId={whitelistByUserId}
          loading={loading}
          error={error}
          onChanged={loadWhitelist}
        />
      </div>
    </main>
  );
}
