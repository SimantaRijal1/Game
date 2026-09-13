import { type ReactNode } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface GameShellProps {
  title: string;
  onBack: () => void;
  onReset: () => void;
  stats: ReactNode;
  children: ReactNode;
  accent: string;
}

export function GameShell({ title, onBack, onReset, stats, children, accent }: GameShellProps) {
  return (
    <div className="min-h-screen bg-grid animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Arcade
          </button>
          <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ color: accent }}>
            {title}
          </h1>
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {stats}
        </div>

        {/* Game area */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatPillProps {
  label: string;
  value: string | number;
  accent?: string;
}

export function StatPill({ label, value, accent }: StatPillProps) {
  return (
    <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2">
      <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">{label}</span>
      <span className="font-display text-lg font-bold" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
    </div>
  );
}
