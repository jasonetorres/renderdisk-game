import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, ArrowRight } from 'lucide-react';
import { audio, useSfx } from '@/audio/engine';

// ── Scene data ────────────────────────────────────────────────────────────────

interface Scene {
  bg: string;
  accent: string;
  speaker?: string;
  text: string;
}

const SCENES: Scene[] = [
  {
    bg: 'from-ink-900 via-ink-900 to-violet-900/40',
    accent: 'text-violet-300',
    text: "RenderATL. June 2024. A crowd of badges and lanyards, and somewhere in it, someone who didn't belong there yet.",
  },
  {
    bg: 'from-ink-900 via-violet-900/30 to-ink-900',
    accent: 'text-violet-300',
    speaker: 'Jason',
    text: "Fifteen years in film and TV production. Not a single line on my résumé that said \"tech.\" I didn't even know community management was a job.",
  },
  {
    bg: 'from-ink-900 via-violet-900/30 to-ink-900',
    accent: 'text-violet-300',
    speaker: 'Jason',
    text: "But that weekend, Jason Lengstorf pointed a camera at me. A total accident. The right room at the right time.",
  },
  {
    bg: 'from-ink-900 via-ocean-900/30 to-ink-900',
    accent: 'text-ocean-300',
    speaker: 'Jason',
    text: "Three months later, somebody looked past the résumé and hired me anyway. Community & Ambassador Lead at Torc. My first real shot in tech.",
  },
  {
    bg: 'from-ink-900 via-forest-900/30 to-ink-900',
    accent: 'text-forest-300',
    speaker: 'Jason',
    text: "A year later, I was back at RenderATL. Not in the crowd this time. On stage. Emceeing. Nobody handed me that mic because I'd earned it. They handed it to me because people believed I could hold a room.",
  },
  {
    bg: 'from-ink-900 via-ember-900/30 to-ink-900',
    accent: 'text-ember-300',
    speaker: 'Jason',
    text: "March 2026. JetBrains. Developer Advocate for WebStorm. The kind of job I didn't know existed when I was standing in that crowd.",
  },
  {
    bg: 'from-ink-900 via-gold-900/30 to-ink-900',
    accent: 'text-gold-300',
    speaker: 'Jason',
    text: "Now I'm coming back for the third time. An instructor on start.dev. None of it happened in a straight line. It happened because people kept showing up for me.",
  },
  {
    bg: 'from-ink-900 via-gold-900/30 to-ink-900',
    accent: 'text-gold-300',
    speaker: 'Jason',
    text: "This disk is for them. For the people who were part of that, whether you knew it at the time or not.",
  },
  {
    bg: 'from-gold-900/40 via-ink-900 to-ink-900',
    accent: 'text-gold-300',
    speaker: 'Jason',
    text: "So thank you. For being part of the story, even the parts you don't remember being in.",
  },
  {
    bg: 'from-violet-900/50 via-ink-900 to-ink-900',
    accent: 'text-violet-300',
    text: "Now. 20 disks are at RenderATL. You find me, I hand you one. Each one holds a creature. Scan it to awaken it and enter the game.",
  },
  {
    bg: 'from-ocean-900/40 via-ink-900 to-ink-900',
    accent: 'text-ocean-300',
    speaker: 'Jason',
    text: "Find more disks. Scan them. Fill your Binder. Then battle the four Guardians — Roxy, Danny, Francesco, and April. Each one guards a piece of the legend.",
  },
  {
    bg: 'from-gold-900/40 via-ink-900 to-ink-900',
    accent: 'text-gold-300',
    speaker: 'Jason',
    text: "Beat all four and I'll see you at the end. One final disk. One final battle. Win, and there's a prize waiting. You didn't just finish the game — you proved you're ready to create your own.",
  },
];

const JASON_PORTRAIT = '/assets/images/cutscenes/jason_talkinghead_framed.png';

// ── Typewriter hook ───────────────────────────────────────────────────────────

