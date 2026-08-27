import { supabase } from './supabaseClient.js'

export async function findOrCreateMeet(name, date) {
  const { data: existing } = await supabase
    .from('meets')
    .select('id')
    .eq('name', name)
    .eq('meet_date', date)
    .maybeSingle()
  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('meets')
    .insert({ name, meet_date: date })
    .select('id')
    .single()
  if (error) throw error
  return created.id
}

export async function findOrCreateAthlete({ firstName, lastName, gender, schoolId }) {
  const { data: existing } = await supabase
    .from('athletes')
    .select('id')
    .eq('school_id', schoolId)
    .eq('gender', gender)
    .ilike('first_name', firstName)
    .ilike('last_name', lastName)
    .maybeSingle()
  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('athletes')
    .insert({ first_name: firstName, last_name: lastName, gender, school_id: schoolId })
    .select('id')
    .single()
  if (error) throw error
  return created.id
}

export async function insertResult({
  athleteId,
  eventId,
  meetId,
  markValue,
  markDisplay,
  wind,
  source = 'manual',
  verified = true,
}) {
  const { error } = await supabase.from('results').insert({
    athlete_id: athleteId,
    event_id: eventId,
    meet_id: meetId,
    mark_value: markValue,
    mark_display: markDisplay,
    wind: wind || null,
    source,
    verified,
  })
  if (error) throw error
}

// Relay results belong to a team, not one athlete — school_id is set
// instead of athlete_id (see the results_athlete_xor_school constraint).
export async function insertRelayResult({
  schoolId,
  relayTeam,
  eventId,
  meetId,
  markValue,
  markDisplay,
  source = 'manual',
  verified = true,
}) {
  const { error } = await supabase.from('results').insert({
    school_id: schoolId,
    relay_team: relayTeam || null,
    event_id: eventId,
    meet_id: meetId,
    mark_value: markValue,
    mark_display: markDisplay,
    source,
    verified,
  })
  if (error) throw error
}
