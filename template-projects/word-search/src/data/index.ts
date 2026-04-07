/// <reference types="vite/client" />
import type { WordSearchConfig } from "../types/objects";

const DEFAULT_BACKGROUND = "assets/images/word-search-sample-background.svg";

const DEFAULT_DATA: WordSearchConfig = {
  items: [
    { id: "item1", image: "🐱", word: "Cat" },
    { id: "item2", image: "🌸", word: "Flower" },
    { id: "item3", image: "🦘", word: "Jump" },
    { id: "item4", image: "🐦", word: "Bird" },
    { id: "item5", image: "⭐", word: "Star" },
  ],
  background: DEFAULT_BACKGROUND,
};
//Chạy yarn dev http://localhost:5173/?test=true để kiểm
const MORE_TEST_DATA: WordSearchConfig["items"] = [
  { id: "item1", image: "🌋", word: "Volcano" },
  { id: "item2", image: "🌌", word: "Galaxy" },
  { id: "item3", image: "🧊", word: "Ice" },
  { id: "item4", image: "🕸️", word: "Web" },
  { id: "item5", image: "🦋", word: "Butterfly" },
  { id: "item6", image: "🐝", word: "Bee" },
  { id: "item7", image: "🤖", word: "Robot" },
  { id: "item8", image: "🌲", word: "Forest" },
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
    word: toSentenceCase(item.word),
  }));
};

const resolveBackground = (background?: string): string => {
  return typeof background === "string" && background.trim()
    ? background
    : DEFAULT_BACKGROUND;
};

const getData = (): WordSearchConfig => {
  const win = window as any;
  const externalData = win.MY_APP_DATA || win.APP_DATA;

  if (externalData) {
    return {
      ...externalData,
      background: resolveBackground(externalData.background),
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
          word: item?.word ?? ""
        }))
      : DEFAULT_DATA.items,
    background: resolveBackground(appData?.background)
  };
}
