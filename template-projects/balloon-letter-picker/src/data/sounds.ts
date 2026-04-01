// src/data/sounds.ts
export interface SoundData {
  pop: string;
  complete: string;
}

// Dữ liệu âm thanh mặc định (giống như DEFAULT_WORDS)
const DEFAULT_SOUNDS: SoundData = {
  pop: './sounds/pop.mp3',
  complete: './sounds/complete.mp3'
};

// Hàm lấy dữ liệu từ window.win.SOUNDS (giống getWords)
export const getSounds = (): SoundData => {
  // Kiểm tra window
  if (typeof window === 'undefined') {
    console.log('❌ Window undefined, using default sounds');
    return DEFAULT_SOUNDS;
  }
  
  // Kiểm tra window.win
  if (!window.win) {
    console.log('❌ window.win not found, using default sounds');
    return DEFAULT_SOUNDS;
  }
  
  // Kiểm tra window.win.SOUNDS
  if (!window.win.SOUNDS) {
    console.log('❌ window.win.SOUNDS not found, using default sounds');
    return DEFAULT_SOUNDS;
  }
  
  console.log('✅ SUCCESS! Using sounds from window.win.SOUNDS');
  console.log('🔊 Sounds:', window.win.SOUNDS);
  
  return window.win.SOUNDS;
};

// Export SOUNDS (giống WORDS)
export const SOUNDS = getSounds();

// Log để kiểm tra
console.log('🔊 FINAL SOUNDS exported:', SOUNDS);