import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, ScanLine, Disc, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useGameStore, capturedCount, BOSS_UNLOCK_THRESHOLDS } from '@/store/gameStore';
import { useSfx } from '@/audio/engine';
import { audio } from '@/audio/engine';
import { NORMAL_SPECIES, GUARDIANS, CREATOR, getSpecies } from '@/data/species';
import { isGuardianUnlocked, isCreatorUnlocked } from '@/store/gameStore';
import type { BattleConfig } from '@/game/battle';
import { PixelButton, PixelText, BodyText, PixelPanel, ElementTag, AnimatedSprite } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type ScanMode = 'idle' | 'scanning' | 'success' | 'error' | 'manual';

export function QrScanner() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader';
  const captureMonster = useGameStore((s) => s.captureMonster);
  const collection = useGameStore((s) => s.collection);
  const captured = useGameStore((s) => capturedCount(s));
  const starterDiskClaimed = useGameStore((s) => s.starterDiskClaimed);
  const claimStarterDisk = useGameStore((s) => s.claimStarterDisk);
  const hasTrainer = useGameStore((s) => !!s.trainer);
  const battlesWon = useGameStore((s) => s.battlesWon);
  const bossesDefeated = useGameStore((s) => s.bossesDefeated);
  const [mode, setMode] = useState<ScanMode>('idle');
  const [scannedSpecies, setScannedSpecies] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    audio.playMusic('menu');
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // already stopped
      }
      scannerRef.current = null;
    }
  };

  const handleScanResult = (decodedText: string) => {
    stopScanner();
    sfx.capture();
    processScan(decodedText);
  };

  const processScan = (code: string) => {
    // Normalize: accept "RD-01", "RD-03", etc.
    const normalized = code.trim().toUpperCase();
    const match = normalized.match(/RD-?\d+/);
    if (!match) {
      setError('Invalid disk code. Expected format: RD-01 through RD-20.');
      setMode('error');
      sfx.error();
      return;
    }

    const diskId = match[0];
    // Pad single digits: RD-1 -> RD-01
    const padded = diskId.replace(/RD-?(\d+)/, (_, n) => `RD-${n.padStart(2, '0')}`);

    const species = getSpecies(padded);
    if (!species) {
      setError(`Unknown disk code: ${padded}.`);
      setMode('error');
      sfx.error();
      return;
    }

    // Boss disk — trigger guardian battle if unlocked
    if (species.rarity === 'Boss') {
      const guardian = GUARDIANS.find((g) => g.speciesId === padded);
      if (!guardian) {
        setError(`Disk ${padded} is not a valid guardian disk.`);
        setMode('error');
        sfx.error();
        return;
      }
      const gi = GUARDIANS.indexOf(guardian);
      if (!isGuardianUnlocked(useGameStore.getState(), gi)) {
        setError(`${guardian.trainerName} is sealed. Win ${BOSS_UNLOCK_THRESHOLDS[gi] - battlesWon} more battle${BOSS_UNLOCK_THRESHOLDS[gi] - battlesWon === 1 ? '' : 's'} to challenge them.`);
        setMode('error');
        sfx.error();
        return;
      }
      if (bossesDefeated.includes(padded)) {
        setError(`You have already defeated ${guardian.trainerName}.`);
        setMode('error');
        sfx.error();
        return;
      }
      sfx.confirm();
      const config: BattleConfig = {
        type: 'guardian',
        enemySpeciesId: guardian.speciesId,
        enemyLevel: 20 + gi * 5,
        enemyName: guardian.trainerName,
        guardianIndex: gi,
      };
      navigate('/battle', { state: config });
      return;
    }

    // Creator disk — trigger final battle if unlocked
    if (species.rarity === 'Legendary') {
      if (!isCreatorUnlocked(useGameStore.getState())) {
        setError('The Creator is sealed. Capture all 20 disks and defeat all 4 Guardians first.');
        setMode('error');
        sfx.error();
        return;
      }
      sfx.confirm();
      const config: BattleConfig = {
        type: 'creator',
        enemySpeciesId: CREATOR.speciesId,
        enemyLevel: 50,
        enemyName: CREATOR.name,
      };
      navigate('/battle', { state: config });
      return;
    }

    setScannedSpecies(padded);
    setMode('success');
  };

  const startCameraScan = async () => {
    sfx.select();
    setMode('scanning');
    setError(null);

    try {
      const html5Qrcode = new Html5Qrcode(containerId);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => handleScanResult(decodedText),
        () => {},
      );
    } catch {
      setError('Camera access denied or unavailable. Use Demo Mode to try the scanner.');
      setMode('error');
      sfx.error();
    }
  };

  const handleDemoCapture = (speciesId: string) => {
    sfx.floppy();
    setScannedSpecies(speciesId);
    setMode('success');
  };

  const handleConfirmCapture = () => {
    if (!scannedSpecies) return;
    sfx.confirm();
    captureMonster(scannedSpecies);
    // Record on the global leaderboard
    const trainerName = useGameStore.getState().trainer?.name;
    if (trainerName) {
      supabase
        .from('leaderboard_entries')
        .insert({ trainer_name: trainerName, disk_id: scannedSpecies })
        .then(({ error }) => {
          if (error) console.warn('Leaderboard update failed:', error.message);
        });
    }
    if (!starterDiskClaimed) {
      claimStarterDisk(scannedSpecies);
      setMode('idle');
      setScannedSpecies(null);
      navigate(hasTrainer ? '/world' : '/trainer/new');
      return;
    }
    setMode('idle');
    setScannedSpecies(null);
  };

  const handleManualEntry = (code: string) => {
    processScan(code);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <button
          onClick={() => { sfx.cancel(); navigate('/game'); }}
          className="pixel-btn !p-2"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <PixelText size="md" className="text-forest-400">
          Scan Disk
        </PixelText>
      </div>

      {/* Stats */}
      <PixelPanel className="p-2 mb-4 flex items-center justify-between">
        <PixelText size="xs" className="text-ink-200">
          Disks Captured
        </PixelText>
        <PixelText size="xs" className="text-forest-400">
          {captured}/20
        </PixelText>
      </PixelPanel>

      {/* Idle mode */}
      {mode === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <PixelPanel variant="raised" className="p-6 text-center mb-4">
            <AnimatedSprite glyph="💾" size="lg" />
            <PixelText size="sm" className="text-forest-300 block mt-4 mb-2">
              Scan a Floppy Disk
            </PixelText>
            <BodyText className="text-ink-300 block mb-4">
              Point your camera at a RenderDisk QR code to capture the creature inside.
            </BodyText>
          </PixelPanel>

          <PixelButton variant="primary" fullWidth onClick={startCameraScan} className="mb-3">
            <Camera size={16} /> Start Camera
          </PixelButton>
          <PixelButton fullWidth onClick={() => setMode('manual')} className="mb-3">
            <ScanLine size={16} /> Enter Code Manually
          </PixelButton>

          {/* Demo mode — lets testers capture any disk */}
          <div className="mt-4">
            <PixelText size="xs" className="text-ink-400 mb-2 block text-center">
              Demo Mode — Capture Any Disk
            </PixelText>
            <div className="grid grid-cols-5 gap-1.5">
              {NORMAL_SPECIES.map((sp) => {
                const isCaptured = !!collection[sp.id];
                return (
                  <button
                    key={sp.id}
                    onClick={() => handleDemoCapture(sp.id)}
                    disabled={isCaptured}
                    className={`aspect-square flex flex-col items-center justify-center border-2 p-1 ${
                      isCaptured
                        ? 'bg-forest-900 border-forest-700 opacity-50'
                        : 'bg-ink-700 border-ink-500 hover:border-forest-400'
                    }`}
                  >
                    {isCaptured && sp.spriteImage ? (
                      <img src={sp.spriteImage} alt={sp.name} className="w-full h-full object-contain" draggable={false} />
                    ) : (
                      <span className="text-lg font-pixel text-ink-500">?</span>
                    )}
                    <span className="pixel-text-xs text-ink-400">{sp.diskId}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Scanning mode */}
      {mode === 'scanning' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col"
        >
          <div id={containerId} className="w-full aspect-square bg-ink-900 border-4 border-forest-600 mb-4 overflow-hidden" />
          <PixelButton
            variant="ember"
            fullWidth
            onClick={async () => {
              await stopScanner();
              sfx.cancel();
              setMode('idle');
            }}
          >
            <X size={16} /> Cancel Scan
          </PixelButton>
        </motion.div>
      )}

      {/* Manual entry mode */}
      {mode === 'manual' && (
        <ManualEntry
          onSubmit={handleManualEntry}
          onCancel={() => { sfx.cancel(); setMode('idle'); }}
        />
      )}

      {/* Success modal */}
      <AnimatePresence>
        {mode === 'success' && scannedSpecies && (
          <SuccessModal
            speciesId={scannedSpecies}
            onConfirm={handleConfirmCapture}
            onCancel={() => {
              sfx.cancel();
              setMode('idle');
              setScannedSpecies(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Error modal */}
      <AnimatePresence>
        {mode === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => { sfx.cancel(); setMode('idle'); setError(null); }}
          >
            <PixelPanel variant="raised" className="p-6 text-center max-w-xs">
              <span onClick={(e) => e.stopPropagation()}>
              <PixelText size="md" className="text-rust-400 block mb-3">
                Scan Failed
              </PixelText>
              <BodyText className="text-ink-200 block mb-4">
                {error}
              </BodyText>
              <PixelButton variant="primary" fullWidth onClick={() => { sfx.cancel(); setMode('idle'); setError(null); }}>
                Try Again
              </PixelButton>
              </span>
            </PixelPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ManualEntry({
  onSubmit,
  onCancel,
}: {
  onSubmit: (code: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col"
    >
      <PixelPanel className="p-4 mb-4">
        <PixelText size="xs" className="text-ink-300 mb-2 block">
          Enter Disk Code
        </PixelText>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="RD-01"
          maxLength={6}
          className="w-full bg-ink-900 border-2 border-ink-600 px-3 py-2 font-body text-xl text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-forest-500"
        />
        <BodyText className="text-ink-400 text-sm mt-2 block">
          Enter a code like RD-01 through RD-20.
        </BodyText>
      </PixelPanel>
      <PixelButton
        variant="primary"
        fullWidth
        onClick={() => onSubmit(code)}
        disabled={code.length < 4}
        className="mb-2"
      >
        <ScanLine size={16} /> Scan
      </PixelButton>
      <PixelButton fullWidth onClick={onCancel}>
        <ArrowLeft size={16} /> Back
      </PixelButton>
    </motion.div>
  );
}

function SuccessModal({
  speciesId,
  onConfirm,
  onCancel,
}: {
  speciesId: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const species = getSpecies(speciesId);
  if (!species) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="w-full max-w-sm"
      >
        <PixelPanel variant="gold" className="p-6 text-center">
          {/* Capture flash effect */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-gold-400 rounded-2xl pointer-events-none"
          />
          <div className="relative z-10">
            <PixelText size="sm" className="text-gold-400 block mb-4">
              DISK FOUND!
            </PixelText>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="flex justify-center mb-4"
            >
              {species.spriteImage ? (
                <img src={species.spriteImage} alt={species.name} className="w-32 h-32 object-contain" draggable={false} />
              ) : (
                <span className="text-7xl">{species.sprite}</span>
              )}
            </motion.div>
            <PixelText size="md" className="text-forest-300 block mb-1">
              {species.name}
            </PixelText>
            <div className="flex justify-center mb-3">
              <ElementTag element={species.element} size="sm" />
            </div>
            <PixelText size="xs" className="text-gold-300 block mb-1">
              Disk {species.diskId}
            </PixelText>
            <BodyText className="text-ink-300 block mb-4 mt-2">
              {species.description}
            </BodyText>
            <div className="flex gap-2">
              <PixelButton variant="primary" fullWidth onClick={onConfirm}>
                <Disc size={14} /> Capture
              </PixelButton>
              <PixelButton onClick={onCancel}>
                <X size={14} />
              </PixelButton>
            </div>
          </div>
        </PixelPanel>
      </motion.div>
    </motion.div>
  );
}
