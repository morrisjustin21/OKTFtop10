import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

// A school's classification is season-specific (see school_seasons).
// Pass a classification to scope the list to one class (e.g. for the
// Teams tab), or omit it to get every school in the season across all
// classes at once (e.g. for results import, where one meet's results
// often span several classifications).
export function useSchools(seasonId, classification) {
  const [schools, setSchools] = useState([])

  useEffect(() => {
    if (!seasonId) {
      setSchools([])
      return
    }
    let active = true
    let query = supabase
      .from('school_seasons')
      .select('school_id, schools(id, name, aliases)')
      .eq('season_id', seasonId)
    if (classification) query = query.eq('classification', classification)

    query.then(({ data, error }) => {
      if (error || !active) return
      const list = (data ?? [])
        .map((row) => row.schools)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name))
      setSchools(list)
    })
    return () => {
      active = false
    }
  }, [seasonId, classification])

  return schools
}
