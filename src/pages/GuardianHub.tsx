/**
 * GuardianHub — private boss dashboard.
 * URL: /guardian-hub  (not linked from game nav — bosses get the URL directly)
 *
 * Tabs:
 *   Home        — sprite, NFC bracelet URL, passive ability
 *   Leaderboard — live player standings
 *   Boss Chat   — real-time private chat between the 5 bosses
 *   Lounge      — main player chat (bosses join public convo)
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Disc, ChevronRight, LogOut, Zap, Star,
  Trophy, Send, Home, Crown, Users,
} from 'lucide-react';
import { GUARDIANS, CREATOR, GYMS } from '@/data/species';
import { supabase } from '@/lib/supabase';
import type { LeaderboardRow, BossChatMessage } from '@/lib/supabase';
import { PixelText, BodyText, PixelPanel } from '@/components/ui';
import type { Guardian } from '@/data/species';

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY        = 'guardian-hub-code';
const BOSS_CHAT_CHANNEL  = 'boss-chat-v1';
const LOUNGE_CHANNEL     = 'renderdisk-lounge-v2';
const CHAT_LIMIT         = 80;

// Known boss names for badge display in lounge
export const BOSS_NAMES = new Set(
  [...GUARDIANS.map((g) => g.trainerName), CREATOR.name]
);

interface LoungeMsgDb {
  id: string;
  trainer_name: string;
  disk_count: number;
  text: string;
  created_at: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BossEntry {
  guardian: Guardian | null;
  isCreator: boolean;
  name: string;
  title: string;
  speciesId: string;
  diskId: string;
  theme: string;
  themeColors: { text: string; border: string; bg: string; glow: string };
  spriteUrl: string;
  accessCode: string;
}

type Tab = 'home' | 'leaderboard' | 'boss-chat' | 'lounge';

// ─── Theme colours ────────────────────────────────────────────────────────────

const THEME_COLORS: Record<string, BossEntry['themeColors']> = {
  violet: { text: 'text-violet-400', border: 'border-violet-500', bg: 'bg-violet-900/30', glow: 'shadow-[0_0_24px_rgba(130,80,200,0.4)]' },
  orange: { text: 'text-ember-400',  border: 'border-ember-500',  bg: 'bg-ember-900/30',  glow: 'shadow-[0_0_24px_rgba(200,85,30,0.4)]'  },
  blue:   { text: 'text-ocean-400',  border: 'border-ocean-500',  bg: 'bg-ocean-900/30',  glow: 'shadow-[0_0_24px_rgba(30,100,160,0.4)]'  },
  purple: { text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-900/30', glow: 'shadow-[0_0_24px_rgba(120,40,200,0.4)]'  },
  gold:   { text: 'text-gold-400',   border: 'border-gold-500',   bg: 'bg-gold-900/30',   glow: 'shadow-[0_0_24px_rgba(200,160,20,0.4)]'  },
};

const BOSS_CHIP_COLOR: Record<string, string> = {
  'ROXY-08':  'bg-violet-600',
  'DANNY-09': 'bg-ember-600',
  'FRAN-14':  'bg-ocean-600',
  'APRIL-17': 'bg-purple-600',
  'BOSS-23':  'bg-gold-600',
};

const BOSS_SPRITES: Record<string, string> = {
  'ROXY-08':  '/assets/images/boss-sprites/roxy.png',
  'DANNY-09': '/assets/images/boss-sprites/danny.png',
  'FRAN-14':  '/assets/images/boss-sprites/francesco.png',
  'APRIL-17': '/assets/images/boss-sprites/april.png',
  'BOSS-23':  '/assets/images/boss-sprites/jason.png',
};

// ─── Code resolution ──────────────────────────────────────────────────────────

function resolveCode(raw: string): BossEntry | null {
  const code = raw.trim().toUpperCase().replace(/\s/g, '');

  for (const g of GUARDIANS) {
    const canonical = g.accessCode.toUpperCase();
    if (code === canonical || code === canonical.replace(/-/g, '')) {
      return {
        guardian: g, isCreator: false,
        name: g.trainerName, title: g.title,
        speciesId: g.speciesId, diskId: g.diskId,
        theme: g.theme,
        themeColors: THEME_COLORS[g.theme] ?? THEME_COLORS.violet,
        spriteUrl: BOSS_SPRITES[g.accessCode] ?? '',
        accessCode: g.accessCode,
      };
    }
  }

  const cc = CREATOR.accessCode.toUpperCase();
  if (code === cc || code === cc.replace(/-/g, '')) {
    return {
      guardian: null, isCreator: true,
      name: CREATOR.name, title: CREATOR.title,
      speciesId: CREATOR.speciesId, diskId: CREATOR.diskId,
      theme: 'gold', themeColors: THEME_COLORS.gold,
      spriteUrl: BOSS_SPRITES[CREATOR.accessCode] ?? '',
      accessCode: CREATOR.accessCode,
    };
  }

  return null;
}

// ─── Code Entry ───────────────────────────────────────────────────────────────

function CodeEntry({ onSuccess }: { onSuccess: (entry: BossEntry, code: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry = resolveCode(value);
    if (entry) { setError(false); onSuccess(entry, value.trim().toUpperCase()); }
    else { setError(true); setTimeout(() => setError(false), 1200); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-ink-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={28} className="text-gold-400" />
            <PixelText size="lg" className="text-gold-300">Guardian Hub</PixelText>
          </div>
          <BodyText size="sm" className="text-ink-400">Bosses only. Enter your access code.</BodyText>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. ROXY-08"
              className={`w-full bg-ink-800 border-2 px-4 py-3 font-mono text-lg text-center tracking-widest uppercase outline-none transition-colors
                ${error ? 'border-ember-500 text-ember-400' : 'border-ink-600 text-ink-100 focus:border-gold-500'}`}
              autoComplete="off" autoCapitalize="characters" spellCheck={false}
            />
            <AnimatePresence>
              {error && (
                <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-ember-400 text-sm text-center mt-2 font-body">
                  Invalid code. Check with Jason.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <button type="submit" className="pixel-btn w-full py-3 flex items-center justify-center gap-2">
            <ChevronRight size={18} /><span>Enter Hub</span>
          </button>
        </form>
        <p className="text-ink-600 text-xs text-center mt-8 font-body">renderdisk.app/guardian-hub</p>
      </motion.div>
    </div>
  );
}

// ─── Home tab ─────────────────────────────────────────────────────────────────

function HomeTab({ entry }: { entry: BossEntry }) {
  const tc = entry.themeColors;

  return (
    <div className="space-y-4 pb-4">
      {/* Sprite */}
      <div className={`border-2 ${tc.border} ${tc.bg} ${tc.glow} px-6 py-3 flex items-end justify-center`}
        style={{ minHeight: 160 }}>
        {entry.spriteUrl
          ? <img src={entry.spriteUrl} alt={entry.name}
              style={{ height: 150, imageRendering: 'pixelated', objectFit: 'contain' }}
              draggable={false} />
          : <div className="w-24 h-36 bg-ink-700 flex items-center justify-center"><span className="text-4xl">🎮</span></div>
        }
      </div>
      <div className="text-center">
        <PixelText size="lg" className={`block ${tc.text}`}>{entry.name}</PixelText>
        <BodyText size="sm" className="block text-ink-400 mt-2">{entry.title}</BodyText>
      </div>

      {/* Passive / final boss note */}
      {entry.isCreator ? (
        <PixelPanel variant="gold" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-gold-400 fill-gold-400" />
            <PixelText size="xs" className="text-gold-300">Final Boss</PixelText>
          </div>
          <BodyText size="sm" className="text-ink-200">
            Players must defeat all 4 Guardians before they can challenge you. Your bracelet URL auto-locks until they're ready.
          </BodyText>
        </PixelPanel>
      ) : entry.guardian && (
        <PixelPanel variant="dark" className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-gold-400" />
            <PixelText size="xs" className="text-gold-300">Your Passive</PixelText>
          </div>
          <BodyText size="sm" className="text-ink-200 leading-relaxed">{entry.guardian.passive}</BodyText>
        </PixelPanel>
      )}

      {/* Gym info */}
      {!entry.isCreator && (() => {
        const gymDef = GYMS.find((g) => g.guardianIndex === GUARDIANS.findIndex((gr) => gr === entry.guardian));
        return gymDef ? (
          <PixelPanel variant="dark" className="p-4">
            <PixelText size="xs" className="block text-ink-400 mb-3">{gymDef.name}</PixelText>
            <BodyText size="xs" className="block text-ink-400 leading-relaxed">{gymDef.description}</BodyText>
          </PixelPanel>
        ) : null;
      })()}
    </div>
  );
}

