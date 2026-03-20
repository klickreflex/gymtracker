import { useState } from 'react';
import type { Exercise, ExerciseSetting } from '../types';

export interface ExerciseFormData {
  name: string;
  muscleGroups: string[];
  deviceNumber: number;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number | null;
  weightUnit: 'kg' | 'bw';
  settings: ExerciseSetting[];
  optional: boolean;
  notes: string;
}

interface ExerciseFormProps {
  initial?: Exercise;
  onSave: (data: ExerciseFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function ExerciseForm({ initial, onSave, onCancel, onDelete }: ExerciseFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [muscleGroupsStr, setMuscleGroupsStr] = useState(initial?.muscleGroups.join(', ') ?? '');
  const [deviceNumber, setDeviceNumber] = useState(initial?.deviceNumber ?? 1);
  const [defaultSets, setDefaultSets] = useState(initial?.defaultSets ?? 3);
  const [defaultReps, setDefaultReps] = useState(initial?.defaultReps ?? 15);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'bw'>(initial?.weightUnit ?? 'kg');
  const [defaultWeight, setDefaultWeight] = useState(initial?.defaultWeight ?? 0);
  const [settings, setSettings] = useState<ExerciseSetting[]>(initial?.settings ?? []);
  const [optional, setOptional] = useState(initial?.optional ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      muscleGroups: muscleGroupsStr.split(',').map((s) => s.trim()).filter(Boolean),
      deviceNumber,
      defaultSets,
      defaultReps,
      defaultWeight: weightUnit === 'bw' ? null : defaultWeight,
      weightUnit,
      settings,
      optional,
      notes: notes.trim(),
    });
  }

  function addSetting() {
    setSettings([...settings, { label: '', value: '' }]);
  }

  function updateSetting(index: number, field: 'label' | 'value', val: string) {
    setSettings(settings.map((s, i) => (i === index ? { ...s, [field]: val } : s)));
  }

  function removeSetting(index: number) {
    setSettings(settings.filter((_, i) => i !== index));
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 overflow-y-auto">
      <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {initial ? 'Übung bearbeiten' : 'Neue Übung'}
          </h2>
          <button type="button" onClick={onCancel} className="text-text-dim text-sm px-3 py-1.5 rounded-lg active:bg-tag-bg">
            Abbrechen
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Klimmzug"
              required
              className="input-field"
            />
          </Field>

          {/* Muscle groups */}
          <Field label="Muskelgruppen" hint="Komma-getrennt">
            <input
              type="text"
              value={muscleGroupsStr}
              onChange={(e) => setMuscleGroupsStr(e.target.value)}
              placeholder="z.B. Rücken, Bizeps"
              className="input-field"
            />
          </Field>

          {/* Device number */}
          <Field label="Gerätenummer">
            <input
              type="number"
              inputMode="numeric"
              value={deviceNumber}
              onChange={(e) => setDeviceNumber(parseInt(e.target.value) || 1)}
              min={1}
              className="input-field w-24"
            />
          </Field>

          {/* Sets & Reps */}
          <div className="flex gap-3">
            <Field label="Sätze" className="flex-1">
              <input
                type="number"
                inputMode="numeric"
                value={defaultSets}
                onChange={(e) => setDefaultSets(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="input-field"
              />
            </Field>
            <Field label="Wiederholungen" className="flex-1">
              <input
                type="number"
                inputMode="numeric"
                value={defaultReps}
                onChange={(e) => setDefaultReps(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="input-field"
              />
            </Field>
          </div>

          {/* Weight */}
          <Field label="Gewicht">
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-card-border overflow-hidden flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setWeightUnit('kg')}
                  className={`px-5 py-2 text-sm font-semibold transition-colors ${
                    weightUnit === 'kg' ? 'bg-accent text-bg' : 'bg-card text-text-dim'
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setWeightUnit('bw')}
                  className={`px-5 py-2 text-sm font-semibold transition-colors ${
                    weightUnit === 'bw' ? 'bg-accent text-bg' : 'bg-card text-text-dim'
                  }`}
                >
                  BW
                </button>
              </div>
              {weightUnit === 'kg' && (
                <input
                  type="number"
                  inputMode="decimal"
                  step="2.5"
                  value={defaultWeight}
                  onChange={(e) => setDefaultWeight(parseFloat(e.target.value) || 0)}
                  min={0}
                  className="input-field w-28"
                />
              )}
            </div>
          </Field>

          {/* Machine settings */}
          <Field label="Geräteeinstellungen">
            <div className="space-y-2">
              {settings.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => updateSetting(i, 'label', e.target.value)}
                    placeholder="z.B. Sitz"
                    className="input-field flex-1"
                  />
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => updateSetting(i, 'value', e.target.value)}
                    placeholder="z.B. 3"
                    className="input-field w-20"
                  />
                  <button
                    type="button"
                    onClick={() => removeSetting(i)}
                    className="text-text-dim active:text-red-400 p-1"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSetting}
                className="text-xs text-accent active:opacity-70"
              >
                + Einstellung hinzufügen
              </button>
            </div>
          </Field>

          {/* Optional toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setOptional(!optional)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                optional ? 'bg-optional' : 'bg-card-border'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                optional ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`} />
            </div>
            <span className="text-sm">Optionale Übung</span>
          </label>

          {/* Notes */}
          <Field label="Notizen">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Assistiert — 42 kg Gegengewicht"
              rows={2}
              className="input-field resize-none"
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-accent text-bg font-bold text-base active:scale-[0.98] transition-transform"
          >
            {initial ? 'Speichern' : 'Übung hinzufügen'}
          </button>

          {initial && onDelete && (
            confirmDelete ? (
              <div className="rounded-xl border border-red-500/30 p-3">
                <p className="text-sm text-text mb-3 text-center">Übung wirklich löschen?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm text-text-dim border border-card-border active:bg-tag-bg"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 active:scale-[0.98]"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full py-3 rounded-xl text-sm text-red-400 border border-red-500/20 active:bg-red-500/10 transition-colors"
              >
                Übung löschen
              </button>
            )
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-xs text-text-dim uppercase tracking-wider mb-1.5">
        {label}
        {hint && <span className="normal-case tracking-normal ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
