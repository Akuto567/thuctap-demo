import { useDraggable } from "@dnd-kit/core";
import type { Item } from "../types/objects";

interface Props {
  item: Item;
  isDragging?: boolean;
}

// No layoutId — the sidebar motion.div wrapper owns the layout animation.
// Keeping it here too would cause Framer Motion to double-animate.
export const ItemCard: React.FC<Props & { style?: React.CSSProperties }> = ({
  item,
  isDragging,
  style,
}) => (
  <div
    className={`w-32 h-32 shrink-0 flex items-center justify-center border-4 border-yellow-400 rounded-3xl bg-white shadow-lg select-none cursor-grab active:cursor-grabbing transition-opacity ${
      isDragging ? "opacity-30" : "opacity-100"
    }`}
    style={style}
  >
    <img
      src={item.imagePath}
      alt={item.name}
      className="w-24 h-24 object-contain pointer-events-none"
    />
  </div>
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
