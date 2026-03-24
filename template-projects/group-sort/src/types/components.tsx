import type { PanInfo } from "framer-motion";
import type { Group, Item } from "./objects";

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
}

export interface GroupColumnProps {
  group: Group;
  items: Item[];
  justDroppedId: string | null;
}
