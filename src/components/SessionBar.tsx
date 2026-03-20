import { useTimer } from '../hooks/useTimer';

interface SessionBarProps {
  startedAt: string;
  completedCount: number;
  totalCount: number;
  onCancel: () => void;
}

export function SessionBar({ startedAt, completedCount, totalCount, onCancel }: SessionBarProps) {
  const { formatted } = useTimer(startedAt);

  return (
    <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-card/95 backdrop-blur border-b border-card-border flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-accent text-lg">{formatted}</span>
        <span className="text-text-dim text-sm">
          {completedCount}/{totalCount} Übungen
        </span>
      </div>
      <button
        onClick={onCancel}
        className="text-text-dim text-sm px-3 py-1.5 rounded-lg hover:text-text active:bg-tag-bg transition-colors"
      >
        Abbrechen
      </button>
    </div>
  );
}
