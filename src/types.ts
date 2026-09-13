import type { LucideIcon } from 'lucide-react';

export type GameId = 'memory' | '2048' | 'snake';

export interface GameMeta {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  glowClass: string;
  gradient: string;
}

export interface HighScore {
  game: GameId;
  score: number;
  date: string;
}
