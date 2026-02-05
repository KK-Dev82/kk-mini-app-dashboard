"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EnvelopeIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import { fetchUserProfile, type UserProfileApi } from "../../lib/profileService";

function getInitials(nameOrEmail: string) {
  const s = (nameOrEmail ?? "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = useMemo(() => {
    if (!profile) return "";
    return getInitials(profile.name || profile.email);
  }, [profile]);

  useEffect(() => {
    fetchUserProfile({ useEnvToken: true })
      .then(setProfile)
      .catch((err) => {
        console.error("Failed to load profile:", err);

        const msg = String(err?.message ?? err);
        if (msg.includes("(401)")) {
          setError("Unauthorized (401) — กรุณา Login ใหม่");
        } else if (msg.includes("(404)")) {
          setError("User not found (404)");
        } else {
          setError("Failed to load profile");
        }
      });
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("accessToken");
            window.location.href = "/auth/logout";
          }}
          className="mt-4 w-full rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 text-sm text-slate-500">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-8 space-y-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3">
        {profile.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.picture}
            alt="avatar"
            className="h-24 w-24 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-blue-600">
            {initials}
          </div>
        )}

        <div className="text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            {profile.name || profile.email}
          </h1>
          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            {profile.role || "USER"}
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Email */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <EnvelopeIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">Email</span>
            <span className="text-sm text-slate-900">{profile.email}</span>
          </div>
        </div>

        {/* User ID */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <UserGroupIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">User ID</span>
            <span className="text-sm text-slate-900 break-all">{profile.id}</span>
          </div>
        </div>

        {/* Trello Member */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <BuildingOfficeIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">
              Trello Member ID
            </span>
            <span className="text-sm text-slate-900 break-all">
              {profile.trelloMemberId || "-"}
            </span>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <ShieldCheckIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">Role</span>
            <span className="text-sm text-slate-900">{profile.role || "-"}</span>
          </div>
        </div>
      </div>

      {/* Sign out button (logout จริง) */}
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem("accessToken");
          window.location.href = "/auth/logout";
        }}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-red-600"
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
