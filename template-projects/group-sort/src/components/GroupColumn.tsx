import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { layoutTransition } from "../config";
import type { GroupColumnProps } from "../types/components";
import { ImageOrEmoji } from "./ImageOrEmoji";

const GroupColumn: React.FC<GroupColumnProps> = ({ group, items }) => {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });

  // Stop wheel event propagation if this column can scroll vertically
  const handleWheel = (e: React.WheelEvent) => {
    const target = e.currentTarget as HTMLElement;
    const canScroll = target.scrollHeight > target.clientHeight;
    if (canScroll) {
      e.stopPropagation();
    }
  };

  return (
    <motion.div
      layout
      transition={layoutTransition}
      ref={setNodeRef}
      className={`shrink-0 w-64 h-full flex flex-col items-center bg-blue-50 rounded-3xl border-4 transition-colors ${
        isOver
          ? "border-blue-500 bg-blue-100 ring-4 ring-blue-200"
          : "border-blue-200"
      }`}
    >
      <div className="flex flex-col items-center p-4 border-b-4 border-blue-200 w-full bg-blue-100 rounded-t-3xl">
        <ImageOrEmoji
          imagePath={group.imagePath}
          alt={group.name}
          size="large"
        />
        <h3 className="mt-2 text-xl font-bold text-blue-800">{group.name}</h3>
        <span className="text-sm text-blue-600 mt-1">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        onWheel={handleWheel}
        className="flex-1 w-full p-4 flex flex-col items-center gap-4 group-items-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layoutId={item.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={layoutTransition}
              className="w-32 h-32 shrink-0 flex items-center justify-center border-4 border-green-400 bg-white rounded-2xl shadow"
            >
              <ImageOrEmoji
                imagePath={item.imagePath}
                alt={item.name}
                size="medium"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GroupColumn;
