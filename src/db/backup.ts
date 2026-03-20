import { db } from './index';
import type { Exercise, Session } from '../types';

interface BackupData {
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  sessions: Session[];
}

export async function exportData(): Promise<void> {
  const exercises = await db.exercises.toArray();
  const sessions = await db.sessions.toArray();

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    sessions,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `gymtracker-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
  const text = await file.text();
  let data: BackupData;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Ungültiges JSON-Format.');
  }

  if (data.version !== 1) {
    throw new Error(`Unbekannte Version: ${data.version}`);
  }
  if (!Array.isArray(data.exercises) || !Array.isArray(data.sessions)) {
    throw new Error('Ungültige Datenstruktur: exercises und sessions müssen Arrays sein.');
  }

  // Validate exercises have required fields
  for (const ex of data.exercises) {
    if (!ex.id || !ex.name || typeof ex.order !== 'number') {
      throw new Error(`Ungültige Übung: ${JSON.stringify(ex).slice(0, 100)}`);
    }
  }

  // Clear and replace all data
  await db.transaction('rw', db.exercises, db.sessions, async () => {
    await db.exercises.clear();
    await db.sessions.clear();
    await db.exercises.bulkAdd(data.exercises);
    await db.sessions.bulkAdd(data.sessions);
  });
}
