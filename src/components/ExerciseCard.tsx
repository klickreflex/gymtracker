import type { Exercise } from '../types';

function formatWeight(weight: number | null, unit: 'kg' | 'bw'): string {
  if (unit === 'bw') return 'BW';
  if (weight === null) return '–';
  // Show decimal only if needed (e.g. 12.5 → "12,5")
  const formatted = weight % 1 === 0 ? String(weight) : weight.toFixed(1).replace('.', ',');
  return `${formatted} kg`;
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const hasSettings = exercise.settings.length > 0;
  const hasNotes = exercise.notes.length > 0;

  return (
    <div className="relative rounded-[14px] border border-card-border bg-card p-4 mb-3 overflow-hidden">
      {exercise.optional && (
        <div className="absolute top-[10px] right-[-32px] bg-optional text-bg text-[0.58rem] font-bold uppercase tracking-wider py-[3px] px-[38px] rotate-[35deg] z-10">
          Optional
        </div>
      )}

      {/* Top row: number + name + badges */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent-dim text-accent font-mono font-bold text-xs flex items-center justify-center">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[1.05rem] leading-tight">{exercise.name}</div>
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
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col bg-bg rounded-[10px] px-3 py-2.5 min-w-[72px] flex-1">
      <span className="text-[0.65rem] text-text-dim uppercase tracking-wider mb-0.5">{label}</span>
      <span className={`font-mono font-bold text-[1.1rem] ${highlight ? 'text-accent' : 'text-text'}`}>
        {value}
      </span>
    </div>
  );
}
