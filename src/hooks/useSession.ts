import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Exercise, Session, SessionSet } from '../types';

export type SessionPhase = 'idle' | 'pendingResume' | 'active' | 'summary';

export function useSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Detect interrupted session on mount
  useEffect(() => {
    db.sessions
      .filter((s) => s.completedAt === null)
      .first()
      .then((s) => {
        if (s) {
          setSessionId(s.id);
          setPhase('pendingResume');
        }
      });
  }, []);

  const session = useLiveQuery(
    () => (sessionId ? db.sessions.get(sessionId) : undefined),
    [sessionId],
  );

  const resumeSession = useCallback(() => {
    setPhase('active');
  }, []);

  const discardSession = useCallback(async () => {
    if (!sessionId) return;
    await db.sessions.delete(sessionId);
    setSessionId(null);
    setPhase('idle');
  }, [sessionId]);

  const startSession = useCallback(async () => {
    const id = crypto.randomUUID();
    const newSession: Session = {
      id,
      startedAt: new Date().toISOString(),
      completedAt: null,
      sets: [],
    };
    await db.sessions.add(newSession);
    setSessionId(id);
    setPhase('active');
  }, []);

  const logSet = useCallback(
    async (exercise: Exercise, setNumber: number, actualReps?: number, actualWeight?: number) => {
      if (!sessionId) return;
      const newSet: SessionSet = {
        id: crypto.randomUUID(),
        exerciseId: exercise.id,
        setNumber,
        plannedReps: exercise.defaultReps,
        plannedWeight: exercise.defaultWeight,
        actualReps: actualReps ?? null,
        actualWeight: actualWeight ?? null,
        completedAt: new Date().toISOString(),
        skipped: false,
      };
      const current = await db.sessions.get(sessionId);
      if (current) {
        await db.sessions.update(sessionId, {
          sets: [...current.sets, newSet],
        });
      }
    },
    [sessionId],
  );

  const undoSet = useCallback(
    async (exerciseId: string, setNumber: number) => {
      if (!sessionId) return;
      const current = await db.sessions.get(sessionId);
      if (current) {
        await db.sessions.update(sessionId, {
          sets: current.sets.filter(
            (s) => !(s.exerciseId === exerciseId && s.setNumber === setNumber),
          ),
        });
      }
    },
    [sessionId],
  );

  const skipExercise = useCallback(
    async (exercise: Exercise) => {
      if (!sessionId) return;
      const current = await db.sessions.get(sessionId);
      if (!current) return;
      const skippedSets: SessionSet[] = [];
      for (let i = 1; i <= exercise.defaultSets; i++) {
        const alreadyLogged = current.sets.some(
          (s) => s.exerciseId === exercise.id && s.setNumber === i,
        );
        if (!alreadyLogged) {
          skippedSets.push({
            id: crypto.randomUUID(),
            exerciseId: exercise.id,
            setNumber: i,
            plannedReps: exercise.defaultReps,
            plannedWeight: exercise.defaultWeight,
            actualReps: null,
            actualWeight: null,
            completedAt: new Date().toISOString(),
            skipped: true,
          });
        }
      }
      if (skippedSets.length > 0) {
        await db.sessions.update(sessionId, {
          sets: [...current.sets, ...skippedSets],
        });
      }
    },
    [sessionId],
  );

  const unskipExercise = useCallback(
    async (exerciseId: string) => {
      if (!sessionId) return;
      const current = await db.sessions.get(sessionId);
      if (current) {
        await db.sessions.update(sessionId, {
          sets: current.sets.filter(
            (s) => !(s.exerciseId === exerciseId && s.skipped),
          ),
        });
      }
    },
    [sessionId],
  );

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    await db.sessions.update(sessionId, {
      completedAt: new Date().toISOString(),
    });
    setPhase('summary');
  }, [sessionId]);

  const cancelSession = useCallback(async () => {
    if (!sessionId) return;
    await db.sessions.delete(sessionId);
    setSessionId(null);
    setPhase('idle');
  }, [sessionId]);

  const returnToPlan = useCallback(() => {
    setSessionId(null);
    setPhase('idle');
  }, []);

  return {
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
  };
}
