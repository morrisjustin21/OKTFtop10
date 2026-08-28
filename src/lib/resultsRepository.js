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
  gender,
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
    gender,
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
// gender is stored directly since there's no athlete to derive it from.
// `legs` is optional: an ordered array of { firstName, lastName } for
// each runner, which gets recorded in relay_legs so the leaderboard can
// show names instead of just "Relay 'A'".
export async function insertRelayResult({
  schoolId,
  relayTeam,
  eventId,
  meetId,
  gender,
  markValue,
  markDisplay,
  legs,
  source = 'manual',
  verified = true,
}) {
  const { data: created, error } = await supabase
    .from('results')
    .insert({
      school_id: schoolId,
      relay_team: relayTeam || null,
      event_id: eventId,
      meet_id: meetId,
      gender,
      mark_value: markValue,
      mark_display: markDisplay,
      source,
      verified,
    })
    .select('id')
    .single()
  if (error) throw error

  const validLegs = (legs ?? []).filter((l) => l.firstName?.trim() && l.lastName?.trim())
  for (let i = 0; i < validLegs.length; i++) {
    const leg = validLegs[i]
    const athleteId = await findOrCreateAthlete({
      firstName: leg.firstName.trim(),
      lastName: leg.lastName.trim(),
      gender,
      schoolId,
    })
    const { error: legError } = await supabase
      .from('relay_legs')
      .insert({ result_id: created.id, leg_order: i + 1, athlete_id: athleteId })
    if (legError) throw legError
  }

  return created.id
}
