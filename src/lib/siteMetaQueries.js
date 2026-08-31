import { supabase } from './supabaseClient.js'

// Most recent result creation time within a season — reflects when data
// was actually last added, not when the most recent meet took place.
export async function fetchLastUpdated(seasonId) {
  if (!supabase || !seasonId) return null
  const { data, error } = await supabase
    .from('results')
    .select('created_at, meets!inner(season_id)')
    .eq('meets.season_id', seasonId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data.created_at
}

// Every meet that's been added for a season, most recent first.
export async function fetchMeets(seasonId) {
  if (!supabase || !seasonId) return []
  const { data, error } = await supabase
    .from('meets')
    .select('id, name, meet_date')
    .eq('season_id', seasonId)
    .order('meet_date', { ascending: false })
  if (error) return []
  return data ?? []
}
