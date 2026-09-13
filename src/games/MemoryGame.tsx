import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameShell, StatPill } from '@/components/GameShell';
import { useHighScores } from '@/hooks/useHighScores';
import { Trophy, Sparkles, Check } from 'lucide-react';

const EMOJIS = ['🚀', '🎮', '🎯', '🎲', '🎨', '🎭', '🎪', '🧩'];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const ACCENT = '#22d3ee';

function buildDeck(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  const shuffled = pairs
    .map((emoji, i) => ({ emoji, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((c, i) => ({ id: i, emoji: c.emoji, flipped: false, matched: false }));
  return shuffled;
}

interface Props {
  onBack: () => void;
}

export function MemoryGame({ onBack }: Props) {
  const { scores, submitScore } = useHighScores();
  const [cards, setCards] = useState<Card[]>(buildDeck);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const bestScore = scores.memory?.score ?? null;

  const reset = useCallback(() => {
    setCards(buildDeck());
    setSelected([]);
    setMoves(0);
    setWon(false);
  }, []);

  const matchedCount = useMemo(() => cards.filter((c) => c.matched).length, [cards]);

  const handleFlip = useCallback((idx: number) => {
    setCards((prev) => {
      const card = prev[idx];
      if (card.flipped || card.matched || selected.length >= 2) return prev;

      const newCards = prev.map((c) =>
        c.id === card.id ? { ...c, flipped: true } : c
      );

      const newSelected = [...selected, idx];
      setSelected(newSelected);

      if (newSelected.length === 2) {
        setMoves((m) => m + 1);
        const [a, b] = newSelected;
        if (newCards[a].emoji === newCards[b].emoji) {
          setTimeout(() => {
            setCards((cs) =>
              cs.map((c, i) =>
                i === a || i === b ? { ...c, matched: true } : c
              )
            );
            setSelected([]);
          }, 400);
        } else {
          setTimeout(() => {
            setCards((cs) =>
              cs.map((c, i) =>
                i === a || i === b ? { ...c, flipped: false } : c
              )
            );
            setSelected([]);
          }, 800);
        }
      }

      return newCards;
    });
  }, [selected]);

  useEffect(() => {
    if (matchedCount === cards.length && !won) {
      setWon(true);
      submitScore('memory', moves);
    }
  }, [matchedCount, cards.length, won, moves, submitScore]);

  return (
    <GameShell
      title="Memory Match"
      onBack={onBack}
      onReset={reset}
      accent={ACCENT}
      stats={
        <>
          <StatPill label="Moves" value={moves} accent={ACCENT} />
          <StatPill label="Pairs" value={`${matchedCount / 2} / ${EMOJIS.length}`} />
          {bestScore !== null && (
            <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2">
              <Trophy className="w-4 h-4 text-[var(--amber)]" style={{ color: '#fbbf24' }} />
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Best</span>
              <span className="font-display text-lg font-bold text-[#fbbf24]">{bestScore}</span>
            </div>
          )}
        </>
      }
    >
      {/* Win banner */}
      {won && (
        <div className="mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 text-center animate-slide-up card-glow-cyan">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" style={{ color: ACCENT }} />
            <span className="font-display text-lg font-bold" style={{ color: ACCENT }}>
              You Win!
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Cleared in {moves} moves{bestScore !== null && moves < bestScore ? ' — new best!' : ''}
          </p>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => handleFlip(idx)}
            disabled={card.matched || card.flipped || selected.length >= 2}
            className={`
              relative aspect-square rounded-2xl flex items-center justify-center text-3xl sm:text-4xl
              transition-all duration-300 select-none
              ${card.flipped || card.matched
                ? 'bg-[var(--bg-card-hover)] border-2'
                : 'bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--text-muted)] hover:scale-[1.03] cursor-pointer'
              }
              ${card.matched ? 'opacity-50' : ''}
            `}
            style={
              card.flipped || card.matched
                ? { borderColor: card.matched ? '#34d399' : ACCENT }
                : undefined
            }
          >
            {card.flipped || card.matched ? (
              <span className="animate-flip-in">
                {card.matched && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#34d399] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[var(--bg)]" />
                  </span>
                )}
                {card.emoji}
              </span>
            ) : (
              <span className="text-[var(--text-muted)] text-2xl font-display font-bold opacity-30">?</span>
            )}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] mt-6">
        Flip two cards at a time. Match all 8 pairs in the fewest moves!
      </p>
    </GameShell>
  );
}
