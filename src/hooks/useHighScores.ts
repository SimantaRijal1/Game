import { useCallback, useEffect, useState } from 'react';
import type { GameId, HighScore } from '@/types';

const STORAGE_KEY = 'arcade-highscores';

function readScores(): Record<GameId, HighScore | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { memory: null, '2048': null, snake: null };
    const parsed = JSON.parse(raw);
    return {
      memory: parsed.memory ?? null,
      '2048': parsed['2048'] ?? null,
      snake: parsed.snake ?? null,
    };
  } catch {
    return { memory: null, '2048': null, snake: null };
  }
}

export function useHighScores() {
  const [scores, setScores] = useState<Record<GameId, HighScore | null>>(readScores);

  useEffect(() => {
    const handler = () => setScores(readScores());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const submitScore = useCallback((game: GameId, score: number) => {
    setScores((prev) => {
      const existing = prev[game];
      if (existing && existing.score >= score) return prev;
      const newScore: HighScore = { game, score, date: new Date().toISOString() };
      const next = { ...prev, [game]: newScore };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { scores, submitScore };
}
