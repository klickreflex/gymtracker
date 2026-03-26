import type { Exercise, SessionSet } from '../types';
import { SetTracker } from './SetTracker';

export function formatWeight(weight: number | null, unit: 'kg' | 'bw'): string {
  if (unit === 'bw') return 'BW';
  if (weight === null) return '–';
  return weight % 1 === 0 ? String(weight) : weight.toFixed(1).replace('.', ',');
}

function formatWeightUnit(unit: 'kg' | 'bw'): string | null {
  return unit === 'kg' ? 'kg' : null;
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  totalCount?: number;
  // Session mode props (all optional — absent = plan view)
  sessionActive?: boolean;
  loggedSets?: SessionSet[];
  isSkipped?: boolean;
  isCompleted?: boolean;
  onLogSet?: (setNumber: number, actualReps?: number, actualWeight?: number) => void;
  onUndoSet?: (setNumber: number) => void;
  onSkip?: () => void;
  onUnskip?: () => void;
  // Plan management props
  onEdit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ExerciseCard({
  exercise,
  index,
  totalCount = 0,
  sessionActive = false,
  loggedSets = [],
  isSkipped = false,
  isCompleted = false,
  onLogSet,
  onUndoSet,
  onSkip,
  onUnskip,
  onEdit,
  onMoveUp,
  onMoveDown,
}: ExerciseCardProps) {
  const hasSettings = exercise.settings.length > 0;
  const hasNotes = exercise.notes.length > 0;

  const cardClasses = [
    'relative rounded-[14px] border bg-card p-4 mb-3 overflow-hidden transition-opacity duration-300',
    isSkipped ? 'opacity-40 border-card-border' : '',
    isCompleted && !isSkipped ? 'border-green/30' : 'border-card-border',
  ].join(' ');

  return (
    <div className={cardClasses}>
      {exercise.optional && !isSkipped && (
        <div className="absolute top-[10px] right-[-32px] bg-optional text-bg text-[0.58rem] font-bold uppercase tracking-wider py-[3px] px-[38px] rotate-[35deg] z-10">
          Optional
        </div>
      )}

      {/* Top row: number + name + badges */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className={`flex-shrink-0 w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center ${
          isCompleted && !isSkipped
            ? 'bg-green/15 text-green'
            : 'bg-accent-dim text-accent'
        }`}>
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`font-bold text-[1.05rem] leading-tight ${isSkipped ? 'line-through' : ''}`}>
            {exercise.name}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {exercise.muscleGroups.map((mg) => (
              <span
                key={mg}
                className="text-[0.67rem] font-semibold text-accent bg-accent-dim px-2 py-0.5 rounded uppercase tracking-wide"
              >
                {mg}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-1.5 flex-wrap">
        <Stat label="Sätze" value={String(exercise.defaultSets)} />
        <Stat label="Wdh." value={String(exercise.defaultReps)} />
        <Stat
          label="Gewicht"
          value={formatWeight(exercise.defaultWeight, exercise.weightUnit)}
          unit={formatWeightUnit(exercise.weightUnit)}
          highlight
        />
        <Stat label="Gerät" value={String(exercise.deviceNumber)} />
      </div>

      {/* Machine settings */}
      {hasSettings && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {exercise.settings.map((s) => (
            <div key={s.label} className="text-xs text-text-dim bg-tag-bg px-2.5 py-1 rounded-md">
              {s.label}: <span className="text-text font-semibold">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {hasNotes && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          <div className="text-xs text-text-dim bg-tag-bg px-2.5 py-1 rounded-md">
            ⚙️ {exercise.notes}
          </div>
        </div>
      )}

      {/* Session mode: set tracker */}
      {sessionActive && !isSkipped && onLogSet && onUndoSet && (
        <SetTracker
          exercise={exercise}
          loggedSets={loggedSets}
          onLogSet={onLogSet}
          onUndoSet={onUndoSet}
        />
      )}

      {/* Session mode: skip/unskip link */}
      {sessionActive && !isCompleted && (
        <div className="mt-3 text-center">
          {isSkipped ? (
            <button
              onClick={onUnskip}
              className="text-xs text-accent active:opacity-70 transition-opacity"
            >
              Wieder aufnehmen
            </button>
          ) : (
            <button
              onClick={onSkip}
              className="text-xs text-text-dim active:opacity-70 transition-opacity"
            >
              Überspringen
            </button>
          )}
        </div>
      )}

      {/* Plan mode: edit button */}
      {!sessionActive && onEdit && (
        <div className="mt-3 pt-3 border-t border-card-border">
          <button
            onClick={onEdit}
            className="text-xs text-text-dim flex items-center gap-1 active:text-accent transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Bearbeiten
          </button>
        </div>
      )}

      {/* Reorder mode: move up/down buttons */}
      {!sessionActive && (onMoveUp || onMoveDown) && (
        <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-card-border">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-text-dim disabled:opacity-20 active:text-accent active:bg-tag-bg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-text-dim disabled:opacity-20 active:text-accent active:bg-tag-bg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}

function Stat({ label, value, unit, highlight = false }: { label: string; value: string; unit?: string | null; highlight?: boolean }) {
  return (
    <div className="flex flex-col bg-bg rounded-[10px] px-3 py-2.5 min-w-[72px] flex-1">
      <span className="text-[0.65rem] text-text-dim uppercase tracking-wider mb-0.5">{label}</span>
      <span className={`font-mono font-bold text-[1.1rem] ${highlight ? 'text-accent' : 'text-text'}`}>
        {value}{unit && <span className="text-[0.55rem] font-semibold ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}
