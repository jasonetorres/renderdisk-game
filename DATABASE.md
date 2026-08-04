# RenderDisk — Database Setup

Supabase project: `ymlijwjerhscdqvswins`
URL: `https://ymlijwjerhscdqvswins.supabase.co`

## Environment variables (.env)

```
VITE_SUPABASE_URL=https://ymlijwjerhscdqvswins.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_pOMyROIOzZGJfTNBJZn8Vg_JI92iBM5
```

## Tables

### `lounge_messages`
Powers the Players Lounge real-time chat (`/lobby`).
Persists messages across page refreshes. Realtime INSERT subscription active.

```sql
create table if not exists lounge_messages (
  id uuid default gen_random_uuid() primary key,
  trainer_name text not null,
  disk_count int not null default 0,
  text text not null check (char_length(text) <= 200),
  created_at timestamptz default now()
);
alter table lounge_messages enable row level security;
create policy "public read"   on lounge_messages for select using (true);
create policy "public insert" on lounge_messages for insert with check (true);
```

### `guestbook_entries`
Powers the "Sign the Disk" guestbook on the Landing page (`/home`).

```sql
create table if not exists guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  note text not null,
  created_at timestamptz default now()
);
alter table guestbook_entries enable row level security;
create policy "anon_select_guestbook" on guestbook_entries for select to anon, authenticated using (true);
create policy "anon_insert_guestbook" on guestbook_entries for insert to anon, authenticated with check (true);
```

### `leaderboard_entries`
Written on every successful QR scan (`/scan`) and disk URL entry (`/disk/:code`).
Aggregated client-side into a top-20 leaderboard by unique disks collected.

```sql
create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  trainer_name text not null,
  disk_id text not null,
  created_at timestamptz default now()
);
alter table leaderboard_entries enable row level security;
create policy "anon_select_leaderboard" on leaderboard_entries for select to anon, authenticated using (true);
create policy "anon_insert_leaderboard" on leaderboard_entries for insert to anon, authenticated with check (true);
create index if not exists idx_leaderboard_trainer_name on leaderboard_entries (trainer_name);
```

## Realtime

Enable realtime for `lounge_messages` in:
Supabase Dashboard → Database → Replication → `supabase_realtime` publication → toggle `lounge_messages` on.
