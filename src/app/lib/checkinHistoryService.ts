// src/lib/checkinHistoryService.ts
import { apiGet } from "./apiClient";

export enum CheckinType {
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
  LEAVE = "LEAVE",
}

export enum LocationType {
  ONSITE = "ONSITE",
  OFFSITE = "OFFSITE",
}

export enum LeaveType {
  SICK_LEAVE = "SICK_LEAVE",
  PERSONAL_LEAVE = "PERSONAL_LEAVE",
  ANNUAL_LEAVE = "ANNUAL_LEAVE",
  NONE = "NONE",
}

export type WorksiteApi = {
  id: string;
  name: string;
  description?: string | null;
  latitude: string | number;
  longitude: string | number;
  radius: number;

  checkinStartTime?: string | null;
  checkinEndTime?: string | null;
  checkoutStartTime?: string | null;
  checkoutEndTime?: string | null;

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CheckinHistoryItem = {
  id: string;

  type: CheckinType;
  location: LocationType;
  leaveType: LeaveType;

  latitude: string | number;
  longitude: string | number;
  distance: string | number;

  photo: string | null;
  reason: string | null;
  notes: string | null;
  isSystemGenerated: boolean;

  createdAt: string;

  userId: string;
  worksiteId: string | null;
  worksite: WorksiteApi | null;
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
