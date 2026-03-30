import type { GameConfig } from "../types/objects";

const DEFAULT_DATA: GameConfig = {
  minTotalPairs: 6,
  items: [
    { id: "cat", image: "🐱", keyword: "CAT", minPairs: 1 },
    { id: "dog", image: "🐶", keyword: "DOG", minPairs: 1 },
    { id: "apple", image: "🍎", keyword: "APPLE", minPairs: 1 },
    { id: "sun", image: "☀️", keyword: "SUN", minPairs: 1 },
    { id: "star", image: "⭐", keyword: "STAR", minPairs: 1 },
    { id: "fish", image: "🐟", keyword: "FISH", minPairs: 1 },
    { id: "flower", image: "🌸", keyword: "FLOWER", minPairs: 1 },
    { id: "book", image: "📚", keyword: "BOOK", minPairs: 1 },
  ],
};

// --- Dữ liệu mẫu ---
export const MY_APP_DATA: GameConfig =
  import.meta.env.PROD &&
  typeof window !== "undefined" &&
  (window as Window & typeof globalThis & { MY_APP_DATA: GameConfig })[
    "MY_APP_DATA"
  ]
    ? (
        window as Window &
          typeof globalThis & {
            MY_APP_DATA: GameConfig;
          }
      )["MY_APP_DATA"]
    : DEFAULT_DATA;
