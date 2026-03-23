import { AnimatePresence, motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { layoutTransition } from "../config";
import type { GroupColumnProps } from "../types/components";

const GroupColumn: React.FC<GroupColumnProps> = ({ group, items }) => {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-64 h-full flex flex-col items-center bg-blue-50 rounded-3xl border-4 transition-colors ${
        isOver
          ? "border-blue-500 bg-blue-100 ring-4 ring-blue-200"
          : "border-blue-200"
      }`}
    >
      <div className="flex flex-col items-center p-4 border-b-4 border-blue-200 w-full bg-blue-100 rounded-t-3xl">
        <img
          src={group.imagePath}
          alt={group.name}
          className="w-24 h-24 object-contain"
        />
        <h3 className="mt-2 text-xl font-bold text-blue-800">{group.name}</h3>
      </div>

      <div className="flex-1 w-full p-4 overflow-y-auto flex flex-col items-center gap-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layoutId={item.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={layoutTransition}
              className="w-32 h-32 shrink-0 flex items-center justify-center border-4 border-green-400 bg-white rounded-2xl shadow"
            >
              <img
                src={item.imagePath}
                alt={item.name}
                className="w-20 h-20 object-contain"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GroupColumn;
