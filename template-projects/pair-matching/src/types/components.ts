import type { CardState } from "./objects";

// ─── Single Card ──────────────────────────────────────────────────────────────
export interface CardProps {
  card: CardState;
  onClick: () => void;
  disabled: boolean;
  size: number;
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
export interface HUDProps {
  moves: number;
  matched: number;
  total: number;
  mascotState: "idle" | "happy" | "sad" | null;
  onRestart: () => void;
  onShowTutorial: () => void;
  isLandscape: boolean;
  uiScale: number;
  isNarrow: boolean;
}
