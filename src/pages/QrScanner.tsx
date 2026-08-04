import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Disc, X } from 'lucide-react';
import { useGameStore, capturedCount, BOSS_UNLOCK_THRESHOLDS } from '@/store/gameStore';
import { useSfx } from '@/audio/engine';
import { audio } from '@/audio/engine';
import { NORMAL_SPECIES, GUARDIANS, CREATOR, getSpecies } from '@/data/species';
import { isGuardianUnlocked, isCreatorUnlocked } from '@/store/gameStore';
import type { BattleConfig } from '@/game/battle';
import { PixelButton, PixelText, BodyText, PixelPanel, ElementTag, AnimatedSprite } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { resolveDiskCode } from '@/data/diskCodes';
import { emitGameEvent } from '@/lib/gameEvents';

type PageMode = 'entry' | 'success' | 'error';

export function QrScanner() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const inputRef = useRef<HTMLInputElement>(null);

  const captureMonster = useGameStore((s) => s.captureMonster);
  const collection = useGameStore((s) => s.collection);
  const captured = useGameStore((s) => capturedCount(s));
  const starterDiskClaimed = useGameStore((s) => s.starterDiskClaimed);
  const claimStarterDisk = useGameStore((s) => s.claimStarterDisk);
  const hasTrainer = useGameStore((s) => !!s.trainer);
  const battlesWon = useGameStore((s) => s.battlesWon);
  const bossesDefeated = useGameStore((s) => s.bossesDefeated);

  const [code, setCode] = useState('');
  const [mode, setMode] = useState<PageMode>('entry');
  const [foundSpecies, setFoundSpecies] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    audio.playMusic('menu');
    inputRef.current?.focus();
  }, []);

  const processDiskCode = (raw: string) => {
    const padded = resolveDiskCode(raw);
    if (!padded) {
      setError(`"${raw.trim()}" isn't a valid disk number. Enter a number from 1 to 20.`);
      setMode('error');
      sfx.error();
      return;
    }

    const species = getSpecies(padded);
    if (!species) {
      setError(`Unknown disk: ${padded}.`);
      setMode('error');
      sfx.error();
      return;
    }

    // Boss disk
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
        enemyLevel: [12, 15, 18, 21][gi] ?? 12,
        enemyName: guardian.trainerName,
        guardianIndex: gi,
      };
      navigate('/battle', { state: config });
      return;
    }

    // Creator disk
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

    sfx.capture();
    setFoundSpecies(padded);
    setMode('success');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!code.trim()) return;
    processDiskCode(code.trim());
  };

  const handleConfirmCapture = () => {
    if (!foundSpecies) return;
    sfx.confirm();
    captureMonster(foundSpecies);
    const trainerName = useGameStore.getState().trainer?.name;
    if (trainerName) {
      supabase
        .from('leaderboard_entries')
        .insert({ trainer_name: trainerName, disk_id: foundSpecies })
        .then(({ error }) => { if (error) console.warn('Leaderboard update failed:', error.message); });
      const speciesName = getSpecies(foundSpecies)?.name ?? foundSpecies;
      emitGameEvent('disk', trainerName, speciesName);
    }
    if (!starterDiskClaimed) {
      claimStarterDisk(foundSpecies);
      setMode('entry');
      setFoundSpecies(null);
      setCode('');
      navigate(hasTrainer ? '/world' : '/trainer/new');
      return;
    }
    setMode('entry');
    setFoundSpecies(null);
    setCode('');
  };

  const handleDemoCapture = (speciesId: string) => {
    sfx.floppy();
    setFoundSpecies(speciesId);
    setMode('success');
  };

  const resetToEntry = () => {
    sfx.cancel();
    setMode('entry');
    setError(null);
    setCode('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col p-4 pb-6">
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
          Enter Disk
        </PixelText>
      </div>

      {/* Stats — only shown to existing trainers */}
      {hasTrainer && (
        <PixelPanel className="p-2 mb-4 flex items-center justify-between">
          <PixelText size="xs" className="text-ink-200">Disks Found</PixelText>
          <PixelText size="xs" className="text-forest-400">{captured}/20</PixelText>
        </PixelPanel>
      )}

      {/* Main entry form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        <PixelPanel variant="raised" className="p-6 text-center mb-5">
          <AnimatedSprite glyph="💾" size="lg" />
          <PixelText size="sm" className="text-forest-300 block mt-4 mb-1">
            Got a disk?
          </PixelText>
          <BodyText className="text-ink-300 block mb-5">
            Enter the number written on it.
          </BodyText>

          {!hasTrainer && (
            <BodyText className="text-ink-400 block mb-4 text-sm">
              Enter the number written on your disk. Your creature is waiting inside.
            </BodyText>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="1 – 20"
              maxLength={8}
              className="w-full bg-ink-900 border-2 border-ink-600 px-4 py-4 font-pixel text-2xl text-center text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-forest-500 tracking-widest"
            />
            <PixelButton
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={!code.trim()}
            >
              <Disc size={16} /> {hasTrainer ? 'Claim Disk' : 'Reveal My Creature'}
            </PixelButton>
          </form>
        </PixelPanel>

        {/* Demo mode — hidden for new players, they must enter their real code */}
        {hasTrainer && (
          <div className="mt-2">
            <PixelText size="xs" className="text-ink-500 mb-2 block text-center">
              Demo — Tap any disk to preview
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
        )}
      </motion.div>

      {/* Success modal */}
      <AnimatePresence>
        {mode === 'success' && foundSpecies && (
          <SuccessModal
            speciesId={foundSpecies}
            onConfirm={handleConfirmCapture}
            onCancel={resetToEntry}
            isNewPlayer={!hasTrainer}
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
            onClick={resetToEntry}
          >
            <PixelPanel variant="raised" className="p-6 text-center max-w-xs" onClick={(e) => e.stopPropagation()}>
              <PixelText size="md" className="text-rust-400 block mb-3">Not Found</PixelText>
              <BodyText className="text-ink-200 block mb-4">{error}</BodyText>
              <PixelButton variant="primary" fullWidth onClick={resetToEntry}>
                Try Again
              </PixelButton>
            </PixelPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessModal({
  speciesId,
  onConfirm,
  onCancel,
  isNewPlayer = false,
}: {
  speciesId: string;
  onConfirm: () => void;
  onCancel: () => void;
  isNewPlayer?: boolean;
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
            <PixelText size="md" className="text-forest-300 block mb-1">{species.name}</PixelText>
            <div className="flex justify-center mb-3">
              <ElementTag element={species.element} size="sm" />
            </div>
            <PixelText size="xs" className="text-gold-300 block mb-1">Disk {species.diskId}</PixelText>
            <BodyText className="text-ink-300 block mb-4 mt-2">{species.description}</BodyText>
            <div className="flex gap-2">
              <PixelButton variant="primary" fullWidth onClick={onConfirm}>
                <Disc size={14} /> {isNewPlayer ? 'Claim & Create Trainer →' : 'Capture'}
              </PixelButton>
              {!isNewPlayer && (
                <PixelButton onClick={onCancel}>
                  <X size={14} />
                </PixelButton>
              )}
            </div>
          </div>
        </PixelPanel>
      </motion.div>
    </motion.div>
  );
}
