"use client";

import { FormEvent, useState } from "react";
import {
  BriefcaseIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 LOGIN จริง (รอ backend พร้อม)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || "Login failed");
      }

      await res.json(); // token ถูก set ใน cookie แล้ว
      router.replace("/home");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.includes("401")) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        setError("ไม่สามารถเข้าสู่ระบบได้");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🧪 DEV LOGIN (Mock Auth)
  const handleDevLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await fetch("/api/auth/dev-login", { method: "POST" });
      router.replace("/home"); // หรือ /project
    } catch {
      setError("DEV LOGIN ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-xl px-4">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <BriefcaseIcon className="h-9 w-9 text-white" />
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            WorkFlow
          </h1>
          <p className="text-sm text-slate-500">
            Employee attendance &amp; task management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email
            </label>
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 shadow-sm">
              <EnvelopeIcon className="h-5 w-5 text-slate-500" />
              <input
                type="email"
                placeholder="pm@company.com"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 shadow-sm">
              <LockClosedIcon className="h-5 w-5 text-slate-500" />
              <input
                type="password"
                placeholder="••••"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Error */}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* DEV LOGIN */}
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              onClick={handleDevLogin}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl
                         border border-dashed border-slate-300 text-sm text-slate-600
                         hover:bg-slate-100 transition disabled:opacity-60"
            >
              DEV LOGIN (Mock Auth)
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
