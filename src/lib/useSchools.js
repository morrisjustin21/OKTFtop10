import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

export function useSchools(classification) {
  const [schools, setSchools] = useState([])

  useEffect(() => {
    let active = true
    supabase
      .from('schools')
      .select('id, name, aliases')
      .eq('classification', classification)
      .order('name')
      .then(({ data, error }) => {
        if (!error && active) setSchools(data ?? [])
      })
    return () => {
      active = false
    }
  }, [classification])

  return schools
}
