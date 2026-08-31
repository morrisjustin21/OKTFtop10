import { supabase } from './supabaseClient.js'
import { EVENTS, getResults as getMockResults } from '../data/mockResults.js'

// Individual/field events join through athletes to get the school name.
// Relay events join straight to schools, since a relay result belongs to
// a team rather than one athlete (see supabase/schema.sql).
//
// An athlete (or, for relays, a team) can appear many times in the raw
// results table across different meets — only their single best mark
// should occupy a leaderboard spot. Results already come back sorted
// best-first, so we fetch a wider pool than needed and keep just the
// first (i.e. best) row per athlete/team before trimming to topN.
const FETCH_MULTIPLIER = 8

export async function fetchLeaderboard(eventId, gender, seasonId, classification, topN = 16) {
  if (!supabase) return getMockResults(eventId, gender)
  if (!seasonId || !classification) return []

  const event = EVENTS.find((e) => e.id === eventId)
  if (!event) return []
  const ascending = event.unit === 'time' // lower wins for times, higher for distances
  const fetchLimit = topN * FETCH_MULTIPLIER

  // A school's classification is season-specific (school_seasons), so
  // find which schools qualify for this season+classification first —
  // a simple, reliable query — rather than trying to filter classification
  // through a multi-level join on the results query itself.
  const { data: schoolSeasons, error: ssError } = await supabase
    .from('school_seasons')
    .select('school_id')
    .eq('season_id', seasonId)
    .eq('classification', classification)
  if (ssError) {
    // eslint-disable-next-line no-console
    console.error('school_seasons query error:', ssError)
    return []
  }
  const schoolIds = (schoolSeasons ?? []).map((r) => r.school_id)
  if (schoolIds.length === 0) return []

  if (event.category === 'relay') {
    const { data, error } = await supabase
      .from('results')
      .select(
        'id, mark_value, mark_display, relay_team, school_id, schools!inner(id, name), relay_legs(leg_order, athletes(first_name, last_name)), meets!inner(name, meet_date, season_id)'
      )
      .eq('event_id', eventId)
      .eq('gender', gender)
      .eq('verified', true)
      .eq('meets.season_id', seasonId)
      .in('school_id', schoolIds)
      .order('mark_value', { ascending })
      .limit(fetchLimit)

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Leaderboard query error (relay):', error)
      return []
    }

    // Keep each school's best mark only — a team shouldn't occupy more
    // than one leaderboard spot in a given event.
    const seen = new Set()
    const deduped = []
    for (const r of data ?? []) {
      const schoolId = r.schools?.id
      if (!schoolId || seen.has(schoolId)) continue
      seen.add(schoolId)

      // Show the runners' names if this result has legs recorded;
      // otherwise fall back to just the team label (older imports).
      const legNames = (r.relay_legs ?? [])
        .slice()
        .sort((a, b) => a.leg_order - b.leg_order)
        .map((l) => `${l.athletes?.first_name ?? ''} ${l.athletes?.last_name ?? ''}`.trim())
        .filter(Boolean)

      deduped.push({
        athlete:
          legNames.length > 0
            ? legNames.join(', ')
            : r.relay_team
              ? `Relay '${r.relay_team}'`
              : 'Relay team',
        school: r.schools?.name ?? 'Unknown',
        mark: r.mark_display,
        meetName: r.meets?.name ?? '',
        meetDate: r.meets?.meet_date ?? null,
      })
      if (deduped.length >= topN) break
    }
    return deduped
  }

  const { data, error } = await supabase
    .from('results')
    .select(
      'id, mark_value, mark_display, grade, athletes!inner(id, first_name, last_name, school_id, schools(name)), meets!inner(name, meet_date, season_id)'
    )
    .eq('event_id', eventId)
    .eq('gender', gender)
    .eq('verified', true)
    .eq('meets.season_id', seasonId)
    .in('athletes.school_id', schoolIds)
    .order('mark_value', { ascending })
    .limit(fetchLimit)

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Leaderboard query error:', error)
    return []
  }

  // Keep each athlete's best mark only — one spot per athlete.
  const seen = new Set()
  const deduped = []
  for (const r of data ?? []) {
    const athleteId = r.athletes?.id
    if (!athleteId || seen.has(athleteId)) continue
    seen.add(athleteId)
    deduped.push({
      athleteId,
      athlete: `${r.athletes?.first_name ?? ''} ${r.athletes?.last_name ?? ''}`.trim(),
      grade: r.grade ?? null,
      school: r.athletes?.schools?.name ?? 'Unknown',
      mark: r.mark_display,
      meetName: r.meets?.name ?? '',
      meetDate: r.meets?.meet_date ?? null,
    })
    if (deduped.length >= topN) break
  }
  return deduped
}
