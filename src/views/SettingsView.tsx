import { useRef, useState } from 'react';
import { exportData, importData } from '../db/backup';

export function SettingsView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmImport, setConfirmImport] = useState<File | null>(null);

  async function handleExport() {
    try {
      await exportData();
      setStatus({ type: 'success', message: 'Backup heruntergeladen.' });
    } catch {
      setStatus({ type: 'error', message: 'Export fehlgeschlagen.' });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setConfirmImport(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  }

  async function handleImportConfirm() {
    if (!confirmImport) return;
    try {
      await importData(confirmImport);
      setStatus({ type: 'success', message: 'Daten erfolgreich importiert.' });
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Import fehlgeschlagen.' });
    }
    setConfirmImport(null);
  }

  return (
    <div className="pt-6">
      <header className="text-center pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
      </header>

      {/* Status message */}
      {status && (
        <div className={`rounded-xl p-3 mb-4 text-sm text-center ${
          status.type === 'success'
            ? 'bg-green/15 text-green border border-green/30'
            : 'bg-red-500/15 text-red-400 border border-red-500/30'
        }`}>
          {status.message}
        </div>
      )}

      {/* Import confirmation dialog */}
      {confirmImport && (
        <div className="rounded-xl border border-optional/40 bg-card p-4 mb-4">
          <p className="text-sm text-text mb-3">
            Import überschreibt alle vorhandenen Daten. Fortfahren?
          </p>
          <p className="text-xs text-text-dim mb-3">
            Datei: {confirmImport.name}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmImport(null)}
              className="flex-1 py-2.5 rounded-lg text-sm text-text-dim border border-card-border active:bg-tag-bg"
            >
              Abbrechen
            </button>
            <button
              onClick={handleImportConfirm}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-accent text-bg active:scale-[0.98] transition-transform"
            >
              Importieren
            </button>
          </div>
        </div>
      )}

      {/* Export / Import */}
      <div className="rounded-[14px] border border-card-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold mb-1">Daten</h2>

        <button
          onClick={handleExport}
          className="w-full py-3 rounded-xl bg-bg border border-card-border text-sm font-semibold text-text active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <DownloadIcon />
          Daten exportieren
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 rounded-xl bg-bg border border-card-border text-sm font-semibold text-text active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <UploadIcon />
          Daten importieren
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
