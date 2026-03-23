import type { PanInfo } from "framer-motion";
import type { Group, Item } from "./objects";

// --- Component Item có thể kéo ---
export interface DraggableItemProps {
  item: Item;
  onDragEnd: (
    item: Item,
    info: PanInfo,
    ref: React.RefObject<HTMLDivElement | null>,
  ) => Promise<boolean>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  onDragStart: (itemId: string) => void;
}// --- Component Cột Group ---
export interface GroupColumnProps {
  group: Group;
  items: Item[];
}

