"use client";

import { useEffect, useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { createWorksite, type CreateWorksitePayload, type WorksiteApi } from "../../../lib/worksiteService";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (worksite: WorksiteApi) => void;
};

function toNumberSafe(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export default function CreateWorksiteModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("500");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setOk(null);
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    const a = toNumberSafe(lat);
    const b = toNumberSafe(lng);
    const r = toNumberSafe(radius);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(r)) return false;
    if (r <= 0) return false;
    return true;
  }, [name, lat, lng, radius]);

  async function onSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setErr(null);
    setOk(null);

    const payload: CreateWorksitePayload = {
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
      latitude: toNumberSafe(lat),
      longitude: toNumberSafe(lng),
      radius: toNumberSafe(radius),
    };

    try {
      const created = await createWorksite(payload);
      setOk("Worksite created successfully");
      onCreated?.(created);

      // reset form (ให้ user สร้างต่อได้)
      setName("");
      setDescription("");
      setLat("");
      setLng("");
      setRadius("500");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Create worksite failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Create Worksite</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-50"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* body */}
          <div className="px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="สำนักงานใหญ่"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[88px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="อาคารสำนักงานหลัก ชั้น 1-10"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Latitude</label>
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="13.7563"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Longitude</label>
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="100.5018"
                  inputMode="decimal"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Radius (meters)</label>
                <input
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="500"
                  inputMode="numeric"
                />
              </div>
            </div>

            {err && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {err}
              </div>
            )}

            {ok && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {ok}
              </div>
            )}
          </div>

          {/* footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
