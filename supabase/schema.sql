-- OK Track Rankings — starter schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Designed so adding classifications beyond 5A later is a data change,
-- not a schema change.

create extension if not exists "pgcrypto";

-- Classifications are a lookup table rather than an enum so OSSAA
-- reclassification cycles or new classes don't require a migration.
create table if not exists classifications (
  code text primary key -- e.g. '5A', '4A', '6A'
);
insert into classifications (code) values ('5A') on conflict do nothing;

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  classification text not null references classifications(code),
  created_at timestamptz not null default now()
);

create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  gender text not null check (gender in ('boys', 'girls')),
  grad_year int,
  school_id uuid not null references schools(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id text primary key, -- short code, e.g. '100m', 'LJ' — matches src/data/mockResults.js
  name text not null,
  category text not null check (category in ('track', 'field')),
  unit text not null check (unit in ('time', 'distance')),
  sort_order int not null default 0
);

create table if not exists meets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  meet_date date not null,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  event_id text not null references events(id),
  meet_id uuid not null references meets(id) on delete cascade,
  -- Normalized so sorting/leaderboards are format-agnostic: seconds for
  -- time events, meters for distance events.
  mark_value numeric not null,
  -- Original human-readable mark as entered (e.g. "10.72", "21'04\""),
  -- shown in the UI so times/distances keep their conventional format.
  mark_display text not null,
  wind numeric, -- optional, for wind-legal sprint/jump events
  source text not null default 'manual' check (source in ('manual', 'csv')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_results_event_gender
  on results (event_id);
create index if not exists idx_athletes_school
  on athletes (school_id);

-- Row Level Security: public read access for verified results; writes are
-- restricted to authenticated users (tighten this to a specific admin role
-- once you set up staff accounts).
alter table schools enable row level security;
alter table athletes enable row level security;
alter table events enable row level security;
alter table meets enable row level security;
alter table results enable row level security;

create policy "public read schools" on schools for select using (true);
create policy "public read athletes" on athletes for select using (true);
create policy "public read events" on events for select using (true);
create policy "public read meets" on meets for select using (true);
create policy "public read verified results" on results
  for select using (verified = true);

create policy "authenticated write schools" on schools
  for all using (auth.role() = 'authenticated');
create policy "authenticated write athletes" on athletes
  for all using (auth.role() = 'authenticated');
create policy "authenticated write meets" on meets
  for all using (auth.role() = 'authenticated');
create policy "authenticated write results" on results
  for all using (auth.role() = 'authenticated');

-- Seed the event catalog to match src/data/mockResults.js
insert into events (id, name, category, unit, sort_order) values
  ('100m', '100m dash', 'track', 'time', 1),
  ('200m', '200m dash', 'track', 'time', 2),
  ('400m', '400m dash', 'track', 'time', 3),
  ('800m', '800m run', 'track', 'time', 4),
  ('1600m', '1600m run', 'track', 'time', 5),
  ('3200m', '3200m run', 'track', 'time', 6),
  ('110H', '110m hurdles', 'track', 'time', 7),
  ('300H', '300m hurdles', 'track', 'time', 8),
  ('4x100', '4x100 relay', 'track', 'time', 9),
  ('4x400', '4x400 relay', 'track', 'time', 10),
  ('LJ', 'Long jump', 'field', 'distance', 11),
  ('TJ', 'Triple jump', 'field', 'distance', 12),
  ('HJ', 'High jump', 'field', 'distance', 13),
  ('PV', 'Pole vault', 'field', 'distance', 14),
  ('SP', 'Shot put', 'field', 'distance', 15),
  ('DT', 'Discus', 'field', 'distance', 16)
on conflict (id) do nothing;
