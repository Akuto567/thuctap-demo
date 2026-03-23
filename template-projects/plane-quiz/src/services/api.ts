/*import { Score } from '../types/game.types';

const API_BASE_URL = 'http://localhost:8080/api/game';

export const gameAPI = {
  saveScore: async (playerName: string, score: number): Promise<Score> => {
    try {
      const response = await fetch(`${API_BASE_URL}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName || 'Anonymous',
          score: score,
          date: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Score = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving score:', error);
      throw error;
    }
  },

  getHighScores: async (): Promise<Score[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/highscores`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Score[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching high scores:', error);
      return [];
    }
  },

  getPlayerStats: async (playerName: string): Promise<{ avgScore: number; totalGames: number; bestScore: number } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/player/${playerName}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  }
};*/
export{};