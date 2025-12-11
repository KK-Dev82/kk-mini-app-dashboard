"use client";

import { useEffect, useState } from "react";
import {
  fetchLeaveHistory,
  type LeaveHistoryResponse,
} from "../../lib/leaveHistoryService";
import HistoryRequestCard from "./components/HistoryRequestCard";

export default function LeaveHistoryPage() {
  const [data, setData] = useState<LeaveHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveHistory()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to fetch leave history:", err);
        setError("Failed to load history");
      });
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-500">
        Loading history…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      {/* header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          History Requests
        </h1>
        <p className="text-xs text-slate-500">
          {data.total} records
        </p>
      </div>

      {/* list */}
      <div className="space-y-3">
        {data.items.map((item) => (
          <HistoryRequestCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
