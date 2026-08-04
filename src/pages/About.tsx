import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSfx } from '@/audio/engine';
import { PixelText, BodyText, PixelPanel, AnimatedSprite } from '@/components/ui';
import { GUARDIANS, CREATOR, NORMAL_SPECIES } from '@/data/species';

export function About() {
  const navigate = useNavigate();
  const sfx = useSfx();

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
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
          About RenderDisk
        </PixelText>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
        {/* Story */}
        <PixelPanel variant="raised" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AnimatedSprite glyph="💾" size="sm" />
            <PixelText size="sm" className="text-forest-300">
              The Story
            </PixelText>
          </div>
          <BodyText className="text-ink-200 block mb-2">
            Long before cloud saves, digital storefronts, or online multiplayer, there was RenderDisk. No publisher claimed it. No company advertised it. Only twenty mysterious floppy disks remained.
          </BodyText>
          <BodyText className="text-ink-200 block mb-2">
            Each disk contained a single living creature known as a Diskling. These creatures were designed to travel from person to person — passed between friends, conferences, and curious builders.
          </BodyText>
          <BodyText className="text-ink-200 block">
            As floppy drives disappeared, so did the game. Or so everyone believed.
          </BodyText>
        </PixelPanel>

        {/* The Rediscovery */}
        <PixelPanel variant="raised" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AnimatedSprite glyph="🔍" size="sm" />
            <PixelText size="sm" className="text-ocean-300">
              The Rediscovery
            </PixelText>
          </div>
          <BodyText className="text-ink-200 block mb-2">
            Years later, the disks surfaced again — carried by Jason Torres himself. You find him, he hands you one, and whispers, "Take care of this one."
          </BodyText>
          <BodyText className="text-ink-200 block">
            Each disk has a number on it. Enter it here and a creature awakens. Every captured Diskling is recorded in your personal Binder, slowly rebuilding the forgotten world of RenderDisk.
          </BodyText>
        </PixelPanel>

        {/* The Hunt */}
        <PixelPanel variant="raised" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AnimatedSprite glyph="🗺️" size="sm" />
            <PixelText size="sm" className="text-forest-300">
              The Journey
            </PixelText>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="font-pixel text-[10px] text-gold-400 shrink-0 pt-1">01</span>
              <BodyText className="text-ink-200">Find Jason. He's got the disks. Track him down and he'll hand you one.</BodyText>
            </div>
            <div className="flex gap-2">
              <span className="font-pixel text-[10px] text-gold-400 shrink-0 pt-1">02</span>
              <BodyText className="text-ink-200">Enter the number written on it to awaken the creature inside and start the game.</BodyText>
            </div>
            <div className="flex gap-2">
              <span className="font-pixel text-[10px] text-gold-400 shrink-0 pt-1">03</span>
              <BodyText className="text-ink-200">Find more disks, enter their numbers, and collect every Diskling into your Binder.</BodyText>
            </div>
            <div className="flex gap-2">
              <span className="font-pixel text-[10px] text-gold-400 shrink-0 pt-1">04</span>
              <BodyText className="text-ink-200">Battle the four Guardians. Each one guards a piece of the legend.</BodyText>
            </div>
            <div className="flex gap-2">
              <span className="font-pixel text-[10px] text-gold-400 shrink-0 pt-1">05</span>
              <BodyText className="text-ink-200">Defeat all four and the Creator appears — Jason himself, with one final disk.</BodyText>
            </div>
            <div className="flex gap-2">
              <span className="font-pixel text-[10px] text-gold-400 shrink-0 pt-1">06</span>
              <BodyText className="text-ink-100">Beat the Creator and claim your prize. You didn't just finish the game — you proved you're ready to create your own.</BodyText>
            </div>
          </div>
        </PixelPanel>

        {/* Creatures */}
        <PixelPanel className="p-4">
          <PixelText size="sm" className="text-forest-300 mb-3 block">
            The Collection
          </PixelText>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <BodyText className="text-ink-200">Normal Monsters</BodyText>
              <span className="pixel-text-xs text-ink-300">{NORMAL_SPECIES.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <BodyText className="text-ink-200">Guardian Bosses</BodyText>
              <span className="pixel-text-xs text-ink-300">{GUARDIANS.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <BodyText className="text-ink-200">Final Boss</BodyText>
              <span className="pixel-text-xs text-gold-400">1 — The Creator</span>
            </div>
          </div>
        </PixelPanel>

        {/* Guardians */}
        <PixelPanel variant="gold" className="p-4">
          <PixelText size="sm" className="text-gold-300 mb-3 block">
            The Four Guardians
          </PixelText>
          <div className="space-y-3">
            {GUARDIANS.map((g) => (
              <div key={g.speciesId} className="border-l-2 border-gold-600 pl-3">
                <PixelText size="xs" className="text-gold-300">
                  {g.trainerName}
                </PixelText>
                <BodyText className="text-ink-300 block">
                  {g.title}
                </BodyText>
                <BodyText className="text-ink-400 block text-base">
                  {g.passive}
                </BodyText>
              </div>
            ))}
          </div>
        </PixelPanel>

        {/* Creator */}
        <PixelPanel variant="raised" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AnimatedSprite glyph="👑" size="sm" />
            <PixelText size="sm" className="text-rust-400">
              The Final Challenge
            </PixelText>
          </div>
          <BodyText className="text-ink-200 block mb-2">
            {CREATOR.name}, {CREATOR.title}. Only appears after all 20 monsters are captured and all 4 Guardians are defeated.
          </BodyText>
          <BodyText className="text-ink-300 block mb-2">
            Disk {CREATOR.diskId} — He does not fight. He commands. Creatorius fights for him.
          </BodyText>
          <BodyText className="text-gold-300 block">
            Defeat him and claim your prize. "You didn't just finish the game. You proved you're ready to create your own."
          </BodyText>
        </PixelPanel>

        {/* Credits */}
        <div className="text-center py-4">
          <PixelText size="xs" className="text-ink-500 block mb-1">
            RenderDisk v0.1.0
          </PixelText>
          <PixelText size="xs" className="text-ink-500">
            An original monster collection game
          </PixelText>
        </div>
      </div>
    </div>
  );
}
