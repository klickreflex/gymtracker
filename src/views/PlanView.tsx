import { useState } from 'react';
import { useExercises } from '../hooks/useExercises';
import { useSession } from '../hooks/useSession';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseForm, type ExerciseFormData } from '../components/ExerciseForm';
import { SessionBar } from '../components/SessionBar';
import { SessionSummary } from '../components/SessionSummary';
import { db } from '../db';
import type { Exercise } from '../types';

export function PlanView() {
  const exercises = useExercises();
  const {
    phase,
    session,
    startSession,
    resumeSession,
    discardSession,
    logSet,
    undoSet,
    skipExercise,
    unskipExercise,
    endSession,
    cancelSession,
    returnToPlan,
  } = useSession();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  if (!exercises) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-text-dim text-sm">Laden…</div>
      </div>
    );
  }

  // Resume prompt for interrupted session
  if (phase === 'pendingResume' && session) {
    const startTime = new Date(session.startedAt);
    const setsLogged = session.sets.filter((s) => !s.skipped).length;
    return (
      <div className="pt-6">
        <header className="text-center pb-5">
          <h1 className="text-2xl font-bold tracking-tight">Trainingsplan</h1>
        </header>
        <div className="rounded-[14px] border border-accent/30 bg-card p-5">
          <h2 className="text-base font-semibold mb-2">Laufendes Training gefunden</h2>
          <p className="text-sm text-text-dim mb-1">
            Gestartet am {startTime.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} um {startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm text-text-dim mb-4">
            {setsLogged} {setsLogged === 1 ? 'Satz' : 'Sätze'} bereits erfasst
          </p>
          <div className="flex gap-2">
            <button
              onClick={discardSession}
              className="flex-1 py-3 rounded-xl text-sm text-text-dim border border-card-border active:bg-tag-bg transition-colors"
            >
              Verwerfen
            </button>
            <button
              onClick={resumeSession}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-accent text-bg active:scale-[0.98] transition-transform"
            >
              Fortsetzen
            </button>
          </div>
        </div>
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

  // --- Session helpers ---
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

  const completedExerciseCount = exercises.filter((e) => {
    const sets = getSetsForExercise(e.id);
    if (sets.length === 0) return false;
    return isExerciseCompleted(e) || isExerciseSkipped(e.id);
  }).length;

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

  // --- Plan management handlers ---
  async function handleSaveExercise(data: ExerciseFormData) {
    if (editingExercise) {
      await db.exercises.update(editingExercise.id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setEditingExercise(null);
    }
  }

  async function handleAddExercise(data: ExerciseFormData) {
    if (!exercises) return;
    const maxOrder = exercises.length > 0
      ? Math.max(...exercises.map((e) => e.order))
      : 0;
    await db.exercises.add({
      id: crypto.randomUUID(),
      ...data,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setShowAddForm(false);
  }

  async function handleDeleteExercise() {
    if (!editingExercise) return;
    await db.exercises.delete(editingExercise.id);
    setEditingExercise(null);
  }

  async function handleMoveUp(exercise: Exercise) {
    if (!exercises) return;
    const idx = exercises.findIndex((e) => e.id === exercise.id);
    if (idx <= 0) return;
    const prev = exercises[idx - 1];
    await db.transaction('rw', db.exercises, async () => {
      await db.exercises.update(exercise.id, { order: prev.order });
      await db.exercises.update(prev.id, { order: exercise.order });
    });
  }

  async function handleMoveDown(exercise: Exercise) {
    if (!exercises) return;
    const idx = exercises.findIndex((e) => e.id === exercise.id);
    if (idx >= exercises.length - 1) return;
    const next = exercises[idx + 1];
    await db.transaction('rw', db.exercises, async () => {
      await db.exercises.update(exercise.id, { order: next.order });
      await db.exercises.update(next.id, { order: exercise.order });
    });
  }

  // --- Render form overlays ---
  if (editingExercise) {
    return (
      <ExerciseForm
        initial={editingExercise}
        onSave={handleSaveExercise}
        onCancel={() => setEditingExercise(null)}
        onDelete={handleDeleteExercise}
      />
    );
  }

  if (showAddForm) {
    return (
      <ExerciseForm
        onSave={handleAddExercise}
        onCancel={() => setShowAddForm(false)}
      />
    );
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

      {/* Start training / reorder toggle (plan mode only) */}
      {!isActive && !reorderMode && (
        <div className="flex gap-2 mb-5">
          <button
            onClick={startSession}
            className="flex-1 py-4 rounded-xl bg-accent text-bg font-bold text-base tracking-tight active:scale-[0.98] transition-transform"
          >
            Training starten
          </button>
          <button
            onClick={() => setReorderMode(true)}
            className="px-4 py-4 rounded-xl border border-card-border text-text-dim active:text-accent active:border-accent transition-colors"
            title="Sortieren"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 4 12 0 16 4" /><line x1="12" y1="1" x2="12" y2="23" /><polyline points="16 20 12 24 8 20" />
            </svg>
          </button>
        </div>
      )}
      {!isActive && reorderMode && (
        <button
          onClick={() => setReorderMode(false)}
          className="w-full mb-5 py-4 rounded-xl bg-green text-bg font-bold text-base tracking-tight active:scale-[0.98] transition-transform"
        >
          Fertig
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
              totalCount={exercises.length}
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
              onEdit={reorderMode ? undefined : () => setEditingExercise(exercise)}
              onMoveUp={reorderMode ? () => handleMoveUp(exercise) : undefined}
              onMoveDown={reorderMode ? () => handleMoveDown(exercise) : undefined}
            />
          );
        })}
      </div>

      {/* Add exercise button (plan mode only) */}
      {!isActive && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mt-1 mb-6 py-3 rounded-xl border border-dashed border-card-border text-sm text-text-dim active:border-accent active:text-accent transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Übung hinzufügen
        </button>
      )}

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
