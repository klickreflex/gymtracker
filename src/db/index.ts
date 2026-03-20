import Dexie, { type Table } from 'dexie';
import type { Exercise, Session } from '../types';
import { seedExercises } from './seed';

class GymTrackerDB extends Dexie {
  exercises!: Table<Exercise>;
  sessions!: Table<Session>;

  constructor() {
    super('gymtracker');
    this.version(1).stores({
      exercises: 'id, order',
      sessions: 'id, startedAt',
    });
  }
}

export const db = new GymTrackerDB();

// Seed the database on first launch
db.on('populate', (tx) => {
  const table = tx.table('exercises');
  for (const exercise of seedExercises) {
    table.add(exercise);
  }
});
