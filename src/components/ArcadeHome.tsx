import { Brain, Grid3x3, Worm } from 'lucide-react';
import type { GameMeta, GameId } from '@/types';
import { useHighScores } from '@/hooks/useHighScores';

const GAMES: GameMeta[] = [
  {
    id: 'memory',
    title: 'Memory Match',
    tagline: 'Find every pair',
    description: 'Flip cards two at a time and match all the pairs. The fewer moves, the better your score.',
    icon: Brain,
    accent: '#22d3ee',
    glowClass: 'card-glow-cyan',
    gradient: 'from-cyan-500/20 to-blue-500/5',
  },
  {
    id: '2048',
    title: '2048',
    tagline: 'Merge to win',
    description: 'Slide numbered tiles together. Combine matching numbers and chase the elusive 2048 tile.',
    icon: Grid3x3,
    accent: '#fbbf24',
    glowClass: 'card-glow-amber',
    gradient: 'from-amber-500/20 to-orange-500/5',
  },
  {
    id: 'snake',
    title: 'Snake',
    tagline: 'Eat and grow',
    description: 'Guide the snake to collect dots without crashing into walls or yourself. How long can you get?',
    icon: Worm,
    accent: '#34d399',
    glowClass: 'card-glow-emerald',
    gradient: 'from-emerald-500/20 to-green-500/5',
  },
];

interface Props {
  onSelect: (game: GameId) => void;
}

export function ArcadeHome({ onSelect }: Props) {
  const { scores } = useHighScores();

  return (
    <div className="min-h-screen bg-grid animate-fade-in">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] mb-6 animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse-glow" />
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest">
            Three Games · No Downloads
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl font-bold mb-4 animate-slide-up">
          <span className="text-cyan-glow" style={{ color: 'var(--cyan)' }}>Neon</span>{''}
          <span style={{ color: 'var(--text)' }}>Arcade</span>
        </h1>

        <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto animate-slide-up">
          Three classic games, reimagined. Pick one and start playing — your best scores are saved automatically.
        </p>
      </div>

      {/* Game cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {GAMES.map((game, idx) => {
            const Icon = game.icon;
            const best = scores[game.id]?.score ?? null;
            return (
              <button
                key={game.id}
                onClick={() => onSelect(game.id)}
                className={`
                  group relative bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6
                  text-left transition-all duration-300
                  hover:scale-[1.03] hover:border-transparent
                  ${game.glowClass}
                  animate-slide-up
                `}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${game.accent}1a`, border: `1px solid ${game.accent}40` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: game.accent }} />
                  </div>

                  <h3 className="font-display text-xl font-bold mb-1" style={{ color: game.accent }}>
                    {game.title}
                  </h3>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-3">
                    {game.tagline}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
                    {game.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--text)] transition-colors">
                      Play now →
                    </span>
                    {best !== null && (
                      <span className="text-xs text-[var(--text-muted)]">
                        Best: <span className="font-bold" style={{ color: game.accent }}>{best}</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-[var(--text-muted)]">
            Scores saved locally in your browser · Built with React + Tailwind
          </p>
        </div>
      </div>
    </div>
  );
}