// ─── Leaderboard tab ──────────────────────────────────────────────────────────

function LeaderboardTab() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from('leaderboard_entries').select('trainer_name, disk_id, created_at');
      if (!error && data) {
        const map: Record<string, { disks: Set<string>; latest: string }> = {};
        for (const row of data) {
          if (!map[row.trainer_name]) map[row.trainer_name] = { disks: new Set(), latest: row.created_at };
          map[row.trainer_name].disks.add(row.disk_id);
          if (row.created_at > map[row.trainer_name].latest) map[row.trainer_name].latest = row.created_at;
        }
        const sorted = Object.entries(map)
          .map(([trainer_name, v]) => ({ trainer_name, unique_disks: v.disks.size, latest_scan: v.latest }))
          .sort((a, b) => b.unique_disks - a.unique_disks || a.latest_scan.localeCompare(b.latest_scan))
          .slice(0, 30);
        setRows(sorted);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="font-body text-ink-500 text-center py-10">Loading...</p>;
  if (!rows.length) return <p className="font-body text-ink-500 text-center py-10">No entries yet.</p>;

  return (
    <div className="space-y-2 pb-4">
      <PixelText size="xs" className="text-ink-400 mb-3">Top Trainers — {rows.length} players</PixelText>
      {rows.map((row, i) => (
        <div key={row.trainer_name}
          className={`flex items-center gap-3 px-3 py-2 border ${
            i === 0 ? 'border-gold-500 bg-gold-900/20' :
            i === 1 ? 'border-ink-500 bg-ink-800' :
            i === 2 ? 'border-ember-700 bg-ember-900/20' :
            'border-ink-700 bg-ink-800/50'
          }`}>
          <span className={`font-pixel text-xs w-6 text-center shrink-0 ${
            i === 0 ? 'text-gold-400' : i === 1 ? 'text-ink-300' : i === 2 ? 'text-ember-400' : 'text-ink-500'
          }`}>{i + 1}</span>
          {i === 0 && <Crown size={12} className="text-gold-400 shrink-0" />}
          <span className="font-body text-sm text-ink-200 flex-1 truncate">{row.trainer_name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Disc size={12} className="text-ink-400" />
            <span className="font-pixel text-xs text-ink-300">{row.unique_disks}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared chat UI helper ────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  senderName: string;
  text: string;
  created_at: string;
  isBoss?: boolean;
}

function ChatView({
  messages,
  draft,
  sending,
  connected,
  myName,
  statusLabel,
  placeholder,
  onDraftChange,
  onSend,
  onKeyDown,
  inputRef,
  bottomRef,
}: {
  messages: ChatMsg[];
  draft: string;
  sending: boolean;
  connected: boolean;
  myName: string;
  statusLabel: string;
  placeholder: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
}) {
  const isMe = (m: ChatMsg) => m.senderName === myName;
  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] min-h-64">
      {/* Status */}
      <div className="flex items-center gap-2 pb-2 mb-1 border-b border-ink-700 shrink-0">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-forest-400' : 'bg-ink-600'}`} />
        <BodyText size="xs" className="text-ink-500">{connected ? statusLabel : 'Connecting...'}</BodyText>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-2 pr-1">
        {messages.length === 0 && (
          <p className="font-body text-ink-600 text-center text-sm py-6">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${isMe(m) ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded shrink-0 flex items-center justify-center text-white
              ${m.isBoss ? 'bg-gold-700' : 'bg-ink-600'}`}>
              {m.isBoss
                ? <Shield size={12} />
                : <span className="font-pixel text-[8px]">{m.senderName.charAt(0)}</span>}
            </div>
            <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe(m) ? 'items-end' : 'items-start'}`}>
              {!isMe(m) && (
                <div className="flex items-center gap-1">
                  <span className="font-pixel text-[8px] text-ink-400">{m.senderName}</span>
                  {m.isBoss && <span className="font-pixel text-[7px] text-gold-500">⚔ BOSS</span>}
                </div>
              )}
              <div className={`px-3 py-2 text-sm font-body ${
                isMe(m) ? 'bg-gold-800/60 border border-gold-600 text-gold-100'
                         : m.isBoss ? 'bg-violet-900/40 border border-violet-600 text-ink-100'
                         : 'bg-ink-700 border border-ink-600 text-ink-100'
              }`}>
                {m.text}
              </div>
              <span className="font-body text-[10px] text-ink-600">{formatTime(m.created_at)}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t border-ink-700 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-ink-800 border-2 border-ink-600 focus:border-gold-500 px-3 py-2 font-body text-sm text-ink-100 outline-none"
          disabled={sending}
        />
        <button onClick={onSend} disabled={!draft.trim() || sending}
          className="pixel-btn !p-2 disabled:opacity-40" aria-label="Send">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Boss Chat tab ────────────────────────────────────────────────────────────

function BossChatTab({ entry }: { entry: BossEntry }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;
    supabase.from('boss_chat').select('id, boss_name, message, created_at')
      .order('created_at', { ascending: true }).limit(CHAT_LIMIT)
      .then(({ data }) => {
        if (!mounted || !data) return;
        for (const m of data) seenIds.current.add(m.id);
        setMessages(data.map((m: BossChatMessage) => ({
          id: m.id, senderName: m.boss_name, text: m.message,
          created_at: m.created_at, isBoss: true,
        })));
      });

    const ch = supabase.channel(BOSS_CHAT_CHANNEL)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'boss_chat' },
        (payload) => {
          const m = payload.new as BossChatMessage;
          if (seenIds.current.has(m.id)) return;
          seenIds.current.add(m.id);
          setMessages((prev) => [...prev, {
            id: m.id, senderName: m.boss_name, text: m.message,
            created_at: m.created_at, isBoss: true,
          }].slice(-CHAT_LIMIT));
        })
      .subscribe((s) => { if (mounted) setConnected(s === 'SUBSCRIBED'); });

    return () => { mounted = false; ch.unsubscribe(); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true); setDraft('');
    const id = crypto.randomUUID();
    const opt: ChatMsg = { id, senderName: entry.name, text, created_at: new Date().toISOString(), isBoss: true };
    seenIds.current.add(id);
    setMessages((p) => [...p, opt].slice(-CHAT_LIMIT));
    const { error } = await supabase.from('boss_chat').insert({ id, boss_name: entry.name, message: text });
    if (error) { setMessages((p) => p.filter((m) => m.id !== id)); seenIds.current.delete(id); setDraft(text); }
    setSending(false); inputRef.current?.focus();
  }

  return <ChatView messages={messages} draft={draft} sending={sending} connected={connected}
    myName={entry.name} statusLabel="Boss-only channel · live" placeholder="Message the other bosses..."
    onDraftChange={setDraft} onSend={send}
    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
    inputRef={inputRef} bottomRef={bottomRef} />;
}

// ─── Lounge tab (main player chat) ───────────────────────────────────────────

function LoungeTab({ entry }: { entry: BossEntry }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;
    supabase.from('lounge_messages').select('id, trainer_name, disk_count, text, created_at')
      .order('created_at', { ascending: true }).limit(CHAT_LIMIT)
      .then(({ data }) => {
        if (!mounted || !data) return;
        for (const m of data) seenIds.current.add(m.id);
        setMessages(data.map((m: LoungeMsgDb) => ({
          id: m.id, senderName: m.trainer_name, text: m.text,
          created_at: m.created_at, isBoss: BOSS_NAMES.has(m.trainer_name),
        })));
      });

    const ch = supabase.channel(`${LOUNGE_CHANNEL}-boss-view`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lounge_messages' },
        (payload) => {
          const m = payload.new as LoungeMsgDb;
          if (seenIds.current.has(m.id)) return;
          seenIds.current.add(m.id);
          setMessages((prev) => [...prev, {
            id: m.id, senderName: m.trainer_name, text: m.text,
            created_at: m.created_at, isBoss: BOSS_NAMES.has(m.trainer_name),
          }].slice(-CHAT_LIMIT));
        })
      .subscribe((s) => { if (mounted) setConnected(s === 'SUBSCRIBED'); });

    return () => { mounted = false; ch.unsubscribe(); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true); setDraft('');
    const id = crypto.randomUUID();
    const opt: ChatMsg = { id, senderName: entry.name, text, created_at: new Date().toISOString(), isBoss: true };
    seenIds.current.add(id);
    setMessages((p) => [...p, opt].slice(-CHAT_LIMIT));
    const { error } = await supabase.from('lounge_messages')
      .insert({ id, trainer_name: entry.name, disk_count: 0, text });
    if (error) { setMessages((p) => p.filter((m) => m.id !== id)); seenIds.current.delete(id); setDraft(text); }
    setSending(false); inputRef.current?.focus();
  }

  return <ChatView messages={messages} draft={draft} sending={sending} connected={connected}
    myName={entry.name} statusLabel="Public lounge · players + bosses" placeholder={`Chat as ${entry.name}...`}
    onDraftChange={setDraft} onSend={send}
    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
    inputRef={inputRef} bottomRef={bottomRef} />;
}

// ─── Boss Dashboard ───────────────────────────────────────────────────────────

function BossDashboard({ entry, onLogout }: { entry: BossEntry; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('home');
  const tc = entry.themeColors;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home',      label: 'Home',   icon: <Home size={12} />           },
    { id: 'leaderboard', label: 'Board', icon: <Trophy size={12} />        },
    { id: 'boss-chat', label: 'Bosses', icon: <Shield size={12} />         },
    { id: 'lounge',    label: 'Lounge', icon: <Users size={12} />          },
  ];

  return (
    <div className="min-h-screen flex flex-col p-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 mt-2 shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={16} className={tc.text} />
          <PixelText size="xs" className={tc.text}>{entry.name}</PixelText>
        </div>
        <button onClick={onLogout} className="pixel-btn !p-2 opacity-60 hover:opacity-100" aria-label="Log out">
          <LogOut size={14} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-1 mb-4 shrink-0">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center justify-center gap-1 py-2 font-pixel text-[8px] uppercase tracking-wide border-2 transition-all
              ${tab === t.id
                ? `${tc.border} ${tc.bg} ${tc.text}`
                : 'border-ink-700 bg-ink-800 text-ink-500 hover:text-ink-300'
              }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HomeTab entry={entry} />
            </motion.div>
          )}
          {tab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <LeaderboardTab />
            </motion.div>
          )}
          {tab === 'boss-chat' && (
            <motion.div key="boss-chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <BossChatTab entry={entry} />
            </motion.div>
          )}
          {tab === 'lounge' && (
            <motion.div key="lounge" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <LoungeTab entry={entry} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function GuardianHub() {
  const [entry, setEntry] = useState<BossEntry | null>(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? resolveCode(saved) : null;
  });

  function handleSuccess(resolved: BossEntry, rawCode: string) {
    sessionStorage.setItem(SESSION_KEY, rawCode);
    setEntry(resolved);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setEntry(null);
  }

  return (
    <AnimatePresence mode="wait">
      {entry ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <BossDashboard entry={entry} onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <CodeEntry onSuccess={handleSuccess} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
