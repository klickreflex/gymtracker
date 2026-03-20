import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { db } from '../db';

export function ProgressView() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('order').toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.filter((s) => s.completedAt !== null).toArray(), []);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Auto-select first exercise
  const activeId = selectedExerciseId ?? exercises?.[0]?.id ?? null;

  const weightData = useMemo(() => {
    if (!sessions || !activeId) return [];
    const points: { date: string; weight: number }[] = [];

    for (const session of sessions) {
      const sets = session.sets.filter((s) => s.exerciseId === activeId && !s.skipped);
      if (sets.length === 0) continue;

      // Use the max weight from this session
      const weights = sets.map((s) => s.actualWeight ?? s.plannedWeight).filter((w): w is number => w !== null);
      if (weights.length === 0) continue;

      points.push({
        date: new Date(session.startedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        weight: Math.max(...weights),
      });
    }

    // Sort by session date
    return points;
  }, [sessions, activeId]);

  const volumeData = useMemo(() => {
    if (!sessions) return [];
    const weekMap = new Map<string, number>();

    for (const session of sessions) {
      const date = new Date(session.startedAt);
      // ISO week start (Monday)
      const day = date.getDay();
      const diff = date.getDate() - ((day + 6) % 7);
      const monday = new Date(date.getFullYear(), date.getMonth(), diff);
      const weekKey = monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

      const completedSets = activeId
        ? session.sets.filter((s) => s.exerciseId === activeId && !s.skipped)
        : session.sets.filter((s) => !s.skipped);

      let volume = 0;
      for (const s of completedSets) {
        const reps = s.actualReps ?? s.plannedReps;
        const weight = s.actualWeight ?? s.plannedWeight ?? 0;
        volume += reps * weight;
      }

      weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + volume);
    }

    return Array.from(weekMap.entries()).map(([week, volume]) => ({ week, volume }));
  }, [sessions, activeId]);

  if (!exercises || !sessions) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-text-dim text-sm">Laden…</div>
      </div>
    );
  }

  const selectedExercise = exercises.find((e) => e.id === activeId);

  return (
    <div className="pt-6">
      <header className="text-center pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Fortschritt</h1>
      </header>

      {/* Exercise selector */}
      <div className="mb-6">
        <select
          value={activeId ?? ''}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          className="w-full p-3 bg-card border border-card-border rounded-xl text-text text-sm appearance-none cursor-pointer"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {sessions.filter((s) => s.completedAt).length === 0 && (
        <div className="text-center text-text-dim text-sm py-8">
          Noch keine abgeschlossenen Trainings. Starte ein Training, um Fortschritt zu sehen.
        </div>
      )}

      {/* Weight progression chart */}
      {weightData.length > 0 && (
        <div className="rounded-[14px] border border-card-border bg-card p-4 mb-4">
          <h2 className="text-sm font-semibold mb-1">
            Gewicht — {selectedExercise?.name}
          </h2>
          <p className="text-xs text-text-dim mb-4">Max. Gewicht pro Training</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8a8f9a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8a8f9a' }} width={35} unit=" kg" />
              <Tooltip
                contentStyle={{ background: '#1a1d24', border: '1px solid #2a2d35', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#8a8f9a' }}
                itemStyle={{ color: '#4ecdc4' }}
                formatter={(value) => [`${value} kg`, 'Gewicht']}
              />
              <Line type="monotone" dataKey="weight" stroke="#4ecdc4" strokeWidth={2} dot={{ fill: '#4ecdc4', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Volume per week chart */}
      {volumeData.length > 0 && (
        <div className="rounded-[14px] border border-card-border bg-card p-4 mb-4">
          <h2 className="text-sm font-semibold mb-1">
            Volumen pro Woche — {selectedExercise?.name}
          </h2>
          <p className="text-xs text-text-dim mb-4">Sätze × Wdh. × Gewicht</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8a8f9a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8a8f9a' }} width={45} />
              <Tooltip
                contentStyle={{ background: '#1a1d24', border: '1px solid #2a2d35', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#8a8f9a' }}
                itemStyle={{ color: '#4ecdc4' }}
                formatter={(value) => [`${Number(value).toLocaleString('de-DE')} kg`, 'Volumen']}
              />
              <Bar dataKey="volume" fill="#4ecdc4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
