import { useCallback, useEffect, useRef, useState } from 'react';
import { GameShell, StatPill } from '@/components/GameShell';
import { useHighScores } from '@/hooks/useHighScores';
import { Trophy, Sparkles, Play, Pause } from 'lucide-react';

const GRID_SIZE = 17;
const CELL = 20;
const BOARD_PX = GRID_SIZE * CELL;
const ACCENT = '#34d399';
const SPEED = 130;

type Point = { x: number; y: number };
type Dir = 'up' | 'down' | 'left' | 'right';

const DIR_VECTORS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down', down: 'up', left: 'right', right: 'left',
};

function randomFood(snake: Point[]): Point {
  while (true) {
    const p = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

function initSnake(): Point[] {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

interface Props {
  onBack: () => void;
}

export function SnakeGame({ onBack }: Props) {
  const { scores, submitScore } = useHighScores();
  const [snake, setSnake] = useState<Point[]>(initSnake);
  const [food, setFood] = useState<Point>(() => randomFood(initSnake()));
  const [dir, setDir] = useState<Dir>('right');
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);

  const dirRef = useRef<Dir>('right');
  const queuedDirRef = useRef<Dir | null>(null);
  const snakeRef = useRef<Point[]>(snake);
  const foodRef = useRef<Point>(food);

  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);

  const bestScore = scores.snake?.score ?? null;

  const reset = useCallback(() => {
    const s = initSnake();
    setSnake(s);
    setFood(randomFood(s));
    setDir('right');
    dirRef.current = 'right';
    queuedDirRef.current = null;
    setScore(0);
    setOver(false);
    setRunning(false);
  }, []);

  const tick = useCallback(() => {
    const currentDir = queuedDirRef.current ?? dirRef.current;
    if (queuedDirRef.current) {
      dirRef.current = queuedDirRef.current;
      setDir(queuedDirRef.current);
      queuedDirRef.current = null;
    }

    const vec = DIR_VECTORS[currentDir];
    const currentSnake = snakeRef.current;
    const head = currentSnake[0];
    const newHead = { x: head.x + vec.x, y: head.y + vec.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      setOver(true);
      setRunning(false);
      return;
    }

    // Self collision
    if (currentSnake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      setOver(true);
      setRunning(false);
      return;
    }

    const newSnake = [newHead, ...currentSnake];
    const currentFood = foodRef.current;

    if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
      const newScore = score + 1;
      setScore(newScore);
      submitScore('snake', newScore);
      setFood(randomFood(newSnake));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [score, submitScore]);

  useEffect(() => {
    if (!running || over) return;
    const interval = setInterval(tick, SPEED);
    return () => clearInterval(interval);
  }, [running, over, tick]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      const newDir = map[e.key];
      if (newDir) {
        e.preventDefault();
        if (OPPOSITE[newDir] !== dirRef.current) {
          queuedDirRef.current = newDir;
        }
        if (!running && !over) setRunning(true);
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (!over) setRunning((r) => !r);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [running, over]);

  // Touch swipe
  useEffect(() => {
    let startX = 0, startY = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      let newDir: Dir;
      if (Math.abs(dx) > Math.abs(dy)) {
        newDir = dx > 0 ? 'right' : 'left';
      } else {
        newDir = dy > 0 ? 'down' : 'up';
      }
      if (OPPOSITE[newDir] !== dirRef.current) {
        queuedDirRef.current = newDir;
      }
      if (!running && !over) setRunning(true);
    };
    const board = document.getElementById('board-snake');
    if (board) {
      board.addEventListener('touchstart', onStart, { passive: true });
      board.addEventListener('touchend', onEnd, { passive: true });
    }
    return () => {
      if (board) {
        board.removeEventListener('touchstart', onStart);
        board.removeEventListener('touchend', onEnd);
      }
    };
  }, [running, over]);

  const handleDirButton = (newDir: Dir) => {
    if (OPPOSITE[newDir] !== dirRef.current) {
      queuedDirRef.current = newDir;
    }
    if (!running && !over) setRunning(true);
  };

  return (
    <GameShell
      title="Snake"
      onBack={onBack}
      onReset={reset}
      accent={ACCENT}
      stats={
        <>
          <StatPill label="Score" value={score} accent={ACCENT} />
          <StatPill label="Length" value={snake.length} />
          {bestScore !== null && (
            <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2">
              <Trophy className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Best</span>
              <span className="font-display text-lg font-bold" style={{ color: ACCENT }}>{bestScore}</span>
            </div>
          )}
        </>
      }
    >
      {over && (
        <div className="mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 text-center animate-slide-up card-glow-emerald">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" style={{ color: ACCENT }} />
            <span className="font-display text-lg font-bold" style={{ color: ACCENT }}>
              Game Over
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            You scored {score}{bestScore !== null && score >= bestScore && score > 0 ? ' — new best!' : ''}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: ACCENT, color: '#0a0e17' }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Board */}
      <div className="flex justify-center">
        <div
          id="board-snake"
          className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-2 touch-none overflow-hidden"
          style={{ width: BOARD_PX + 16, height: BOARD_PX + 16 }}
        >
          {/* Grid background */}
          <div
            className="absolute inset-2 rounded-xl opacity-30"
            style={{
              backgroundImage: `linear-gradient(rgba(35,43,63,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(35,43,63,0.5) 1px, transparent 1px)`,
              backgroundSize: `${CELL}px ${CELL}px`,
              width: BOARD_PX,
              height: BOARD_PX,
            }}
          />

          {/* Food */}
          <div
            className="absolute rounded-full animate-pulse-glow"
            style={{
              left: 8 + food.x * CELL + 2,
              top: 8 + food.y * CELL + 2,
              width: CELL - 4,
              height: CELL - 4,
              background: '#fb7185',
              boxShadow: '0 0 10px rgba(251, 113, 133, 0.6)',
            }}
          />

          {/* Snake */}
          {snake.map((seg, i) => (
            <div
              key={i}
              className="absolute rounded-md transition-all duration-75"
              style={{
                left: 8 + seg.x * CELL + 1,
                top: 8 + seg.y * CELL + 1,
                width: CELL - 2,
                height: CELL - 2,
                background: i === 0 ? ACCENT : `rgba(52, 211, 153, ${Math.max(0.4, 1 - i * 0.04)})`,
                boxShadow: i === 0 ? '0 0 12px rgba(52, 211, 153, 0.5)' : 'none',
              }}
            />
          ))}

          {/* Pause overlay */}
          {!running && !over && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/70 rounded-2xl">
              <button
                onClick={() => setRunning(true)}
                className="flex flex-col items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <Play className="w-10 h-10" style={{ color: ACCENT }} />
                <span className="text-sm font-medium">Press to start</span>
              </button>
            </div>
          )}
          {running && !over && (
            <button
              onClick={() => setRunning(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-[var(--bg)]/60 hover:bg-[var(--bg)]/80 transition-colors"
            >
              <Pause className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile controls */}
      <div className="mt-4 sm:hidden grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
        <div />
        <button onClick={() => handleDirButton('up')} className="aspect-square rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--text-muted)] active:scale-95 transition-all">↑</button>
        <div />
        <button onClick={() => handleDirButton('left')} className="aspect-square rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--text-muted)] active:scale-95 transition-all">←</button>
        <button onClick={() => handleDirButton('down')} className="aspect-square rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--text-muted)] active:scale-95 transition-all">↓</button>
        <button onClick={() => handleDirButton('right')} className="aspect-square rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--text-muted)] active:scale-95 transition-all">→</button>
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] mt-4 hidden sm:block">
        Arrow keys or WASD to steer. Spacebar to pause. Eat the red dots and don't hit the walls!
      </p>
      <p className="text-center text-sm text-[var(--text-muted)] mt-4 sm:hidden">
        Swipe or tap arrows to steer. Eat dots, avoid walls!
      </p>
    </GameShell>
  );
}
