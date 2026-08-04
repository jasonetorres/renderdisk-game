import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Trophy, BookOpen, ExternalLink,
  Twitter, Youtube, ArrowRight, Send, Disc,
} from 'lucide-react';
import { useGameStore, capturedCount } from '@/store/gameStore';
import { supabase, type GuestbookEntry, type LeaderboardRow } from '@/lib/supabase';

const FOLLOW_LINKS = [
  { label: 'Watch', desc: 'The 2024 video — where this started', icon: Youtube, href: 'https://www.youtube.com/watch?v=YKeVeG6h4AA&t=1s' },
  { label: 'Follow', desc: '@TasonJorres on X', icon: Twitter, href: 'https://x.com/TasonJorres' },
  { label: 'Build', desc: '@WebstormIDE on X', icon: Twitter, href: 'https://x.com/WebstormIDE' },
  { label: 'Learn', desc: 'Start.Dev', icon: BookOpen, href: 'https://start.dev' },
];

export function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const trainer = useGameStore((s) => s.trainer);
  const count = useGameStore((s) => capturedCount(s));

  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loadingGuestbook, setLoadingGuestbook] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [signName, setSignName] = useState('');
  const [signNote, setSignNote] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const initialTab = (location.state as { tab?: string } | null)?.tab === 'leaderboard' ? 'leaderboard' : 'guestbook';
  const [activeTab, setActiveTab] = useState<'guestbook' | 'leaderboard'>(initialTab);

  const fetchGuestbook = useCallback(async () => {
    setLoadingGuestbook(true);
    const { data, error } = await supabase
      .from('guestbook_entries')
      .select('id, name, note, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setGuestbook(error ? [] : (data as GuestbookEntry[]));
    setLoadingGuestbook(false);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('trainer_name, disk_id, created_at');
    if (error || !data) {
      setLeaderboard([]);
      setLoadingLeaderboard(false);
      return;
    }
    const map = new Map<string, { disks: Set<string>; latest: string }>();
    for (const row of data as { trainer_name: string; disk_id: string; created_at: string }[]) {
      const ex = map.get(row.trainer_name);
      if (ex) {
        ex.disks.add(row.disk_id);
        if (row.created_at > ex.latest) ex.latest = row.created_at;
      } else {
        map.set(row.trainer_name, { disks: new Set([row.disk_id]), latest: row.created_at });
      }
    }
    setLeaderboard(
      Array.from(map.entries())
        .map(([trainer_name, { disks, latest }]) => ({
          trainer_name,
          unique_disks: disks.size,
          latest_scan: latest,
        }))
        .sort((a, b) => b.unique_disks - a.unique_disks || (b.latest_scan > a.latest_scan ? 1 : -1))
        .slice(0, 20)
    );
    setLoadingLeaderboard(false);
  }, []);

  useEffect(() => {
    fetchGuestbook();
    fetchLeaderboard();
  }, [fetchGuestbook, fetchLeaderboard]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signName.trim() || !signNote.trim()) return;
    setSigning(true);
    setSignError(null);
    const { error } = await supabase
      .from('guestbook_entries')
      .insert({ name: signName.trim(), note: signNote.trim() });
    if (error) {
      setSignError('Could not sign the disk. Please try again.');
      setSigning(false);
      return;
    }
    setSignName('');
    setSignNote('');
    setSigning(false);
    fetchGuestbook();
  };

  return (
    <div className="min-h-screen bg-ink-900 text-ink-100">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 pb-8 px-5">
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/25 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-5">
            <Disc size={13} className="text-violet-400" />
            <span className="font-pixel text-[9px] tracking-[0.18em] text-violet-400 uppercase">
              RenderATL · August 2026
            </span>
          </div>

          <h1 className="font-pixel leading-tight text-ink-100 mb-3" style={{ fontSize: 'clamp(1.6rem, 8vw, 2.4rem)' }}>
            RENDER
            <span className="text-violet-300">DISK</span>
          </h1>

          <p className="font-body text-xl text-ink-400 leading-snug">
            A scavenger hunt. A thank you. A game.
          </p>
        </motion.div>
      </section>

      {/* ── GAME CTA ─────────────────────────────────────────────────────── */}
      <section className="px-5 py-4">
        <div className="bg-ink-800 border-2 border-ink-600 p-5">
          <div className="flex items-center gap-2 mb-1">
            <ScanLine size={18} className="text-forest-400 shrink-0" />
            <h3 className="font-pixel text-xs text-forest-300 uppercase tracking-wider">
              The Hunt
            </h3>
          </div>
          <p className="font-body text-xl text-ink-300 leading-snug mb-4">
            20 disks at RenderATL. Each one has a creature inside.
            Find them all to complete the set.
          </p>
          <button
            onClick={() => navigate('/game')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-4 font-pixel text-xs uppercase tracking-wider text-ink-900 bg-forest-500 border-2 border-forest-700 shadow-pixel transition-all hover:bg-forest-400 active:translate-y-0.5 active:shadow-none"
          >
            Enter RenderDisk <ArrowRight size={14} />
          </button>
          {trainer && (
            <p className="font-body text-lg text-ink-400 text-center mt-3">
              {trainer.name} · {count}/20 disks found
            </p>
          )}
        </div>
      </section>

      {/* ── FOLLOW THE THREAD ────────────────────────────────────────────── */}
      <section className="px-5 pt-6 pb-4">
        <h3 className="font-pixel text-[10px] text-ocean-400 uppercase tracking-wider mb-3">
          Follow the Thread
        </h3>
        <div className="space-y-2">
          {FOLLOW_LINKS.map((link, i) => (
            <button
              key={i}
              onClick={() => link.href && window.open(link.href, '_blank', 'noopener,noreferrer')}
              className="w-full flex items-center gap-3 p-3.5 bg-ink-800 border-2 border-ink-700 hover:border-ocean-600 transition-colors group"
            >
              <link.icon size={18} className="text-ocean-400 shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <span className="font-body text-xl text-ink-100">{link.label}</span>
                <p className="font-body text-base text-ink-400 truncate leading-tight">{link.desc}</p>
              </div>
              <ExternalLink size={15} className="text-ink-500 group-hover:text-ocean-400 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </section>

      {/* ── GUESTBOOK + LEADERBOARD ──────────────────────────────────────── */}
      <section className="px-5 pt-4 pb-6">
        <div className="flex gap-1.5 mb-4">
          {(['guestbook', 'leaderboard'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-pixel text-[10px] uppercase tracking-wider border-2 transition-all ${
                activeTab === tab
                  ? tab === 'guestbook'
                    ? 'bg-violet-700 border-violet-500 text-ink-100'
                    : 'bg-gold-700 border-gold-500 text-ink-900'
                  : 'bg-ink-800 border-ink-700 text-ink-400 hover:text-ink-200'
              }`}
            >
              {tab === 'guestbook' ? <BookOpen size={13} /> : <Trophy size={13} />}
              {tab === 'guestbook' ? 'Sign the Disk' : 'Leaderboard'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'guestbook' ? (
            <motion.div
              key="guestbook"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <form onSubmit={handleSign} className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Your name"
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-3.5 bg-ink-800 border-2 border-ink-700 text-ink-100 font-body text-xl placeholder:text-ink-500 focus:border-violet-500 focus:outline-none"
                />
                <textarea
                  placeholder="Where do you know me from? What do you remember?"
                  value={signNote}
                  onChange={(e) => setSignNote(e.target.value)}
                  maxLength={280}
                  rows={3}
                  className="w-full px-4 py-3 bg-ink-800 border-2 border-ink-700 text-ink-100 font-body text-xl placeholder:text-ink-500 focus:border-violet-500 focus:outline-none resize-none"
                />
                {signError && (
                  <p className="font-body text-lg text-rust-400">{signError}</p>
                )}
                <button
                  type="submit"
                  disabled={signing || !signName.trim() || !signNote.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 font-pixel text-[10px] uppercase tracking-wider text-ink-100 bg-violet-700 border-2 border-violet-900 shadow-pixel transition-all hover:bg-violet-600 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <Send size={13} /> {signing ? 'Signing...' : 'Sign It'}
                </button>
              </form>

              {loadingGuestbook ? (
                <p className="font-body text-xl text-ink-500 text-center py-6">Loading...</p>
              ) : guestbook.length === 0 ? (
                <p className="font-body text-xl text-ink-500 text-center py-6">
                  No signatures yet. Be the first.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="font-body text-base text-ink-500 mb-2">
                    {guestbook.length} {guestbook.length === 1 ? 'signature' : 'signatures'}
                  </p>
                  {guestbook.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-ink-800 border-2 border-ink-700 p-4"
                    >
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-body text-xl text-violet-300">{entry.name}</span>
                        <span className="font-body text-sm text-ink-500 shrink-0 ml-2">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-body text-lg text-ink-300 leading-snug">{entry.note}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {loadingLeaderboard ? (
                <p className="font-body text-xl text-ink-500 text-center py-6">Loading...</p>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-10">
                  <Trophy size={32} className="text-gold-600 mx-auto mb-3" />
                  <p className="font-body text-xl text-ink-500">
                    No hunters yet. Be the first.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.map((row, i) => {
                    const isYou = trainer && row.trainer_name === trainer.name;
                    return (
                      <motion.div
                        key={row.trainer_name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025 }}
                        className={`flex items-center gap-3 px-4 py-3 border-2 ${
                          isYou
                            ? 'bg-gold-800/40 border-gold-500'
                            : i === 0
                            ? 'bg-gold-900/25 border-gold-700'
                            : i < 3
                            ? 'bg-ink-700 border-ink-600'
                            : 'bg-ink-800 border-ink-700'
                        }`}
                      >
                        <span className={`font-pixel text-xs w-6 text-center shrink-0 ${
                          i === 0 ? 'text-gold-300' : i < 3 ? 'text-ink-200' : 'text-ink-500'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-xl text-ink-100 truncate leading-tight">
                            {row.trainer_name}
                            {isYou && <span className="text-gold-400"> (you)</span>}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-pixel text-sm text-gold-300">{row.unique_disks}</span>
                          <span className="font-body text-base text-ink-500">/20</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="px-5 py-8 text-center border-t border-ink-800">
        <p className="font-body text-lg text-ink-600 leading-snug">
          Made from a memory, you were a part of it.
          <br />
          Handed out in Atlanta.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Disc size={12} className="text-violet-700" />
          <span className="font-body text-base text-ink-700">RenderDisk v1.0</span>
        </div>
      </footer>
    </div>
  );
}
