import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { useState } from 'react';
import { useGameStore, getGymProgress, isGymBossUnlocked, isCreatorUnlocked, GYM_WIN_THRESHOLD, GYM_IDS } from '@/store/gameStore';
import { useSfx } from '@/audio/engine';
import { GUARDIANS, CREATOR, GYMS, getSpecies } from '@/data/species';
import { TrainerCard } from '@/components/TrainerCard';
import { PixelButton, PixelText, BodyText, PixelPanel } from '@/components/ui';
import type { GymId } from '@/types/game';

export function Guardians() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const bossesDefeated = useGameStore((s) => s.bossesDefeated);
  const creatorDefeated = useGameStore((s) => s.creatorDefeated);
  const gymProgress     = useGameStore((s) => s.gymProgress);
  const [selectedGuardian, setSelectedGuardian] = useState<number | null>(null);

  const allBossesDefeated = GUARDIANS.every((g) => bossesDefeated.includes(g.speciesId));
  const creatorUnlocked   = isCreatorUnlocked({ gymProgress } as Parameters<typeof isCreatorUnlocked>[0]);
  const totalWins         = GYM_IDS.reduce((sum, id) => sum + (gymProgress?.[id]?.playerWins ?? 0), 0);

  return (
    <div className="min-h-screen flex flex-col p-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <button
          onClick={() => { sfx.cancel(); navigate('/'); }}
          className="pixel-btn !p-2"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <PixelText size="md" className="text-gold-400">
          Guardians
        </PixelText>
      </div>

      {/* Progress */}
      <PixelPanel variant="gold" className="p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <PixelText size="xs" className="text-gold-300">
            Badges Earned
          </PixelText>
          <div className="flex gap-1">
            {GUARDIANS.map((g, i) => (
              <Star
                key={i}
                size={16}
                className={bossesDefeated.includes(g.speciesId) ? 'text-gold-400 fill-gold-400' : 'text-ink-600'}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <PixelText size="xs" className="text-ocean-300">
            Total Wins: {totalWins}
          </PixelText>
          <PixelText size="xs" className="text-ink-400">
            {GYM_WIN_THRESHOLD} wins per gym to unlock leader
          </PixelText>
        </div>
      </PixelPanel>

      {/* Guardian cards */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-6">
          {GUARDIANS.map((guardian, idx) => {
            const gym      = GYMS[idx];
            const defeated = bossesDefeated.includes(guardian.speciesId);
            const progress = getGymProgress(useGameStore.getState(), gym.id as GymId);
            const unlocked = isGymBossUnlocked(useGameStore.getState(), gym.id as GymId);
            return (
              <motion.div
                key={guardian.speciesId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, type: 'spring', damping: 20 }}
              >
                {unlocked ? (
                  <TrainerCard
                    name={guardian.trainerName}
                    diskId={guardian.diskId}
                    badgeLabel={guardian.title}
                    title={getSpecies(guardian.speciesId)!.name}
                    theme={guardian.theme}
                    imageUrl={guardian.cardImage}
                    defeated={defeated}
                    onClick={() => {
                      sfx.select();
                      setSelectedGuardian(idx);
                    }}
                  />
                ) : (
                  <LockedGuardianCard
                    gymName={gym.name}
                    playerWins={progress.playerWins}
                    threshold={GYM_WIN_THRESHOLD}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Final Boss section */}
        <div className="mt-8 pt-6 border-t-2 border-gold-700">
          <div className="flex items-center gap-2 mb-4">
            <PixelText size="sm" className="text-rust-400">
              Final Boss
            </PixelText>
            {!creatorUnlocked && (
              <Lock size={14} className="text-ink-500" />
            )}
          </div>

          {creatorUnlocked ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <TrainerCard
                name={CREATOR.name}
                diskId={CREATOR.diskId}
                badgeLabel={CREATOR.title}
                title="Creatorius"
                theme="gold"
                imageUrl={CREATOR.cardImage}
                defeated={creatorDefeated}
                onClick={() => {
                  sfx.confirm();
                  navigate('/world');
                }}
              />
              <BodyText className="text-gold-300 text-center mt-2 block">
                Go to the Overworld to challenge the Creator.
              </BodyText>
            </motion.div>
          ) : (
            <PixelPanel variant="gold" className="p-6 text-center">
              <Lock size={32} className="text-gold-600 mx-auto mb-3" />
              <BodyText className="text-gold-300 block mb-2">
                The Creator is sealed.
              </BodyText>
              <PixelText size="xs" className="text-ink-400 block">
                Capture all 20 monsters and defeat all 4 Guardians to unlock.
              </PixelText>
              <div className="mt-4 flex justify-center gap-4">
                <PixelText size="xs" className={allBossesDefeated ? 'text-forest-400' : 'text-rust-400'}>
                  {bossesDefeated.length}/4 Badges
                </PixelText>
              </div>
            </PixelPanel>
          )}
        </div>
      </div>

      {/* Guardian detail modal */}
      {selectedGuardian !== null && (
        <GuardianDetailModal
          guardian={GUARDIANS[selectedGuardian]}
          defeated={bossesDefeated.includes(GUARDIANS[selectedGuardian].speciesId)}
          onClose={() => { sfx.cancel(); setSelectedGuardian(null); }}
        />
      )}
    </div>
  );
}

function LockedGuardianCard({
  gymName,
  playerWins,
  threshold,
}: {
  gymName: string;
  playerWins: number;
  threshold: number;
}) {
  const remaining = Math.max(0, threshold - playerWins);
  return (
    <div className="relative w-full max-w-xs mx-auto rounded-2xl border-4 border-ink-600 bg-ink-800 shadow-pixel select-none overflow-hidden">
      <div className="absolute inset-[6px] rounded-xl border-2 border-ink-500 pointer-events-none z-10" />
      <div className="relative z-20 pt-3 pb-1 px-4 text-center">
        <span className="font-pixel text-xs uppercase tracking-wide text-ink-500">
          {gymName}
        </span>
      </div>
      <div className="relative z-20 mx-3 bg-ink-900 flex items-center justify-center" style={{ height: '18rem' }}>
        <Lock size={64} className="text-ink-600" />
      </div>
      <div className="relative z-20 bg-ink-700 border-t-2 border-ink-500 px-4 pt-3 pb-4 flex flex-col items-center gap-1 mt-2">
        <span className="font-pixel text-ink-500 text-[9px] uppercase tracking-widest">
          Locked
        </span>
        <span className="font-body text-ink-400 text-xl">
          Win {remaining} more player battle{remaining === 1 ? '' : 's'} to unlock
        </span>
      </div>
    </div>
  );
}

function GuardianDetailModal({
  guardian,
  defeated,
  onClose,
}: {
  guardian: typeof GUARDIANS[number];
  defeated: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const sfx = useSfx();
  const species = getSpecies(guardian.speciesId)!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
      >
        <PixelPanel variant="raised" className="p-4">
          {/* Mini card */}
          <div className="mb-4">
            <TrainerCard
              name={guardian.trainerName}
              diskId={guardian.diskId}
              badgeLabel={guardian.title}
              title={species.name}
              theme={guardian.theme}
              imageUrl={guardian.cardImage}
              compact
              defeated={defeated}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatBox label="HP"  value={species.baseHp} />
            <StatBox label="ATK" value={species.baseAttack} />
            <StatBox label="DEF" value={species.baseDefense} />
            <StatBox label="SPD" value={species.baseSpeed} />
            <StatBox label="SP.ATK" value={species.baseSpecialAttack} />
            <StatBox label="SP.DEF" value={species.baseSpecialDefense} />
          </div>

          {/* Passive */}
          <div className="bg-ink-900 border-2 border-gold-600 p-3 mb-4">
            <PixelText size="xs" className="text-gold-400 mb-1 block">
              Boss Passive
            </PixelText>
            <BodyText className="text-ink-100">
              {guardian.passive}
            </BodyText>
          </div>

          {/* Signature move */}
          <div className="bg-ink-900 border-2 border-ink-600 p-3 mb-4">
            <PixelText size="xs" className="text-ink-400 mb-1 block">
              Signature Move
            </PixelText>
            <BodyText className="text-gold-300">
              {species.signatureMove}
            </BodyText>
          </div>

          {/* Action buttons */}
          {defeated ? (
            <PixelButton fullWidth onClick={onClose}>
              Close
            </PixelButton>
          ) : (
            <>
              <BodyText className="text-rust-300 text-center block mb-3">
                Find this Guardian in the Overworld to challenge them.
              </BodyText>
              <div className="flex gap-2">
                <PixelButton
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    sfx.confirm();
                    navigate('/world');
                  }}
                >
                  Go to Overworld
                </PixelButton>
                <PixelButton onClick={onClose}>
                  <ArrowLeft size={14} />
                </PixelButton>
              </div>
            </>
          )}
        </PixelPanel>
      </motion.div>
    </motion.div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink-900 border-2 border-ink-700 p-2 text-center">
      <PixelText size="xs" className="text-ink-400 block mb-1">
        {label}
      </PixelText>
      <span className="font-pixel text-sm text-forest-300">
        {value}
      </span>
    </div>
  );
}
