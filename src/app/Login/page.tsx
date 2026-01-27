"use client";

import { BriefcaseIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const handleAuth0Login = () => {
    window.location.href = "/auth/login";
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

        <button
          onClick={handleAuth0Login}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition"
        >
          Sign In with Auth0
        </button>
      </div>
    </div>
  );
}
