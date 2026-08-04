import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { User, Pencil, ArrowLeft, Shield, Swords } from 'lucide-react';
import { useGameStore, capturedCount, maxHpAtLevel, xpForLevel } from '@/store/gameStore';
import { getSpecies, getGymForSpecies, GYMS } from '@/data/species';
import { PixelButton, PixelPanel, PixelText, BodyText, HealthBar, XpBar, ElementTag, RarityTag } from '@/components/ui';
import { TrainerSprite } from '@/components/trainer/TrainerSprite';

const BADGE_DEFS = [
  { id: 'forest',   label: 'Forest',   color: 'text-forest-400', bg: 'bg-forest-900 border-forest-600' },
  { id: 'mountain', label: 'Mountain', color: 'text-rust-400',   bg: 'bg-rust-900 border-rust-600' },
  { id: 'ruins',    label: 'Ruins',    color: 'text-violet-400', bg: 'bg-violet-900 border-violet-600' },
  { id: 'digital',  label: 'Digital',  color: 'text-ocean-400',  bg: 'bg-ocean-900 border-ocean-600' },
] as const;

export function TrainerProfile() {
  const navigate    = useNavigate();
  const trainer     = useGameStore((s) => s.trainer);
  const collection  = useGameStore((s) => s.collection);
  const badges      = useGameStore((s) => s.badges);
  const captured    = useGameStore((s) => capturedCount(s));
  const _bosses     = useGameStore((s) => s.bossesDefeated.length); // kept for future use
  const battlesWon  = useGameStore((s) => s.battlesWon);
  const potions     = useGameStore((s) => s.inventory.potions);
  const gymId       = useGameStore((s) => s.gymId);
  const pvpWins     = useGameStore((s) => s.pvpWins);
  const claimStarterDisk = useGameStore((s) => s.claimStarterDisk);

  // Retroactively assign gym for saves created before gym feature existed
  useEffect(() => {
    if (!gymId && Object.keys(collection).length > 0) {
      const firstId = Object.keys(collection)[0];
      const gym = getGymForSpecies(firstId);
      if (gym) {
        // Re-run claimStarterDisk equivalent — just set gymId via internal action
        useGameStore.setState((s) => ({ ...s, gymId: gym.id as import('@/types/game').GymId }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myGym = gymId ? GYMS.find((g) => g.id === gymId) ?? null : null;

  if (!trainer) return null;

  // Active creature = first in collection (the one that goes into battle)
  const activeId      = Object.keys(collection)[0] ?? null;
  const activeMon     = activeId ? collection[activeId] : null;
  const activeSpecies = activeId ? getSpecies(activeId) : null;
  const maxHp         = activeMon && activeSpecies ? maxHpAtLevel(activeSpecies.baseHp, activeMon.level) : 0;
  const xpNeeded      = activeMon ? xpForLevel(activeMon.level) : 0;

  return (
    <div className="min-h-[100dvh] flex flex-col px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="pixel-btn !p-2" aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <User size={16} className="text-forest-400" />
          <PixelText size="md" className="text-forest-400">Trainer</PixelText>
        </div>
      </div>

      {/* Trainer card */}
      <PixelPanel variant="raised" className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0 border-2 border-ink-700 bg-ink-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ width: 96, height: 96 }}>
            <TrainerSprite appearance={trainer.appearance} scale={2} />
          </div>
          <div className="min-w-0">
            <PixelText size="sm" className="text-forest-300 truncate block">{trainer.name}</PixelText>
            <PixelText size="xs" className="text-ink-400 block mt-1">
              Since {new Date(trainer.createdAt).toLocaleDateString()}
            </PixelText>
          </div>
        </div>
      </PixelPanel>

      {/* Gym assignment */}
      {myGym && (
        <PixelPanel className={`p-3 mb-4 border-2 ${myGym.border} ${myGym.bg}/20`}>
          <div className="flex items-center justify-between">
            <div>
              <PixelText size="xs" className="text-ink-400 block mb-1">Your Gym</PixelText>
              <PixelText size="sm" className={myGym.accent}>{myGym.name}</PixelText>
              <BodyText className="text-ink-400 text-xs mt-0.5">{myGym.subtitle}</BodyText>
            </div>
            <div className="text-right">
              <PixelText size="xs" className="text-ink-500 block">PvP Wins</PixelText>
              <PixelText size="md" className={myGym.accent}>{pvpWins}</PixelText>
            </div>
          </div>
        </PixelPanel>
      )}

      {/* Active creature */}
      {activeMon && activeSpecies ? (
        <PixelPanel className="p-4 mb-4">
          <PixelText size="xs" className="text-ink-400 block mb-3">Active Creature</PixelText>
          <div className="flex items-center gap-4">
            {/* Sprite */}
            <div className="shrink-0 w-20 h-20 flex items-center justify-center bg-ink-900 border-2 border-ink-700 rounded-lg overflow-hidden">
              {activeSpecies.spriteImage ? (
                <img
                  src={activeSpecies.spriteImage}
                  alt={activeSpecies.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  draggable={false}
                />
              ) : (
                <span className="text-4xl">{activeSpecies.sprite}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <PixelText size="sm" className="text-forest-300">{activeSpecies.name}</PixelText>
                <RarityTag rarity={activeSpecies.rarity} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <ElementTag element={activeSpecies.element} size="sm" />
                <BodyText className="text-ink-400 text-xs">Lv.{activeMon.level}</BodyText>
              </div>

              {/* HP — HealthBar has its own label+numbers built in */}
              <div className="mb-1.5">
                <HealthBar current={activeMon.currentHp} max={maxHp} showNumbers />
              </div>

              {/* XP — XpBar has its own label+numbers built in */}
              <XpBar current={activeMon.experience} needed={xpNeeded} />
            </div>
          </div>
        </PixelPanel>
      ) : (
        <PixelPanel className="p-4 mb-4">
          <PixelText size="xs" className="text-ink-500 block text-center py-2">
            No creature yet — find a disk and enter its number!
          </PixelText>
        </PixelPanel>
      )}

      {/* Badges */}
      <PixelPanel className="p-4 mb-4">
        <PixelText size="xs" className="text-ink-400 block mb-3">Badges</PixelText>
        <div className="grid grid-cols-4 gap-2">
          {BADGE_DEFS.map((b) => {
            const earned = badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 ${
                  earned ? b.bg : 'bg-ink-900 border-ink-700'
                }`}
              >
                <Shield size={18} className={earned ? b.color : 'text-ink-700'} />
                <PixelText size="xs" className={earned ? b.color : 'text-ink-700'}>
                  {b.label}
                </PixelText>
              </div>
            );
          })}
        </div>
      </PixelPanel>

      {/* Stats */}
      <PixelPanel className="p-4 mb-4">
        <PixelText size="xs" className="text-ink-400 block mb-3">Stats</PixelText>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-ink-900 border-2 border-ink-600 rounded-lg px-3 py-3 text-center">
            <PixelText size="xs" className="text-ink-500 block">Disks</PixelText>
            <PixelText size="sm" className="text-forest-300 block">{captured}/20</PixelText>
          </div>
          <div className="bg-ink-900 border-2 border-ink-600 rounded-lg px-3 py-3 text-center">
            <PixelText size="xs" className="text-ink-500 block">Wins</PixelText>
            <PixelText size="sm" className="text-gold-300 block">{battlesWon}</PixelText>
          </div>
          <div className="bg-ink-900 border-2 border-ink-600 rounded-lg px-3 py-3 text-center">
            <PixelText size="xs" className="text-ink-500 block">Potions</PixelText>
            <PixelText size="sm" className="text-ocean-300 block">{potions}</PixelText>
          </div>
        </div>
      </PixelPanel>

      <div className="mt-auto flex flex-col gap-2">
        {activeId && (
          <PixelButton variant="primary" fullWidth onClick={() => navigate('/pvp', { state: { mode: 'host' } })}>
            <Swords size={16} /> Battle a Trainer
          </PixelButton>
        )}
        <PixelButton fullWidth onClick={() => navigate('/trainer/edit')}>
          <Pencil size={16} /> Edit Trainer
        </PixelButton>
      </div>
    </div>
  );
}
