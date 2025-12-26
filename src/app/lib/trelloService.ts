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

export type TrelloMember = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  initials?: string;
};

/* ----------------------------- APIs ----------------------------- */

export const fetchTrelloMembers = () => apiGet<TrelloMember[]>("/trello/members");

export async function fetchTrelloCardsByTag(tag: string): Promise<TrelloCard[]> {
  const t = (tag ?? "").trim();
  if (!t) return [];
  return apiGet<TrelloCard[]>(`/trello/cards/tag/${encodeURIComponent(t)}`);
}

export type CreateTrelloCardPayload = {
  listId: string;
  name: string;
  desc?: string;
  memberIds?: string[];
  startDate?: string;
  dueDate?: string;
  checklistItems?: string[];
  projectId?: string;
};

export async function createTrelloCard(
  payload: CreateTrelloCardPayload
): Promise<TrelloCard> {
  return apiPost<TrelloCard>("/trello/cards", payload);
}

export type UpdateTrelloCardPayload = {
  listId: string;
  name: string;
  desc?: string;
  startDate?: string;
  dueDate?: string;
};

export async function updateTrelloCard(
  cardId: string,
  payload: UpdateTrelloCardPayload
): Promise<TrelloCard> {
  const id = (cardId ?? "").trim();
  if (!id) throw new Error("Missing cardId");
  return apiPut<TrelloCard>(`/trello/cards/${encodeURIComponent(id)}`, payload);
}

export const fetchTrelloLists = () => apiGet<TrelloList[]>("/trello/lists");

/* ----------------------------- Member Assign ----------------------------- */

export async function assignTrelloMember(cardId: string, memberId: string) {
  const cid = (cardId ?? "").trim();
  const mid = (memberId ?? "").trim();
  if (!cid) throw new Error("Missing cardId");
  if (!mid) throw new Error("Missing memberId");
  return apiPost<any>(`/trello/cards/${encodeURIComponent(cid)}/assign`, {
    memberId: mid,
  });
}

export async function unassignTrelloMember(cardId: string, memberId: string) {
  const cid = (cardId ?? "").trim();
  const mid = (memberId ?? "").trim();
  if (!cid) throw new Error("Missing cardId");
  if (!mid) throw new Error("Missing memberId");

  return apiPost<any>(`/trello/cards/${encodeURIComponent(cid)}/unassign`, {
    memberId: mid,
  });
}

/* ----------------------------- Checklist Update ----------------------------- */

export type ChecklistItemState = "complete" | "incomplete";

export async function updateChecklistItemState(
  cardId: string,
  checkItemId: string,
  state: ChecklistItemState
) {
  const cid = (cardId ?? "").trim();
  const iid = (checkItemId ?? "").trim();
  if (!cid) throw new Error("Missing cardId");
  if (!iid) throw new Error("Missing checkItemId");
  if (state !== "complete" && state !== "incomplete") {
    throw new Error("Invalid checklist state");
  }

  // ✅ default: ส่งแบบ body (ส่วนใหญ่ backend ทำแบบนี้)
  return apiPut<any>(
    `/trello/cards/${encodeURIComponent(cid)}/checklist/${encodeURIComponent(iid)}`,
    { state }
  );
}
