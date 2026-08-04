import type { TrainerAppearance } from '@/data/trainer2/types';
import { TrainerSprite } from './TrainerSprite';

export function TrainerPortrait({
  appearance,
  size = 96,
  className = '',
}: {
  appearance: TrainerAppearance;
  size?: number;
  className?: string;
}) {
  // Use CSS crop on the already-composed 48×48 sprite.
  // We zoom in and shift upward to frame head+shoulders.
  const scale = 4;
  const spriteSize = 48 * scale;

  // Tuned for the provided paste offsets.
  const zoom = 1.7;
  const dx = Math.round(spriteSize * 0.12);
  const dy = Math.round(spriteSize * 0.22);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}
    >
      <div
        style={{
          transform: `translate(${-dx}px, ${-dy}px) scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        <TrainerSprite appearance={appearance} scale={scale} />
      </div>
    </div>
  );
}

