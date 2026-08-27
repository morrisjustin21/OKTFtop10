# OK Track Rankings

Leaderboards for Oklahoma high school track and field, by classification.
Launching with Class 5A; the schema and UI are built so 4A, 6A, etc. are a
data change, not a rebuild.

## Stack

React + Vite + Tailwind, Supabase (Postgres + auth), deployed on Vercel —
same pattern as CourtVision.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

The app runs on mock data (`src/data/mockResults.js`) until Supabase env
vars are set, so you can preview the UI immediately without a database.

## Setting up Supabase

1. Create a new Supabase project.
2. Run `supabase/schema.sql` in the SQL editor. This creates the schools,
   athletes, events, meets, and results tables, seeds the event catalog,
   and sets up starter row-level security (public read on verified
   results, writes restricted to authenticated users).
3. Copy your project URL and anon key into `.env`.

## Admin page

`/admin` is a staff-only page for managing data, starting with bulk team
entry. It's gated behind Supabase auth — you need to create at least one
staff account before you can sign in:

1. In Supabase, go to Authentication > Users > Add user. Set an email and
   password (you can mark the email as already confirmed so no
   verification email is needed).
2. Run `supabase/migrations/003_schools_unique_constraint.sql` in the SQL
   editor if you already deployed the original schema — it adds the
   uniqueness rule that lets bulk team entry skip duplicates safely. If
   you're setting up Supabase fresh, this is already included in
   `schema.sql` and you can skip this step.
3. Visit `your-site.vercel.app/admin` and sign in with that account.

**Teams entry**: paste a list of school names (one per line) for a
classification and submit — they're added in one batch, and pasting the
same list again won't create duplicates. Every school you add here is
then available to reference when entering athletes and results, which is
what keeps everything grouped correctly by classification going forward.

## Design notes

- **Color**: cinder-red (`#B7410E`) for the track surface identity, a
  cream "lane" tone for light surfaces, and a muted gold accent reserved
  for #1 on the leaderboard — not a literal medal, just a clear signal.
- **Type**: Oswald (condensed, scoreboard-like) for headings and marks so
  columns of times/distances line up cleanly; Inter for body text.
- **Signature motif**: the dashed "lane line" divider (`.lane-line` in
  `src/index.css`) under the header — a nod to painted lane markings
  without an illustrated track.

## Current scope

Leaderboards are intentionally simple for launch: pick a gender and an
event, see the ranked marks. Data model already supports what's next:

- Click into an event to see the full list beyond the top marks
- Click into an athlete for their season progression / PRs
- Classification switcher (4A / 6A) once more data is loaded
- CSV import + admin review queue for meet results (schema has a
  `source` and `verified` flag on `results` to support this)

## Project structure

```
src/
  components/   Header, EventTabs, LeaderboardTable
  pages/        Leaderboard (main view)
  data/         mock event catalog + sample results
  lib/          Supabase client
supabase/
  schema.sql    tables, RLS policies, event seed data
```
