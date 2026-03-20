import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function useExercises() {
  return useLiveQuery(() => db.exercises.orderBy('order').toArray(), []);
}
