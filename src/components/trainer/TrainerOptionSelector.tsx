import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PixelText } from '@/components/ui';

export function TrainerOptionSelector<T extends { id: string; label: string }>({
  label,
  value,
  options,
  onChange,
  ariaLabelPrev,
  ariaLabelNext,
}: {
  label: string;
  value: string | null;
  options: T[];
  onChange: (id: string) => void;
  ariaLabelPrev: string;
  ariaLabelNext: string;
}) {
  if (options.length <= 1) {
    const single = options[0];
    if (!single) return null;
    return (
      <div className="py-2">
        <PixelText size="xs" className="text-ink-300 mb-2 block">
          {label}
        </PixelText>
        <div className="bg-ink-900 border-2 border-ink-600 px-3 py-3">
          <span className="font-body text-base text-ink-100 leading-none">{single.label}</span>
        </div>
      </div>
    );
  }

  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  const current = options[idx] ?? options[0]!;

  function cycle(dir: 1 | -1) {
    const next = (idx + dir + options.length) % options.length;
    onChange(options[next]!.id);
  }

  return (
    <div className="py-2">
      <PixelText size="xs" className="text-ink-300 mb-2 block">
        {label}
      </PixelText>

      <div className="flex items-stretch gap-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => cycle(-1)}
          className="pixel-btn !px-3 !py-3 shrink-0"
          aria-label={ariaLabelPrev}
        >
          <ChevronLeft size={18} />
        </motion.button>

        <div className="flex-1 flex items-center justify-center bg-ink-900 border-2 border-ink-600 px-3 py-3 min-w-0">
          <span className="font-body text-base text-ink-100 truncate leading-none">{current.label}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => cycle(1)}
          className="pixel-btn !px-3 !py-3 shrink-0"
          aria-label={ariaLabelNext}
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}

