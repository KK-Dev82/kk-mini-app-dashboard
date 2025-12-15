"use client";

import { useEffect, useState } from "react";
import {
  fetchProjects,
  createProject,
  type ProjectsResponse,
  type CreateProjectPayload,
} from "../../lib/projectService";

import ProjectCard from "./components/ProjectCard";
import ProjectModal, { type NewProjectPayload } from "./components/ProjectModal";

export default function ProjectPage() {
  const [data, setData] = useState<ProjectsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetchProjects()
      .then(setData)
      .catch((err) => console.error("Failed to load projects", err));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (payload: NewProjectPayload) => {
    try {
      setSaving(true);

      const body: CreateProjectPayload = {
        name: payload.name,
        description: payload.description,
        key: payload.key,
        trelloTag: payload.trelloTag,
      };

      await createProject(body);
      await load();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Create project failed");
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className="p-6 text-sm text-slate-500">Loading...</div>;

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Project</h1>
            <p className="text-xs text-slate-500">{data.items.length} projects</p>
          </div>

          <button
            onClick={() => setOpen(true)}
            disabled={saving}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
          >
            <span className="mr-1 text-base leading-none">＋</span>
            New Project
          </button>
        </div>

        <div className="space-y-3">
          {data.items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      <ProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