function useTypewriter(text: string, speed: number, active: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    setDisplayed('');
    setDone(false);
    idxRef.current = 0;
    const interval = setInterval(() => {
      idxRef.current++;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, idxRef.current));
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Intro() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const scene = SCENES[sceneIdx];


  const { displayed, done, skip } = useTypewriter(scene.text, 28, started && !skipped);

  useEffect(() => {
    audio.playMusic('menu');
  }, []);

  // Auto-advance after text completes + a pause
  useEffect(() => {
    if (!started || skipped) return;
    if (!done) return;
    const timer = setTimeout(() => {
      if (sceneIdx < SCENES.length - 1) {
        setSceneIdx((i) => i + 1);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [done, sceneIdx, started, skipped]);

  const advance = useCallback(() => {
    if (skipped) return;
    if (!done) {
      skip();
      sfx.select();
      return;
    }
    sfx.confirm();
    if (sceneIdx < SCENES.length - 1) {
      setSceneIdx((i) => i + 1);
    }
  }, [done, skip, sceneIdx, sfx, skipped]);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, started]);

  const handleBegin = () => {
    sfx.confirm();
    navigate('/home');
  };

  const handleSkipAll = () => {
    sfx.cancel();
    setSkipped(true);
    navigate('/home');
  };

  // ── Start screen ─────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Disc size={14} className="text-violet-400" />
            <span className="font-pixel text-[9px] tracking-[0.18em] text-violet-400 uppercase">
              RenderDisk
            </span>
          </div>
          <h1 className="font-pixel text-ink-100 mb-4 text-center" style={{ fontSize: 'clamp(1rem, 5vw, 2rem)', lineHeight: 1.45, wordSpacing: '-0.05em' }}>
            <span className="block whitespace-nowrap">THREE RENDERS</span>
            <span className="block whitespace-nowrap">ONE THANK YOU</span>
          </h1>
          <p className="font-body text-xl text-ink-400 mb-10 leading-snug max-w-xs text-center mx-auto">
            A story before the hunt begins.
          </p>
          <button
            onClick={() => { sfx.select(); setStarted(true); }}
            className="px-8 py-4 font-pixel text-xs uppercase tracking-wider text-ink-900 bg-violet-400 border-2 border-violet-600 shadow-pixel transition-all hover:bg-violet-300 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Press Start
          </button>
          <button
            onClick={handleSkipAll}
            className="block mx-auto mt-4 font-body text-lg text-ink-500 hover:text-ink-300 transition-colors"
          >
            Skip story
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Final scene ──────────────────────────────────────────────────────────
  const isLast = sceneIdx === SCENES.length - 1;

  // ── Cutscene ──────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col cursor-pointer select-none"
      onClick={isLast && done ? handleBegin : advance}
    >
      {/* Background gradient transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`fixed inset-0 bg-gradient-to-b ${scene.bg} pointer-events-none`}
        />
      </AnimatePresence>

      {/* Scanline texture */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Skip button (top-right) */}
      <button
        onClick={(e) => { e.stopPropagation(); handleSkipAll(); }}
        className="absolute top-5 right-5 z-20 font-body text-base text-ink-500 hover:text-ink-300 transition-colors"
      >
        Skip
      </button>

      {/* ── Centered scene: character + speech bubble ─────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5">
        <motion.div
          key={sceneIdx}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 sm:gap-6 w-full max-w-2xl"
        >
          {/* Speech bubble */}
          <div className="relative flex-1 min-w-0">
            {/* Tail pointing right toward character */}
            <div className="absolute right-[-10px] top-7 w-0 h-0 border-y-[10px] border-y-transparent border-l-[12px] border-l-ink-600" />
            <div className="absolute right-[-7px] top-7 w-0 h-0 border-y-[8px] border-y-transparent border-l-[10px] border-l-ink-900/90 z-10" />

            <div className="bg-ink-900/90 border-2 border-ink-600 p-4 sm:p-5 backdrop-blur-sm">
              <p className="font-body text-lg sm:text-xl text-ink-100 leading-relaxed min-h-[4em] sm:min-h-[5em]">
                {displayed}
                {!done && <span className="animate-blink">_</span>}
              </p>
            </div>
          </div>

          {/* Character portrait */}
          <div className="shrink-0">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 overflow-hidden border-2 border-ink-600 bg-ink-800 shadow-pixel">
                <img
                  src={JASON_PORTRAIT}
                  alt="Jason Torres"
                  className="w-full h-full object-cover object-top"
                  draggable={false}
                />
              </div>
              {/* Name tag */}
              <div
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-ink-900 border border-ink-600 font-pixel text-[8px] uppercase tracking-wider text-gold-300 whitespace-nowrap`}
              >
                Jason
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom controls */}
        <div className="mt-8 flex items-center justify-between w-full max-w-2xl px-1">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {SCENES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === sceneIdx
                    ? 'w-6 bg-violet-400'
                    : i < sceneIdx
                    ? 'w-1.5 bg-violet-700'
                    : 'w-1.5 bg-ink-700'
                }`}
              />
            ))}
          </div>

          {/* Advance / Begin button */}
          {isLast && done ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={handleBegin}
              className="inline-flex items-center gap-2 px-6 py-3 font-pixel text-xs uppercase tracking-wider text-ink-900 bg-forest-500 border-2 border-forest-700 shadow-pixel transition-all hover:bg-forest-400 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Begin Your Hunt <ArrowRight size={14} />
            </motion.button>
          ) : done ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-ink-500"
            >
              <span className="font-body text-base">Tap to continue</span>
              <ArrowRight size={16} className="animate-pulse" />
            </motion.div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); skip(); sfx.select(); }}
              className="font-body text-base text-ink-500 hover:text-ink-300 transition-colors"
            >
              Skip text
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
