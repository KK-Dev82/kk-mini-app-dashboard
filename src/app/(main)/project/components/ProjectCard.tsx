// src/app/(main)/project/components/ProjectCard.tsx
import Link from "next/link";
import type { ProjectListItem } from "../../../lib/projectService";
import {
  EllipsisHorizontalIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";

type Props = {
  project: ProjectListItem;
};

export default function ProjectCard({ project }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-start justify-between">
      <div className="flex items-start gap-3">
        {/* Project icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <FolderIcon className="h-5 w-5" />
        </div>

        <div className="space-y-1">
          <Link
            href={{
              pathname: "/project/task",
              query: { projectKey: project.key },
            }}
            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition"
          >
            {project.name}
          </Link>

          {project.description && (
            <p className="text-xs text-slate-500">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="text-slate-400 hover:text-slate-600"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
