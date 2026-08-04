import { motion } from 'framer-motion';
import type { GuardianTheme } from '@/data/species';

// ── Theme token map (matches the card images exactly) ───────────────────────
// purple  = April Gittens
// orange  = Danny Thompson
// blue    = Francesco Ciulla
// violet  = Roxy
// gold    = Jason Torres (final boss)

interface ThemeTokens {
  outerBorder:   string;
  innerBorder:   string;
  cardBg:        string;
  portraitBg:    string;
  nameColor:     string;
  infoBg:        string;
  infoBorder:    string;
  badgeBg:       string;
  badgeBorder:   string;
  badgeText:     string;
  diskIdColor:   string;
  subtitleColor: string;
  sparkleColor:  string;
  glow:          string;
}

const THEMES: Record<GuardianTheme | 'gold', ThemeTokens> = {
  purple: {
    outerBorder:   'border-violet-600',
    innerBorder:   'border-violet-300',
    cardBg:        'bg-violet-100',
    portraitBg:    'bg-[#f0e8f8]',
    nameColor:     'text-violet-700',
    infoBg:        'bg-violet-600',
    infoBorder:    'border-violet-400',
    badgeBg:       'bg-violet-800',
    badgeBorder:   'border-violet-400',
    badgeText:     'text-violet-100',
    diskIdColor:   'text-white',
    subtitleColor: 'text-violet-200',
    sparkleColor:  '#7B4FA6',
    glow:          'shadow-cardPurple',
  },
  violet: {
    outerBorder:   'border-violet-500',
    innerBorder:   'border-violet-200',
    cardBg:        'bg-[#f5f0fc]',
    portraitBg:    'bg-[#f8f2ff]',
    nameColor:     'text-violet-600',
    infoBg:        'bg-violet-500',
    infoBorder:    'border-violet-300',
    badgeBg:       'bg-violet-700',
    badgeBorder:   'border-violet-300',
    badgeText:     'text-violet-100',
    diskIdColor:   'text-white',
    subtitleColor: 'text-violet-100',
    sparkleColor:  '#7B4FA6',
    glow:          'shadow-cardViolet',
  },
  orange: {
    outerBorder:   'border-ember-500',
    innerBorder:   'border-ember-300',
    cardBg:        'bg-parchment-100',
    portraitBg:    'bg-[#fdf6ee]',
    nameColor:     'text-ember-600',
    infoBg:        'bg-ember-600',
    infoBorder:    'border-ember-400',
    badgeBg:       'bg-ember-700',
    badgeBorder:   'border-ember-400',
    badgeText:     'text-parchment-100',
    diskIdColor:   'text-white',
    subtitleColor: 'text-parchment-200',
    sparkleColor:  '#C85A1A',
    glow:          'shadow-cardOrange',
  },
  blue: {
    outerBorder:   'border-ocean-500',
    innerBorder:   'border-ocean-300',
    cardBg:        'bg-[#f0f5ff]',
    portraitBg:    'bg-[#f5f8ff]',
    nameColor:     'text-ocean-600',
    infoBg:        'bg-ocean-600',
    infoBorder:    'border-ocean-400',
    badgeBg:       'bg-ocean-700',
    badgeBorder:   'border-ocean-400',
    badgeText:     'text-ocean-100',
    diskIdColor:   'text-white',
    subtitleColor: 'text-ocean-100',
    sparkleColor:  '#3B6EC5',
    glow:          'shadow-cardBlue',
  },
  gold: {
    outerBorder:   'border-gold-500',
    innerBorder:   'border-gold-400',
    cardBg:        'bg-ink-900',
    portraitBg:    'bg-[#f8f5ff]',
    nameColor:     'text-gold-400',
    infoBg:        'bg-gold-600',
    infoBorder:    'border-gold-400',
    badgeBg:       'bg-ink-900',
    badgeBorder:   'border-gold-400',
    badgeText:     'text-gold-400',
    diskIdColor:   'text-gold-300',
    subtitleColor: 'text-gold-500',
    sparkleColor:  '#C8960A',
    glow:          'shadow-cardGold',
  },
};

interface TrainerCardProps {
  name: string;
  diskId: string;
  badgeLabel: string;
  title: string;
  theme: GuardianTheme | 'gold';
  imageUrl: string;
  /** Scale the card smaller for list views */
  compact?: boolean;
  onClick?: () => void;
  defeated?: boolean;
}

