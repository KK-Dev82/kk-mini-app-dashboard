// src/app/lib/profileService.ts
import { apiGet } from "./apiClient";

export type UserProfileApi = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  trelloMemberId?: string | null;
  role?: string | null;
};

export async function fetchUserProfile(options?: {
  token?: string;
  useEnvToken?: boolean;
}): Promise<UserProfileApi> {
  return apiGet<UserProfileApi>("/users/profile", {
    token: options?.token,
    useEnvToken: options?.useEnvToken ?? true,
  });
}
