import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { layoutTransition } from "../config";
import type { Item } from "../types/objects";
import { ImageOrEmoji } from "./ImageOrEmoji";

interface Props {
  item: Item;
  isDragging?: boolean;
}

// Component hiển thị UI thuần túy
export const ItemCard: React.FC<Props & { style?: React.CSSProperties }> = ({
  item,
  isDragging,
  style,
}) => (
  <motion.div
    layoutId={item.id}
    className={`w-32 h-32 shrink-0 flex items-center justify-center border-4 border-yellow-400 rounded-3xl bg-white shadow-lg select-none cursor-grab active:cursor-grabbing ${
      isDragging ? "opacity-30" : "opacity-100"
    }`}
    style={style}
    transition={layoutTransition}
  >
    <ImageOrEmoji imagePath={item.imagePath} alt={item.name} size="medium" />
  </motion.div>
);

const DraggableItem: React.FC<{ item: Item }> = ({ item }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <ItemCard item={item} isDragging={isDragging} />
    </div>
  );
};

export default DraggableItem;
