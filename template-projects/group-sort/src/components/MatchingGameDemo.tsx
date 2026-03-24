import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
  type ClientRect,
} from "@dnd-kit/core";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import React, { useRef, useState } from "react";
import { MY_APP_DATA } from "../data";
import type { Item } from "../types/objects";
import DraggableItem, { ItemCard } from "./DraggableItem";
import GroupColumn from "./GroupColumn";

// Constants that match the GroupColumn layout exactly
const ITEM_SIZE = 128; // w-32 h-32
const ITEM_GAP = 16;   // gap-4  (Tailwind gap-4 = 1rem = 16px)
const HEADER_H = 148;  // column header block height (img 96 + mt-2 text ~28 + p-4*2)
const SIDE_PAD = 16;   // p-4 on the scroll container

const MatchingGameDemo: React.FC = () => {
  const [unansweredItems, setUnansweredItems] = useState<Item[]>(
    MY_APP_DATA.items,
  );
  const [groupedItems, setGroupedItems] = useState<Record<string, Item[]>>(
    Object.fromEntries(MY_APP_DATA.groups.map((g) => [g.id, []])),
  );
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect";
    msg: string;
  } | null>(null);

  // Populated synchronously in handleDragEnd so the next render's
  // dropAnimation sees the correct values.
  const pendingDropRef = useRef<{
    item: Item;
    targetGroupId: string;
    targetRect: ClientRect;
    landingIndex: number;
  } | null>(null);

  // We build dropAnimation fresh each render from the ref — this is safe
  // because DragOverlay reads it only after handleDragEnd triggers a re-render.
  const buildDropAnimation = (): DropAnimation => {
    const pending = pendingDropRef.current;
    return {
      duration: 400,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      keyframes({ draggableInitialRect, transform }) {
        if (!pending || !draggableInitialRect) {
          // Wrong answer or no target — just fade out in place
          return [
            { transform: transform.initial, opacity: "1" },
            { transform: transform.initial, opacity: "0" },
          ];
        }

        const { targetRect, landingIndex } = pending;

        // Y offset of the new item's slot inside the column scroll area
        const slotOffsetY =
          HEADER_H + SIDE_PAD + landingIndex * (ITEM_SIZE + ITEM_GAP);

        // Viewport center of where the item will land
        const destCX = targetRect.left + SIDE_PAD + ITEM_SIZE / 2;
        const destCY = targetRect.top + slotOffsetY + ITEM_SIZE / 2;

        // Viewport center of the draggable at the moment of release
        const srcCX = draggableInitialRect.left + draggableInitialRect.width / 2;
        const srcCY = draggableInitialRect.top + draggableInitialRect.height / 2;

        const dx = destCX - srcCX;
        const dy = destCY - srcCY;

        return [
          // Frame 0: exactly where the user released it
          { transform: transform.initial, opacity: "1" },
          // Frame 80%: arrived at destination, start to shrink
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(1)`,
            opacity: "1",
            offset: 0.75,
          },
          // Frame 100%: shrink to nothing right at the landing spot
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(0)`,
            opacity: "0",
          },
        ];
      },
      sideEffects({ active }) {
        // Hide the "ghost" left in the sidebar while overlay is flying
        active.node.style.opacity = "0";
        return () => {
          active.node.style.opacity = "";
        };
      },
    };
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current as Item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      return;
    }

    const item = active.data.current as Item;
    const targetGroupId = over.id as string;

    if (item.groupId === targetGroupId) {
      // Populate the ref BEFORE the state update so buildDropAnimation()
      // on the next render already has the correct target info.
      pendingDropRef.current = {
        item,
        targetGroupId,
        targetRect: over.rect,
        landingIndex: groupedItems[targetGroupId].length,
      };

      // Remove from sidebar immediately so siblings animate up right away,
      // but DON'T add to groupedItems yet — that happens after the overlay lands.
      setUnansweredItems((prev) => prev.filter((i) => i.id !== item.id));

      showFeedback("correct", "Chính xác! 🎉");
      // activeItem stays set so DragOverlay keeps rendering and runs the animation
    } else {
      setActiveItem(null);
      showFeedback("incorrect", "Thử lại nhé! 🤔");
    }
  };

  // Called by DragOverlay when its drop animation finishes
  const handleDropAnimationEnd = () => {
    const pending = pendingDropRef.current;
    if (pending) {
      // NOW add to the column — the overlay has already landed and vanished
      setGroupedItems((prev) => ({
        ...prev,
        [pending.targetGroupId]: [...prev[pending.targetGroupId], pending.item],
      }));
      pendingDropRef.current = null;
    }
    setActiveItem(null);
  };

  const showFeedback = (type: "correct" | "incorrect", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 1500);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-screen h-screen bg-sky-100 p-6 flex flex-col overflow-hidden relative font-sans">
        <header className="h-16 flex items-center justify-center mb-6">
          <h1 className="text-4xl font-extrabold text-blue-900 drop-shadow-sm">
            Ghép Đôi Vui Vẻ
          </h1>
        </header>

        <div className="flex-1 flex gap-8 min-h-0">
          {/* SIDEBAR
              - overflow-y-auto for scrollability
              - LayoutGroup scopes all layoutIds here so they never conflict
                with anything in the GroupColumns or the DragOverlay portal
              - layout on the grid + layoutId on each wrapper = siblings
                animate their positions when one exits (the classic FLIP shift-up) */}
          <div className="w-96 h-full bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-4 border-yellow-300 shadow-inner overflow-y-auto custom-scrollbar">
            <LayoutGroup id="sidebar">
              <motion.div className="grid grid-cols-2 gap-4" layout>
                <AnimatePresence mode="popLayout">
                  {unansweredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={`sidebar-${item.id}`}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <DraggableItem item={item} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </LayoutGroup>
          </div>

          {/* GROUP COLUMNS */}
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar-h">
            {MY_APP_DATA.groups.map((group) => (
              <GroupColumn
                key={group.id}
                group={group}
                items={groupedItems[group.id]}
              />
            ))}
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-100 px-10 py-6 rounded-full text-white text-3xl font-bold shadow-2xl ${
                feedback.type === "correct" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DRAG OVERLAY — portaled to body, bypasses overflow clipping.
            dropAnimation is rebuilt each render so it always has fresh coords. */}
        <DragOverlay
          dropAnimation={buildDropAnimation()}
          onDropAnimationEnd={handleDropAnimationEnd}
        >
          {activeItem ? (
            <ItemCard item={activeItem} style={{ cursor: "grabbing" }} />
          ) : null}
        </DragOverlay>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 10px; }
      `}</style>
    </DndContext>
  );
};

export default MatchingGameDemo;
