import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { MY_APP_DATA } from "../data";
import type { Item } from "../types/objects";
import DraggableItem, { ItemCard } from "./DraggableItem";
import GroupColumn from "./GroupColumn";

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

  // Cấu hình Sensor để không bị xung đột với scroll trên mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Kéo 8px mới bắt đầu drag
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current as Item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const item = active.data.current as Item;
    const targetGroupId = over.id as string;

    if (item.groupId === targetGroupId) {
      // ĐÚNG: Chuyển item sang group mới
      setUnansweredItems((prev) => prev.filter((i) => i.id !== item.id));
      setGroupedItems((prev) => ({
        ...prev,
        [targetGroupId]: [...prev[targetGroupId], item],
      }));
      showFeedback("correct", "Chính xác! 🎉");
    } else {
      // SAI
      showFeedback("incorrect", "Thử lại nhé! 🤔");
    }
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
          {/* SIDEBAR VỚI SCROLLBAR - Không còn lo bị clipping nhờ DragOverlay */}
          <div className="w-96 h-full bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-4 border-yellow-300 shadow-inner overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {unansweredItems.map((item) => (
                  <DraggableItem key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* KHU VỰC CÁC CỘT NHÓM */}
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

        {/* FEEDBACK OVERLAY */}
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

        {/* DRAG OVERLAY: giải quyết vấn đề overflow clipping */}
        <DragOverlay
          dropAnimation={{
            duration: 300,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: "0" } },
            }),
          }}
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
