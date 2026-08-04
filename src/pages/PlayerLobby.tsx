import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader, Shield, Swords } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { PixelText, BodyText } from '@/components/ui';
import { GUARDIANS, CREATOR } from '@/data/species';

const BOSS_NAMES = new Set([...GUARDIANS.map((g) => g.trainerName), CREATOR.name]);

const CHANNEL_NAME = 'renderdisk-lounge-v2';
const MSG_LIMIT = 150;

interface DbMessage {
  id: string;
  trainer_name: string;
  disk_count: number;
  text: string;
  created_at: string;
}

interface PresenceMeta {
  trainer_name: string;
  disk_count: number;
}

export function PlayerLobby() {
  const navigate = useNavigate();
  const trainer = useGameStore((s) => s.trainer);
  const collection = useGameStore((s) => s.collection);
  const diskCount = Object.keys(collection).length;
  const myName = trainer?.name ?? 'Unknown Trainer';

  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState<PresenceMeta[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didScrollRef = useRef(false);

  // ── Load history ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('lounge_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(MSG_LIMIT)
      .then(({ data, error }) => {
        if (!error && data) setMessages(data as DbMessage[]);
        setLoading(false);
      });
  }, []);

  // ── Single channel: presence + realtime inserts ───────────────────────────
  useEffect(() => {
    const presenceKey = crypto.randomUUID();
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: presenceKey } },
    });
    channelRef.current = channel;

    const syncOnline = () => {
      // presenceState() returns Record<string, Array<Payload & { presence_ref: string }>>
      const state = channel.presenceState<PresenceMeta>();
      const list: PresenceMeta[] = [];
      for (const presences of Object.values(state)) {
        for (const p of presences) {
          list.push({ trainer_name: p.trainer_name, disk_count: p.disk_count });
        }
      }
      // Deduplicate by trainer name (same person in multiple tabs)
      const seen = new Set<string>();
      const deduped = list.filter((p) => {
        if (seen.has(p.trainer_name)) return false;
        seen.add(p.trainer_name);
        return true;
      });
      deduped.sort((a, b) => b.disk_count - a.disk_count);
      setOnlinePlayers(deduped);
    };

    channel
      .on('presence', { event: 'sync' }, syncOnline)
      .on('presence', { event: 'join' }, syncOnline)
      .on('presence', { event: 'leave' }, syncOnline)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lounge_messages' },
        (payload) => {
          const msg = payload.new as DbMessage;
          // Deduplicate against optimistic entry (same id since we pass it)
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg].slice(-MSG_LIMIT);
          });
        },
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          await channel.track({ trainer_name: myName, disk_count: diskCount });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    bottomRef.current?.scrollIntoView({ behavior: didScrollRef.current ? 'smooth' : 'instant' });
    didScrollRef.current = true;
  }, [messages, loading]);

  // ── Send ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setDraft('');

    // Use a client-generated id so the realtime dedup works
    const id = crypto.randomUUID();
    const optimistic: DbMessage = {
      id,
      trainer_name: myName,
      disk_count: diskCount,
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic].slice(-MSG_LIMIT));

    const { error } = await supabase
      .from('lounge_messages')
      .insert({ id, trainer_name: myName, disk_count: diskCount, text });

    if (error) {
      // Roll back
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setDraft(text);
    }

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b-2 border-ink-700 shrink-0">
        <button onClick={() => navigate('/world')} className="pixel-btn !p-2">
          <ArrowLeft size={16} />
        </button>
        <PixelText size="md" className="text-ocean-400">Players Lounge</PixelText>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/pvp', { state: { mode: 'join' } })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-ember-600 bg-ember-900/30 active:scale-95 transition-transform"
            title="Enter a battle code"
          >
            <Swords size={12} className="text-ember-400" />
            <span className="font-pixel text-[9px] text-ember-300">Battle</span>
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-forest-400' : 'bg-rust-400'} animate-pulse`} />
            <BodyText className={`text-xs ${connected ? 'text-forest-400' : 'text-rust-400'}`}>
              {connected ? `${onlinePlayers.length} online` : 'Connecting…'}
            </BodyText>
          </div>
        </div>
      </div>

      {/* Online now */}
      {onlinePlayers.length > 0 && (
        <div className="px-3 py-2 bg-ink-800 border-b-2 border-ink-700 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {onlinePlayers.map((p) => (
            <div
              key={p.trainer_name}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
                p.trainer_name === myName
                  ? 'border-ocean-500 bg-ocean-900/60 text-ocean-300'
                  : 'border-ink-600 bg-ink-900 text-ink-300'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-forest-400 shrink-0" />
              {p.trainer_name}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader size={20} className="text-ink-500 animate-spin" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {!loading && messages.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <PixelText size="sm" className="text-ink-500">No messages yet.</PixelText>
              <BodyText className="text-ink-600 text-sm mt-1">Be the first!</BodyText>
            </motion.div>
          )}

          {messages.map((msg) => {
            const isMe = msg.trainer_name === myName;
            const isBoss = BOSS_NAMES.has(msg.trainer_name);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Name + time — clean, small */}
                <div className={`flex items-center gap-2 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className={`text-xs font-bold ${isMe ? 'text-ocean-400' : isBoss ? 'text-gold-400' : 'text-ink-400'}`}>
                    {msg.trainer_name}
                  </span>
                  {isBoss && !isMe && (
                    <span className="flex items-center gap-0.5 text-[9px] font-pixel text-gold-500 border border-gold-700 bg-gold-900/40 px-1 py-0.5 rounded-sm">
                      <Shield size={8} className="inline" /> BOSS
                    </span>
                  )}
                  <span className="text-[10px] text-ink-600">{formatTime(msg.created_at)}</span>
                </div>

                {/* Bubble */}
                <div className={`max-w-[78%] px-3 py-2.5 rounded-2xl ${
                  isMe
                    ? 'bg-ocean-800 border border-ocean-700 rounded-tr-sm'
                    : isBoss
                    ? 'bg-gold-900/30 border border-gold-700 rounded-tl-sm'
                    : 'bg-ink-800 border border-ink-600 rounded-tl-sm'
                }`}>
                  <p className="text-sm text-ink-100 break-words leading-snug">{msg.text}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t-2 border-ink-700 bg-ink-800 px-3 py-3 flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? 'Say something…' : 'Connecting…'}
          maxLength={200}
          disabled={!connected || sending}
          className="flex-1 bg-ink-900 border-2 border-ink-600 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-ocean-500 disabled:opacity-40"
        />
        <button
          onClick={sendMessage}
          disabled={!connected || !draft.trim() || sending}
          className="w-10 h-10 rounded-xl bg-ocean-700 border-2 border-ocean-500 flex items-center justify-center shrink-0 disabled:opacity-40 active:translate-y-0.5 transition-transform"
        >
          {sending
            ? <Loader size={15} className="text-white animate-spin" />
            : <Send size={16} className="text-white" />}
        </button>
      </div>
    </div>
  );
}
