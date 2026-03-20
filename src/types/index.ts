export interface ExerciseSetting {
  label: string;
  value: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  deviceNumber: number;
  order: number;
  optional: boolean;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number | null;
  weightUnit: 'kg' | 'bw';
  settings: ExerciseSetting[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  plannedReps: number;
  plannedWeight: number | null;
  actualReps: number | null;
  actualWeight: number | null;
  completedAt: string;
  skipped: boolean;
}

export interface Session {
  id: string;
  startedAt: string;
  completedAt: string | null;
  sets: SessionSet[];
}
