// --- Định nghĩa kiểu dữ liệu ---
// types.ts
// --- Định nghĩa kiểu dữ liệu ---
// ─── Types ────────────────────────────────────────────────────────────────────
export interface ItemData {
  id: string;
  image: string; // URL or emoji
  keyword: string;
  minPairs?: number; // min pairs for this item specifically
}

export interface GameConfig {
  items: ItemData[];
  minTotalPairs?: number; // global minimum
  cardBackColor?: string;
}

export interface CardState {
  uid: string; // unique id per card instance
  itemId: string;
  image: string;
  keyword: string;
  isFlipped: boolean;
  isMatched: boolean;
  pairIndex: number; // which duplicate pair this is (0,1,2...)
}
