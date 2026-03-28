import type { CardState, GameConfig } from "../types/objects";

// ─── Grid Algorithm ───────────────────────────────────────────────────────────
export function getOptimalGrid(totalCards: number): {
  rows: number;
  cols: number;
} {
  let n = totalCards % 2 === 0 ? totalCards : totalCards + 1;
  const maxRatio = 2.0;

  while (n < 100) {
    let bestRows = -1;
    let bestCols = -1;
    let bestScore = Infinity;

    for (let r = 1; r * r <= n; r++) {
      if (n % r === 0) {
        const c = n / r;
        const ratio = c / r;

        if (ratio <= maxRatio) {
          // Score based on proximity to 4:3 or 1:1
          const score = Math.abs(ratio - 1.2);
          if (score < bestScore) {
            bestScore = score;
            bestRows = r;
            bestCols = c;
          }
        }
      }
    }

    if (bestRows !== -1) {
      // Return normalized as landscape-oriented (cols >= rows)
      return {
        rows: Math.min(bestRows, bestCols),
        cols: Math.max(bestRows, bestCols),
      };
    }
    n += 2; // Try next even number
  }

  // Fallback
  return { rows: 2, cols: Math.ceil(totalCards / 2) };
}

// Helper for weighted random selection (favors items with fewer pairs)
function getRandomItemByWeight(
  items: GameConfig["items"],
  pairCounts: Map<string, number>,
) {
  const candidates = items.map((item) => {
    const count = pairCounts.get(item.id) || 1;
    // Weight is inversely proportional to the square of the count
    return { item, weight: 1 / Math.pow(count, 2) };
  });
  const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * totalWeight;
  for (const c of candidates) {
    if (r < c.weight) return c.item;
    r -= c.weight;
  }
  return items[Math.floor(Math.random() * items.length)];
}

export function buildDeck(config: GameConfig): CardState[] {
  const { items, minTotalPairs = 4 } = config;
  if (!items.length) return [];

  // Step 1: Initialize minPairs
  const pairCounts: Map<string, number> = new Map();
  for (const item of items) {
    pairCounts.set(item.id, Math.max(item.minPairs ?? 1, 1));
  }

  // Step 2: Sum current pairs
  let currentPairsTotal = Array.from(pairCounts.values()).reduce(
    (a, b) => a + b,
    0,
  );

  // Step 3: Determine target grid size
  // Grid must fit currentPairsTotal * 2 AND minTotalPairs * 2
  const minCardsNeeded = Math.max(currentPairsTotal, minTotalPairs) * 2;
  const grid = getOptimalGrid(minCardsNeeded);
  const targetCards = grid.rows * grid.cols;
  const targetPairs = targetCards / 2;

  // Step 4: Fill the gap to reach targetPairs
  while (currentPairsTotal < targetPairs) {
    const item = getRandomItemByWeight(items, pairCounts);
    pairCounts.set(item.id, (pairCounts.get(item.id) ?? 0) + 1);
    currentPairsTotal++;
  }

  // Step 5: Build card array
  const cards: CardState[] = [];
  for (const item of items) {
    const count = pairCounts.get(item.id) ?? 1;
    for (let p = 0; p < count; p++) {
      for (let side = 0; side < 2; side++) {
        cards.push({
          uid: `${item.id}-p${p}-s${side}-${Math.random()}`,
          itemId: item.id,
          image: item.image,
          keyword: item.keyword,
          isFlipped: false,
          isMatched: false,
          pairIndex: p,
        });
      }
    }
  }

  // Step 6: Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

export function isEmoji(str: string) {
  if (!str) return false;

  const s = str.trim();

  // 1. If it looks like an image source → NOT emoji
  if (
    s.startsWith("http") ||
    s.startsWith("data:") ||
    s.startsWith("file:") ||
    s.startsWith("/") ||
    s.startsWith("./") ||
    s.startsWith("../") ||
    /^[a-zA-Z]:\\/.test(s) || // Windows path (C:\...)
    /\.(png|jpe?g|gif|webp|svg)$/i.test(s)
  ) {
    return false;
  }

  // 2. If it's short and contains emoji-like unicode → treat as emoji
  // This uses Unicode property for emojis
  const emojiRegex = /\p{Extended_Pictographic}/u;

  return s.length <= 4 && emojiRegex.test(s);
}
