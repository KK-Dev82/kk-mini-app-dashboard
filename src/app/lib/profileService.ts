import { apiGet } from "./apiClient";

export type TeamMember = {
  id: number;
  name: string;
  initials: string;
};

export type UserProfile = {
  id: number;
  name: string;
  initials: string;
  title: string;
  email: string;
  department: string;
  role: string;
  teamName: string;
  teamMembers: TeamMember[];
};

export async function fetchUserProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>("/api/profile");
}
