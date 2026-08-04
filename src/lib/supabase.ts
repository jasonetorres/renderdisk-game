import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export interface GuestbookEntry {
  id: string;
  name: string;
  note: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  trainer_name: string;
  disk_id: string;
  created_at: string;
}

export interface LeaderboardRow {
  trainer_name: string;
  unique_disks: number;
  latest_scan: string;
}

export interface BossChatMessage {
  id: string;
  boss_name: string;
  message: string;
  created_at: string;
}
