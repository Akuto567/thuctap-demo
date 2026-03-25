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
import React, { useRef, useState } from "react";
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
  const [showSummary, setShowSummary] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Use ref to manage feedback timeout
  const feedbackTimeoutRef = useRef<number | null>(null);

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
      // ĐÚNG: Chuyển item sang group mới (thêm vào đầu)
      setUnansweredItems((prev) => prev.filter((i) => i.id !== item.id));
      setGroupedItems((prev) => ({
        ...prev,
        [targetGroupId]: [item, ...prev[targetGroupId]], // Add to top instead of bottom
      }));
      showFeedback("correct", "Chính xác! 🎉");
    } else {
      // SAI
      showFeedback("incorrect", "Thử lại nhé! 🤔");
    }
  };

  const showFeedback = (type: "correct" | "incorrect", msg: string) => {
    // Clear existing timeout if any
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Set new feedback (replaces old one immediately)
    setFeedback({ type, msg });

    // Set timeout to hide feedback
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 1500);
  };

  const handleRetry = () => {
    // Reset game state
    setUnansweredItems(MY_APP_DATA.items);
    setGroupedItems(
      Object.fromEntries(MY_APP_DATA.groups.map((g) => [g.id, []])),
    );
    setShowSummary(false);
    setFeedback(null);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  };

  // Calculate summary data
  const getSummaryData = () => {
    const totalItems = MY_APP_DATA.items.length;
    const matchedItems = totalItems - unansweredItems.length;
    const groupsSummary = MY_APP_DATA.groups.map((group) => ({
      ...group,
      matchedCount: groupedItems[group.id].length,
      totalCount: MY_APP_DATA.items.filter((item) => item.groupId === group.id)
        .length,
      items: groupedItems[group.id],
    }));
    return { totalItems, matchedItems, groupsSummary };
  };

  // Check if game is finished and animations are complete
  const isGameFinished =
    unansweredItems.length === 0 && !showSummary && !isAnimating;

  // Handle game completion with animation delay
  React.useEffect(() => {
    if (isGameFinished) {
      // Wait for all animations to complete before showing summary
      const animationDelay = setTimeout(() => {
        setShowSummary(true);
      }, 1000); // Give time for final animations to complete

      return () => clearTimeout(animationDelay);
    }
  }, [unansweredItems.length, showSummary, isAnimating, isGameFinished]);

  // Track animation state for smooth transitions
  React.useEffect(() => {
    if (unansweredItems.length > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [unansweredItems]);

  if (showSummary) {
    const summary = getSummaryData();
    return (
      <div className="w-screen h-screen bg-linear-to-br from-blue-100 to-purple-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold text-green-600 mb-2">
              🎉 Hoàn Thành! 🎉
            </h1>
            <p className="text-xl text-gray-600">
              Chúc mừng bạn đã hoàn thành trò chơi!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-linear-to-br from-green-400 to-green-500 rounded-2xl p-6 text-center text-white"
            >
              <div className="text-4xl font-bold mb-2">
                {summary.matchedItems}
              </div>
              <div className="text-lg">Đã ghép đúng</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-linear-to-br from-blue-400 to-blue-500 rounded-2xl p-6 text-center text-white"
            >
              <div className="text-4xl font-bold mb-2">
                {summary.totalItems}
              </div>
              <div className="text-lg">Tổng số item</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-linear-to-br from-purple-400 to-purple-500 rounded-2xl p-6 text-center text-white"
            >
              <div className="text-4xl font-bold mb-2">
                {Math.round((summary.matchedItems / summary.totalItems) * 100)}%
              </div>
              <div className="text-lg">Tỷ lệ hoàn thành</div>
            </motion.div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              📊 Chi Tiết Các Nhóm
            </h2>
            <div className="space-y-4">
              {summary.groupsSummary.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={group.imagePath}
                        alt={group.name}
                        className="w-12 h-12 object-contain"
                      />
                      <h3 className="text-xl font-semibold text-gray-800">
                        {group.name}
                      </h3>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {group.matchedCount}/{group.totalCount}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm"
                      >
                        <img
                          src={item.imagePath}
                          alt={item.name}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-sm text-gray-700">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              className="bg-linear-to-r from-blue-500 to-purple-500 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              🔄 Chơi Lại
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-screen h-screen bg-sky-100 p-6 flex flex-col overflow-hidden relative font-sans">
        <header className="h-16 flex items-center justify-between mb-6 px-4">
          <h1 className="text-4xl font-extrabold text-blue-900 drop-shadow-sm">
            Ghép Đôi Vui Vẻ
          </h1>
          <div className="bg-white rounded-full px-6 py-2 shadow-md">
            <span className="text-lg font-semibold text-blue-800">
              Còn lại: {unansweredItems.length} / {MY_APP_DATA.items.length}
            </span>
          </div>
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

        {/* FEEDBACK OVERLAY - Moved to top of screen */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-white text-xl font-bold shadow-2xl ${
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
