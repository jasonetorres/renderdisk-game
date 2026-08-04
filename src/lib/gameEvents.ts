/**
 * gameEvents — emit and subscribe to the live activity feed.
 *
 * Table: game_events (id, event_type, trainer_name, detail, created_at)
 *
 * Event types:
 *   join        — new trainer created
 *   disk        — creature captured
 *   boss_win    — player defeated a guardian
 *   boss_loss   — player lost to a guardian
 *   pvp_win     — player won a PvP battle
 *   pvp_loss    — player lost a PvP battle
 *   creator     — player defeated the final boss
 */

import { supabase } from '@/lib/supabase';

export type GameEventType =
  | 'join'
  | 'disk'
  | 'boss_win'
  | 'boss_loss'
  | 'pvp_win'
  | 'pvp_loss'
  | 'creator';

export interface GameEvent {
  id: string;
  event_type: GameEventType;
  trainer_name: string;
  detail: string | null;
  created_at: string;
}

export async function emitGameEvent(
  event_type: GameEventType,
  trainer_name: string,
  detail?: string,
) {
  await supabase.from('game_events').insert({ event_type, trainer_name, detail: detail ?? null });
}

/** Human-readable label + emoji for each event type */
export function formatGameEvent(e: GameEvent): { icon: string; text: string } {
  const name = e.trainer_name;
  const detail = e.detail ?? '';

  switch (e.event_type) {
    case 'join':
      return { icon: '🎮', text: `${name} joined the hunt` };
    case 'disk':
      return { icon: '💾', text: `${name} captured ${detail}` };
    case 'boss_win':
      return { icon: '⚔️', text: `${name} defeated ${detail}!` };
    case 'boss_loss':
      return { icon: '💀', text: `${name} was defeated by ${detail}` };
    case 'pvp_win':
      return { icon: '🏆', text: `${name} beat ${detail} in a trainer battle` };
    case 'pvp_loss':
      return { icon: '🤝', text: `${name} lost to ${detail} in a trainer battle` };
    case 'creator':
      return { icon: '👑', text: `${name} defeated The Creator!!` };
    default:
      return { icon: '📡', text: `${name} did something` };
  }
}

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
