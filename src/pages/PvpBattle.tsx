/**
 * PvpBattle — real-time 1v1 between two trainers physically next to each other.
 *
 * Flow:
 *   Host:       navigates here with mode='host', generates 4-digit room code
 *               waits for challenger to join → battle starts
 *   Challenger: navigates here with mode='join' + roomCode from location state
 *               OR arrives via /pvp/join with code entered in lobby
 *
 * Architecture:
 *   - Supabase Realtime broadcast channel `pvp-{code}` (ephemeral, no table needed)
 *   - Host runs all combat logic and broadcasts resulting state after each turn
 *   - Challenger sends move selections; host resolves them
 *
 * Winner gets a copy of loser's starter creature added to their collection.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Swords, Copy, Check, Loader, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameStore, maxHpAtLevel, statAtLevel } from '@/store/gameStore';
import { getSpecies, getAbility } from '@/data/species';
import { typeMultiplier } from '@/data/elements';
import { PixelText, BodyText, PixelButton, HealthBar } from '@/components/ui';
import { audio } from '@/audio/engine';
import { emitGameEvent } from '@/lib/gameEvents';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PvpFighter {
  trainerName: string;
  speciesId: string;
  speciesName: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  element: string;
  abilities: string[];
  spriteEmoji: string;
  spriteImage: string | null;
}

type BattlePhase = 'waiting' | 'countdown' | 'select' | 'animating' | 'result' | 'victory' | 'defeat';

interface BattleState {
  host: PvpFighter;
  challenger: PvpFighter;
  phase: BattlePhase;
  log: string[];
  hostMove: string | null;
  challengerMove: string | null;
  turn: number;
}

type BroadcastMsg =
  | { type: 'challenger_ready'; fighter: PvpFighter }
  | { type: 'host_ready'; fighter: PvpFighter; state: BattleState }
  | { type: 'move'; role: 'host' | 'challenger'; abilityId: string }
  | { type: 'turn_result'; state: BattleState }
  | { type: 'battle_end'; winner: 'host' | 'challenger'; state: BattleState }
  | { type: 'ping' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function buildFighter(trainerName: string, speciesId: string, collection: Record<string, { level: number; currentHp: number }>): PvpFighter | null {
  const species = getSpecies(speciesId);
  const mon = collection[speciesId];
  if (!species || !mon) return null;
  const level = mon.level;
  return {
    trainerName,
    speciesId,
    speciesName: species.name,
    level,
    maxHp: maxHpAtLevel(species.baseHp, level),
    currentHp: mon.currentHp > 0 ? mon.currentHp : maxHpAtLevel(species.baseHp, level),
    attack: statAtLevel(species.baseAttack, level),
    defense: statAtLevel(species.baseDefense, level),
    speed: statAtLevel(species.baseSpeed, level),
    element: species.element,
    abilities: [...species.abilities],
    spriteEmoji: species.sprite,
    spriteImage: species.spriteImage ?? null,
  };
}

function resolveTurn(state: BattleState): BattleState {
  const { host, challenger, hostMove, challengerMove } = state;
  if (!hostMove || !challengerMove) return state;

  let h = { ...host };
  let c = { ...challenger };
  const log: string[] = [...state.log];

  // Determine order by speed
  const hostFirst = h.speed >= c.speed;
  const order: Array<{ attacker: PvpFighter; defender: PvpFighter; abilityId: string; isHost: boolean }> = hostFirst
    ? [{ attacker: h, defender: c, abilityId: hostMove, isHost: true },
       { attacker: c, defender: h, abilityId: challengerMove, isHost: false }]
    : [{ attacker: c, defender: h, abilityId: challengerMove, isHost: false },
       { attacker: h, defender: c, abilityId: hostMove, isHost: true }];

  for (const { attacker, defender, abilityId, isHost } of order) {
    if (h.currentHp <= 0 || c.currentHp <= 0) break;
    const ability = getAbility(abilityId);
    if (!ability) continue;

    if (ability.category === 'status') {
      log.push(`${attacker.trainerName}'s ${attacker.speciesName} used ${ability.name}!`);
      continue;
    }

    const mult = typeMultiplier(ability.element, defender.element as import('@/types/game').Element);
    const baseDmg = Math.max(1, Math.floor(
      ((2 * attacker.level / 5 + 2) * ability.power * (attacker.attack / defender.defense)) / 50 + 2
    ));
    const dmg = Math.max(1, Math.floor(baseDmg * mult));

    if (isHost) {
      c = { ...c, currentHp: Math.max(0, c.currentHp - dmg) };
    } else {
      h = { ...h, currentHp: Math.max(0, h.currentHp - dmg) };
    }

    const effText = mult >= 2 ? ' Super effective!' : mult <= 0.5 ? ' Not very effective.' : '';
    log.push(`${attacker.speciesName} used ${ability.name} — ${dmg} dmg!${effText}`);
  }

  const winner = h.currentHp <= 0 ? 'challenger' : c.currentHp <= 0 ? 'host' : null;
  const nextPhase: BattlePhase = winner ? 'battle_end' as BattlePhase : 'select';

  return {
    host: h,
    challenger: c,
    phase: winner ? 'animating' : 'select',
    log: log.slice(-5),
    hostMove: null,
    challengerMove: null,
    turn: state.turn + 1,
    ...(winner ? { _winner: winner } : {}),
  } as BattleState & { _winner?: 'host' | 'challenger' };
}

// ─── Sprite display ───────────────────────────────────────────────────────────

function FighterSprite({ fighter, side, dimmed }: { fighter: PvpFighter; side: 'left' | 'right'; dimmed?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 transition-opacity ${dimmed ? 'opacity-30' : ''}`}>
      <div className="w-20 h-20 flex items-center justify-center bg-ink-900 border-2 border-ink-700">
        {fighter.spriteImage
          ? <img src={fighter.spriteImage} alt={fighter.speciesName}
              className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          : <span className="text-4xl">{fighter.spriteEmoji}</span>}
      </div>
      <PixelText size="xs" className="text-ink-300 text-center">{fighter.speciesName}</PixelText>
      <BodyText className="text-ink-500 text-xs">Lv.{fighter.level}</BodyText>
      <HealthBar current={fighter.currentHp} max={fighter.maxHp} showNumbers />
    </div>
  );
}

// ─── Ability button ───────────────────────────────────────────────────────────

function AbilityBtn({ abilityId, onPick, disabled }: { abilityId: string; onPick: () => void; disabled: boolean }) {
  const ability = getAbility(abilityId);
  if (!ability) return null;
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2.5 border-2 font-body text-sm transition-all
        ${disabled
          ? 'border-ink-700 bg-ink-900 text-ink-600 cursor-not-allowed'
          : 'border-ember-600 bg-ember-900/30 text-ink-100 active:scale-95'}`}
    >
      <span className="font-pixel text-xs text-ember-400 block mb-0.5">{ability.name}</span>
      <span className="text-ink-400 text-xs">{ability.element} · {ability.category} · {ability.power} pwr</span>
    </button>
  );
}

// ─── Waiting room (host shows code) ──────────────────────────────────────────

function WaitingRoom({ code, myFighter }: { code: string; myFighter: PvpFighter }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
      <PixelText size="sm" className="text-ocean-300">Waiting for challenger...</PixelText>

      <div className="border-4 border-gold-500 bg-gold-900/20 px-8 py-6 text-center">
        <BodyText className="text-ink-400 text-xs mb-2 block">Battle Room Code</BodyText>
        <p className="font-pixel text-gold-300 text-4xl tracking-[0.3em]">{code}</p>
      </div>

      <button onClick={copy} className="pixel-btn flex items-center gap-2 px-4 py-2 text-sm">
        {copied ? <Check size={14} className="text-forest-400" /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy Code'}
      </button>

      <BodyText className="text-ink-500 text-xs text-center">
        Tell your opponent to tap <span className="text-ink-300">Battle</span> in the lobby and enter this code.
      </BodyText>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse" />
        <BodyText className="text-ink-500 text-xs">Your creature: <span className="text-ink-300">{myFighter.speciesName}</span> Lv.{myFighter.level}</BodyText>
      </div>
    </div>
  );
}

// ─── Join screen ──────────────────────────────────────────────────────────────

function JoinScreen({ onJoin }: { onJoin: (code: string) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length !== 4) { setError('Enter the 4-character code'); return; }
    onJoin(clean);
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
      <Swords size={32} className="text-ember-400" />
      <PixelText size="sm" className="text-ember-300">Enter Battle Code</PixelText>
      <BodyText className="text-ink-400 text-sm text-center">
        Get the 4-character code from the trainer you want to battle.
      </BodyText>
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          placeholder="e.g. 7K3P"
          maxLength={4}
          className={`w-full bg-ink-800 border-2 px-4 py-3 font-pixel text-2xl text-center tracking-[0.4em] uppercase outline-none transition-colors
            ${error ? 'border-ember-500 text-ember-400' : 'border-ink-600 text-ink-100 focus:border-gold-500'}`}
          autoCapitalize="characters" autoComplete="off" spellCheck={false}
        />
        {error && <p className="text-ember-400 text-xs text-center font-body">{error}</p>}
        <PixelButton variant="primary" fullWidth>
          <Swords size={14} /> Challenge!
        </PixelButton>
      </form>
    </div>
  );
}

// ─── Main PvpBattle page ──────────────────────────────────────────────────────

export function PvpBattle() {
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as { mode: 'host' | 'join'; roomCode?: string } | null;

  const trainer = useGameStore((s) => s.trainer);
  const collection = useGameStore((s) => s.collection);
  const captureMonster = useGameStore((s) => s.captureMonster);
  const addBattleRecord = useGameStore((s) => s.addBattleRecord);

  const [mode, setMode] = useState<'host' | 'join' | null>(locState?.mode ?? null);
  // Generate code eagerly so it's ready before myFighter populates
  const [roomCode, setRoomCode] = useState(() =>
    locState?.roomCode ?? (locState?.mode === 'host' ? genRoomCode() : '')
  );
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [myRole, setMyRole] = useState<'host' | 'challenger'>('host');
  const [myFighter, setMyFighter] = useState<PvpFighter | null>(null);
  const [opponentFighter, setOpponentFighter] = useState<PvpFighter | null>(null);
  const [movePicked, setMovePicked] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<'victory' | 'defeat' | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const stateRef = useRef<BattleState | null>(null);
  const myRoleRef = useRef<'host' | 'challenger'>('host');
  const myFighterRef = useRef<PvpFighter | null>(null);
  const retryRef = useRef<number | null>(null);

  // Get my starter creature (first in collection)
  const myStarterId = Object.keys(collection)[0] ?? null;

  // ── Build own fighter ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!trainer || !myStarterId) return;
    const fighter = buildFighter(trainer.name, myStarterId, collection);
    setMyFighter(fighter);
    myFighterRef.current = fighter;
  }, [trainer, myStarterId, collection]);

  // ── Channel broadcast helper ───────────────────────────────────────────────
  const broadcast = useCallback((msg: BroadcastMsg) => {
    channelRef.current?.send({ type: 'broadcast', event: 'pvp', payload: msg });
  }, []);

  // ── Subscribe to channel ───────────────────────────────────────────────────
  const connectChannel = useCallback((code: string, role: 'host' | 'challenger') => {
    const ch = supabase.channel(`pvp-${code}`, { config: { broadcast: { self: false } } });
    channelRef.current = ch;
    myRoleRef.current = role;

    ch.on('broadcast', { event: 'pvp' }, ({ payload }: { payload: BroadcastMsg }) => {
      const msg = payload;

      if (msg.type === 'ping') return;

      // Challenger joined — host sends initial state
      if (msg.type === 'challenger_ready' && role === 'host') {
        const opponent = msg.fighter;
        setOpponentFighter(opponent);
        setOpponentConnected(true);
        const myF = myFighterRef.current!;
        const initial: BattleState = {
          host: myF,
          challenger: opponent,
          phase: 'countdown',
          log: ['Battle start!'],
          hostMove: null,
          challengerMove: null,
          turn: 1,
        };
        stateRef.current = initial;
        setBattleState(initial);
        broadcast({ type: 'host_ready', fighter: myF, state: initial });
        // countdown
        let n = 3;
        setCountdown(n);
        const iv = setInterval(() => {
          n--;
          if (n > 0) setCountdown(n);
          else { clearInterval(iv); setCountdown(null); }
        }, 1000);
      }

      // Host confirmed — challenger updates
      if (msg.type === 'host_ready' && role === 'challenger') {
        if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
        setOpponentFighter(msg.fighter);
        setOpponentConnected(true);
        stateRef.current = msg.state;
        setBattleState(msg.state);
        let n = 3;
        setCountdown(n);
        const iv = setInterval(() => {
          n--;
          if (n > 0) setCountdown(n);
          else { clearInterval(iv); setCountdown(null); }
        }, 1000);
      }

      // Opponent picked a move — if host, try resolving
      if (msg.type === 'move' && role === 'host') {
        const cur = stateRef.current;
        if (!cur) return;
        const updated = { ...cur, challengerMove: msg.abilityId };
        stateRef.current = updated;
        // If we already have our own move, resolve now
        if (updated.hostMove) {
          const resolved = resolveTurn(updated) as BattleState & { _winner?: 'host' | 'challenger' };
          const winner = (resolved as { _winner?: 'host' | 'challenger' })._winner;
          stateRef.current = resolved;
          setBattleState(resolved);
          setMovePicked(false);
          setLog(resolved.log);
          if (winner) {
            broadcast({ type: 'battle_end', winner, state: resolved });
            handleEnd(winner, resolved);
          } else {
            broadcast({ type: 'turn_result', state: resolved });
          }
        } else {
          stateRef.current = updated;
        }
      }

      // Host pushed result
      if (msg.type === 'turn_result' && role === 'challenger') {
        stateRef.current = msg.state;
        setBattleState(msg.state);
        setMovePicked(false);
        setLog(msg.state.log);
      }

      // Battle ended
      if (msg.type === 'battle_end') {
        stateRef.current = msg.state;
        setBattleState(msg.state);
        setLog(msg.state.log);
        handleEnd(msg.winner, msg.state);
      }
    }).subscribe((status) => {
      if (status !== 'SUBSCRIBED' || role !== 'challenger') return;
      // Announce once subscribed. Retry every 2s until host responds (max 10 tries).
      let tries = 0;
      const tryAnnounce = () => {
        if (tries >= 10) return;
        tries++;
        if (myFighterRef.current) {
          broadcast({ type: 'challenger_ready', fighter: myFighterRef.current });
        }
        // Keep retrying until host_ready is received (opponentConnected flips)
        retryRef.current = window.setTimeout(tryAnnounce, 2000);
      };
      // Small delay so host channel is definitely ready
      setTimeout(tryAnnounce, 300);
    });
  }, [broadcast]);

  // ── End of battle ──────────────────────────────────────────────────────────
  function handleEnd(winner: 'host' | 'challenger', state: BattleState) {
    const iWon = winner === myRoleRef.current;
    setOutcome(iWon ? 'victory' : 'defeat');
    audio.stopMusic();

    const me = myRoleRef.current === 'host' ? state.host : state.challenger;
    const opponent = myRoleRef.current === 'host' ? state.challenger : state.host;

    if (iWon) {
      // Give winner a copy of loser's creature
      if (!collection[opponent.speciesId]) {
        captureMonster(opponent.speciesId);
      }
      emitGameEvent('pvp_win', me.trainerName, opponent.trainerName);
    } else {
      emitGameEvent('pvp_loss', me.trainerName, opponent.trainerName);
    }

    addBattleRecord({ type: 'pvp', won: iWon });
  }

  // ── Host init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'host' || !trainer || !roomCode) return;
    setMyRole('host');
    myRoleRef.current = 'host';
    connectChannel(roomCode, 'host');
    return () => {
      channelRef.current?.unsubscribe();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, trainer, roomCode]);

  // ── Challenger join ────────────────────────────────────────────────────────
  function handleJoin(code: string) {
    setRoomCode(code);
    setMyRole('challenger');
    myRoleRef.current = 'challenger';
    connectChannel(code, 'challenger');
  }

  // ── Pick a move ────────────────────────────────────────────────────────────
  function pickMove(abilityId: string) {
    if (movePicked || !battleState || battleState.phase !== 'select') return;
    setMovePicked(true);

    if (myRole === 'host') {
      // Store our move; wait for challenger's or resolve if already have it
      const cur = stateRef.current!;
      const updated = { ...cur, hostMove: abilityId };
      stateRef.current = updated;
      broadcast({ type: 'move', role: 'host', abilityId });
      if (updated.challengerMove) {
        const resolved = resolveTurn(updated) as BattleState & { _winner?: 'host' | 'challenger' };
        const winner = resolved._winner;
        stateRef.current = resolved;
        setBattleState(resolved);
        setMovePicked(false);
        setLog(resolved.log);
        if (winner) {
          broadcast({ type: 'battle_end', winner, state: resolved });
          handleEnd(winner, resolved);
        } else {
          broadcast({ type: 'turn_result', state: resolved });
        }
      }
    } else {
      // Challenger just sends the move; host resolves
      broadcast({ type: 'move', role: 'challenger', abilityId });
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!trainer || !myStarterId || !myFighter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <PixelText size="sm" className="text-ink-400 mb-3">No creature yet</PixelText>
          <BodyText className="text-ink-500 text-sm mb-4">Capture a disk first before battling other trainers.</BodyText>
          <PixelButton onClick={() => navigate('/world')}>Back</PixelButton>
        </div>
      </div>
    );
  }

  const myBattler = myRole === 'host' ? battleState?.host : battleState?.challenger;
  const oppBattler = myRole === 'host' ? battleState?.challenger : battleState?.host;

  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b-2 border-ink-700 shrink-0">
        <button onClick={() => { channelRef.current?.unsubscribe(); navigate(-1); }} className="pixel-btn !p-2">
          <ArrowLeft size={16} />
        </button>
        <PixelText size="sm" className="text-ember-300">PvP Battle</PixelText>
        {roomCode && (
          <span className="ml-auto font-pixel text-xs text-ink-500 tracking-widest">{roomCode}</span>
        )}
      </div>

      {/* ── No mode selected: pick host or join ── */}
      {!mode && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <Swords size={36} className="text-ember-400" />
          <PixelText size="md" className="text-ink-200">Trainer Battle</PixelText>
          <BodyText className="text-ink-400 text-sm text-center">
            Challenge a trainer standing next to you. One creates the room, one joins.
          </BodyText>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <PixelButton variant="primary" fullWidth onClick={() => setMode('host')}>
              Create Room (Host)
            </PixelButton>
            <PixelButton variant="secondary" fullWidth onClick={() => setMode('join')}>
              Join Room (Enter Code)
            </PixelButton>
          </div>
        </div>
      )}

      {/* ── Host waiting for opponent ── */}
      {mode === 'host' && !battleState && myFighter && (
        <WaitingRoom code={roomCode} myFighter={myFighter} />
      )}
      {mode === 'host' && !battleState && !myFighter && (
        <div className="flex-1 flex items-center justify-center">
          <Loader size={24} className="text-ocean-400 animate-spin" />
        </div>
      )}

      {/* ── Challenger entering code ── */}
      {mode === 'join' && !battleState && !opponentConnected && (
        <JoinScreen onJoin={handleJoin} />
      )}
      {mode === 'join' && !battleState && opponentConnected && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader size={24} className="text-ocean-400 animate-spin mx-auto" />
            <BodyText className="text-ink-400">Connected! Starting battle...</BodyText>
          </div>
        </div>
      )}

      {/* ── Countdown ── */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            key={countdown}
            className="absolute inset-0 z-50 flex items-center justify-center bg-ink-900/90"
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <PixelText size="lg" className="text-gold-300">{countdown}</PixelText>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active battle ── */}
      {battleState && !outcome && countdown === null && (
        <div className="flex-1 flex flex-col">
          {/* Fighters */}
          <div className="grid grid-cols-2 gap-4 px-4 pt-4 pb-2">
            <div>
              <BodyText className="text-ocean-400 text-xs mb-2 block font-pixel">YOU</BodyText>
              {myBattler && <FighterSprite fighter={myBattler} side="left" />}
            </div>
            <div>
              <BodyText className="text-ember-400 text-xs mb-2 block font-pixel text-right">RIVAL</BodyText>
              {oppBattler && <FighterSprite fighter={oppBattler} side="right" dimmed={movePicked} />}
            </div>
          </div>

          {/* Turn indicator */}
          <div className="px-4 py-2 text-center">
            <BodyText className="text-ink-500 text-xs">Turn {battleState.turn}</BodyText>
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="mx-4 mb-3 border border-ink-700 bg-ink-800/60 px-3 py-2 space-y-1">
              {log.slice(-3).map((l, i) => (
                <BodyText key={i} className="text-ink-300 text-xs block">{l}</BodyText>
              ))}
            </div>
          )}

          {/* Move selection */}
          <div className="px-4 pb-4 mt-auto">
            {movePicked ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader size={16} className="text-ocean-400 animate-spin" />
                <BodyText className="text-ink-400 text-sm">Waiting for opponent...</BodyText>
              </div>
            ) : (
              <>
                <PixelText size="xs" className="text-ink-400 block mb-2">Choose a move:</PixelText>
                <div className="grid grid-cols-2 gap-2">
                  {(myBattler?.abilities ?? myFighter.abilities).map((id) => (
                    <AbilityBtn key={id} abilityId={id} disabled={movePicked} onPick={() => pickMove(id)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Victory ── */}
      <AnimatePresence>
        {outcome === 'victory' && (
          <motion.div
            key="victory"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink-900 px-6 text-center gap-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, repeat: 3 }}
            >
              <PixelText size="lg" className="text-gold-300">Victory!</PixelText>
            </motion.div>
            <BodyText className="text-ink-300">
              You defeated <span className="text-ember-300">{opponentFighter?.trainerName}</span>!
            </BodyText>
            {opponentFighter && !collection[opponentFighter.speciesId] && (
              <div className="border-2 border-gold-500 bg-gold-900/20 px-5 py-3">
                <BodyText className="text-gold-300 text-sm block mb-1">🏆 Creature Captured!</BodyText>
                <BodyText className="text-ink-300 text-sm">
                  {opponentFighter.speciesName} added to your binder.
                </BodyText>
              </div>
            )}
            <PixelButton variant="primary" onClick={() => navigate('/world')}>Back to World</PixelButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Defeat ── */}
      <AnimatePresence>
        {outcome === 'defeat' && (
          <motion.div
            key="defeat"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink-900 px-6 text-center gap-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <PixelText size="lg" className="text-rust-400">Defeated</PixelText>
            <BodyText className="text-ink-400">
              <span className="text-ember-300">{opponentFighter?.trainerName}</span> was stronger this time.
            </BodyText>
            <BodyText className="text-ink-500 text-sm">Your creature is safe — train up and try again.</BodyText>
            <PixelButton onClick={() => navigate('/world')}>Back to World</PixelButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
