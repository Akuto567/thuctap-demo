// src/types/global.d.ts
export interface WordData {
  word: string;
  imageUrl: string;
  hint: string;
}

export interface SoundData {
  pop: string;
  complete: string;
}

declare global {
  interface Window {
    win: {
      DATA?: WordData[];
      SOUNDS?: SoundData;
    };
  }
}

export {};