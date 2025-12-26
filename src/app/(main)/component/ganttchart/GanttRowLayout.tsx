"use client";

import React from "react";

export default function GanttRowLayout({
  left,
  right,
  leftWidth = 360,
  className,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number;
  className?: string;
}) {
  return (
    <div
      className={["grid items-center gap-4", className ?? ""].join(" ")}
      style={{ gridTemplateColumns: `${leftWidth}px 1fr` }}
    >
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}
