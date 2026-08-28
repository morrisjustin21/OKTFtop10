import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

// A school's classification is season-specific (see school_seasons), so
// this needs both a season and a classification to know which schools
// belong on a given team list.
export function useSchools(seasonId, classification) {
  const [schools, setSchools] = useState([])

  useEffect(() => {
    if (!seasonId || !classification) {
      setSchools([])
      return
    }
    let active = true
    supabase
      .from('school_seasons')
      .select('school_id, schools(id, name, aliases)')
      .eq('season_id', seasonId)
      .eq('classification', classification)
      .then(({ data, error }) => {
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
