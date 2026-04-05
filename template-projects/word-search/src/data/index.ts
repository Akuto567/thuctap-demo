/// <reference types="vite/client" />
import type { WordSearchConfig } from "../types/objects";

const DEFAULT_DATA: WordSearchConfig = {
  items: [
    { id: "item1", image: "🐱", keyword: "Cat" },
    { id: "item2", image: "🌸", keyword: "Flower" },
    { id: "item3", image: "🦘", keyword: "Jump" },
    { id: "item4", image: "🐦", keyword: "Bird" },
    { id: "item5", image: "⭐", keyword: "Star" },
  ],
  background: "",
};
//Chạy yarn dev http://localhost:5173/?test=true để kiểm
const MORE_TEST_DATA: WordSearchConfig["items"] = [
  { id: "item1", image: "🌋", keyword: "Volcano" },
  { id: "item2", image: "🌌", keyword: "Galaxy" },
  { id: "item3", image: "🧊", keyword: "Ice" },
  { id: "item4", image: "🕸️", keyword: "Web" },
  { id: "item5", image: "🦋", keyword: "Butterfly" },
  { id: "item6", image: "🐝", keyword: "Bee" },
  { id: "item7", image: "🤖", keyword: "Robot" },
  { id: "item8", image: "🌲", keyword: "Forest" },
];

const isTestMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("test") === "true";
};

const toSentenceCase = (str: string): string => {
  return str;
};

const processItemsToSentenceCase = (
  items: WordSearchConfig["items"]
): WordSearchConfig["items"] => {
  return items.map((item) => ({
    ...item,
    keyword: toSentenceCase(item.keyword),
  }));
};

const getData = (): WordSearchConfig => {
  const externalData =
    typeof window !== "undefined" &&
    (window as Window & typeof globalThis & { MY_APP_DATA: WordSearchConfig })[
      "MY_APP_DATA"
    ];

  if (externalData) {
    return {
      ...externalData,
      items: processItemsToSentenceCase(externalData.items),
    };
  }

  if (import.meta.env.PROD) {
    return {
      ...DEFAULT_DATA,
      items: processItemsToSentenceCase(DEFAULT_DATA.items),
    };
  }

  const testMode = isTestMode();

  if (testMode) {
    return {
      ...DEFAULT_DATA,
      items: processItemsToSentenceCase([...MORE_TEST_DATA]),
    };
  } else {
    return {
      ...DEFAULT_DATA,
      items: processItemsToSentenceCase(DEFAULT_DATA.items),
    };
  }
};

export const MY_APP_DATA: WordSearchConfig = getData();

export function createWordSearchGameData(appData?: Partial<WordSearchConfig>): WordSearchConfig {
  return {
    items: Array.isArray(appData?.items) && appData.items.length > 0
      ? appData.items.map((item) => ({
          id: item?.id ?? "",
          image: item?.image ?? "",
          keyword: item?.keyword ?? ""
        }))
      : DEFAULT_DATA.items,
    background:
      typeof appData?.background === "string"
        ? appData.background
        : DEFAULT_DATA.background
  };
}
