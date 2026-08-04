import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, Swords, Lock, FlaskRound, Map, ChevronRight, Trophy, Users,
} from 'lucide-react';
import {
  useGameStore,
  capturedCount,
  GYM_WIN_THRESHOLD,
  GYM_IDS,
  maxHpAtLevel,
} from '@/store/gameStore';
import { useSfx, audio } from '@/audio/engine';
import { GUARDIANS, CREATOR, GYMS, getSpecies } from '@/data/species';
import type { GymDef } from '@/data/species';
import { PixelButton, PixelText, BodyText, PixelPanel } from '@/components/ui';
import { TrainerSprite } from '@/components/trainer/TrainerSprite';
import type { BattleConfig } from '@/game/battle';
import type { GymId } from '@/types/game';

export function Overworld() {
  const navigate    = useNavigate();
  const sfx         = useSfx();
  const collection  = useGameStore((s) => s.collection);
  const captured    = useGameStore((s) => capturedCount(s));
  const bossesDefeated  = useGameStore((s) => s.bossesDefeated);
  const gymProgress = useGameStore((s) => s.gymProgress);
  const healAll     = useGameStore((s) => s.healAll);
  const trainer     = useGameStore((s) => s.trainer);

  const [activeGym, setActiveGym] = useState<GymDef | null>(null);
  const [flashMsg, setFlashMsg]   = useState<string | null>(null);
  const [pendingConfig, setPendingConfig] = useState<BattleConfig | null>(null);

  useEffect(() => { audio.playMusic('overworld'); }, []);

  const creatorReady = GYM_IDS.every((id) => gymProgress?.[id]?.bossDefeated === true);

  function flash(msg: string, ms = 1800) {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(null), ms);
  }

  /** Check if the trainer has at least one non-fainted creature */
  function checkHasHealthyCreature(): boolean {
    const ids = Object.keys(collection);
    if (ids.length === 0) {
      flash('You need a Disk monster to battle! Enter a disk number first.');
      return false;
    }
    const hasHealthy = ids.some(id => (collection[id]?.currentHp ?? 0) > 0);
    if (!hasHealthy) {
      flash('All your creatures fainted! Tap Heal All first.');
      return false;
    }
    return true;
  }

  /** Launch the creature-select modal (or go straight to battle if only 1 creature) */
  function openCreatureSelect(config: BattleConfig) {
    const ids = Object.keys(collection);
    if (ids.length <= 1) {
      // Only one creature — skip the picker
      navigate('/battle', { state: config });
      return;
    }
    setPendingConfig(config);
  }

  function startEncounter(gym: GymDef) {
    if (!checkHasHealthyCreature()) return;

    sfx.floppy?.();
    const pool      = gym.speciesPool;
    const speciesId = pool[Math.floor(Math.random() * pool.length)];
    const species   = getSpecies(speciesId);
    if (!species) return;

    const ids      = Object.keys(collection);
    const firstMon = collection[ids[0]];
    const level    = Math.max(1, firstMon.level + Math.floor(Math.random() * 3 - 1));

    flash(`A wild ${species.name} appeared!`);
    setTimeout(() => {
      openCreatureSelect({
        type: 'wild',
        enemySpeciesId: speciesId,
        enemyLevel: level,
        gymId: gym.id as GymId,
      });
    }, 700);
  }

  function startGuardian(gym: GymDef) {
    if (!checkHasHealthyCreature()) return;
    const guardian = GUARDIANS[gym.guardianIndex];
    sfx.confirm?.();
    openCreatureSelect({
      type: 'guardian',
      enemySpeciesId: guardian.speciesId,
      enemyLevel: [12, 15, 18, 21][gym.guardianIndex] ?? 12,
      enemyName: guardian.trainerName,
      guardianIndex: gym.guardianIndex,
      gymId: gym.id as GymId,
    });
  }

  function startCreator() {
    if (!checkHasHealthyCreature()) return;
    sfx.confirm?.();
    openCreatureSelect({
      type: 'creator',
      enemySpeciesId: CREATOR.speciesId,
      enemyLevel: 28,
      enemyName: CREATOR.name,
    });
  }

  return (
    <div className="h-[100dvh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 gap-3">
        {/* Left: back + title */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => { sfx.cancel?.(); navigate('/game'); }} className="pixel-btn !p-2">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Map size={16} className="text-forest-400" />
            <PixelText size="md" className="text-forest-400">World Map</PixelText>
          </div>
        </div>

        {/* Right: trainer card */}
        <button
          type="button"
          onClick={() => navigate('/trainer/profile')}
          className="flex items-center gap-3 bg-ink-800 border-2 border-ink-600 rounded-xl px-3 py-2"
          aria-label="Open trainer profile"
        >
          {trainer?.appearance && (
            <div className="shrink-0 rounded overflow-hidden bg-ink-900 border-2 border-ink-600" style={{ width: 48, height: 48 }}>
              <TrainerSprite appearance={trainer.appearance} scale={1} className="block" />
            </div>
          )}
          <div className="flex flex-col items-start gap-0.5 min-w-0">
            <PixelText size="sm" className="text-ink-200 truncate max-w-[80px]">{trainer?.name}</PixelText>
            <div className="flex items-center gap-2">
              <PixelText size="xs" className="text-ocean-400">{captured}/20 💾</PixelText>
              <PixelText size="xs" className="text-gold-400">{bossesDefeated.length}/4 ⭐</PixelText>
            </div>
          </div>
        </button>
      </div>

      {/* Top action bar */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button
          onClick={() => { sfx.confirm?.(); healAll(); flash('All creatures restored!'); }}
          className="pixel-btn pixel-btn-primary !px-3 !py-1 flex items-center gap-1"
        >
          <FlaskRound size={12} /> Heal All
        </button>
        <button
          onClick={() => { sfx.confirm?.(); navigate('/lobby'); }}
          className="pixel-btn !px-3 !py-1 flex items-center gap-1 border-2 border-ocean-600 text-ocean-400"
        >
          <Users size={12} /> Chat
        </button>
        <button
          onClick={() => { sfx.confirm?.(); navigate('/home', { state: { tab: 'leaderboard' } }); }}
          className="pixel-btn !px-3 !py-1 flex items-center gap-1 border-2 border-gold-600 text-gold-400"
        >
          <Trophy size={12} /> Ranks
        </button>
      </div>

      {/* Flash message */}
      <AnimatePresence>
        {flashMsg && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mb-2 bg-ink-800 border-2 border-forest-600 px-3 py-2 text-center"
          >
            <BodyText className="text-forest-300">{flashMsg}</BodyText>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gym list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-4 pb-6">
        {GYMS.map((gym, idx) => {
          const guardian   = GUARDIANS[gym.guardianIndex];
          const defeated   = bossesDefeated.includes(guardian.speciesId);
          const progress   = gymProgress?.[gym.id as GymId] ?? { playerWins: 0, bossDefeated: false };
          const bossReady  = progress.playerWins >= GYM_WIN_THRESHOLD;
          const winsLeft   = Math.max(0, GYM_WIN_THRESHOLD - progress.playerWins);

          return (
            <motion.div
              key={gym.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`${gym.bg} border-4 ${gym.border} rounded-lg ${gym.glow} overflow-hidden`}
            >
              {/* Gym header */}
              <button
                className="w-full text-left px-4 py-4 flex items-center justify-between gap-3"
                onClick={() => { sfx.select?.(); setActiveGym(activeGym?.id === gym.id ? null : gym); }}
              >
                <div className="flex-1 min-w-0">
                  <PixelText size="md" className={`${gym.accent} block leading-tight`}>{gym.name}</PixelText>
                  <BodyText className="text-ink-400 text-sm mt-1">{gym.subtitle}</BodyText>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {defeated && <Star size={15} className="text-gold-400 fill-gold-400" />}
                  <ChevronRight
                    size={16}
                    className={`text-ink-500 transition-transform ${activeGym?.id === gym.id ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded panel */}
              <AnimatePresence>
                {activeGym?.id === gym.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t-2 border-ink-700 pt-3">
                      <BodyText className="text-ink-300">{gym.description}</BodyText>

                      {/* Creatures in gym */}
                      <div>
                        <PixelText size="xs" className="text-ink-400 mb-2 block">Gym Creatures</PixelText>
                        <div className="flex flex-wrap gap-2">
                          {gym.speciesPool.map((id) => {
                            const sp = getSpecies(id);
                            if (!sp) return null;
                            return (
                              <div key={id} className="flex items-center gap-1 bg-ink-900 border-2 border-ink-600 px-2 py-1 rounded">
                                <span className="text-base leading-none">{sp.sprite}</span>
                                <PixelText size="xs" className="text-ink-300">{sp.name}</PixelText>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Win progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <PixelText size="xs" className="text-ink-400">Player wins</PixelText>
                          <PixelText size="xs" className={bossReady ? 'text-forest-400' : 'text-ink-400'}>
                            {Math.min(progress.playerWins, GYM_WIN_THRESHOLD)}/{GYM_WIN_THRESHOLD}
                          </PixelText>
                        </div>
                        <div className="h-2 bg-ink-900 border-2 border-ink-700 rounded overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${bossReady ? 'bg-forest-500' : 'bg-ocean-600'}`}
                            style={{ width: `${Math.min(100, (progress.playerWins / GYM_WIN_THRESHOLD) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Gym boss block */}
                      <div className={`border-2 rounded p-3 ${
                        defeated    ? 'border-gold-600 bg-ink-900/60' :
                        bossReady   ? 'border-rust-500 bg-ink-900/60' :
                                      'border-ink-700 bg-ink-900/40 opacity-70'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {defeated  ? <Star size={12} className="text-gold-400 fill-gold-400" />
                          : bossReady ? <Swords size={12} className="text-rust-400" />
                          : <Lock size={12} className="text-ink-500" />}
                          <PixelText size="xs" className={
                            defeated ? 'text-gold-400' : bossReady ? 'text-rust-400' : 'text-ink-500'
                          }>
                            Gym Leader — {guardian.trainerName}
                          </PixelText>
                        </div>
                        <BodyText className="text-ink-400 text-sm">{guardian.title}</BodyText>
                        {!defeated && bossReady && (
                          <BodyText className="text-ink-400 text-sm mt-1 italic">{guardian.passive}</BodyText>
                        )}
                        {!bossReady && (
                          <BodyText className="text-ink-500 text-sm mt-1">
                            Beat {winsLeft} more player{winsLeft === 1 ? '' : 's'} in this gym to unlock.
                          </BodyText>
                        )}
                        {defeated && (
                          <BodyText className="text-gold-500 text-sm mt-1">Badge earned!</BodyText>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 pt-1">
                        <PixelButton variant="primary" fullWidth onClick={() => startEncounter(gym)}>
                          Battle Players Here
                        </PixelButton>
                        {bossReady && !defeated && (
                          <PixelButton variant="ember" fullWidth onClick={() => startGuardian(gym)}>
                            <Swords size={14} /> Challenge {guardian.trainerName}
                          </PixelButton>
                        )}
                        {defeated && (
                          <PixelButton variant="ember" fullWidth onClick={() => startGuardian(gym)}>
                            <Swords size={14} /> Rematch {guardian.trainerName}
                          </PixelButton>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Final Boss */}
        <div className="mt-2">
          {creatorReady ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startCreator}
              className="w-full border-4 border-gold-500 bg-ink-900 rounded-lg p-5 text-center shadow-[0_0_30px_rgba(240,200,80,0.25)]"
            >
              <Trophy size={36} className="text-gold-400 mx-auto mb-2" />
              <PixelText size="sm" className="text-gold-400 block mb-1">Jason Torres — Final Boss</PixelText>
              <BodyText className="text-gold-300">You've beaten all 4 gym leaders. Now face the Creator.</BodyText>
            </motion.button>
          ) : (
            <PixelPanel variant="gold" className="p-4 text-center opacity-60">
              <Lock size={28} className="text-gold-600 mx-auto mb-2" />
              <PixelText size="xs" className="text-gold-600 block mb-1">Final Boss — Sealed</PixelText>
              <PixelText size="xs" className="text-ink-500">
                Defeat all 4 Gym Leaders to unlock Jason Torres.
              </PixelText>
              <PixelText size="xs" className="text-ink-600 mt-1">
                {bossesDefeated.length}/4 badges
              </PixelText>
            </PixelPanel>
          )}
        </div>
      </div>

      {/* ── CREATURE SELECT MODAL ── */}
      <AnimatePresence>
        {pendingConfig && (
          <motion.div
            key="creature-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm"
            onClick={() => { sfx.cancel?.(); setPendingConfig(null); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-ink-900 border-t-2 border-ink-600 p-4 pb-8 max-h-[65vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <PixelText size="xs" className="text-ink-500">SELECT FIGHTER</PixelText>
                <button
                  onClick={() => { sfx.cancel?.(); setPendingConfig(null); }}
                  className="text-ink-500 hover:text-ink-300 p-1"
                >
                  ✕
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(collection).map(([id, mon]) => {
                  const sp = getSpecies(id);
                  if (!sp) return null;
                  const maxHp = maxHpAtLevel(sp.baseHp, mon.level);
                  const fainted = mon.currentHp <= 0;
                  const hpPct = Math.max(0, (mon.currentHp / maxHp) * 100);
                  const barColor = hpPct > 50 ? 'bg-forest-500' : hpPct > 20 ? 'bg-gold-400' : 'bg-rust-500';
                  return (
                    <button
                      key={id}
                      disabled={fainted}
                      onClick={() => {
                        sfx.confirm?.();
                        navigate('/battle', { state: { ...pendingConfig, startingCreatureId: id } });
                        setPendingConfig(null);
                      }}
                      className={`relative flex flex-col items-center p-3 border-2 transition-all active:scale-95 ${
                        fainted
                          ? 'bg-ink-800 border-ink-700 opacity-35 cursor-not-allowed'
                          : 'bg-ink-800 border-ink-600 hover:border-forest-500 active:border-forest-400'
                      }`}
                    >
                      {/* Sprite */}
                      <div className="w-14 h-14 flex items-center justify-center mb-2">
                        {sp.spriteImage ? (
                          <img
                            src={sp.spriteImage}
                            alt={sp.name}
                            className={`w-full h-full object-contain ${fainted ? 'grayscale' : ''}`}
                            draggable={false}
                          />
                        ) : (
                          <span className="text-3xl">{sp.sprite}</span>
                        )}
                      </div>

                      {/* Name + level */}
                      <PixelText size="xs" className="text-ink-100 truncate w-full text-center mb-0.5">
                        {sp.name}
                      </PixelText>
                      <PixelText size="xs" className="text-ink-500 block mb-2">
                        Lv.{mon.level}
                      </PixelText>

                      {/* HP bar */}
                      <div className="w-full h-1.5 bg-ink-700 overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${hpPct}%` }} />
                      </div>
                      <span className="font-body text-xs text-ink-500 mt-0.5">
                        {fainted ? '✗ Fainted' : `${mon.currentHp}/${maxHp}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
