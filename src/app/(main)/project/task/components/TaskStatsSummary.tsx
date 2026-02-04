"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EllipsisHorizontalIcon, PlusIcon } from "@heroicons/react/24/outline";
import TaskModal, { type TaskCreatePayload } from "./TaskModal";
import TaskCard from "./TaskCard";
import TaskDetailModal from "./TaskDetailModal";

import {
  fetchTrelloCardsByTag,
  createTrelloCard,
  fetchTrelloLists,
  fetchTrelloMembers,
  assignTrelloCardToPhase,
  type TrelloCard,
  type TrelloList,
  type TrelloMember,
} from "../../../../lib/trelloService";

import {
  fetchProjectPhases,
  type ProjectPhaseApi,
} from "../../../../lib/ganttService";

import { useAsyncLoader } from "../../../component/loading/useAsyncLoader";
import { PageLoadingOverlay } from "../../../component/loading/LoadingUI";

/** แปลง date input (YYYY-MM-DD) -> ISO */
function toISOFromDateInput(v?: string) {
  const s = (v ?? "").trim();
  if (!s) return undefined;

  const d = new Date(`${s}T09:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* กัน user ใส่ [ECOM] เอง */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function stripLeadingTag(name: string, tag: string) {
  const t = tag.trim();
  if (!t) return name.trim();
  const re = new RegExp(`^\\s*(?:\\[\\s*${escapeRegExp(t)}\\s*\\]\\s*)+`, "i");
  return name.replace(re, "").trim();
}

type Props = {
  projectTag: string;
  projectId?: string;
};

type ModalMember = { id: string; name: string; avatarText?: string };
type ModalPhase = {
  id: string;
  name: string;
  startDate?: string | null;
  dueDate?: string | null;
};

// ✅ เก็บข้อมูล phase ต่อ card
type CardPhaseInfo = { phaseId: string; phaseName: string };
type PhaseMap = Record<string, CardPhaseInfo>; // key = trelloCardId

export default function TaskStatsSummary({ projectTag, projectId }: Props) {
  const [lists, setLists] = useState<TrelloList[]>([]);
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [members, setMembers] = useState<TrelloMember[]>([]);

  // ✅ phases ของ project
  const [phases, setPhases] = useState<ProjectPhaseApi[]>([]);

  // ✅ map: cardId -> {phaseId, phaseName}
  const [phaseMap, setPhaseMap] = useState<PhaseMap>({});
  // ✅ สำคัญ: เก็บ "ค่าล่าสุด" กัน phase เด้งกลับตอน onReload()
  const phaseMapRef = useRef<PhaseMap>({});

  // ✅ กัน race: fetch เก่า overwrite state
  const cardsReqRef = useRef(0);

  // ✅ loading ตอน sync หลัง create
  const [syncing, setSyncing] = useState(false);

  // ✅ helper setter ให้ ref อัปเดตทันที (ไม่ต้องรอ useEffect)
  const setPhaseMapSafe = (updater: (prev: PhaseMap) => PhaseMap) => {
    setPhaseMap((prev) => {
      const next = updater(prev);
      phaseMapRef.current = next;
      return next;
    });
  };

  // create modal
  const [open, setOpen] = useState(false);
  const [activeListId, setActiveListId] = useState<string>("");

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<TrelloCard | null>(null);

  // ✅ loaders กลาง
  const listsLoader = useAsyncLoader();
  const cardsLoader = useAsyncLoader();
  const membersLoader = useAsyncLoader();
  const phasesLoader = useAsyncLoader();

  // scroller + drag state
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({
    down: false,
    startX: 0,
    startLeft: 0,
    moved: false,
  });
  const [dragging, setDragging] = useState(false);

  // ✅ helper: เอา phaseMap ไปแปะลง card (ให้ TaskCard/TaskDetailModal อ่านได้)
  const applyPhaseToCards = (arr: TrelloCard[], map: PhaseMap) => {
    if (!arr?.length) return arr;
    if (!map || Object.keys(map).length === 0) return arr;

    return arr.map((c) => {
      const hit = map[c.id];
      if (!hit) return c;

      return {
        ...(c as any),
        phaseId: hit.phaseId,
        phaseName: hit.phaseName,
      } as any;
    });
  };

  // ✅ reload cards (แทน F5) + กัน race
  const reloadCards = async () => {
    const reqId = ++cardsReqRef.current;

    const data = await fetchTrelloCardsByTag(projectTag);
    const next = (data ?? []).filter((c) => !c.closed);

    // ถ้ามี request ใหม่กว่าแล้ว ให้ทิ้งผลลัพธ์นี้
    if (reqId !== cardsReqRef.current) return;

    const withPhase = applyPhaseToCards(next, phaseMapRef.current);
    setCards(withPhase);

    // ✅ sync activeCard ถ้ากำลังเปิดอยู่
    setActiveCard((prev) => {
      if (!prev?.id) return prev;
      return withPhase.find((x) => x.id === prev.id) ?? prev;
    });
  };

  /**
   * ✅ fetch ใหม่แบบ retry เพื่อรอ Trello sync checklist/badges/date/member ให้ครบ
   * - expectCheckItems: ถ้า > 0 จะรอจน badges.checkItems >= expectCheckItems
   */
  const reloadCardsWithRetry = async (opts: {
    expectCardId: string;
    expectCheckItems: number;
  }) => {
    const { expectCardId, expectCheckItems } = opts;

    const maxAttempts = 6;
    for (let i = 0; i < maxAttempts; i++) {
      const reqId = ++cardsReqRef.current;

      const data = await fetchTrelloCardsByTag(projectTag);
      const next = (data ?? []).filter((c) => !c.closed);

      // ถ้ามี request ใหม่กว่าแล้ว ให้ทิ้งผลลัพธ์นี้
      if (reqId !== cardsReqRef.current) return;

      const withPhase = applyPhaseToCards(next, phaseMapRef.current);
      setCards(withPhase);

      setActiveCard((prev) => {
        if (!prev?.id) return prev;
        return withPhase.find((x) => x.id === prev.id) ?? prev;
      });

      const found = next.find((c) => c.id === expectCardId);

      const checkItems = (found as any)?.badges?.checkItems ?? 0;
      const ready =
        !!found &&
        !!(found as any)?.idList &&
        (expectCheckItems > 0 ? checkItems >= expectCheckItems : true);

      if (ready) return;

      // backoff: 250, 500, 750...
      await sleep(250 * (i + 1));
    }
  };

  // ✅ onUpdated จาก TaskDetailModal จะส่ง phaseId/phaseName ใหม่มาด้วย
  const handleCardUpdated = (updated: TrelloCard) => {
    if (!updated?.id) return;

    const uAny = updated as any;

    const hasPhaseField =
      Object.prototype.hasOwnProperty.call(uAny, "phaseId") ||
      Object.prototype.hasOwnProperty.call(uAny, "phaseName");

    const incomingPhaseId = String(uAny.phaseId ?? "").trim();
    const incomingPhaseName = String(uAny.phaseName ?? "").trim();

    if (hasPhaseField) {
      setPhaseMapSafe((prev) => {
        const next = { ...prev };

        if (!incomingPhaseId) {
          delete next[updated.id];
        } else {
          next[updated.id] = {
            phaseId: incomingPhaseId,
            phaseName: incomingPhaseName,
          };
        }
        return next;
      });
    }

    const hit = hasPhaseField
      ? incomingPhaseId
        ? { phaseId: incomingPhaseId, phaseName: incomingPhaseName }
        : null
      : phaseMapRef.current[updated.id];

    const patched = hit
      ? ({
          ...(updated as any),
          phaseId: hit.phaseId,
          phaseName: hit.phaseName,
        } as any as TrelloCard)
      : ({
          ...(updated as any),
          phaseId: "",
          phaseName: "",
        } as any as TrelloCard);

    setCards((prev) => prev.map((c) => (c.id === patched.id ? patched : c)));
    setActiveCard((prev) => (prev?.id === patched.id ? patched : prev));
  };

  // โหลด lists
  useEffect(() => {
    let cancelled = false;

    listsLoader
      .run(async () => {
        const data = await fetchTrelloLists();
        if (cancelled) return;

        const visible = (data ?? []).filter((l) => !l.closed);
        visible.sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
        setLists(visible);
      })
      .catch((e) => console.error("Failed to load trello lists", e));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // โหลด cards ตาม tag (กัน race ด้วย cardsReqRef)
  useEffect(() => {
    let cancelled = false;

    const reqId = ++cardsReqRef.current;

    cardsLoader
      .run(async () => {
        const data = await fetchTrelloCardsByTag(projectTag);
        if (cancelled) return;
        if (reqId !== cardsReqRef.current) return;

        const base = (data ?? []).filter((c) => !c.closed);
        setCards(applyPhaseToCards(base, phaseMapRef.current));
      })
      .catch((e) => console.error("Failed to load trello cards by tag", e));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTag]);

  // โหลด members
  useEffect(() => {
    let cancelled = false;

    membersLoader
      .run(async () => {
        const data: TrelloMember[] = await fetchTrelloMembers();
        if (cancelled) return;

        setMembers(data ?? []);
      })
      .catch((e) => console.error("Failed to load trello members", e));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ โหลด phases ของ project จาก ganttService แล้วสร้าง phaseMap จาก tasks[].trelloCardId
  useEffect(() => {
    if (!projectId) {
      setPhases([]);

      phaseMapRef.current = {};
      setPhaseMap({});

      setCards((prev) => applyPhaseToCards(prev, {}));
      setActiveCard((prev) => prev);
      return;
    }

    let cancelled = false;

    phasesLoader
      .run(async () => {
        const data = await fetchProjectPhases(projectId);
        if (cancelled) return;

        const next = [...(data ?? [])].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        );
        setPhases(next);

        const map: PhaseMap = {};
        for (const ph of next) {
          for (const t of ph.tasks ?? []) {
            const cardId = ((t as any).trelloCardId ?? "").trim();
            if (!cardId) continue;

            if (!map[cardId]) {
              map[cardId] = { phaseId: ph.id, phaseName: ph.name };
            }
          }
        }

        phaseMapRef.current = map;
        setPhaseMap(map);

        setCards((prev) => applyPhaseToCards(prev, map));

        setActiveCard((prev) => {
          if (!prev?.id) return prev;
          const hit = map[prev.id];
          if (!hit) return prev;
          return {
            ...(prev as any),
            phaseId: hit.phaseId,
            phaseName: hit.phaseName,
          } as any;
        });
      })
      .catch((e) => console.error("Failed to load phases", e));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // แปลงเป็นรูปแบบที่ TaskModal ต้องใช้
  const modalMembers: ModalMember[] = useMemo(() => {
    return (members ?? []).map((m) => ({
      id: m.id,
      name: m.fullName || m.username,
      avatarText: (m.initials || m.fullName?.[0] || m.username?.[0] || "?")
        .toString()
        .toUpperCase(),
    }));
  }, [members]);

  const modalPhases: ModalPhase[] = useMemo(() => {
    return (phases ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      startDate: p.startDate ?? null,
      dueDate: p.dueDate ?? null,
    }));
  }, [phases]);

  const groupedByListId = useMemo(() => {
    const map: Record<string, TrelloCard[]> = {};
    for (const l of lists) map[l.id] = [];

    for (const c of cards) {
      const lid = (c as any).idList as string | undefined;
      if (!lid) continue;
      if (!map[lid]) map[lid] = [];
      map[lid].push(c);
    }

    Object.keys(map).forEach((lid) => {
      map[lid].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
    });

    return map;
  }, [lists, cards]);

  /**
   * ✅ Create + Sync:
   * - สร้างการ์ด
   * - patch field ที่มักขาดใน response
   * - (เลือก phase) assign phase + update phaseMapRef
   * - setCards ทันที
   * - แล้ว reload แบบ retry จน Trello พร้อม (ไม่ต้อง F5)
   */
  const handleCreate = async (data: TaskCreatePayload): Promise<{ id: string }> => {
    if (!activeListId) throw new Error("ไม่พบ listId ของคอลัมน์ที่กดเพิ่มการ์ด");

    const cleanName = stripLeadingTag(data.name, projectTag);

    const isoStart = toISOFromDateInput(data.startDate);
    const isoDue = toISOFromDateInput(data.endDate);
    const subtasks = data.subtasks ?? [];

    setSyncing(true);
    try {
      const createdCard = await createTrelloCard({
        listId: activeListId,
        name: cleanName,
        desc: data.description ?? "",
        memberIds: data.memberIds ?? [],
        startDate: isoStart,
        dueDate: isoDue,
        checklistItems: subtasks,
        projectId,
      });

      if (!createdCard?.id) {
        throw new Error("สร้าง Trello Card ไม่สำเร็จ (ไม่พบ cardId)");
      }

      // ✅ PATCH: กัน response ไม่ครบ ทำให้การ์ดโชว์เพี้ยน/ต้อง F5
      const listName = lists.find((l) => l.id === activeListId)?.name ?? "";
      const uiCard: TrelloCard = {
        ...(createdCard as any),
        idList: (createdCard as any)?.idList ?? activeListId,
        listName: (createdCard as any)?.listName ?? listName,
        idMembers: (createdCard as any)?.idMembers ?? (data.memberIds ?? []),
        start: (createdCard as any)?.start ?? isoStart ?? null,
        due: (createdCard as any)?.due ?? isoDue ?? null,
        badges:
          (createdCard as any)?.badges ??
          ({
            checkItems: subtasks.length,
            checkItemsChecked: 0,
          } as any),
      } as TrelloCard;

      const pickedPhaseId = (data.phaseId ?? "").trim();
      let createdTaskId: string | undefined;

      if (pickedPhaseId) {
        const res = await assignTrelloCardToPhase(uiCard.id, pickedPhaseId);
        createdTaskId = res?.task?.id;

        const p = phases.find((x) => x.id === pickedPhaseId);
        const phaseName = p?.name ?? "";

        (uiCard as any).phaseId = pickedPhaseId;
        (uiCard as any).phaseName = phaseName;
        if (createdTaskId) (uiCard as any).taskId = createdTaskId;

        // ✅ update ref + state แบบ sync (ไม่รอ react schedule)
        const nextMap: PhaseMap = {
          ...phaseMapRef.current,
          [uiCard.id]: { phaseId: pickedPhaseId, phaseName },
        };
        phaseMapRef.current = nextMap;
        setPhaseMap(nextMap);
      } else {
        (uiCard as any).phaseId = "";
        (uiCard as any).phaseName = "";
      }

      // ✅ ใส่เข้า state ก่อน (ให้ user เห็นทันที)
      setCards((prev) => [uiCard, ...prev]);

      // ✅ แล้ว sync ด้วยการ fetch ใหม่แบบ retry (รอ checklist/badges ให้ครบ)
      try {
        await reloadCardsWithRetry({
          expectCardId: uiCard.id,
          expectCheckItems: subtasks.length,
        });
      } catch (e) {
        console.warn("Sync cards failed:", e);
      }

      return { id: createdTaskId ?? uiCard.id };
    } finally {
      setSyncing(false);
    }
  };

  const loading = listsLoader.loading || cardsLoader.loading;

  const getInnerColumnScroller = (target: EventTarget | null) => {
    const node = target as HTMLElement | null;
    if (!node) return null;
    return node.closest<HTMLElement>("[data-col-scroll]");
  };

  // wheel แนวตั้ง -> เลื่อนแนวนอน
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;

    const inner = getInnerColumnScroller(e.target);
    if (inner) {
      const canScrollY = inner.scrollHeight > inner.clientHeight;
      if (canScrollY) return;
    }

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (target.closest("button,a,input,textarea,select,label")) return;
    if (getInnerColumnScroller(target)) return;

    dragRef.current.down = true;
    dragRef.current.moved = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startLeft = el.scrollLeft;

    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (!dragRef.current.down) return;

    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 3) dragRef.current.moved = true;

    el.scrollLeft = dragRef.current.startLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.down = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const showOverlay = loading || membersLoader.loading || phasesLoader.loading || syncing;
  const overlayLabel = syncing
    ? "กำลังซิงค์ข้อมูลจาก Trello..."
    : "กำลังโหลด Project Tasks...";

  return (
    <>
      <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
        <div
          ref={scrollerRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={[
            "mt-6 w-screen overflow-x-auto pb-4",
            "snap-x snap-mandatory scroll-smooth",
            dragging ? "cursor-grabbing select-none" : "cursor-grab",
          ].join(" ")}
          style={{ touchAction: "pan-y" }}
        >
          <div className="inline-flex w-max items-start gap-4 px-6">
            {(lists ?? []).map((list) => {
              const listCards = groupedByListId[list.id] ?? [];

              return (
                <div
                  key={list.id}
                  className={[
                    "snap-start w-[360px]",
                    "rounded-2xl bg-slate-900 text-white p-4 shadow-lg",
                    "min-h-[240px] flex flex-col self-start",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-semibold">{list.name}</h3>
                      <span className="text-[11px] text-white/60">
                        {loading ? "..." : listCards.length}
                      </span>
                    </div>

                    <button className="text-slate-300 hover:text-white">
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div
                    className="mt-3 space-y-2 pr-1 overflow-y-auto max-h-[calc(100vh-340px)]"
                    data-col-scroll
                  >
                    {loading ? (
                      <div className="text-xs text-white/60">Loading…</div>
                    ) : listCards.length === 0 ? (
                      <div className="text-xs text-white/50">ยังไม่มีการ์ด</div>
                    ) : (
                      listCards.map((card) => (
                        <TaskCard
                          key={card.id}
                          card={card}
                          movedRef={dragRef}
                          onOpen={(c) => {
                            setActiveCard(c);
                            setDetailOpen(true);
                          }}
                        />
                      ))
                    )}
                  </div>

                  <div className="pt-3 shrink-0">
                    <button
                      onClick={() => {
                        setActiveListId(list.id);
                        setOpen(true);
                      }}
                      className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
                    >
                      <PlusIcon className="h-4 w-4" />
                      เพิ่มการ์ด
                    </button>
                  </div>
                </div>
              );
            })}

            {!loading && lists.length === 0 && (
              <div className="text-sm text-slate-400">ไม่พบคอลัมน์จาก Trello</div>
            )}
          </div>
        </div>
      </div>

      <TaskModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
        members={modalMembers}
        phases={modalPhases}
      />

      <TaskDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        card={activeCard}
        members={members}
        projectTag={projectTag}
        lists={lists}
        phases={modalPhases}
        onUpdated={handleCardUpdated}
        onReload={reloadCards}
      />

      <PageLoadingOverlay show={showOverlay} label={overlayLabel} />
    </>
  );
}
