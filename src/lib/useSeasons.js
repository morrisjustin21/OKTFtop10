import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

export function useSeasons() {
  const [seasons, setSeasons] = useState([])

  useEffect(() => {
    let active = true
    supabase
      .from('seasons')
      .select('id, name, year, is_current')
      .order('year', { ascending: false })
      .then(({ data, error }) => {
        if (!error && active) setSeasons(data ?? [])
      })
    return () => {
      active = false
    }
  }, [])

  const currentSeason = seasons.find((s) => s.is_current) ?? seasons[0] ?? null

  return { seasons, currentSeason }
}
