import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { audio } from '@/audio/engine';
import { CRTOverlay } from '@/components/ui';
import { Landing } from '@/pages/Landing';
import { Intro } from '@/pages/Intro';
import { MainMenu } from '@/pages/MainMenu';
import { TrainerRegister } from '@/pages/TrainerRegister';
import { TrainerProfile } from '@/pages/TrainerProfile';
import { TrainerEdit } from '@/pages/TrainerEdit';
import { Tutorial } from '@/pages/Tutorial';
import { Settings } from '@/pages/Settings';
import { About } from '@/pages/About';
import { Binder } from '@/pages/Binder';
import { Guardians } from '@/pages/Guardians';
import { DiskEntry } from '@/pages/DiskEntry';
import { QrCodes } from '@/pages/QrCodes';
import { QrScanner } from '@/pages/QrScanner';
import { Overworld } from '@/pages/Overworld';
import { Battle } from '@/pages/Battle';
import { FinalBossUnlock } from '@/pages/FinalBossUnlock';
import { Credits } from '@/pages/Credits';
import { PlayerLobby } from '@/pages/PlayerLobby';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const trainer = useGameStore((s) => s.trainer);
  if (!trainer) return <Navigate to="/game" replace />;
  return <>{children}</>;
}

export default function App() {
  const audioEnabled = useGameStore((s) => s.settings.audioEnabled);
  const crt = useGameStore((s) => s.settings.crtEffect);

  useEffect(() => {
    audio.syncVolumes();
  }, [audioEnabled]);

  return (
    <BrowserRouter>
      {crt && <CRTOverlay />}
      <div className="min-h-screen w-full flex justify-center bg-ink-900">
        <div className="w-full max-w-md min-h-screen relative bg-ink-800 overflow-hidden">
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path="/home" element={<Landing />} />
            <Route path="/game" element={<MainMenu />} />
            <Route path="/trainer/new" element={<TrainerRegister />} />
            <Route
              path="/trainer/profile"
              element={<ProtectedRoute><TrainerProfile /></ProtectedRoute>}
            />
            <Route
              path="/trainer/edit"
              element={<ProtectedRoute><TrainerEdit /></ProtectedRoute>}
            />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/binder"
              element={<ProtectedRoute><Binder /></ProtectedRoute>}
            />
            <Route
              path="/guardians"
              element={<ProtectedRoute><Guardians /></ProtectedRoute>}
            />
            <Route path="/qr-codes" element={<QrCodes />} />
            <Route path="/disk/:code" element={<DiskEntry />} />
            <Route path="/scan" element={<QrScanner />} />
            <Route
              path="/world"
              element={<ProtectedRoute><Overworld /></ProtectedRoute>}
            />
            <Route
              path="/battle"
              element={<ProtectedRoute><Battle /></ProtectedRoute>}
            />
            <Route path="/final-unlock" element={<FinalBossUnlock />} />
            <Route path="/credits" element={<Credits />} />
            <Route
              path="/lobby"
              element={<ProtectedRoute><PlayerLobby /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
