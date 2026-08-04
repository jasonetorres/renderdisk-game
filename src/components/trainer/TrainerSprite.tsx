import { useEffect, useRef, useState } from 'react';
import type { TrainerAppearance } from '@/data/trainer2/types';
import { composeTrainerSprite } from '@/lib/trainerSprite';

export function TrainerSprite({
  appearance,
  scale = 4,
  className = '',
}: {
  appearance: TrainerAppearance;
  scale?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // Keep previous src so there's no blank flash while next compose runs
  const prevSrcRef = useRef<string | null>(null);

  // Compute key from primitives — no useMemo, so useEffect always sees the
  // real current values and fires reliably when any appearance field changes.
  const key = [
    appearance.body,
    appearance.top,
    appearance.bottom,
    appearance.shoes,
    appearance.head,
    appearance.eyes,
    appearance.faceAcc ?? 'none',
    appearance.hair,
    appearance.headwear ?? 'none',
    appearance.hairFront,
    appearance.skinTone ?? 'skin-3',
    appearance.hairColor ?? '#3d1f0e',
    appearance.topColor ?? '#1848c0',
    appearance.bottomColor ?? '#163068',
    appearance.bottomColor2 ?? '#0a1040',
    appearance.version,
  ].join('|');

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    composeTrainerSprite(appearance)
      .then((url) => {
        if (!cancelled) {
          prevSrcRef.current = url;
          setSrc(url);
          setFailed(false);
        }
      })
      .catch((err) => {
        console.error('[TrainerSprite] compose failed:', err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const size = 48 * scale;
  const displaySrc = src ?? prevSrcRef.current;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    >
      {displaySrc ? (
        <img
          src={displaySrc}
          alt=""
          width={size}
          height={size}
          draggable={false}
          style={{
            width: size,
            height: size,
            imageRendering: 'pixelated',
          }}
        />
      ) : failed ? (
        /* Fallback: pixel-art silhouette placeholder */
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center bg-ink-800 border-2 border-ink-600 rounded"
        >
          <span style={{ fontSize: size * 0.5 }}>🧑</span>
        </div>
      ) : (
        /* Loading: dim placeholder */
        <div
          style={{ width: size, height: size }}
          className="bg-ink-800 animate-pulse rounded"
        />
      )}
    </div>
  );
}
