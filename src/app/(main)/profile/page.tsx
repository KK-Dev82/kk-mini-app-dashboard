"use client";

import { useEffect, useState } from "react";
import {
  EnvelopeIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import { fetchUserProfile, type UserProfile } from "../../lib/profileService";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile()
      .then(setProfile)
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile");
      });
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 text-sm text-red-500">
        {error}
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

  const teamCount = profile.teamMembers.length;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-8 space-y-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-blue-600">
          {profile.initials}
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            {profile.name}
          </h1>
          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            {profile.title}
          </span>
        </div>
      </div>

      {/* Card: email / department / role */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Email */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <EnvelopeIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">
              Email
            </span>
            <span className="text-sm text-slate-900">{profile.email}</span>
          </div>
        </div>

        {/* Department */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <BuildingOfficeIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">
              Department
            </span>
            <span className="text-sm text-slate-900">
              {profile.department}
            </span>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <ShieldCheckIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">
              Role
            </span>
            <span className="text-sm text-slate-900">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* Card: team */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
            <UserGroupIcon className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">
              Team
            </span>
            <span className="text-sm font-medium text-slate-900">
              {profile.teamName}
            </span>
          </div>
        </div>

        {/* member avatars */}
        <div className="flex items-center gap-2 px-5 pb-2">
          {profile.teamMembers.map((m) => (
            <div
              key={m.id}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-700"
            >
              {m.initials}
            </div>
          ))}
        </div>

        <div className="px-5 pb-4 text-[11px] text-slate-500">
          {teamCount} team member{teamCount > 1 ? "s" : ""}
        </div>
      </div>

      {/* Sign out button (ตอนนี้แค่ UI เฉย ๆ) */}
      <button
        type="button"
        onClick={() => console.log("Sign out clicked")}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-red-600"
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
