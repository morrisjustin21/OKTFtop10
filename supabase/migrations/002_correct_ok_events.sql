-- Run this in the Supabase SQL editor to bring an already-deployed
-- database up to date with the corrected Oklahoma event catalog
-- (removes triple jump, adds 4x200/4x800 relays, splits relays into
-- their own category, renames 110H to the combined 100/110 hurdles).
--
-- Safe to run even if you haven't entered any real results yet — if you
-- have, results tied to the old 'TJ' or '110H' ids would need to be
-- re-pointed first; this assumes you're still on mock/no data.

-- Allow the new 'relay' category
alter table events drop constraint if exists events_category_check;
alter table events add constraint events_category_check
  check (category in ('track', 'relay', 'field'));

-- Remove events that aren't run in Oklahoma
delete from events where id in ('TJ', '110H');

-- Re-seed with the corrected catalog (id, name, category, unit, sort_order)
insert into events (id, name, category, unit, sort_order) values
  ('100m', '100m dash', 'track', 'time', 1),
  ('200m', '200m dash', 'track', 'time', 2),
  ('400m', '400m dash', 'track', 'time', 3),
  ('800m', '800m run', 'track', 'time', 4),
  ('1600m', '1600m run', 'track', 'time', 5),
  ('3200m', '3200m run', 'track', 'time', 6),
  ('shortH', '100m/110m hurdles', 'track', 'time', 7),
  ('300H', '300m hurdles', 'track', 'time', 8),
  ('4x100', '4x100m relay', 'relay', 'time', 9),
  ('4x200', '4x200m relay', 'relay', 'time', 10),
  ('4x400', '4x400m relay', 'relay', 'time', 11),
  ('4x800', '4x800m relay', 'relay', 'time', 12),
  ('LJ', 'Long jump', 'field', 'distance', 13),
  ('HJ', 'High jump', 'field', 'distance', 14),
  ('PV', 'Pole vault', 'field', 'distance', 15),
  ('SP', 'Shot put', 'field', 'distance', 16),
  ('DT', 'Discus', 'field', 'distance', 17)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  unit = excluded.unit,
  sort_order = excluded.sort_order;
