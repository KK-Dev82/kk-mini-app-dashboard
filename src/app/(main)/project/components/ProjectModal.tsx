"use client";

import { useState, FormEvent } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export type NewProjectPayload = {
  name: string;
  description: string;
  key: string;
  trelloTag: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate?: (data: NewProjectPayload) => void;
};

export default function ProjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [key, setKey] = useState("");
  const [trelloTag, setTrelloTag] = useState("");

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload: NewProjectPayload = {
      name: name.trim(),
      description: description.trim(),
      key: key.trim(),
      trelloTag: trelloTag.trim(),
    };

    onCreate?.(payload);
    onClose();

    setName("");
    setDescription("");
    setKey("");
    setTrelloTag("");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 md:p-8">
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
          {/* name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Name</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Mobile App Development"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Description
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="A comprehensive mobile application for task management"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* key + trelloTag */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Key</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="MOBILE"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
              <p className="text-[11px] text-slate-400">
                ต้องไม่ซ้ำ (ซ้ำจะได้ 409)
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Trello Tag
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="MOBILE"
                value={trelloTag}
                onChange={(e) => setTrelloTag(e.target.value)}
                required
              />
            </div>
          </div>

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
