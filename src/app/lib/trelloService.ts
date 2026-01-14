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

  // NOTE: ฝั่ง UI ของคุณจะ attach เพิ่มเองได้ เช่น (card as any).phaseId
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

/* ----------------------------- Helpers ----------------------------- */

function mustId(v: string, label: string) {
  const s = (v ?? "").trim();
  if (!s) throw new Error(`Missing ${label}`);
  return s;
}

/* ----------------------------- APIs ----------------------------- */

export const fetchTrelloMembers = () => apiGet<TrelloMember[]>("/trello/members");

export async function fetchTrelloCardsByTag(tag: string): Promise<TrelloCard[]> {
  const t = (tag ?? "").trim();
  if (!t) return [];
  return apiGet<TrelloCard[]>(`/trello/cards/tag/${encodeURIComponent(t)}`);
}

/**
 * ✅ NEW: ดึงการ์ดที่อยู่ใน Phase นั้น ๆ
 * GET /trello/phases/{phaseId}/cards
 */
export async function fetchTrelloCardsByPhase(phaseId: string): Promise<TrelloCard[]> {
  const pid = mustId(phaseId, "phaseId");
  return apiGet<TrelloCard[]>(
    `/trello/phases/${encodeURIComponent(pid)}/cards`
  );
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
  const id = mustId(cardId, "cardId");
  return apiPut<TrelloCard>(`/trello/cards/${encodeURIComponent(id)}`, payload);
}

export const fetchTrelloLists = () => apiGet<TrelloList[]>("/trello/lists");

/* ----------------------------- Member Assign ----------------------------- */

export async function assignTrelloMember(cardId: string, memberId: string) {
  const cid = mustId(cardId, "cardId");
  const mid = mustId(memberId, "memberId");
  return apiPost<any>(`/trello/cards/${encodeURIComponent(cid)}/assign`, {
    memberId: mid,
  });
}

export async function unassignTrelloMember(cardId: string, memberId: string) {
  const cid = mustId(cardId, "cardId");
  const mid = mustId(memberId, "memberId");

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
  const cid = mustId(cardId, "cardId");
  const iid = mustId(checkItemId, "checkItemId");

  if (state !== "complete" && state !== "incomplete") {
    throw new Error("Invalid checklist state");
  }

  return apiPut<any>(
    `/trello/cards/${encodeURIComponent(cid)}/checklist/${encodeURIComponent(iid)}`,
    { state }
  );
}

/* ----------------------------- Phase Assign ----------------------------- */

export type AssignCardToPhaseResponse = {
  trelloCard: TrelloCard;
  task?: {
    id: string;
    title?: string;
    status?: string;
    priority?: string;
    dueDate?: string | null;
  };
  message?: string;
};

/**
 * ✅ PUT /trello/cards/{cardId}/phase
 * assign card -> phase + create task auto
 */
export async function assignTrelloCardToPhase(cardId: string, phaseId: string) {
  const cid = mustId(cardId, "cardId");
  const pid = mustId(phaseId, "phaseId");

  return apiPut<AssignCardToPhaseResponse>(
    `/trello/cards/${encodeURIComponent(cid)}/phase`,
    { phaseId: pid }
  );
}
