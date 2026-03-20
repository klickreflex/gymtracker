import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Exercise, Session } from '../types';

export function HistoryView() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const completedSessions = useMemo(
    () => (sessions ?? []).filter((s) => s.completedAt !== null),
    [sessions],
  );

  // Map date strings (YYYY-MM-DD) to sessions
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of completedSessions) {
      const date = s.startedAt.slice(0, 10);
      const existing = map.get(date) ?? [];
      existing.push(s);
      map.set(date, existing);
    }
    return map;
  }, [completedSessions]);

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const e of exercises ?? []) {
      map.set(e.id, e);
    }
    return map;
  }, [exercises]);

  const handleDeleteSession = useCallback(async (id: string) => {
    await db.sessions.delete(id);
  }, []);

  if (!sessions || !exercises) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-text-dim text-sm">Laden…</div>
      </div>
    );
  }

  const { year, month } = currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const monthName = new Date(year, month).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  function prevMonth() {
    setCurrentMonth((c) => {
      const d = new Date(c.year, c.month - 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth((c) => {
      const d = new Date(c.year, c.month + 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  const selectedSessions = selectedDate ? (sessionsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="pt-6">
      <header className="text-center pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Verlauf</h1>
      </header>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-10 h-10 rounded-lg flex items-center justify-center text-text-dim active:text-accent active:bg-tag-bg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="text-sm font-semibold capitalize">{monthName}</span>
        <button onClick={nextMonth} className="w-10 h-10 rounded-lg flex items-center justify-center text-text-dim active:text-accent active:bg-tag-bg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
          <div key={d} className="text-center text-[0.6rem] text-text-dim uppercase tracking-wider py-1">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasSession = sessionsByDate.has(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-mono transition-colors relative ${
                isSelected
                  ? 'bg-accent text-bg font-bold'
                  : hasSession
                    ? 'text-text active:bg-tag-bg'
                    : 'text-text-dim/40'
              }`}
            >
              {day}
              {hasSession && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Session detail for selected date */}
      {selectedDate && selectedSessions.length > 0 && (
        <div className="space-y-3">
          {selectedSessions.map((s) => (
            <SessionDetail key={s.id} session={s} exerciseMap={exerciseMap} onDelete={() => handleDeleteSession(s.id)} />
          ))}
        </div>
      )}

      {selectedDate && selectedSessions.length === 0 && (
        <div className="text-center text-text-dim text-sm py-4">
          Kein Training an diesem Tag.
        </div>
      )}

      {/* Session list */}
      {!selectedDate && (
        <div>
          <h2 className="text-sm font-semibold text-text-dim mb-3">Letzte Trainings</h2>
          {completedSessions.length === 0 && (
            <div className="text-center text-text-dim text-sm py-8">
              Noch keine abgeschlossenen Trainings.
            </div>
          )}
          {completedSessions.slice(0, 10).map((s) => (
            <SessionListItem
              key={s.id}
              session={s}
              exerciseMap={exerciseMap}
              onSelect={() => setSelectedDate(s.startedAt.slice(0, 10))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionDetail({ session, exerciseMap, onDelete }: { session: Session; exerciseMap: Map<string, Exercise>; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const start = new Date(session.startedAt);
  const end = session.completedAt ? new Date(session.completedAt) : null;
  const durationMin = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;
  const completedSets = session.sets.filter((s) => !s.skipped);
  const skippedSets = session.sets.filter((s) => s.skipped);

  // Group sets by exercise
  const exerciseGroups = new Map<string, typeof session.sets>();
  for (const set of session.sets) {
    const existing = exerciseGroups.get(set.exerciseId) ?? [];
    existing.push(set);
    exerciseGroups.set(set.exerciseId, existing);
  }

  return (
    <div className="rounded-[14px] border border-card-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">
          {start.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
          {' · '}
          {start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {durationMin !== null && (
          <span className="text-xs text-text-dim font-mono">{durationMin} Min.</span>
        )}
      </div>

      <div className="text-xs text-text-dim mb-3">
        {completedSets.length} Sätze · {skippedSets.length > 0 ? `${new Set(skippedSets.map((s) => s.exerciseId)).size} übersprungen` : 'keine übersprungen'}
      </div>

      {Array.from(exerciseGroups.entries()).map(([exId, sets]) => {
        const ex = exerciseMap.get(exId);
        const allSkipped = sets.every((s) => s.skipped);
        const completed = sets.filter((s) => !s.skipped);

        return (
          <div key={exId} className={`py-2 border-t border-card-border ${allSkipped ? 'opacity-40 line-through' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">{ex?.name ?? 'Unbekannt'}</span>
              <span className="text-xs text-text-dim font-mono">
                {allSkipped
                  ? 'übersprungen'
                  : completed.map((s) => {
                      const reps = s.actualReps ?? s.plannedReps;
                      const weight = s.actualWeight ?? s.plannedWeight;
                      return weight !== null ? `${reps}×${weight}kg` : `${reps}×BW`;
                    }).join(', ')
                }
              </span>
            </div>
          </div>
        );
      })}

      {/* Delete session */}
      {confirmDelete ? (
        <div className="mt-3 pt-3 border-t border-card-border">
          <p className="text-xs text-text-dim mb-2 text-center">Training wirklich löschen?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2 rounded-lg text-xs text-text-dim border border-card-border active:bg-tag-bg"
            >
              Abbrechen
            </button>
            <button
              onClick={onDelete}
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 active:scale-[0.98]"
            >
              Löschen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="mt-3 pt-3 border-t border-card-border w-full text-xs text-text-dim active:text-red-400 transition-colors text-left flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Training löschen
        </button>
      )}
    </div>
  );
}

function SessionListItem({
  session,
  exerciseMap,
  onSelect,
}: {
  session: Session;
  exerciseMap: Map<string, Exercise>;
  onSelect: () => void;
}) {
  const start = new Date(session.startedAt);
  const end = session.completedAt ? new Date(session.completedAt) : null;
  const durationMin = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;
  const completedSets = session.sets.filter((s) => !s.skipped);
  const exerciseCount = new Set(completedSets.map((s) => s.exerciseId)).size;

  // Top exercises
  const topExercises = Array.from(new Set(completedSets.map((s) => s.exerciseId)))
    .slice(0, 3)
    .map((id) => exerciseMap.get(id)?.name ?? '?')
    .join(', ');

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-[14px] border border-card-border bg-card p-4 mb-2 active:bg-tag-bg transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold">
          {start.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
        <span className="text-xs text-text-dim font-mono">{durationMin} Min.</span>
      </div>
      <div className="text-xs text-text-dim">
        {exerciseCount} Übungen · {completedSets.length} Sätze · {topExercises}
      </div>
    </button>
  );
}
