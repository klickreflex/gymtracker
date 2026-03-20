import { useState } from 'react';
import type { Exercise, SessionSet } from '../types';
import { DeviationEditor } from './DeviationEditor';

interface SetTrackerProps {
  exercise: Exercise;
  loggedSets: SessionSet[];
  onLogSet: (setNumber: number, actualReps?: number, actualWeight?: number) => void;
  onUndoSet: (setNumber: number) => void;
}

export function SetTracker({ exercise, loggedSets, onLogSet, onUndoSet }: SetTrackerProps) {
  const [editingSet, setEditingSet] = useState<number | null>(null);

  function handleTap(setNumber: number) {
    const existing = loggedSets.find((s) => s.setNumber === setNumber && !s.skipped);
    if (existing) {
      // Undo completed set
      onUndoSet(setNumber);
      return;
    }
    // Quick confirm with planned values
    onLogSet(setNumber);
    triggerHaptic();
  }

  function handleLongPress(setNumber: number) {
    const existing = loggedSets.find((s) => s.setNumber === setNumber && !s.skipped);
    if (existing) return; // Can't edit already completed set
    setEditingSet(setNumber);
  }

  function handleDeviationConfirm(setNumber: number, reps: number, weight: number | null) {
    onLogSet(setNumber, reps, weight ?? undefined);
    setEditingSet(null);
    triggerHaptic();
  }

  const completedCount = loggedSets.filter((s) => !s.skipped).length;
  const allDone = completedCount >= exercise.defaultSets;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <span className="text-[0.65rem] text-text-dim uppercase tracking-wider">Sätze</span>
        <div className="flex gap-2">
          {Array.from({ length: exercise.defaultSets }, (_, i) => {
            const setNumber = i + 1;
            const logged = loggedSets.find((s) => s.setNumber === setNumber && !s.skipped);
            const hasDeviation = logged && (logged.actualReps !== null || logged.actualWeight !== null);

            return (
              <SetCircle
                key={setNumber}
                completed={!!logged}
                hasDeviation={!!hasDeviation}
                onTap={() => handleTap(setNumber)}
                onLongPress={() => handleLongPress(setNumber)}
              />
            );
          })}
        </div>
        {allDone && (
          <div className="ml-auto w-11 h-11 rounded-full bg-green flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {editingSet !== null && (
        <DeviationEditor
          exercise={exercise}
          setNumber={editingSet}
          onConfirm={(reps, weight) => handleDeviationConfirm(editingSet, reps, weight)}
          onCancel={() => setEditingSet(null)}
        />
      )}
    </div>
  );
}

function SetCircle({
  completed,
  hasDeviation,
  onTap,
  onLongPress,
}: {
  completed: boolean;
  hasDeviation: boolean;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handlePointerDown() {
    const timer = setTimeout(() => {
      onLongPress();
      setPressTimer(null);
    }, 500);
    setPressTimer(timer);
  }

  function handlePointerUp() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      onTap();
    }
  }

  function handlePointerLeave() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-200 select-none ${
        completed
          ? hasDeviation
            ? 'bg-optional/20 border-optional text-optional'
            : 'bg-accent/20 border-accent text-accent'
          : 'border-card-border text-text-dim active:scale-90'
      }`}
    >
      {completed ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span className="w-2.5 h-2.5 rounded-full bg-card-border" />
      )}
    </button>
  );
}

function triggerHaptic() {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}
