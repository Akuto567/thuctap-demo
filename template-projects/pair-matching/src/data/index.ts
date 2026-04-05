import type { GameConfig } from "../types/objects";

const DEFAULT_DATA: GameConfig = {
  minTotalPairs: 6,
  items: [
    { id: "cat", image: "🐱", keyword: "Cat", minPairs: 1 },
    { id: "dog", image: "🐶", keyword: "Dog", minPairs: 1 },
    { id: "apple", image: "🍎", keyword: "Apple", minPairs: 1 },
    { id: "sun", image: "☀️", keyword: "Sun", minPairs: 1 },
    { id: "star", image: "⭐", keyword: "Star", minPairs: 1 },
    { id: "fish", image: "🐟", keyword: "Fish", minPairs: 1 },
    { id: "flower", image: "🌸", keyword: "Flower", minPairs: 1 },
    { id: "book", image: "📚", keyword: "Book", minPairs: 1 },
  ],
};

const MORE_TEST_DATA: GameConfig["items"] = [
  // 1. The "Single Long Word" Test (Tests horizontal scaling/overflow)
  {
    id: "volcano",
    image: "🌋",
    keyword: "Pneumonoultramicroscopicsilicovolcanoconiosis",
    minPairs: 1,
  },

  // 2. The "Multi-Line Phrase" Test (Tests vertical stacking)
  {
    id: "galaxy",
    image: "🌌",
    keyword: "The spiral andromeda galaxy system",
    minPairs: 1,
  },

  // 3. The "Thin Character" Test (Tests if tracking/kerning breaks)
  {
    id: "ice",
    image: "🧊",
    keyword: "Illuminated icicle",
    minPairs: 1,
  },

  // 4. The "Wide Character" Test (Tests width-heavy letters)
  {
    id: "web",
    image: "🕸️",
    keyword: "World wide web",
    minPairs: 1,
  },

  // 5. The "Compound Word" Test (Tests standard wrap logic)
  {
    id: "butterfly",
    image: "🦋",
    keyword: "Monarch butterfly metamorphosis",
    minPairs: 1,
  },

  // 6. The "Short & Simple" Test (Control group)
  {
    id: "bee",
    image: "🐝",
    keyword: "Bee",
    minPairs: 1,
  },

  // 7. The "Punctuation" Test (Check for weird line breaks)
  {
    id: "robot",
    image: "🤖",
    keyword: "Robot-x: Mark iv",
    minPairs: 1,
  },

  // 8. The "Nature" Test (Medium length, multiple words)
  {
    id: "forest",
    image: "🌲",
    keyword: "Ancient evergreen forest",
    minPairs: 1,
  },
];

// Helper function to check if test mode is enabled via URL parameter
const isTestMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("test") === "true";
};

// Helper function to convert all keywords to sentence case
const toSentenceCase = (str: string): string => {
  // if (!str) return str;
  // return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  // no-op, testing purposes
  return str;
};

// Helper function to process items to sentence case
const processItemsToSentenceCase = (
  items: GameConfig["items"],
): GameConfig["items"] => {
  return items.map((item) => ({
    ...item,
    keyword: toSentenceCase(item.keyword),
  }));
};

// Get the appropriate data based on test mode
const getData = (): GameConfig => {
  // Check for externally provided data (highest priority)
  const externalData =
    typeof window !== "undefined" &&
    (window as Window & typeof globalThis & { MY_APP_DATA: GameConfig })[
      "MY_APP_DATA"
    ];

  if (externalData) {
    // Process external data to sentence case
    return {
      ...externalData,
      items: processItemsToSentenceCase(externalData.items),
    };
  }

  // In production without external data, return default
  if (import.meta.env.PROD) {
    return {
      ...DEFAULT_DATA,
      items: processItemsToSentenceCase(DEFAULT_DATA.items),
    };
  }

  // Development mode - check test parameter
  const testMode = isTestMode();

  if (testMode) {
    // Use test data
    return {
      ...DEFAULT_DATA,
      items: processItemsToSentenceCase([
        // ...DEFAULT_DATA.items,
        ...MORE_TEST_DATA,
      ]),
    };
  } else {
    // Use only default data
    return {
      ...DEFAULT_DATA,
      items: processItemsToSentenceCase(DEFAULT_DATA.items),
    };
  }
};

// --- Sample data ---
export const MY_APP_DATA: GameConfig = getData();
