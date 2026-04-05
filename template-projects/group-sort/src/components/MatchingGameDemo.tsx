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
import { TutorialViewer } from "@minigame/tutorial-viewer";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef, useState } from "react";
import { useSound } from "react-sounds";
import failSound from "../../assets/sounds/blocked.mp3";
import successSound from "../../assets/sounds/success_blip.mp3";
import { layoutTransition } from "../config";
import { MY_APP_DATA } from "../data";
import type { Group, Item } from "../types/objects";
import { shuffleGroups, shuffleItems } from "../utils";
import DraggableItem, { ItemCard } from "./DraggableItem";
import GroupColumn from "./GroupColumn";
import { ImageOrEmoji } from "./ImageOrEmoji";

const MatchingGameDemo: React.FC = () => {
  // Settings state (must be before other state that depends on it)
  const [showSettings, setShowSettings] = useState(false);
  const [randomizeItems, setRandomizeItems] = useState(true);
  const [randomizeGroups, setRandomizeGroups] = useState(true);
  const settingsTimeoutRef = useRef<number | null>(null);

  const [unansweredItems, setUnansweredItems] = useState<Item[]>(() =>
    randomizeItems ? shuffleItems(MY_APP_DATA.items) : MY_APP_DATA.items,
  );
  const [groupedItems, setGroupedItems] = useState<Record<string, Item[]>>(() =>
    Object.fromEntries(MY_APP_DATA.groups.map((g) => [g.id, []])),
  );
  const [groups, setGroups] = useState<Group[]>(() =>
    randomizeGroups ? shuffleGroups(MY_APP_DATA.groups) : MY_APP_DATA.groups,
  );
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect";
    msg: string;
  } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Use ref to manage feedback timeout
  const feedbackTimeoutRef = useRef<number | null>(null);

  // Ref for group area scroll container
  const groupAreaRef = useRef<HTMLDivElement | null>(null);

  // Handle wheel event on group area - only scrolls horizontally if event bubbles up
  // (meaning no child column captured the vertical scroll)
  const handleGroupAreaWheel = (e: React.WheelEvent) => {
    if (e.shiftKey) return; // Let default shift+scroll handle horizontal
    e.preventDefault();
    if (groupAreaRef.current) {
      groupAreaRef.current.scrollLeft += e.deltaY;
    }
  };

  // Cấu hình Sensor để không bị xung đột với scroll trên mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Kéo 8px mới bắt đầu drag
    }),
  );

  const { play: playSuccessSound } = useSound(successSound);
  const { play: playFailSound } = useSound(failSound);

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
      playSuccessSound();
    } else {
      // SAI
      showFeedback("incorrect", "Thử lại nhé! 🤔");
      playFailSound();
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
    // First, return all items back to sidebar (this triggers layout animation)
    setUnansweredItems(
      randomizeItems ? shuffleItems(MY_APP_DATA.items) : MY_APP_DATA.items,
    );
    setGroupedItems(
      Object.fromEntries(MY_APP_DATA.groups.map((g) => [g.id, []])),
    );
    setShowSummary(false);
    setFeedback(null);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    // Shuffle groups after a delay to allow items to fly back first
    if (randomizeGroups) {
      setTimeout(() => {
        setGroups(shuffleGroups(MY_APP_DATA.groups));
      }, 500);
    }
  };

  // Calculate summary data
  const getSummaryData = () => {
    const totalItems = MY_APP_DATA.items.length;
    const matchedItems = totalItems - unansweredItems.length;
    const groupsSummary = groups.map((group) => ({
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
                      <ImageOrEmoji
                        imagePath={group.imagePath}
                        alt={group.name}
                        size="large"
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
                        <ImageOrEmoji
                          imagePath={item.imagePath}
                          alt={item.name}
                          size="tiny"
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
          <div className="flex items-center gap-4">
            {/* Settings button with hover panel */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (settingsTimeoutRef.current) {
                  clearTimeout(settingsTimeoutRef.current);
                  settingsTimeoutRef.current = null;
                }
                setShowSettings(true);
              }}
              onMouseLeave={() => {
                settingsTimeoutRef.current = window.setTimeout(() => {
                  setShowSettings(false);
                  settingsTimeoutRef.current = null;
                }, 300);
              }}
            >
              <button className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-colors">
                ⚙️ Cài đặt
              </button>

              {/* Settings panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border-2 border-purple-200 p-4 z-50 min-w-[280px]"
                    onMouseEnter={() => {
                      if (settingsTimeoutRef.current) {
                        clearTimeout(settingsTimeoutRef.current);
                        settingsTimeoutRef.current = null;
                      }
                    }}
                    onMouseLeave={() => {
                      settingsTimeoutRef.current = window.setTimeout(() => {
                        setShowSettings(false);
                        settingsTimeoutRef.current = null;
                      }, 300);
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Trộn thứ tự item
                        </label>
                        <button
                          onClick={() => setRandomizeItems(!randomizeItems)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            randomizeItems ? "bg-purple-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              randomizeItems ? "left-7" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Trộn thứ tự nhóm
                        </label>
                        <button
                          onClick={() => setRandomizeGroups(!randomizeGroups)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            randomizeGroups ? "bg-purple-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              randomizeGroups ? "left-7" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        * Áp dụng khi nhấn Thử lại
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleRetry}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-colors"
            >
              🔄 Thử lại
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-colors"
            >
              📖 Hướng dẫn
            </button>
            <div className="bg-white rounded-full px-6 py-2 shadow-md">
              <span className="text-lg font-semibold text-blue-800">
                Còn lại: {unansweredItems.length} / {MY_APP_DATA.items.length}
              </span>
            </div>
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
          <motion.div
            ref={groupAreaRef}
            layout
            transition={layoutTransition}
            onWheel={handleGroupAreaWheel}
            className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar-h"
          >
            <AnimatePresence>
              {groups.map((group) => (
                <GroupColumn
                  key={group.id}
                  group={group}
                  items={groupedItems[group.id]}
                />
              ))}
            </AnimatePresence>
          </motion.div>
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

        {/* TUTORIAL VIEWER */}
        <TutorialViewer
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
          basePath="assets/images/"
          filenamePattern="tutorial"
          fileExtension="png"
        />
      </div>

      <style>{`
        /* Sidebar scrollbar - yellow to match border */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fcd34d; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fbbf24; }
        
        /* Group columns horizontal scrollbar - blue to match theme */
        .custom-scrollbar-h::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #93c5fd; border-radius: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb:hover { background: #60a5fa; }
        
        /* Group column items vertical scrollbar - blue overlay (doesn't affect layout) */
        .group-items-scrollbar {
          overflow-y: overlay; /* Makes scrollbar overlay content (webkit) */
          overflow-x: hidden;
        }
        .group-items-scrollbar::-webkit-scrollbar { width: 8px; }
        .group-items-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .group-items-scrollbar::-webkit-scrollbar-thumb { background: #93c5fd; border-radius: 10px; }
        .group-items-scrollbar::-webkit-scrollbar-thumb:hover { background: #60a5fa; }
      `}</style>
    </DndContext>
  );
};

export default MatchingGameDemo;
