// src/app/lib/trelloService.ts
import { apiGet, apiPost, apiPut } from "./apiClient";

/* ----------------------------- Types ----------------------------- */

export type TrelloLabel = {
  id: string;
  name: string;
  color: string | null;
};

export type TrelloChecklistItem = {
  id: string;
  name: string;
  state: "complete" | "incomplete" | string;
  pos: number;
};

export type TrelloChecklist = {
  id: string;
  name: string;
  checkItems: TrelloChecklistItem[];
};

export type TrelloBadges = {
  checkItems?: number;
  checkItemsChecked?: number;
  comments?: number;
  attachments?: number;
};

export type TrelloCard = {
  id: string;
  name: string;
  desc: string;

  idList?: string;
  listName?: string;

  pos: number;
  closed: boolean;
  start: string | null;
  due: string | null;
  dueComplete: boolean;

  idMembers: string[];
  labels: TrelloLabel[];
  checklists: TrelloChecklist[];
  badges: TrelloBadges;

  shortLink: string;
  url: string;
};

export type TrelloList = {
  id: string;
  name: string;
  pos: number;
  closed: boolean;
};

/** ✅ GET /trello/members */
export type TrelloMember = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  initials?: string;
};

/* ----------------------------- APIs ----------------------------- */

export const fetchTrelloMembers = () =>
  apiGet<TrelloMember[]>("/trello/members");

/** ✅ GET /trello/cards/tag/{tag} */
export async function fetchTrelloCardsByTag(tag: string): Promise<TrelloCard[]> {
  const t = (tag ?? "").trim();
  if (!t) return [];
  return apiGet<TrelloCard[]>(`/trello/cards/tag/${encodeURIComponent(t)}`);
}

/** ✅ POST /trello/cards */
export type CreateTrelloCardPayload = {
  listId: string;
  name: string;
  desc?: string;
  memberIds?: string[];
  startDate?: string; // ISO
  dueDate?: string; // ISO
  checklistItems?: string[];
  projectId?: string;
};

export async function createTrelloCard(
  payload: CreateTrelloCardPayload
): Promise<TrelloCard> {
  return apiPost<TrelloCard>("/trello/cards", payload);
}

/** ✅ PUT /trello/cards/{cardId} */
export type UpdateTrelloCardPayload = {
  listId: string;
  name: string;
  desc?: string;
  startDate?: string; // ISO
  dueDate?: string; // ISO
};

export async function updateTrelloCard(
  cardId: string,
  payload: UpdateTrelloCardPayload
): Promise<TrelloCard> {
  const id = (cardId ?? "").trim();
  if (!id) throw new Error("Missing cardId");
  return apiPut<TrelloCard>(`/trello/cards/${encodeURIComponent(id)}`, payload);
}

/** ✅ GET /trello/lists */
export const fetchTrelloLists = () => apiGet<TrelloList[]>("/trello/lists");
