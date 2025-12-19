// src/app/lib/userService.ts
import { apiGet } from "./apiClient";

export type UserApi = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  trelloMemberId?: string | null;
  role?: string | null;
};

export async function fetchUsers(options?: { token?: string }): Promise<UserApi[]> {
  return apiGet<UserApi[]>("/users", options);
}
