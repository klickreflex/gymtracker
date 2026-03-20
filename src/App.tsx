import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { PlanView } from './views/PlanView';
import { HistoryView } from './views/HistoryView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';
import { useServiceWorker } from './hooks/useServiceWorker';

export default function App() {
  const { updateAvailable, applyUpdate } = useServiceWorker();

  return (
    <BrowserRouter>
      <div className="max-w-[480px] mx-auto px-4 pb-24 min-h-screen">
        {updateAvailable && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-bg text-center py-3 px-4 text-sm font-semibold flex items-center justify-center gap-3">
            <span>Neue Version verfügbar</span>
            <button
              onClick={applyUpdate}
              className="bg-bg text-accent px-3 py-1 rounded-lg text-xs font-bold active:scale-95 transition-transform"
            >
              Aktualisieren
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<PlanView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/progress" element={<ProgressView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}
