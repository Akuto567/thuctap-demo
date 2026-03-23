export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameObject extends Position, Size {
  id?: string;
}

export interface Obstacle extends GameObject {
  speed: number;
}

export interface Player extends GameObject {
  speed: number;
}

export interface Score {
  id?: number;
  playerName: string;
  score: number;
  date: string;
}

export interface GameState {
  isPlaying: boolean;
  gameOver: boolean;
  score: number;
  playerY: number;
  highScores: Score[];
}

export type KeyState = {
  [key: string]: boolean;
};