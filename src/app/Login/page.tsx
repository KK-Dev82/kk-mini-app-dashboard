"use client";

import { FormEvent } from "react";
import {
  BriefcaseIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // TODO: ทำระบบ login จริงทีหลัง
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-xl px-4">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <BriefcaseIcon className="h-9 w-9 text-white" />
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 mb-2">WorkFlow</h1>
          <p className="text-sm text-slate-500">
            Employee attendance &amp; task management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>
          </div>

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
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition"
          >
            Sign In
          </button>

        </form>
      </div>
    </div>
  );
}
