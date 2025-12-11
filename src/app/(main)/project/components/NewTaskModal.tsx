"use client";

import { useState, FormEvent } from "react";
import { XMarkIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

export type NewTaskPayload = {
  name: string;
  tagName: string;
  description: string;
  startDate: string;
  endDate: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: NewTaskPayload) => void;
};

export default function NewTaskModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [tagName, setTagName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload: NewTaskPayload = {
      name,
      tagName,
      description,
      startDate,
      endDate,
    };

    onCreate?.(payload);
    onClose();

    // เคลียร์ฟอร์มรอบต่อไป
    setName("");
    setTagName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Create New Project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Project Name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none 
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                         placeholder:text-black/50"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Tag Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Tag Name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none 
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                         placeholder:text-black/50"
              placeholder="Enter tag name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Description
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none 
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                         placeholder:text-black/50"
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none 
                             focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <CalendarDaysIcon className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none 
                             focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <CalendarDaysIcon className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
