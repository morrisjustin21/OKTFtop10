import { supabase } from './supabaseClient.js'
import { EVENTS } from '../data/mockResults.js'

export async function fetchAthleteProfile(athleteId) {
  if (!supabase) return null

  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, gender, schools(name)')
    .eq('id', athleteId)
    .single()

  if (athleteError || !athlete) return null

  const { data: results, error: resultsError } = await supabase
    .from('results')
    .select('id, event_id, mark_value, mark_display, meets(name, meet_date)')
    .eq('athlete_id', athleteId)
    .eq('verified', true)
    .order('meet_date', { foreignTable: 'meets', ascending: true })

  if (resultsError) {
    // eslint-disable-next-line no-console
    console.error('Athlete profile query error:', resultsError)
    return { athlete, eventGroups: [] }
  }

  // Group chronological results by event, and mark each event's best mark.
  const byEvent = new Map()
  for (const r of results ?? []) {
    if (!byEvent.has(r.event_id)) byEvent.set(r.event_id, [])
    byEvent.get(r.event_id).push(r)
  }

  const eventGroups = Array.from(byEvent.entries()).map(([eventId, rows]) => {
    const event = EVENTS.find((e) => e.id === eventId)
    const ascending = event?.unit === 'time' // lower is better for times
    const bestValue = rows.reduce((best, r) => {
      if (best === null) return r.mark_value
      return ascending ? Math.min(best, r.mark_value) : Math.max(best, r.mark_value)
    }, null)

    return {
      eventId,
      eventName: event?.name ?? eventId,
      results: rows.map((r) => ({
        id: r.id,
        meetName: r.meets?.name ?? 'Unknown meet',
        meetDate: r.meets?.meet_date,
        mark: r.mark_display,
        isBest: r.mark_value === bestValue,
      })),
    }
  })

  return { athlete, eventGroups }
}
