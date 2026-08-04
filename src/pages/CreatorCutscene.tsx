/**
 * CreatorCutscene — fires when a player qualifies and taps Jason's bracelet.
 *
 * Sequence (total ~9s, skippable after text crawl):
 *   0.0s  CRT power-on scan line expands
 *   0.8s  Glitch cascade — grid corrupts, RGB split
 *   2.5s  Text crawl — 3 lines, one by one
 *   6.0s  Sprite slam — Jason drops from top, screen shake
 *   7.2s  Title card — gold flash, name, "FINAL ENCOUNTER"
 *   9.0s  Auto-advance → /battle
 *
 * Tap anywhere after text starts to skip straight to battle.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';
import { CREATOR } from '@/data/species';
import { audio } from '@/audio/engine';
import type { BattleConfig } from '@/game/battle';

// ─── Types ───────────────────────────────────────────────────────────────────

type CutPhase =
  | 'crt'        // scan line boot
  | 'glitch'     // corruption cascade
  | 'text'       // dramatic lines
  | 'sprite'     // Jason drops in
  | 'title'      // FINAL ENCOUNTER card
  | 'done';      // transitioning out

const LINES = [
  'You found all the disks.',
  'You beat every guardian.',
  "You weren't supposed to make it this far.",
];

// ─── Glitch overlay ───────────────────────────────────────────────────────────

function GlitchLayer() {
  return (
    <>
      {/* RGB channel split — red */}
      <motion.div
        className="absolute inset-0 bg-ember-500/10 pointer-events-none"
        animate={{ x: [0, -6, 4, -2, 0], opacity: [0, 0.6, 0.3, 0.8, 0] }}
        transition={{ duration: 0.6, times: [0, 0.2, 0.5, 0.8, 1] }}
        style={{ mixBlendMode: 'screen' }}
      />
      {/* RGB channel split — cyan */}
      <motion.div
        className="absolute inset-0 bg-ocean-400/10 pointer-events-none"
        animate={{ x: [0, 8, -4, 2, 0], opacity: [0, 0.5, 0.4, 0.7, 0] }}
        transition={{ duration: 0.6, times: [0, 0.2, 0.5, 0.8, 1] }}
        style={{ mixBlendMode: 'screen' }}
      />
      {/* Scanline grid flicker */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 bg-ink-300/20 pointer-events-none"
          style={{ top: `${(i / 8) * 100}%`, height: '2px' }}
          animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1, 0] }}
          transition={{
            duration: 0.18,
            delay: i * 0.04,
            ease: 'easeOut',
          }}
        />
      ))}
      {/* Random pixel blocks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`block-${i}`}
          className="absolute bg-white/30 pointer-events-none"
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            width: `${8 + Math.random() * 40}px`,
            height: `${4 + Math.random() * 12}px`,
          }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.12, delay: Math.random() * 0.4 }}
        />
      ))}
    </>
  );
}

// ─── Main cutscene ───────────────────────────────────────────────────────────

export function CreatorCutscene() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state as BattleConfig;

  const [phase, setPhase] = useState<CutPhase>('crt');
  const [shownLines, setShownLines] = useState(0);
  const [skippable, setSkippable] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const skippableRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  const goToBattle = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    timers.current.forEach(clearTimeout);
    audio.playMusic('menu'); // battle music starts in Battle.tsx
    setTimeout(() => navigate('/battle', { state: config }), 600);
  }, [exiting, navigate, config]);

  // ── Sequence controller ────────────────────────────────────────────────────
  useEffect(() => {
    audio.stopMusic();

    // CRT boot → glitch
    addTimer(() => setPhase('glitch'), 800);

    // Glitch → text
    addTimer(() => { setPhase('text'); }, 2000);

    // Reveal lines one by one
    addTimer(() => setShownLines(1), 2600);
    addTimer(() => setShownLines(2), 3800);
    addTimer(() => { setShownLines(3); setSkippable(true); skippableRef.current = true; }, 5000);

    // Text → sprite
    addTimer(() => setPhase('sprite'), 6200);

    // Screen shake on "landing"
    addTimer(() => setScreenShake(true), 6700);
    addTimer(() => setScreenShake(false), 7000);

    // Sprite → title
    addTimer(() => setPhase('title'), 7400);

    // Auto-advance
    addTimer(() => goToBattle(), 9200);

    return () => timers.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTap() {
    if (skippableRef.current) goToBattle();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="cutscene"
          className="fixed inset-0 z-[100] bg-ink-950 flex flex-col items-center justify-center overflow-hidden select-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            x: screenShake ? [0, -8, 6, -4, 3, 0] : 0,
            y: screenShake ? [0, 4, -6, 3, -2, 0] : 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: exiting ? 0.5 : 0.3 }}
          onClick={handleTap}
        >

          {/* ── CRT PHASE: scan line boot ── */}
          <AnimatePresence>
            {phase === 'crt' && (
              <motion.div key="crt" className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                {/* Horizontal scan line expanding */}
                <motion.div
                  className="absolute bg-ink-200/80"
                  style={{ left: 0, right: 0, height: 2 }}
                  initial={{ scaleY: 1, scaleX: 0 }}
                  animate={{ scaleX: 1, scaleY: [1, 40, 1] }}
                  transition={{ duration: 0.7, times: [0, 0.5, 1], ease: 'easeInOut' }}
                />
                {/* CRT flicker overlay */}
                <motion.div
                  className="absolute inset-0 bg-ink-200/5"
                  animate={{ opacity: [0, 1, 0, 1, 0] }}
                  transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.6, 1] }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── GLITCH PHASE ── */}
          <AnimatePresence>
            {phase === 'glitch' && (
              <motion.div key="glitch" className="absolute inset-0"
                initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {/* Pseudo overworld grid that corrupts */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-12 opacity-20">
                  {Array.from({ length: 96 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="border border-ink-600/30"
                      animate={{ backgroundColor: ['transparent', '#1f2d1f', 'transparent'] }}
                      transition={{ duration: 0.1, delay: Math.random() * 0.5, repeat: 2 }}
                    />
                  ))}
                </div>
                <GlitchLayer />
                {/* "ERROR" text flash */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ opacity: [0, 1, 0, 1, 0] }}
                  transition={{ duration: 0.5 }}>
                  <span className="font-pixel text-ember-500 text-xs tracking-[0.3em] opacity-60">
                    SYSTEM CORRUPTED
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TEXT PHASE ── */}
          <AnimatePresence>
            {(phase === 'text' || phase === 'sprite') && shownLines > 0 && (
              <motion.div
                key="text-lines"
                className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8"
                initial={{ opacity: 1 }}
                animate={{ opacity: phase === 'sprite' ? 0 : 1 }}
                transition={{ duration: 0.5 }}
              >
                {LINES.map((line, i) => (
                  <AnimatePresence key={i}>
                    {shownLines > i && (
                      <motion.p
                        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`font-pixel text-center leading-loose ${
                          i === 2
                            ? 'text-gold-300 text-sm'
                            : 'text-ink-300 text-xs'
                        }`}
                      >
                        {line}
                      </motion.p>
                    )}
                  </AnimatePresence>
                ))}

                {/* Skip hint */}
                {skippable && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
                    className="absolute bottom-12 font-body text-ink-600 text-xs tracking-widest uppercase"
                  >
                    tap to skip
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SPRITE PHASE: Jason drops in ── */}
          <AnimatePresence>
            {phase === 'sprite' && (
              <motion.div
                key="sprite"
                className="absolute inset-0 flex flex-col items-end justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Gold radial glow behind sprite */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(180,130,10,0.18) 0%, transparent 70%)',
                  }}
                  animate={{ opacity: [0, 1] }}
                  transition={{ duration: 0.4 }}
                />

                {/* Sprite */}
                <motion.div
                  className="w-full flex justify-center"
                  initial={{ y: '-100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                >
                  <img
                    src={CREATOR.spriteUrl}
                    alt={CREATOR.name}
                    style={{
                      height: 260,
                      imageRendering: 'pixelated',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 32px rgba(200,160,20,0.6))',
                    }}
                    draggable={false}
                  />
                </motion.div>

                {/* Impact dust rings when sprite lands */}
                <motion.div
                  className="absolute bottom-[38%] left-1/2 -translate-x-1/2"
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
                >
                  <div className="w-24 h-3 rounded-full border-2 border-gold-400/50" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TITLE PHASE ── */}
          <AnimatePresence>
            {phase === 'title' && (
              <motion.div
                key="title"
                className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Gold flash */}
                <motion.div
                  className="absolute inset-0 bg-gold-400"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                {/* Lingering sprite silhouette */}
                <motion.img
                  src={CREATOR.spriteUrl}
                  alt=""
                  style={{ height: 180, imageRendering: 'pixelated', objectFit: 'contain' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="drop-shadow-[0_0_40px_rgba(200,160,20,0.8)]"
                  draggable={false}
                />

                {/* Name */}
                <motion.div
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="text-center px-6"
                >
                  <p className="font-pixel text-gold-300 text-lg tracking-wider mb-1">
                    {CREATOR.name}
                  </p>
                  <p className="font-body text-gold-600 text-sm mb-4">{CREATOR.title}</p>

                  {/* Warning badge */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.4, ease: 'easeOut' }}
                    className="border-2 border-gold-500 bg-gold-900/40 px-6 py-2 inline-block"
                  >
                    <span className="font-pixel text-gold-400 text-xs tracking-[0.2em]">
                      ⚠ FINAL ENCOUNTER ⚠
                    </span>
                  </motion.div>
                </motion.div>

                {/* Countdown pips */}
                <motion.div
                  className="absolute bottom-10 flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gold-500"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
