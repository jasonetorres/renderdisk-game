import { motion } from 'framer-motion';
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import type React from 'react';
import { useSfx } from '@/audio/engine';

// ── PixelPanel ───────────────────────────────────────────────────────────────
// A bordered container with the SNES-style beveled frame.

export function PixelPanel({
  children,
  className = '',
  variant = 'default',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'raised' | 'gold';
}) {
  const frameClass =
    variant === 'raised' ? 'pixel-frame-raised' : variant === 'gold' ? 'pixel-frame-gold' : 'pixel-frame';
  return (
    <div className={`${frameClass} ${className}`}>
      {children}
    </div>
  );
}

// ── PixelButton ──────────────────────────────────────────────────────────────

type ButtonVariant = 'default' | 'primary' | 'ember' | 'ocean' | 'gold';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
}

export function PixelButton({
  variant = 'default',
  children,
  fullWidth = false,
  onClick,
  className = '',
  ...rest
}: PixelButtonProps) {
  const sfx = useSfx();
  const variantClass =
    variant === 'primary' ? 'pixel-btn-primary'
    : variant === 'ember' ? 'pixel-btn-ember'
    : variant === 'ocean' ? 'pixel-btn-ocean'
    : variant === 'gold' ? 'pixel-btn-gold'
    : '';

  return (
    <button
      className={`pixel-btn ${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={(e) => {
        sfx.select();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── PixelText ────────────────────────────────────────────────────────────────

export function PixelText({
  children,
  size = 'md',
  className = '',
  shadow = true,
}: {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  shadow?: boolean;
}) {
  const sizeClass =
    size === 'xs' ? 'pixel-text-xs'
    : size === 'sm' ? 'pixel-text-sm'
    : size === 'lg' ? 'pixel-text-lg'
    : 'pixel-text';
  return (
    <span className={`${sizeClass} ${shadow ? 'text-shadow-pixel-sm' : ''} ${className}`}>
      {children}
    </span>
  );
}

// ── BodyText ──────────────────────────────────────────────────────────────────

export function BodyText({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`body-text ${className}`} style={style}>
      {children}
    </span>
  );
}

// ── HealthBar ────────────────────────────────────────────────────────────────

export function HealthBar({
  current,
  max,
  showNumbers = true,
  label = 'HP',
}: {
  current: number;
  max: number;
  showNumbers?: boolean;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color =
    pct > 50 ? 'bg-forest-500'
    : pct > 20 ? 'bg-gold-500'
    : 'bg-rust-500';

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="pixel-text-xs text-ink-200">{label}</span>
        {showNumbers && (
          <span className="pixel-text-xs text-ink-100 ml-auto">
            {Math.ceil(current)}/{max}
          </span>
        )}
      </div>
      <div className="h-3 bg-ink-900 border-2 border-ink-900 overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── XpBar ────────────────────────────────────────────────────────────────────

export function XpBar({ current, needed }: { current: number; needed: number }) {
  const pct = Math.max(0, Math.min(100, (current / needed) * 100));
  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="pixel-text-xs text-ocean-300">XP</span>
        <span className="pixel-text-xs text-ink-300 ml-auto">
          {current}/{needed}
        </span>
      </div>
      <div className="h-2 bg-ink-900 border-2 border-ink-900 overflow-hidden">
        <motion.div
          className="h-full bg-ocean-400"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── ElementTag ────────────────────────────────────────────────────────────────

import type { Element } from '@/types/game';
import { ELEMENT_COLORS } from '@/data/elements';

export function ElementTag({ element, size = 'md' }: { element: Element; size?: 'sm' | 'md' }) {
  const colors = ELEMENT_COLORS[element];
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 pixel-text-xs' : 'px-2 py-1 pixel-text-xs';
  return (
    <span
      className={`inline-block ${colors.bg} ${colors.text} border-2 ${colors.border} ${sizeClass} uppercase`}
    >
      {element}
    </span>
  );
}

// ── RarityTag ─────────────────────────────────────────────────────────────────

import type { Rarity } from '@/types/game';

const RARITY_COLORS: Record<Rarity, string> = {
  Common: 'text-ink-200',
  Uncommon: 'text-forest-400',
  Rare: 'text-ocean-400',
  Boss: 'text-ember-400',
  Legendary: 'text-gold-400',
};

export function RarityTag({ rarity }: { rarity: Rarity }) {
  return (
    <span className={`pixel-text-xs uppercase ${RARITY_COLORS[rarity]}`}>
      {rarity}
    </span>
  );
}

// ── CRTOverlay ────────────────────────────────────────────────────────────────

export function CRTOverlay() {
  return (
    <>
      <div className="crt-overlay" />
      <div className="vignette" />
    </>
  );
}

// ── AnimatedSprite ───────────────────────────────────────────────────────────
// A simple bouncing emoji-based sprite placeholder. Phase 3 will replace
// the glyph with actual pixel-art sprites, but the interface stays the same.

export function AnimatedSprite({
  glyph,
  size = 'md',
  idle = true,
}: {
  glyph: string;
  size?: 'sm' | 'md' | 'lg';
  idle?: boolean;
}) {
  const sizeClass =
    size === 'sm' ? 'text-3xl'
    : size === 'lg' ? 'text-7xl'
    : 'text-5xl';
  return (
    <motion.div
      className={`${sizeClass} select-none`}
      animate={idle ? { y: [0, -6, 0] } : {}}
      transition={idle ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      {glyph}
    </motion.div>
  );
}
