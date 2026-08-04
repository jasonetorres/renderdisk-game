import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useGameStore, capturedCount, maxHpAtLevel } from '@/store/gameStore';
import { useSfx } from '@/audio/engine';
import { NORMAL_SPECIES, BOSS_SPECIES, FINAL_BOSS } from '@/data/species';
import {
  PixelButton,
  PixelText,
  BodyText,
  PixelPanel,
  ElementTag,
  RarityTag,
  HealthBar,
  XpBar,
  AnimatedSprite,
} from '@/components/ui';
import { xpForLevel } from '@/store/gameStore';
import type { MonsterSpecies } from '@/types/game';

export function Binder() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const collection = useGameStore((s) => s.collection);
  const bossesDefeated = useGameStore((s) => s.bossesDefeated);
  const creatorDefeated = useGameStore((s) => s.creatorDefeated);
  const [selected, setSelected] = useState<MonsterSpecies | null>(null);

  const captured = capturedCount(useGameStore.getState());
  const total = NORMAL_SPECIES.length;
  const completionPct = Math.round((captured / total) * 100);

  return (
    <div className="min-h-[100dvh] flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <button
          onClick={() => {
            sfx.cancel();
            navigate('/game');
          }}
          className="pixel-btn !p-2"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <PixelText size="md" className="text-forest-400">
          Binder
        </PixelText>
      </div>

      {/* Completion bar */}
      <PixelPanel variant="raised" className="p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <PixelText size="xs" className="text-ink-200">
            Collection
          </PixelText>
          <PixelText size="xs" className="text-forest-400">
            {captured}/{total} — {completionPct}%
          </PixelText>
        </div>
        <div className="h-3 bg-ink-900 border-2 border-ink-900 overflow-hidden">
          <motion.div
            className="h-full bg-forest-500"
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </PixelPanel>

      {/* Only caught creatures */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {/* Normal caught */}
        {(() => {
          const caughtNormal = NORMAL_SPECIES.filter((s) => !!collection[s.id]);
          return caughtNormal.length > 0 ? (
            <>
              <PixelText size="xs" className="text-ink-300 mb-2 block">Your Creatures</PixelText>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {caughtNormal.map((species, idx) => (
                  <motion.button
                    key={species.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    onClick={() => { sfx.select(); setSelected(species); }}
                    className="aspect-square flex flex-col items-center justify-center border-2 bg-ink-700 border-ink-500 hover:border-forest-400 hover:-translate-y-0.5 transition-all"
                  >
                    {species.spriteImage ? (
                      <img src={species.spriteImage} alt={species.name} className="w-full h-full object-contain" draggable={false} />
                    ) : species.cardImage ? (
                      <img src={species.cardImage} alt={species.name} className="w-full h-full object-contain" draggable={false} />
                    ) : (
                      <AnimatedSprite glyph={species.sprite} size="sm" />
                    )}
                    <span className="pixel-text-xs text-ink-300 mt-0.5 truncate w-full text-center px-0.5">
                      {species.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <div className="py-10 text-center mb-6">
              <PixelText size="sm" className="text-ink-600 block">No creatures yet</PixelText>
              <BodyText className="text-ink-700 text-sm mt-1">Battle wild creatures in gym zones to capture them!</BodyText>
            </div>
          );
        })()}

        {/* Guardians caught */}
        {(() => {
          const caughtBosses = BOSS_SPECIES.filter((s) => !!collection[s.id] || bossesDefeated.includes(s.id));
          return caughtBosses.length > 0 ? (
            <>
              <PixelText size="xs" className="text-gold-400 mb-2 block">Guardians</PixelText>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {caughtBosses.map((species) => (
                  <button
                    key={species.id}
                    onClick={() => { sfx.select(); setSelected(species); }}
                    className="aspect-square flex flex-col items-center justify-center border-2 bg-gold-900 border-gold-600 hover:border-gold-400 transition-all"
                  >
                    {species.spriteImage ? (
                      <img src={species.spriteImage} alt={species.name} className="w-full h-full object-contain" draggable={false} />
                    ) : species.cardImage ? (
                      <img src={species.cardImage} alt={species.name} className="w-full h-full object-contain" draggable={false} />
                    ) : (
                      <AnimatedSprite glyph={species.sprite} size="sm" />
                    )}
                    <span className="pixel-text-xs text-gold-300 mt-0.5 truncate w-full text-center px-0.5">
                      {species.name}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null;
        })()}

        {/* Final boss caught */}
        {creatorDefeated && (
          <>
            <PixelText size="xs" className="text-rust-400 mb-2 block">Final Boss</PixelText>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => { sfx.select(); setSelected(FINAL_BOSS); }}
                className="aspect-square flex flex-col items-center justify-center border-2 bg-rust-900 border-rust-500 hover:border-rust-400 transition-all"
              >
                {FINAL_BOSS.cardImage ? (
                  <img src={FINAL_BOSS.cardImage} alt={FINAL_BOSS.name} className="w-full h-full object-contain" draggable={false} />
                ) : (
                  <AnimatedSprite glyph={FINAL_BOSS.sprite} size="sm" />
                )}
                <span className="pixel-text-xs text-rust-300 mt-0.5 truncate w-full text-center px-0.5">
                  {FINAL_BOSS.name}
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <MonsterDetail
          species={selected}
          instance={collection[selected.id]}
          onClose={() => {
            sfx.cancel();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function MonsterDetail({
  species,
  instance,
  onClose,
}: {
  species: MonsterSpecies;
  instance: ReturnType<typeof useGameStore.getState>['collection'][string];
  onClose: () => void;
}) {
  const isCaptured = !!instance;
  const maxHp = isCaptured ? maxHpAtLevel(species.baseHp, instance.level) : species.baseHp;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
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
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <PixelText size="md" className={isCaptured ? 'text-forest-300' : 'text-ink-500'}>
                {isCaptured ? species.name : '???'}
              </PixelText>
              <div className="flex items-center gap-2 mt-1">
                <span className="pixel-text-xs text-ink-400">{species.diskId}</span>
                {isCaptured && <RarityTag rarity={species.rarity} />}
              </div>
            </div>
            <div className="flex gap-1">
              <ElementTag element={species.element} size="sm" />
            </div>
          </div>

          {/* Sprite */}
          <div className="flex justify-center bg-ink-900 border-2 border-ink-700 py-6 mb-3">
            {isCaptured ? (
              species.spriteImage ? (
                <img src={species.spriteImage} alt={species.name} className="max-h-32 object-contain" draggable={false} />
              ) : species.cardImage ? (
                <img src={species.cardImage} alt={species.name} className="max-h-32 object-contain" draggable={false} />
              ) : (
                <AnimatedSprite glyph={species.sprite} size="lg" />
              )
            ) : species.spriteImage || species.cardImage ? (
              <img
                src={(species.spriteImage ?? species.cardImage) as string}
                alt="Undiscovered"
                className="max-h-32 object-contain opacity-20 brightness-0 saturate-100"
                draggable={false}
              />
            ) : (
              <Lock size={32} className="text-ink-600" />
            )}
          </div>

          {/* Description */}
          <BodyText className="text-ink-300 block mb-3 min-h-[3rem]">
            {isCaptured ? species.description : 'This creature has not been discovered yet.'}
          </BodyText>

          {/* Stats */}
          {isCaptured && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-ink-900 border-2 border-ink-700 rounded-lg p-3">
                  <PixelText size="xs" className="text-ink-500 block mb-1">Level</PixelText>
                  <PixelText size="md" className="text-forest-300">{instance.level}</PixelText>
                </div>
                <div className="bg-ink-900 border-2 border-ink-700 rounded-lg p-3">
                  <PixelText size="xs" className="text-ink-500 block mb-1">Element</PixelText>
                  <PixelText size="md" className="text-ink-100">{species.element}</PixelText>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <PixelText size="xs" className="text-ink-400">HP</PixelText>
                  <PixelText size="xs" className="text-ink-300">{instance.currentHp}/{maxHp}</PixelText>
                </div>
                <HealthBar current={instance.currentHp} max={maxHp} />
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <PixelText size="xs" className="text-ink-400">XP</PixelText>
                  <PixelText size="xs" className="text-ocean-400">{instance.experience}/{xpForLevel(instance.level)}</PixelText>
                </div>
                <XpBar current={instance.experience} needed={xpForLevel(instance.level)} />
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
                <StatRow label="ATK" value={species.baseAttack} />
                <StatRow label="DEF" value={species.baseDefense} />
                <StatRow label="SPD" value={species.baseSpeed} />
                <StatRow label="SP.ATK" value={species.baseSpecialAttack} />
                <StatRow label="SP.DEF" value={species.baseSpecialDefense} />
                <StatRow label="HP" value={species.baseHp} />
              </div>

              <div className="mb-3">
                <PixelText size="xs" className="text-ink-400 mb-1 block">
                  Signature Move
                </PixelText>
                <BodyText className="text-gold-300">{species.signatureMove}</BodyText>
              </div>
            </>
          )}

          <PixelButton fullWidth onClick={onClose}>
            Close
          </PixelButton>
        </PixelPanel>
      </motion.div>
    </motion.div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="pixel-text-xs text-ink-400">{label}</span>
      <span className="pixel-text-xs text-ink-100">{value}</span>
    </div>
  );
}
