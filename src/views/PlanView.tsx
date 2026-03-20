import { useState } from 'react';
import { useExercises } from '../hooks/useExercises';
import { useSession } from '../hooks/useSession';
import { ExerciseCard } from '../components/ExerciseCard';
import { SessionBar } from '../components/SessionBar';
import { SessionSummary } from '../components/SessionSummary';

export function PlanView() {
  const exercises = useExercises();
  const {
    phase,
    session,
    startSession,
    logSet,
    undoSet,
    skipExercise,
    unskipExercise,
    endSession,
    cancelSession,
    returnToPlan,
  } = useSession();

  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!exercises) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-text-dim text-sm">Laden…</div>
      </div>
    );
  }

  // Summary phase
  if (phase === 'summary' && session) {
    return (
      <SessionSummary
        session={session}
        exercises={exercises}
        onReturn={returnToPlan}
      />
    );
  }

  const isActive = phase === 'active' && session;

  // Helpers for session state per exercise
  function getSetsForExercise(exerciseId: string) {
    return session?.sets.filter((s) => s.exerciseId === exerciseId) ?? [];
  }

  function isExerciseSkipped(exerciseId: string) {
    const sets = getSetsForExercise(exerciseId);
    return sets.length > 0 && sets.every((s) => s.skipped);
  }

  function isExerciseCompleted(exercise: { id: string; defaultSets: number }) {
    const sets = getSetsForExercise(exercise.id);
    const completedSets = sets.filter((s) => !s.skipped);
    return completedSets.length >= exercise.defaultSets;
  }

  // Count completed exercises (all sets done OR skipped)
  const completedExerciseCount = exercises.filter((e) => {
    const sets = getSetsForExercise(e.id);
    if (sets.length === 0) return false;
    return isExerciseCompleted(e) || isExerciseSkipped(e.id);
  }).length;

  // All required exercises done?
  const allRequiredDone = exercises
    .filter((e) => !e.optional)
    .every((e) => isExerciseCompleted(e) || isExerciseSkipped(e.id));

  function handleCancel() {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    cancelSession();
    setConfirmCancel(false);
  }

  return (
    <div>
      {/* Session bar */}
      {isActive && (
        <SessionBar
          startedAt={session.startedAt}
          completedCount={completedExerciseCount}
          totalCount={exercises.length}
          onCancel={handleCancel}
        />
      )}

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className="my-3 p-3 rounded-xl bg-bg border border-optional/40 text-center">
          <p className="text-sm text-text mb-3">Training wirklich abbrechen? Alle Daten gehen verloren.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmCancel(false)}
              className="flex-1 py-2.5 rounded-lg text-sm text-text-dim border border-card-border active:bg-tag-bg"
            >
              Weiter trainieren
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 active:scale-[0.98]"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      {!isActive && (
        <header className="text-center pt-6 pb-5">
          <h1 className="text-2xl font-bold tracking-tight">Trainingsplan</h1>
          <p className="text-text-dim text-sm mt-1">
            {exercises.length} Übungen · {exercises.filter((e) => !e.optional).length} Pflicht
          </p>
        </header>
      )}

      {/* Start training button (plan mode only) */}
      {!isActive && (
        <button
          onClick={startSession}
          className="w-full mb-5 py-4 rounded-xl bg-accent text-bg font-bold text-base tracking-tight active:scale-[0.98] transition-transform"
        >
          Training starten
        </button>
      )}

      {/* Exercise cards */}
      <div className={isActive ? 'mt-3' : ''}>
        {exercises.map((exercise, i) => {
          const loggedSets = getSetsForExercise(exercise.id);
          const skipped = isExerciseSkipped(exercise.id);
          const completed = isExerciseCompleted(exercise);

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={i}
              sessionActive={!!isActive}
              loggedSets={loggedSets}
              isSkipped={skipped}
              isCompleted={completed}
              onLogSet={(setNumber, actualReps, actualWeight) =>
                logSet(exercise, setNumber, actualReps, actualWeight)
              }
              onUndoSet={(setNumber) => undoSet(exercise.id, setNumber)}
              onSkip={() => skipExercise(exercise)}
              onUnskip={() => unskipExercise(exercise.id)}
            />
          );
        })}
      </div>

      {/* End session button */}
      {isActive && (
        <button
          onClick={endSession}
          className={`w-full mt-2 mb-6 py-4 rounded-xl font-bold text-base tracking-tight active:scale-[0.98] transition-all ${
            allRequiredDone
              ? 'bg-green text-bg'
              : 'bg-card border border-card-border text-text-dim'
          }`}
        >
          {allRequiredDone ? 'Training beenden' : 'Training vorzeitig beenden'}
        </button>
      )}
    </div>
  );
}
