"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TaskStatsSummary from "./components/TaskStatsSummary";
import { fetchProjectByKey, type ProjectApi } from "../../../lib/projectService";

type ViewState = {
  project: ProjectApi | null;
  err: string;
  loading: boolean;
};

const defer = (fn: () => void) => {
  if (typeof queueMicrotask === "function") queueMicrotask(fn);
  else setTimeout(fn, 0);
};

export default function TaskPage() {
  const sp = useSearchParams();
  const projectKey = sp.get("projectKey") ?? "";

  const [state, setState] = useState<ViewState>({
    project: null,
    err: "",
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;

    const safeSetState = (next: ViewState) => {
      defer(() => {
        if (cancelled) return;
        setState(next);
      });
    };

    if (!projectKey) {
      safeSetState({ project: null, err: "", loading: false });
      return () => {
        cancelled = true;
      };
    }

    safeSetState({ project: null, err: "", loading: true });

    fetchProjectByKey(projectKey)
      .then((data) => {
        safeSetState({ project: data, err: "", loading: false });
      })
      .catch((e) => {
        console.error(e);
        safeSetState({
          project: null,
          err: e instanceof Error ? e.message : "Load project failed",
          loading: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [projectKey]);

  const { project, err, loading } = state;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Project Tasks</h1>

      {!projectKey && (
        <p className="text-xs text-rose-600 mb-4">Missing projectKey</p>
      )}

      {err && <p className="text-xs text-rose-600 mb-4">{err}</p>}

      {project ? (
        <p className="text-xs text-slate-500 mb-4">
          Project:{" "}
          <span className="font-medium text-slate-700">{project.name}</span>{" "}
          <span className="text-slate-400">({project.key})</span>
        </p>
      ) : loading ? (
        projectKey && (
          <p className="text-xs text-slate-500 mb-4">Loading project...</p>
        )
      ) : null}

      <TaskStatsSummary
        projectTag={project?.trelloTag ?? projectKey}
        projectId={project?.id}
      />
    </div>
  );
}
