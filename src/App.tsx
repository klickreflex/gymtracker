import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { PlanView } from './views/PlanView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-[480px] mx-auto px-4 pb-24 min-h-screen">
        <Routes>
          <Route path="/" element={<PlanView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}
