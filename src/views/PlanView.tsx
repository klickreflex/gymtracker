import { useExercises } from '../hooks/useExercises';
import { ExerciseCard } from '../components/ExerciseCard';

export function PlanView() {
  const exercises = useExercises();

  if (!exercises) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-text-dim text-sm">Laden…</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="text-center pt-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Trainingsplan</h1>
        <p className="text-text-dim text-sm mt-1">
          {exercises.length} Übungen · {exercises.filter((e) => !e.optional).length} Pflicht
        </p>
      </header>

      {/* Start training button */}
      <button
        className="w-full mb-5 py-4 rounded-xl bg-accent text-bg font-bold text-base tracking-tight active:scale-[0.98] transition-transform"
      >
        Training starten
      </button>

      {/* Exercise cards */}
      <div>
        {exercises.map((exercise, i) => (
          <ExerciseCard key={exercise.id} exercise={exercise} index={i} />
        ))}
      </div>
    </div>
  );
}
