import type { Session, Exercise } from '../types';

interface SessionSummaryProps {
  session: Session;
  exercises: Exercise[];
  onReturn: () => void;
}

export function SessionSummary({ session, exercises, onReturn }: SessionSummaryProps) {
  const start = new Date(session.startedAt).getTime();
  const end = new Date(session.completedAt!).getTime();
  const durationMin = Math.round((end - start) / 60000);

  const completedSets = session.sets.filter((s) => !s.skipped);
  const skippedSets = session.sets.filter((s) => s.skipped);
  const deviations = completedSets.filter(
    (s) => s.actualReps !== null || s.actualWeight !== null,
  );

  // Unique exercises that had at least one completed set
  const exercisesCompleted = new Set(completedSets.map((s) => s.exerciseId)).size;

  // Exercises that were fully skipped
  const skippedExerciseIds = new Set(skippedSets.map((s) => s.exerciseId));
  const skippedExercises = exercises.filter((e) => skippedExerciseIds.has(e.id));

  return (
    <div className="pt-6">
      <header className="text-center pb-6">
        <div className="text-4xl mb-3">💪</div>
        <h1 className="text-2xl font-bold tracking-tight">Training abgeschlossen</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard label="Dauer" value={`${durationMin} Min.`} />
        <SummaryCard label="Übungen" value={String(exercisesCompleted)} />
        <SummaryCard label="Sätze" value={String(completedSets.length)} />
        <SummaryCard
          label="Abweichungen"
          value={String(deviations.length)}
          highlight={deviations.length > 0}
        />
      </div>

      {/* Deviations detail */}
      {deviations.length > 0 && (
        <div className="rounded-[14px] border border-card-border bg-card p-4 mb-3">
          <h2 className="text-sm font-semibold mb-2">Abweichungen vom Plan</h2>
          {deviations.map((s) => {
            const ex = exercises.find((e) => e.id === s.exerciseId);
            return (
              <div key={s.id} className="text-xs text-text-dim py-1 border-b border-card-border last:border-0">
                <span className="text-text">{ex?.name}</span> Satz {s.setNumber}:{' '}
                {s.actualReps !== null && `${s.actualReps} Wdh. `}
                {s.actualWeight !== null && `${s.actualWeight} kg`}
              </div>
            );
          })}
        </div>
      )}

      {/* Skipped exercises */}
      {skippedExercises.length > 0 && (
        <div className="rounded-[14px] border border-card-border bg-card p-4 mb-3">
          <h2 className="text-sm font-semibold mb-2">Übersprungen</h2>
          {skippedExercises.map((e) => (
            <div key={e.id} className="text-xs text-text-dim py-1 line-through">
              {e.name}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onReturn}
        className="w-full mt-4 py-4 rounded-xl bg-accent text-bg font-bold text-base tracking-tight active:scale-[0.98] transition-transform"
      >
        Zurück zum Plan
      </button>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-card-border bg-card p-4 text-center">
      <div className="text-[0.65rem] text-text-dim uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-mono font-bold text-2xl ${highlight ? 'text-optional' : 'text-text'}`}>
        {value}
      </div>
    </div>
  );
}