export function TrainerCard({
  name,
  diskId,
  badgeLabel,
  title,
  theme,
  imageUrl,
  compact = false,
  onClick,
  defeated = false,
}: TrainerCardProps) {
  const t = THEMES[theme];

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.03, y: -4 } : {}}
      whileTap={onClick ? { scale: 0.97 } : {}}
      onClick={onClick}
      className={`
        relative rounded-2xl border-4 ${t.outerBorder} ${t.cardBg}
        ${t.glow} select-none overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${defeated ? 'ring-2 ring-gold-400' : ''}
        ${compact ? 'w-40' : 'w-full max-w-xs mx-auto'}
      `}
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {/* Inner border inset */}
      <div className={`absolute inset-[6px] rounded-xl border-2 ${t.innerBorder} pointer-events-none z-10`} />

      {/* Corner sparkles */}
      <Sparkle color={t.sparkleColor} position="top-left"  compact={compact} />
      <Sparkle color={t.sparkleColor} position="top-right" compact={compact} />

      {/* Trainer name header */}
      <div className="relative z-20 pt-3 pb-1 px-4 text-center">
        <span
          className={`
            ${t.nameColor} font-pixel uppercase tracking-wide
            ${compact ? 'text-[8px]' : 'text-xs'}
          `}
          style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.15)' }}
        >
          {name}
        </span>
      </div>

      {/* Portrait area */}
      <div className={`relative z-20 mx-3 ${t.portraitBg} overflow-hidden`} style={{ borderRadius: '4px' }}>
        <img
          src={imageUrl}
          alt={name}
          className={`
            w-full object-contain object-center
            ${compact ? 'h-36' : 'h-72'}
            ${defeated ? 'grayscale-[20%]' : ''}
          `}
          draggable={false}
        />
        {defeated && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span
              className="font-pixel text-gold-400 text-[10px] rotate-[-15deg]"
              style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.8)' }}
            >
              DEFEATED
            </span>
          </div>
        )}
      </div>

      {/* Bottom info panel */}
      <div
        className={`
          relative z-20 ${t.infoBg} border-t-2 ${t.infoBorder}
          ${compact ? 'px-2 pt-2 pb-2' : 'px-4 pt-3 pb-4'}
          flex flex-col items-center gap-1 mt-2
        `}
        style={{ borderRadius: '0 0 14px 14px', marginTop: '-1px' }}
      >
        {/* Badge pill */}
        <span
          className={`
            inline-block ${t.badgeBg} border ${t.badgeBorder} ${t.badgeText}
            font-pixel uppercase tracking-widest rounded-sm
            ${compact ? 'text-[7px] px-1.5 py-0.5' : 'text-[9px] px-3 py-1'}
          `}
        >
          {badgeLabel}
        </span>

        {/* Disk ID */}
        <span
          className={`
            font-pixel ${t.diskIdColor} block text-center
            ${compact ? 'text-sm' : 'text-2xl'}
          `}
          style={{ textShadow: '1px 2px 0 rgba(0,0,0,0.4)' }}
        >
          {diskId}
        </span>

        {/* Subtitle */}
        <span
          className={`
            font-body ${t.subtitleColor} block text-center
            ${compact ? 'text-sm' : 'text-xl'}
          `}
        >
          {title}
        </span>
      </div>
    </motion.div>
  );
}

// ── Corner sparkle decoration ─────────────────────────────────────────────────

function Sparkle({
  color,
  position,
  compact,
}: {
  color: string;
  position: 'top-left' | 'top-right';
  compact: boolean;
}) {
  const size = compact ? 10 : 14;
  const pos = position === 'top-left'
    ? { top: compact ? 8 : 12, left: compact ? 8 : 12 }
    : { top: compact ? 8 : 12, right: compact ? 8 : 12 };

  return (
    <motion.svg
      animate={{ rotate: [0, 20, 0, -20, 0], scale: [1, 1.2, 1, 1.2, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute z-30 pointer-events-none"
      style={pos}
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill={color}
    >
      {/* 4-point star / diamond sparkle */}
      <polygon points="7,0 8.5,5.5 14,7 8.5,8.5 7,14 5.5,8.5 0,7 5.5,5.5" />
    </motion.svg>
  );
}
