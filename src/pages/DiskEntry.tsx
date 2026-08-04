import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Disc, ArrowRight, Lock } from 'lucide-react';
import { useGameStore, isGuardianUnlocked, isCreatorUnlocked, BOSS_UNLOCK_THRESHOLDS } from '@/store/gameStore';
import { getSpecies, GUARDIANS, CREATOR } from '@/data/species';
import { resolveDiskCode } from '@/data/diskCodes';
import { useSfx } from '@/audio/engine';
import { audio } from '@/audio/engine';
import { PixelButton, PixelText, BodyText, PixelPanel, ElementTag } from '@/components/ui';
import type { BattleConfig } from '@/game/battle';
import { supabase } from '@/lib/supabase';

export function DiskEntry() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const sfx = useSfx();

  const hasTrainer = useGameStore((s) => !!s.trainer);
  const collection = useGameStore((s) => s.collection);
  const captureMonster = useGameStore((s) => s.captureMonster);
  const starterDiskClaimed = useGameStore((s) => s.starterDiskClaimed);
  const setPendingDiskCode = useGameStore((s) => s.setPendingDiskCode);
  const battlesWon = useGameStore((s) => s.battlesWon);
  const bossesDefeated = useGameStore((s) => s.bossesDefeated);
  const trainerName = useGameStore((s) => s.trainer?.name);

  type PageState = 'preview' | 'already-captured' | 'locked' | 'invalid';
  const [pageState, setPageState] = useState<PageState>('preview');
  const [lockedMessage, setLockedMessage] = useState('');

  // Resolve unique QR token → RD-XX (also accepts legacy RD-01/rd01 format)
  const diskCode = resolveDiskCode(code ?? '');
  const species = diskCode ? getSpecies(diskCode) : null;

  useEffect(() => {
    audio.playMusic('menu');
  }, []);

  useEffect(() => {
    if (!diskCode || !species) {
      setPageState('invalid');
      return;
    }

    // Guardian disk
    if (species.rarity === 'Boss') {
      const guardian = GUARDIANS.find((g) => g.speciesId === diskCode);
      const gi = guardian ? GUARDIANS.indexOf(guardian) : -1;
      if (!guardian || gi < 0) { setPageState('invalid'); return; }
      if (bossesDefeated.includes(diskCode)) {
        setLockedMessage(`You have already defeated ${guardian.trainerName}.`);
        setPageState('locked');
        return;
      }
      if (!isGuardianUnlocked(useGameStore.getState(), gi)) {
        const needed = BOSS_UNLOCK_THRESHOLDS[gi] - battlesWon;
        setLockedMessage(`${guardian.trainerName} is sealed. Win ${needed} more battle${needed === 1 ? '' : 's'} first.`);
        setPageState('locked');
        return;
      }
    }

    // Creator disk
    if (species.rarity === 'Legendary') {
      if (!isCreatorUnlocked(useGameStore.getState())) {
        setLockedMessage('The Creator is sealed. Capture all 20 disks and defeat all 4 Guardians first.');
        setPageState('locked');
        return;
      }
    }

    // Already captured normal disk
    if (species.rarity !== 'Boss' && species.rarity !== 'Legendary' && collection[diskCode]) {
      setPageState('already-captured');
      return;
    }

    setPageState('preview');
  }, [diskCode, species, collection, battlesWon, bossesDefeated]);

  const handleClaim = () => {
    if (!diskCode || !species) return;
    sfx.confirm();

    // Guardian battle
    if (species.rarity === 'Boss') {
      const guardian = GUARDIANS.find((g) => g.speciesId === diskCode)!;
      const gi = GUARDIANS.indexOf(guardian);
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

    // Creator battle
    if (species.rarity === 'Legendary') {
      const config: BattleConfig = {
        type: 'creator',
        enemySpeciesId: CREATOR.speciesId,
        enemyLevel: 50,
        enemyName: CREATOR.name,
      };
      navigate('/battle', { state: config });
      return;
    }

    // Normal disk — new player: save pending code, go create trainer
    if (!hasTrainer || !starterDiskClaimed) {
      setPendingDiskCode(diskCode);
      navigate('/trainer/new');
      return;
    }

    // Existing player: capture now
    captureMonster(diskCode);
    if (trainerName) {
      supabase
        .from('leaderboard_entries')
        .insert({ trainer_name: trainerName, disk_id: diskCode })
        .then(({ error }) => { if (error) console.warn('Leaderboard update failed:', error.message); });
    }
    navigate('/world');
  };

  if (!species || pageState === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <PixelText size="md" className="text-rust-400 mb-3">Invalid Disk</PixelText>
        <BodyText className="text-ink-300 mb-6">This QR code doesn't match any known RenderDisk.</BodyText>
        <PixelButton onClick={() => navigate('/game')}>Go to Menu</PixelButton>
      </div>
    );
  }

  if (pageState === 'locked') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Lock size={40} className="text-ink-500 mb-4" />
        <PixelText size="md" className="text-ink-300 mb-3">Disk Sealed</PixelText>
        <BodyText className="text-ink-400 mb-6">{lockedMessage}</BodyText>
        <PixelButton onClick={() => navigate(hasTrainer ? '/world' : '/game')}>Back</PixelButton>
      </div>
    );
  }

  if (pageState === 'already-captured') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          {species.spriteImage
            ? <img src={species.spriteImage} alt={species.name} className="w-32 h-32 object-contain mx-auto mb-4" draggable={false} />
            : <span className="text-7xl block mb-4">{species.sprite}</span>}
        </motion.div>
        <PixelText size="md" className="text-forest-400 mb-1">{species.name}</PixelText>
        <BodyText className="text-ink-400 mb-6">You already have this one in your binder!</BodyText>
        <PixelButton variant="primary" onClick={() => navigate('/world')}>Back to World</PixelButton>
      </div>
    );
  }

  const isBoss = species.rarity === 'Boss' || species.rarity === 'Legendary';
  const isNewPlayer = !hasTrainer || !starterDiskClaimed;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Flash ring */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute w-48 h-48 rounded-full bg-gold-400/20 pointer-events-none"
      />

      <PixelPanel variant="gold" className="p-6 w-full max-w-sm text-center relative overflow-hidden">
        <PixelText size="xs" className="text-gold-400 block mb-4 tracking-widest">
          {isBoss ? '⚔ CHALLENGE DISK ⚔' : '✦ DISK FOUND ✦'}
        </PixelText>

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex justify-center mb-4"
        >
          {species.spriteImage
            ? <img src={species.spriteImage} alt={species.name} className="w-36 h-36 object-contain drop-shadow-2xl" draggable={false} />
            : <span className="text-8xl">{species.sprite}</span>}
        </motion.div>

        <PixelText size="md" className="text-forest-300 block mb-1">{species.name}</PixelText>
        <div className="flex justify-center mb-2">
          <ElementTag element={species.element} size="sm" />
        </div>
        <PixelText size="xs" className="text-gold-300 block mb-3">Disk {species.diskId}</PixelText>
        <BodyText className="text-ink-300 block mb-5">{species.description}</BodyText>

        <PixelButton variant="primary" fullWidth onClick={handleClaim}>
          <Disc size={14} />
          {isBoss ? 'Battle!' : isNewPlayer ? 'Claim & Begin Journey' : 'Capture!'}
          <ArrowRight size={14} />
        </PixelButton>

        {isNewPlayer && !isBoss && (
          <BodyText className="text-ink-500 text-xs mt-3 block">
            This creature becomes your starter — you'll create your trainer next.
          </BodyText>
        )}
      </PixelPanel>
    </div>
  );
}
