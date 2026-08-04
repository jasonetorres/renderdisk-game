/*
# Create guestbook and leaderboard tables for the RenderDisk thank-you page

1. Purpose
   This migration creates two public, no-auth tables that power the
   RenderDisk thank-you / landing page:
   - `guestbook_entries`: visitors sign a digital guestbook with their name
     and a short note about how they know the creator.
   - `leaderboard_entries`: each time a player scans a creature disk, a row
     is recorded so the landing page can show a live leaderboard of who has
     collected the most disks.

2. New Tables
   - `guestbook_entries`
     - `id` (uuid, primary key)
     - `name` (text, not null) — the signer's display name
     - `note` (text, not null) — the message they leave
     - `created_at` (timestamptz, default now())
   - `leaderboard_entries`
     - `id` (uuid, primary key)
     - `trainer_name` (text, not null) — the in-game trainer name
     - `disk_id` (text, not null) — the species/disk code scanned (e.g. RD-03)
     - `created_at` (timestamptz, default now())

3. Security
   - RLS enabled on both tables.
   - Both tables are intentionally public/shared (no sign-in screen for the
     landing page). All CRUD is open to `anon, authenticated` so the
     anon-key frontend can read and write.

4. Indexes
   - `leaderboard_entries` indexed on `trainer_name` for leaderboard aggregation.
*/

CREATE TABLE IF NOT EXISTS guestbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_guestbook" ON guestbook_entries;
CREATE POLICY "anon_select_guestbook" ON guestbook_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_guestbook" ON guestbook_entries;
CREATE POLICY "anon_insert_guestbook" ON guestbook_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_name text NOT NULL,
  disk_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leaderboard" ON leaderboard_entries;
CREATE POLICY "anon_select_leaderboard" ON leaderboard_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leaderboard" ON leaderboard_entries;
CREATE POLICY "anon_insert_leaderboard" ON leaderboard_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leaderboard_trainer_name ON leaderboard_entries (trainer_name);
