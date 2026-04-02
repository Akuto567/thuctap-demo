// src/data/sounds.ts
export interface SoundData {
  pop: string;
  complete: string;
  correct: string;
}

// Dữ liệu âm thanh mặc định (luôn dùng cái này, không cần window.win)
const DEFAULT_SOUNDS: SoundData = {
  pop: './assets/sounds/pop.mp3',
  complete: './assets/sounds/complete.mp3',
  correct: './assets/sounds/true.mp3'
};

// Export trực tiếp, không cần getSounds
export const SOUNDS = DEFAULT_SOUNDS;

// Log để kiểm tra
console.log('🔊 SOUNDS loaded:', SOUNDS);