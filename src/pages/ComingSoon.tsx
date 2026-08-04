import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction } from 'lucide-react';
import { useSfx } from '@/audio/engine';
import { PixelButton, PixelText, BodyText, PixelPanel, AnimatedSprite } from '@/components/ui';

export function ComingSoon({ feature, phase }: { feature: string; phase: string }) {
  const navigate = useNavigate();
  const sfx = useSfx();

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-6">
          <AnimatedSprite glyph="💾" size="lg" />
        </div>
        <PixelPanel variant="raised" className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <Construction size={32} className="text-gold-400" />
          </div>
          <PixelText size="md" className="text-gold-400 mb-3 block">
            Under Construction
          </PixelText>
          <BodyText className="text-ink-200 block mb-2">
            {feature}
          </BodyText>
          <BodyText className="text-ink-400 block mb-6">
            This feature arrives in {phase}.
          </BodyText>
          <PixelButton
            variant="primary"
            fullWidth
            onClick={() => {
              sfx.cancel();
              navigate('/');
            }}
          >
            <ArrowLeft size={16} /> Back to Menu
          </PixelButton>
        </PixelPanel>
      </motion.div>
    </div>
  );
}
