import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameShell, StatPill } from '@/components/GameShell';
import { useHighScores } from '@/hooks/useHighScores';
import { Trophy, Sparkles } from 'lucide-react';

const SIZE = 4;
const ACCENT = '#fbbf24';

type Grid = number[][];

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function spawnTile(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function initGrid(): Grid {
  return spawnTile(spawnTile(emptyGrid()));
}

function slideRow(row: number[]): [number[], number] {
  const filtered = row.filter((n) => n !== 0);
  let gained = 0;
  const result: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      gained += merged;
      i += 2;
    } else {
      result.push(filtered[i]);
      i++;
    }
  }
  while (result.length < SIZE) result.push(0);
  return [result, gained];
}

function rotateCW(grid: Grid): Grid {
  const next = emptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      next[c][SIZE - 1 - r] = grid[r][c];
    }
  }
  return next;
}

type Direction = 'left' | 'right' | 'up' | 'down';

function move(grid: Grid, dir: Direction): [Grid, number, boolean] {
  let g = grid.map((row) => [...row]);
  const rotations: Record<Direction, number> = { left: 0, up: 1, right: 2, down: 3 };
  for (let i = 0; i < rotations[dir]; i++) g = rotateCW(g);

  let gained = 0;
  g = g.map((row) => {
    const [slid, score] = slideRow(row);
    gained += score;
    return slid;
  });

  for (let i = 0; i < (4 - rotations[dir]) % 4; i++) g = rotateCW(g);

  const changed = JSON.stringify(g) !== JSON.stringify(grid);
  return [g, gained, changed];
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWon(grid: Grid): boolean {
  return grid.some((row) => row.includes(2048));
}

const TILE_STYLES: Record<number, string> = {
  0: 'bg-[var(--bg-card)] border border-[var(--border)] text-transparent',
  2: 'bg-[#1e2a4a] text-[#e8ecf4] border border-[var(--border)]',
  4: 'bg-[#2a3a6a] text-[#e8ecf4] border border-[var(--border)]',
  8: 'bg-[#3b5278] text-[#e8ecf4] border border-[var(--border)]',
  16: 'bg-[#4a6a9a] text-white border border-[var(--border)]',
  32: 'bg-[#5b7eb0] text-white border border-[var(--border)]',
  64: 'bg-[#6b92c8] text-white border border-[var(--border)]',
  128: 'bg-[#f59e0b] text-white border border-[var(--border)]',
  256: 'bg-[#f97316] text-white border border-[var(--border)]',
  512: 'bg-[#ea580c] text-white border border-[var(--border)]',
  1024: 'bg-[#fbbf24] text-[var(--bg)] border border-[var(--border)]',
  2048: 'bg-gradient-to-br from-[#fbbf24] to-[#f97316] text-[var(--bg)] border-2 border-[#fbbf24]',
};

interface Props {
  onBack: () => void;
}

export function Game2048({ onBack }: Props) {
  const { scores, submitScore } = useHighScores();
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [dismissedWin, setDismissedWin] = useState(false);

  const bestScore = scores['2048']?.score ?? null;

  const reset = useCallback(() => {
    setGrid(initGrid());
    setScore(0);
    setOver(false);
    setWon(false);
    setDismissedWin(false);
  }, []);

  const doMove = useCallback((dir: Direction) => {
    if (over) return;
    setGrid((prevGrid) => {
      const [newGrid, gained, changed] = move(prevGrid, dir);
      if (!changed) return prevGrid;

      const withTile = spawnTile(newGrid);
      if (gained > 0) {
        setScore((s) => {
          const newScore = s + gained;
          submitScore('2048', newScore);
          return newScore;
        });
      }
      if (!won && hasWon(withTile)) setWon(true);
      if (!canMove(withTile)) setOver(true);
      return withTile;
    });
  }, [over, won, submitScore]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doMove]);

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
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        doMove(dx > 0 ? 'right' : 'left');
      } else {
        doMove(dy > 0 ? 'down' : 'up');
      }
    };
    const board = document.getElementById('board-2048');
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
  }, [doMove]);

  const showWin = won && !dismissedWin;

  return (
    <GameShell
      title="2048"
      onBack={onBack}
      onReset={reset}
      accent={ACCENT}
      stats={
        <>
          <StatPill label="Score" value={score} accent={ACCENT} />
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
      {(showWin || over) && (
        <div className="mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 text-center animate-slide-up card-glow-amber">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" style={{ color: ACCENT }} />
            <span className="font-display text-lg font-bold" style={{ color: ACCENT }}>
              {over ? 'Game Over' : 'You Hit 2048!'}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            {over ? `Final score: ${score}` : 'Keep going for a higher score!'}
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border)] text-sm font-medium hover:border-[var(--text-muted)] transition-colors"
            >
              New Game
            </button>
            {showWin && (
              <button
                onClick={() => setDismissedWin(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: ACCENT, color: '#0a0e17' }}
              >
                Keep Going
              </button>
            )}
          </div>
        </div>
      )}

      <div id="board-2048" className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3 touch-none">
        <div className="grid grid-cols-4 gap-2">
          {grid.flat().map((value, i) => (
            <div
              key={i}
              className={`
                aspect-square rounded-xl flex items-center justify-center
                font-display font-bold text-2xl sm:text-3xl
                transition-all duration-150
                ${TILE_STYLES[value] ?? TILE_STYLES[2048]}
                ${value !== 0 ? 'animate-pop' : ''}
              `}
            >
              {value !== 0 ? value : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile controls */}
      <div className="mt-4 sm:hidden grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
        <div />
        <button onClick={() => doMove('up')} className="aspect-square rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--text-muted)] active:scale-95 transition-all">↑</button>
        <div />
        <button onClick={() => doMove('left')} className="aspect-square rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--text-muted)] active:scale-95 transition-all">←</button>
        <button onClick={() => doMove('down')} className="aspect-square rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--text-muted)] active:scale-95 transition-all">↓</button>
        <button onClick={() => doMove('right')} className="aspect-square rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl hover:border-[var(--text-muted)] active:scale-95 transition-all">→</button>
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] mt-4 hidden sm:block">
        Use arrow keys or WASD to slide tiles. Merge matching numbers to reach 2048!
      </p>
      <p className="text-center text-sm text-[var(--text-muted)] mt-4 sm:hidden">
        Swipe or tap arrows to merge tiles!
      </p>
    </GameShell>
  );
}
