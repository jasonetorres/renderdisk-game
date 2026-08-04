import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Info, BookOpen, Disc, Map as MapIcon, Star, GraduationCap, Home } from 'lucide-react';
import { useGameStore, capturedCount } from '@/store/gameStore';
import { audio, useSfx } from '@/audio/engine';
import { PixelButton, PixelText, BodyText, PixelPanel, AnimatedSprite } from '@/components/ui';
import { TrainerSprite } from '@/components/trainer/TrainerSprite';

export function MainMenu() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const trainer = useGameStore((s) => s.trainer);
  const count = useGameStore((s) => capturedCount(s));
  const bosses = useGameStore((s) => s.bossesDefeated.length);
  const audioEnabled = useGameStore((s) => s.settings.audioEnabled);
  const tutorialComplete = useGameStore((s) => s.tutorialComplete);
  const [booting, setBooting] = useState(true);
  const [bootLine, setBootLine] = useState(0);

  const bootLines = [
    'RENDERDISK BIOS v1.98',
    'Checking disk drive... OK',
    'Loading disk library... OK',
    'Initializing render engine... OK',
    'Press any button to continue.',
  ];

  useEffect(() => {
    if (!booting) return;
    if (bootLine >= bootLines.length) return;
    const t = setTimeout(() => {
      setBootLine((l) => l + 1);
      audio.sfx('floppy');
    }, bootLine === 0 ? 300 : 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, bootLine]);

  useEffect(() => {
    if (!booting) {
      if (audioEnabled) audio.playMusic('menu');
    }
    return () => {};
  }, [booting, audioEnabled]);

  const handleBoot = () => {
    sfx.confirm();
    setBooting(false);
    audio.resume();
  };

  if (booting && bootLine < bootLines.length) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-ink-900 cursor-pointer"
        onClick={handleBoot}
      >
        <div className="w-full max-w-sm space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 flex justify-center"
          >
            <AnimatedSprite glyph="💾" size="lg" />
          </motion.div>
          {bootLines.slice(0, bootLine).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-forest-400 font-body text-lg">{`>`}</span>
              <BodyText className="text-forest-300">{line}</BodyText>
            </motion.div>
          ))}
          {bootLine < bootLines.length && (
            <span className="inline-block w-2 h-4 bg-forest-400 animate-blink" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 pb-6">
      {/* Title section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mt-6 mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <AnimatedSprite glyph="💾" size="md" />
          <h1 className="font-pixel text-2xl text-forest-400 text-shadow-pixel">
            RENDERDISK
          </h1>
        </div>
        <PixelText size="xs" className="text-ink-400">
          The Lost Disk Collection
        </PixelText>
      </motion.div>

      {/* Trainer card (if exists) */}
      {trainer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <PixelPanel variant="raised" className="p-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0 border-2 border-ink-600 overflow-hidden bg-ink-900 rounded">
                {trainer.appearance ? (
                  <button
                    type="button"
                    className="block"
                    onClick={() => navigate('/trainer/profile')}
                    aria-label="Open trainer profile"
                  >
                    <TrainerSprite appearance={trainer.appearance} scale={1} />
                  </button>
                ) : (
                  <span className="text-2xl">🧢</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <PixelText size="sm" className="text-forest-300 truncate">
                  {trainer.name}
                </PixelText>
                <div className="flex gap-3 mt-1">
                  <span className="pixel-text-xs text-ink-300">
                    {count}/20 Disks
                  </span>
                  <span className="pixel-text-xs text-gold-400">
                    {bosses}/4 Badges
                  </span>
                </div>
              </div>
            </div>
          </PixelPanel>
        </motion.div>
      )}

      {/* Menu buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 flex-1"
      >
        {!trainer ? (
          <div className="space-y-3">
            <PixelPanel variant="raised" className="p-5 text-center">
              <AnimatedSprite glyph="💾" size="md" />
              <PixelText size="sm" className="text-forest-300 block mt-3 mb-2">
                The Hunt
              </PixelText>
              <BodyText className="text-ink-300 block mb-1">
                20 disks at RenderATL. Each one has a creature inside. Scan them all to complete the set.
              </BodyText>
              <BodyText className="text-ink-400 block mt-3 text-base">
                Find Jason, get a disk, then enter the number written on it to begin.
              </BodyText>
            </PixelPanel>
            <PixelButton
              variant="primary"
              fullWidth
              onClick={() => navigate('/trainer/new')}
            >
              <GraduationCap size={16} /> Create Your Trainer
            </PixelButton>
            <PixelButton
              fullWidth
              onClick={() => navigate('/scan')}
            >
              <Disc size={16} /> Enter a Disk Code
            </PixelButton>
          </div>
        ) : !tutorialComplete ? (
          <PixelButton
            variant="primary"
            fullWidth
            onClick={() => navigate('/tutorial')}
          >
            <GraduationCap size={16} /> Begin Tutorial
          </PixelButton>
        ) : (
          <>
            <PixelButton
              variant="primary"
              fullWidth
              onClick={() => navigate('/world')}
            >
              <MapIcon size={16} /> Continue
            </PixelButton>
            <PixelButton
              fullWidth
              onClick={() => navigate('/scan')}
            >
              <Disc size={16} /> Enter Disk
            </PixelButton>
            <PixelButton
              fullWidth
              onClick={() => navigate('/binder')}
            >
              <BookOpen size={16} /> Binder
            </PixelButton>
            <PixelButton
              variant="gold"
              fullWidth
              onClick={() => navigate('/guardians')}
            >
              <Star size={16} /> Guardians
            </PixelButton>
          </>
        )}

        <div className="flex gap-3 mt-auto">
          <PixelButton
            fullWidth
            onClick={() => navigate('/settings')}
          >
            <Settings size={16} /> Settings
          </PixelButton>
          <PixelButton
            fullWidth
            onClick={() => navigate('/about')}
          >
            <Info size={16} /> About
          </PixelButton>
        </div>

        <PixelButton
          variant="gold"
          fullWidth
          onClick={() => navigate('/')}
          className="mt-3"
        >
          <Home size={16} /> Thank You Page
        </PixelButton>
      </motion.div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <PixelText size="xs" className="text-ink-500">
          v1.0.0 — RenderDisk
        </PixelText>
      </div>
    </div>
  );
}
