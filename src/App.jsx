-- Run this in the Supabase SQL editor.
-- Adds a table linking relay results to the athletes who ran each leg.
-- Existing relay results are unaffected — they'll just show "Relay 'A'"
-- as before, since they have no rows here.

create table if not exists relay_legs (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references results(id) on delete cascade,
  leg_order int not null,
  athlete_id uuid not null references athletes(id) on delete cascade,
  unique (result_id, leg_order)
);

alter table relay_legs enable row level security;

create policy "public read relay legs" on relay_legs for select using (true);
create policy "authenticated write relay legs" on relay_legs
  for all using (auth.role() = 'authenticated');
