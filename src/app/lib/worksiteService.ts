// src/lib/worksiteService.ts
import { apiDelete, apiGet, apiPost, apiPut } from "./apiClient";

export type WorksiteApi = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number | string;
  longitude: number | string;
  radius: number;

  checkinStartTime?: string | null;
  checkinEndTime?: string | null;
  checkoutStartTime?: string | null;
  checkoutEndTime?: string | null;

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateWorksitePayload = {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number;
};

export type UpdateWorksitePayload = {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number;
};

export async function fetchWorksites(): Promise<WorksiteApi[]> {
  return apiGet<WorksiteApi[]>("/admin/worksites", {
    useEnvToken: true,
  });
}

export async function createWorksite(
  payload: CreateWorksitePayload
): Promise<WorksiteApi> {
  return apiPost<WorksiteApi>("/admin/worksites", payload, {
    useEnvToken: true,
  });
}

export async function updateWorksite(
  id: string,
  payload: UpdateWorksitePayload
): Promise<WorksiteApi> {
  const safeId = String(id ?? "").trim();
  if (!safeId) throw new Error("updateWorksite: id is required");

  return apiPut<WorksiteApi>(`/admin/worksites/${safeId}`, payload, {
    useEnvToken: true,
  });
}

export async function deactivateWorksite(
  id: string
): Promise<WorksiteApi> {
  const safeId = String(id ?? "").trim();
  if (!safeId) throw new Error("deactivateWorksite: id is required");

  return apiDelete<WorksiteApi>(`/admin/worksites/${safeId}`, {
    useEnvToken: true,
  });
}
