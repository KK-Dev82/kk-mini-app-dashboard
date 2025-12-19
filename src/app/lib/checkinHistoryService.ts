// src/lib/checkinHistoryService.ts
import { apiGet } from "./apiClient";

export type CheckinType = "CHECK_IN" | "CHECK_OUT" | string;

export type Worksite = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  radius: number;
};

export type CheckinHistoryItem = {
  id: string;
  type: CheckinType;
  latitude: number;
  longitude: number;
  distance: number;
  notes?: string | null;
  createdAt: string;
  worksite: Worksite;
};

export async function fetchMyCheckinHistory(): Promise<CheckinHistoryItem[]> {
  return apiGet<CheckinHistoryItem[]>("/checkin/history");
}

export async function fetchCheckinHistoryByUserId(
  userId: string
): Promise<CheckinHistoryItem[]> {
  const safe = encodeURIComponent(userId);
  return apiGet<CheckinHistoryItem[]>(`/checkin/user/${safe}/history`, {
    noAuth: true,
  });
}
