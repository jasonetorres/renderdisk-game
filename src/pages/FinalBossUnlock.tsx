import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { audio, useSfx } from '@/audio/engine';
import { PixelButton, PixelText, BodyText } from '@/components/ui';

type Stage = 'spinning' | 'burst' | 'reveal' | 'text';

export function FinalBossUnlock() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const [stage, setStage] = useState<Stage>('spinning');

  useEffect(() => {
    audio.playMusic('finalboss');

    const t1 = setTimeout(() => setStage('burst'), 2600);
    const t2 = setTimeout(() => setStage('reveal'), 3400);
    const t3 = setTimeout(() => setStage('text'), 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-y-auto px-4 py-8"
      style={{
        background:
          'radial-gradient(circle at 50% 35%, #3a3a5c 0%, #27273f 40%, #1a1a2e 100%)',
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Radial gold glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 'reveal' || stage === 'text' ? 0.7 : 0.3 }}
        transition={{ duration: 1.2 }}
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(251,191,36,0.28) 0%, rgba(15,15,27,0) 55%)',
        }}
      />

      {/* Scanline flicker on reveal */}
      {(stage === 'reveal' || stage === 'text') && (
        <motion.div
          className="absolute inset-0 pointer-events-none bg-white/10"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      )}

      {/* Spinning disk / burst / reveal */}
      <div className="relative z-10 flex flex-col items-center shrink-0">
        <AnimatePresence mode="wait">
          {stage === 'spinning' && (
            <motion.div
              key="disk"
              exit={{ opacity: 0, scale: 3 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 rounded-full blur-xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)',
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="relative w-28 h-28 sm:w-40 sm:h-40"
              >
                <FloppyDisk />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {stage === 'burst' && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-300"
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 600, height: 600, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}

        {(stage === 'reveal' || stage === 'text') && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="relative"
          >
            <div className="w-40 h-40 sm:w-56 sm:h-56 overflow-hidden border-4 border-gold-400 shadow-pixel bg-ink-700">
              <img
                src="/assets/images/finalboss/jason_torres_finalboss_card.png"
                alt="The Creator — the final boss"
                className="w-full h-full object-contain select-none"
                draggable={false}
              />
            </div>
            <motion.div
              className="absolute -top-3 -right-3 text-gold-200 font-pixel text-xs"
              animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              RD-000
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Text panel — readable on any background */}
      <div className="relative z-10 mt-6 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {stage === 'text' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="pixel-frame-gold p-5 text-center"
              style={{ backgroundColor: 'rgba(58, 58, 92, 0.95)' }}
            >
              <PixelText size="lg" className="text-gold-200 block mb-3">
                RD-000
              </PixelText>
              <BodyText className="block mb-2 text-xl leading-relaxed" style={{ color: '#ffffff' }}>
                The final disk has awakened.
              </BodyText>
              <BodyText className="block mb-3 text-xl leading-relaxed" style={{ color: '#ffffff' }}>
                All four Guardians have fallen. Only one trainer remains.
              </BodyText>
              <BodyText className="block mb-5 text-2xl leading-relaxed" style={{ color: '#fde68a' }}>
                Find Jason. End it.
              </BodyText>
              <PixelButton
                variant="gold"
                fullWidth
                onClick={() => {
                  sfx.confirm();
                  audio.playMusic('menu');
                  navigate('/world');
                }}
              >
                Continue
              </PixelButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Pixel-art floppy disk (SVG) ────────────────────────────────────────────────
function FloppyDisk() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
      role="img"
      aria-label="A spinning floppy disk"
    >
      <rect x="8" y="8" width="84" height="84" rx="4" fill="#1a1815" stroke="#fbbf24" strokeWidth="3" />
      <rect x="18" y="18" width="64" height="30" rx="2" fill="#f5f0e6" stroke="#d6cfc0" strokeWidth="1.5" />
      <line x1="24" y1="28" x2="76" y2="28" stroke="#c4bca8" strokeWidth="1.5" />
      <line x1="24" y1="34" x2="64" y2="34" stroke="#c4bca8" strokeWidth="1.5" />
      <line x1="24" y1="40" x2="70" y2="40" stroke="#c4bca8" strokeWidth="1.5" />
      <rect x="30" y="54" width="40" height="22" rx="1" fill="#9a9182" stroke="#6b6358" strokeWidth="1.5" />
      <rect x="44" y="56" width="12" height="18" fill="#1a1815" />
      <rect x="14" y="78" width="14" height="10" rx="1" fill="#0f0e0c" />
    </svg>
  );
}
