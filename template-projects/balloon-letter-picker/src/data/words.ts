// src/data/words.ts
import type { WordData } from '../types/game.types';

// Dữ liệu mặc định (dùng khi không có window.win.DATA)
const DEFAULT_WORDS: WordData[] = [
  {
    word: 'JUMP',
    imageUrl: './assets/images/words/jump.png',
    hint: 'He pushes his body off the ground and rises into the air.'
  },
  {
    word: 'RUN',
    imageUrl: './assets/images/words/run.png',
    hint: 'He moves fast on his feet.'
  }
];

export const BUBBLE_IMAGES = [
  './assets/images/bubbles/bubble_red.png',
  './assets/images/bubbles/bubble_blue.png',
  './assets/images/bubbles/bubble_pink.png',
  './assets/images/bubbles/bubble_yellow.png',
];

// Hàm lấy dữ liệu từ window.win.DATA
export const getWords = (): WordData[] => {
  // Kiểm tra window có tồn tại không
  if (typeof window === 'undefined') {
    console.log('❌ Window undefined, using default words');
    return DEFAULT_WORDS;
  }
  
  // Kiểm tra window.win
  if (!window.win) {
    console.log('❌ window.win not found, using default words');
    return DEFAULT_WORDS;
  }
  
  // Kiểm tra window.win.DATA
  if (!window.win.DATA) {
    console.log('❌ window.win.DATA not found, using default words');
    return DEFAULT_WORDS;
  }
  
  // Kiểm tra DATA có phải mảng không
  if (!Array.isArray(window.win.DATA)) {
    console.log('❌ window.win.DATA is not an array, using default words');
    return DEFAULT_WORDS;
  }
  
  // Kiểm tra DATA có dữ liệu không
  if (window.win.DATA.length === 0) {
    console.log('❌ window.win.DATA is empty, using default words');
    return DEFAULT_WORDS;
  }
  
  console.log('✅ SUCCESS! Using words from window.win.DATA');
  console.log(`📝 Loaded ${window.win.DATA.length} words`);
  console.log('📖 First word:', window.win.DATA[0].word);
  
  return window.win.DATA;
};

// Export WORDS
export const WORDS = getWords();

// Log để kiểm tra khi import
console.log('📦 FINAL WORDS exported:', WORDS.length, 'words');