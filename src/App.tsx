import { useState } from 'react';
import type { GameId } from '@/types';
import { ArcadeHome } from '@/components/ArcadeHome';
import { MemoryGame } from '@/games/MemoryGame';
import { Game2048 } from '@/games/Game2048';
import { SnakeGame } from '@/games/SnakeGame';

function App() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  if (activeGame === 'memory') return <MemoryGame onBack={() => setActiveGame(null)} />;
  if (activeGame === '2048') return <Game2048 onBack={() => setActiveGame(null)} />;
  if (activeGame === 'snake') return <SnakeGame onBack={() => setActiveGame(null)} />;

  return <ArcadeHome onSelect={setActiveGame} />;
}

export default App;
