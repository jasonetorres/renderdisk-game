import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useSfx } from '@/audio/engine';
import { audio } from '@/audio/engine';
import { PixelButton, PixelText, BodyText, AnimatedSprite } from '@/components/ui';

const CREDIT_LINES = [
  'RenderDisk',
  '',
  'The Creator has fallen.',
  'All disks have been found.',
  'The collection is complete.',
  '',
  'A forgotten indie game,',
  'reborn in the browser.',
  '',
  'Thank you for playing.',
  '',
  '— The End —',
];

export function Credits() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    audio.playMusic('credits');
  }, []);

  useEffect(() => {
    if (visibleLines >= CREDIT_LINES.length) return;
    const t = setTimeout(() => {
      setVisibleLines((v) => v + 1);
      if (CREDIT_LINES[visibleLines]) sfx.select();
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLines]);

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Starfield background */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gold-300"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Credits scroll */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        {CREDIT_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            {line === '— The End —' ? (
              <PixelText size="lg" className="text-gold-400 text-shadow-pixel">
                {line}
              </PixelText>
            ) : line === 'RenderDisk' ? (
              <div className="flex items-center gap-3 mb-6">
                <AnimatedSprite glyph="💾" size="md" />
                <PixelText size="lg" className="text-forest-400 text-shadow-pixel">
                  {line}
                </PixelText>
              </div>
            ) : line === '' ? (
              <div className="h-4" />
            ) : (
              <BodyText className="text-ink-200 text-center">
                {line}
              </BodyText>
            )}
          </motion.div>
        ))}
      </div>

      {/* Return button */}
      {visibleLines >= CREDIT_LINES.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mt-6"
        >
          <PixelButton
            variant="primary"
            onClick={() => {
              sfx.confirm();
              audio.playMusic('menu');
              navigate('/');
            }}
          >
            <Home size={16} /> Return Home
          </PixelButton>
        </motion.div>
      )}
    </div>
  );
}
