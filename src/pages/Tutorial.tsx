import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useSfx } from '@/audio/engine';
import { PixelButton, PixelText, BodyText, PixelPanel } from '@/components/ui';

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to RenderDisk',
    body: 'Long ago, a forgotten indie studio pressed creatures onto floppy disks. The disks scattered across the world. You are a Disk Trainer — it is your job to find them all.',
  },
  {
    title: 'Your First Disk',
    body: 'Your first partner creature is now part of your collection. Nineteen more disks are still out there, waiting to be found.',
  },
  {
    title: 'Battling',
    body: 'Creatures battle turn-by-turn, just like the classic games. Use abilities, exploit elemental weaknesses, and level up your team. Win battles to grow stronger.',
  },
  {
    title: 'The Guardians',
    body: 'Four Guardians protect the secrets of RenderDisk. After 5 battles, the first Guardian appears on the map. Defeat each one to earn their badge. Only then will the Creator reveal himself.',
  },
];

export function Tutorial() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const completeTutorial = useGameStore((s) => s.completeTutorial);
  const [step, setStep] = useState(0);

  const handleNext = () => {
    sfx.confirm();
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeTutorial();
      navigate('/world');
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 pb-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col"
        >
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-4 mb-6">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 ${i === step ? 'bg-forest-400' : 'bg-ink-600'}`}
              />
            ))}
          </div>

          {/* Content */}
          <PixelPanel variant="raised" className="p-6 flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PixelText size="md" className="text-forest-300 block mb-4">
                {TUTORIAL_STEPS[step].title}
              </PixelText>
              <BodyText className="text-ink-200 block">
                {TUTORIAL_STEPS[step].body}
              </BodyText>
            </motion.div>
          </PixelPanel>

          {/* Navigation */}
          <div className="flex gap-2 mt-4">
            {step > 0 && (
              <PixelButton onClick={() => { sfx.cancel(); setStep(step - 1); }}>
                Back
              </PixelButton>
            )}
            <PixelButton variant="primary" fullWidth onClick={handleNext}>
              {step < TUTORIAL_STEPS.length - 1 ? (
                <>Next <ArrowRight size={14} /></>
              ) : (
                <>Enter the World <ArrowRight size={14} /></>
              )}
            </PixelButton>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
