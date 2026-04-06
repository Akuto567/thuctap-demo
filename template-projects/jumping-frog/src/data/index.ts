/// <reference types="vite/client" />

export interface QuizOption {
  label?: string;
  image?: string;
}

export interface Question {
  question: string;
  options: Array<string | QuizOption>;
  correctIndex: number;
}

const DEFAULT_DATA: Question[] = [
  {
    question: "2 + 2 bằng mấy?",
    options: ["3", "4", "5"],
    correctIndex: 1,
  },
];
// Test cái dưới thì: http://localhost:5173/?test=true
const TEST_DATA: Question[] = [
  {
    question: "2 + 2 bằng mấy?",
    options: ["3", "4", "5"],
    correctIndex: 1,
  },
  {
    question: "Chọn biểu tượng gần với ếch nhất:",
    options: [
      { image: "🐸", label: "Éch" },
      { image: "🐟", label: "Cá" },
      { image: "🦆", label: "Vịt" },
    ],
    correctIndex: 0,
  },
  {
    question: "Bầu trời xanh thường có màu gì?",
    options: ["Xanh lá", "Xanh dương", "Đỏ"],
    correctIndex: 1,
  },
  {
    question: "Con nhện có bao nhiêu chân?",
    options: ["6", "8", "10"],
    correctIndex: 1,
  },
  {
    question: "Quả táo màu gì?",
    options: [
      { image: "🍎", label: "Đỏ" },
      { image: "🍌", label: "Vàng" },
      { image: "🍇", label: "Tím" },
    ],
    correctIndex: 0,
  },
  {
    question: "Con chó sống mấy năm?",
    options: ["5-7 năm", "10-12 năm", "15-20 năm"],
    correctIndex: 1,
  },
  {
    question: "Nước sôi ở nhiệt độ nào?",
    options: ["50°C", "100°C", "200°C"],
    correctIndex: 1,
  },
  {
    question: "Mặt trời mọc ở hướng nào?",
    options: ["Đông", "Tây", "Bắc"],
    correctIndex: 0,
  },
  {
    question: "Con mèo kêu tiếng gì?",
    options: [
      { image: "🐱", label: "Meo" },
      { image: "🐕", label: "Gâu" },
      { image: "🐄", label: "Moó" },
    ],
    correctIndex: 0,
  },
];

const isTestMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("test") === "true";
};

export function normalizeOption(raw: string | QuizOption): QuizOption {
  if (typeof raw === "string") return { label: raw };
  return {
    label: raw.label ?? "",
    image: raw.image,
  };
}

export interface ShuffledOptions {
  ordered: Array<{ option: QuizOption; originalIndex: number }>;
  correctDisplayIndex: number;
}

export function shuffleQuestionOptions(question: Question): ShuffledOptions {
  const normalized = question.options.map(normalizeOption);
  const pairs = normalized.map((option, originalIndex) => ({ option, originalIndex }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  const correctDisplayIndex = pairs.findIndex((p) => p.originalIndex === question.correctIndex);
  return { ordered: pairs, correctDisplayIndex };
}

const getData = (): Question[] => {
  if (typeof window === "undefined") {
    if (import.meta.env.PROD) {
      return DEFAULT_DATA;
    }
    return isTestMode() ? TEST_DATA : DEFAULT_DATA;
  }

  const win = window as any;
  const externalData = win.MY_APP_DATA || win.APP_DATA;

  // Handle: { questions: [...] } or直接的数组 [...]
  if (Array.isArray(externalData)) {
    return externalData;
  }
  if (externalData?.questions) {
    return externalData.questions;
  }

  if (import.meta.env.PROD) {
    return DEFAULT_DATA;
  }

  const testMode = isTestMode();

  if (testMode) {
    return TEST_DATA;
  } else {
    return DEFAULT_DATA;
  }
};

export const MY_QUESTIONS: Question[] = getData();