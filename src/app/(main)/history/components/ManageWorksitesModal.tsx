"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deactivateWorksite,
  fetchWorksites,
  updateWorksite,
  type WorksiteApi,
  type UpdateWorksitePayload,
} from "../../../lib/worksiteService";

type Props = {
  open: boolean;
  onClose: () => void;
  onChanged?: () => void; // ให้ parent reload worksites / sync filter
};

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function clampRadius(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}

export default function ManageWorksitesModal({ open, onClose, onChanged }: Props) {
  const [list, setList] = useState<WorksiteApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [showInactive, setShowInactive] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateWorksitePayload>({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    radius: 0,
  });

  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetchWorksites();
      setList(res ?? []);
    } catch (e) {
      console.error(e);
      setList([]);
      setErr("Failed to load worksites");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    load();
    // reset edit
    setEditingId(null);
    setBusyId(null);
    setErr(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const visibleList = useMemo(() => {
    const arr = showInactive ? list : list.filter((w) => w.isActive !== false);
    return arr.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [list, showInactive]);

  function startEdit(w: WorksiteApi) {
    setEditingId(w.id);
    setForm({
      name: String(w.name ?? "").trim(),
      description: String(w.description ?? "").trim(),
      latitude: toNum(w.latitude),
      longitude: toNum(w.longitude),
      radius: clampRadius(toNum(w.radius)),
    });
  }

  function stopEdit() {
    setEditingId(null);
    setBusyId(null);
    setErr(null);
  }

  async function saveEdit(id: string) {
    try {
      setBusyId(id);
      setErr(null);

      const payload: UpdateWorksitePayload = {
        name: String(form.name ?? "").trim(),
        description: String(form.description ?? "").trim(),
        latitude: toNum(form.latitude),
        longitude: toNum(form.longitude),
        radius: clampRadius(toNum(form.radius)),
      };

      if (!payload.name) {
        setErr("Name is required");
        return;
      }
      if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
        setErr("Latitude/Longitude must be numbers");
        return;
      }

      await updateWorksite(id, payload);
      await load();
      stopEdit();
      onChanged?.();
    } catch (e) {
      console.error(e);
      setErr("Failed to update worksite");
    } finally {
      setBusyId(null);
    }
  }

  async function doDeactivate(w: WorksiteApi) {
    const ok = window.confirm(`Deactivate "${w.name}" ?\n(Worksite จะถูกปิดการใช้งาน)`);
    if (!ok) return;

    try {
      setBusyId(w.id);
      setErr(null);
      await deactivateWorksite(w.id);
      await load();
      // ถ้ากำลัง edit ตัวนี้อยู่ ให้ปิด edit ไปเลย
      if (editingId === w.id) stopEdit();
      onChanged?.();
    } catch (e) {
      console.error(e);
      setErr("Failed to deactivate worksite");
    } finally {
      setBusyId(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-base font-semibold text-slate-900">Manage Worksites</div>
            <div className="mt-0.5 text-xs text-slate-500">
              Edit หรือ Deactivate worksite (Admin)
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show inactive
            </label>
          </div>

          {err && <div className="text-sm text-rose-600">{err}</div>}
        </div>

        {/* List */}
        <div className="max-h-[70vh] overflow-auto px-5 pb-5">
          {visibleList.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No worksites
            </div>
          ) : (
            <div className="space-y-3">
              {visibleList.map((w) => {
                const editing = editingId === w.id;
                const busy = busyId === w.id;

                return (
                  <div key={w.id} className="rounded-2xl border border-slate-200 p-4">
                    {/* Top row */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {w.name}
                          </div>
                          {w.isActive === false && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              inactive
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-xs text-slate-600">
                          {w.description || "—"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>lat: {String(w.latitude)}</span>
                          <span>lng: {String(w.longitude)}</span>
                          <span>radius: {String(w.radius)}m</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!editing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(w)}
                              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                              disabled={busy}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => doDeactivate(w)}
                              className="h-9 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm text-rose-700 hover:bg-rose-100"
                              disabled={busy || w.isActive === false}
                              title={w.isActive === false ? "Already inactive" : "Deactivate"}
                            >
                              {busy ? "Working…" : "Deactivate"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(w.id)}
                              className="h-9 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white hover:opacity-95"
                              disabled={busy}
                            >
                              {busy ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={stopEdit}
                              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                              disabled={busy}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit form */}
                    {editing && (
                      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-medium text-slate-600">
                            Name
                          </label>
                          <input
                            value={form.name}
                            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            placeholder="Worksite name"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-xs font-medium text-slate-600">
                            Description
                          </label>
                          <input
                            value={form.description ?? ""}
                            onChange={(e) =>
                              setForm((s) => ({ ...s, description: e.target.value }))
                            }
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                            placeholder="Description"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600">
                            Latitude
                          </label>
                          <input
                            value={String(form.latitude)}
                            onChange={(e) =>
                              setForm((s) => ({ ...s, latitude: toNum(e.target.value) }))
                            }
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600">
                            Longitude
                          </label>
                          <input
                            value={String(form.longitude)}
                            onChange={(e) =>
                              setForm((s) => ({ ...s, longitude: toNum(e.target.value) }))
                            }
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600">
                            Radius (m)
                          </label>
                          <input
                            value={String(form.radius)}
                            onChange={(e) =>
                              setForm((s) => ({ ...s, radius: clampRadius(toNum(e.target.value)) }))
                            }
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
