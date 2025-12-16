"use client";

import React from "react";

export function InlineLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-white/70">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

export function PageLoadingOverlay({
  show,
  label = "Loading...",
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="w-[340px] rounded-2xl bg-slate-900/90 p-5 text-white shadow-xl ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <div>
            <div className="text-sm font-semibold">กำลังโหลดข้อมูล</div>
            <div className="text-xs text-white/60">{label}</div>
          </div>
        </div>

        {/* skeleton bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}
