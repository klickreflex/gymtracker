import { useState } from 'react';
import type { Exercise } from '../types';

function parseDecimal(value: string): number {
  // Accept both comma and dot as decimal separator
  return parseFloat(value.replace(',', '.')) || 0;
}

function formatDecimal(value: number): string {
  // Display with comma for German locale
  return value % 1 === 0 ? String(value) : value.toFixed(1).replace('.', ',');
}

interface DeviationEditorProps {
  exercise: Exercise;
  setNumber: number;
  onConfirm: (reps: number, weight: number | null) => void;
  onCancel: () => void;
}

export function DeviationEditor({ exercise, setNumber, onConfirm, onCancel }: DeviationEditorProps) {
  const [reps, setReps] = useState(exercise.defaultReps);
  const [weightStr, setWeightStr] = useState(
    exercise.defaultWeight !== null ? formatDecimal(exercise.defaultWeight) : '0'
  );
  const isBW = exercise.weightUnit === 'bw';
  const weightNum = parseDecimal(weightStr);

  return (
    <div className="mt-3 p-3 rounded-xl bg-bg border border-card-border">
      <div className="text-xs text-text-dim mb-3">
        Satz {setNumber} — Abweichung eingeben
      </div>

      {/* Reps stepper */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-dim">Wdh.</span>
        <div className="flex items-center gap-2">
          <StepperButton label="−" onClick={() => setReps((r) => Math.max(1, r - 1))} />
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-14 text-center font-mono font-bold text-lg bg-card border border-card-border rounded-lg py-1.5 text-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <StepperButton label="+" onClick={() => setReps((r) => r + 1)} />
        </div>
      </div>

      {/* Weight stepper (only for non-bodyweight exercises) */}
      {!isBW && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-dim">Gewicht</span>
          <div className="flex items-center gap-2">
            <StepperButton label="−" onClick={() => setWeightStr(formatDecimal(Math.max(0, weightNum - 1)))} />
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="decimal"
                value={weightStr}
                onChange={(e) => setWeightStr(e.target.value)}
                className="w-16 text-center font-mono font-bold text-lg bg-card border border-card-border rounded-lg py-1.5 text-accent"
              />
              <span className="text-sm text-text-dim">kg</span>
            </div>
            <StepperButton label="+" onClick={() => setWeightStr(formatDecimal(weightNum + 1))} />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-sm text-text-dim border border-card-border active:bg-tag-bg transition-colors"
        >
          Abbrechen
        </button>
        <button
          onClick={() => onConfirm(reps, isBW ? null : weightNum)}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-accent text-bg active:scale-[0.98] transition-transform"
        >
          Speichern
        </button>
      </div>
    </div>
  );
}

function StepperButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-lg bg-card border border-card-border text-text font-bold text-lg flex items-center justify-center active:scale-90 transition-transform select-none"
    >
      {label}
    </button>
  );
}
