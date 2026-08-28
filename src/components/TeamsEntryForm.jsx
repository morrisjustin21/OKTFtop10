import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useSeasons } from '../lib/useSeasons.js'

const CLASSIFICATIONS = ['6A', '5A', '4A', '3A', '2A', 'A']

export default function TeamsEntryForm() {
  const { seasons, currentSeason } = useSeasons()
  const [seasonId, setSeasonId] = useState('')
  const [classification, setClassification] = useState('5A')
  const [bulkText, setBulkText] = useState('')
  const [teams, setTeams] = useState([]) // [{ schoolSeasonId, schoolId, name, aliases }]
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [aliasDrafts, setAliasDrafts] = useState({})

  // Default to the current season once seasons load.
  useEffect(() => {
    if (!seasonId && currentSeason) setSeasonId(currentSeason.id)
  }, [seasonId, currentSeason])

  useEffect(() => {
    if (seasonId && classification) loadTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId, classification])

  async function loadTeams() {
    const { data, error } = await supabase
      .from('school_seasons')
      .select('id, school_id, schools(id, name, aliases)')
      .eq('season_id', seasonId)
      .eq('classification', classification)
    if (error) return
    const list = (data ?? [])
      .filter((row) => row.schools)
      .map((row) => ({
        schoolSeasonId: row.id,
        schoolId: row.school_id,
        name: row.schools.name,
        aliases: row.schools.aliases ?? [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    setTeams(list)
  }

  async function findOrCreateSchool(name) {
    const { data: existing } = await supabase
      .from('schools')
      .select('id')
      .ilike('name', name)
      .maybeSingle()
    if (existing) return existing.id

    const { data: created, error } = await supabase
      .from('schools')
      .insert({ name })
      .select('id')
      .single()
    if (error) throw error
    return created.id
  }

  async function handleAddTeams(e) {
    e.preventDefault()
    setStatus(null)

    const names = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (names.length === 0) {
      setStatus({ type: 'error', message: 'Paste at least one team name, one per line.' })
      return
    }

    setLoading(true)
    try {
      for (const name of names) {
        const schoolId = await findOrCreateSchool(name)
        const { error } = await supabase
          .from('school_seasons')
          .upsert(
            { school_id: schoolId, season_id: seasonId, classification },
            { onConflict: 'school_id,season_id' }
          )
        if (error) throw error
      }
      setStatus({ type: 'success', message: `Added ${names.length} team(s) to ${classification}.` })
      setBulkText('')
      await loadTeams()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  // Removes the school from this season/classification only — the school
  // itself (and its athletes, aliases, and history) is untouched.
  async function handleRemove(schoolSeasonId) {
    const { error } = await supabase.from('school_seasons').delete().eq('id', schoolSeasonId)
    if (!error) loadTeams()
  }

  async function handleAddAlias(team) {
    const alias = (aliasDrafts[team.schoolId] ?? '').trim()
    if (!alias) return
    const nextAliases = [...team.aliases, alias]
    const { error } = await supabase
      .from('schools')
      .update({ aliases: nextAliases })
      .eq('id', team.schoolId)
    if (!error) {
      setAliasDrafts((d) => ({ ...d, [team.schoolId]: '' }))
      loadTeams()
    }
  }

  async function handleRemoveAlias(team, alias) {
    const nextAliases = team.aliases.filter((a) => a !== alias)
    const { error } = await supabase
      .from('schools')
      .update({ aliases: nextAliases })
      .eq('id', team.schoolId)
    if (!error) loadTeams()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <p className="font-display uppercase tracking-wide text-lg mb-3">Add teams</p>
        <form onSubmit={handleAddTeams} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-graphite">Season</label>
              <select
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.is_current ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-graphite">
                Classification
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              >
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-graphite">
              Team names — one per line
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={10}
              placeholder={'Duncan\nArdmore\nElk City\nChickasha\nLawton'}
              className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1 font-body"
            />
          </div>
          {status && (
            <p className={`text-sm ${status.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !seasonId}
            className="bg-accent text-white rounded px-4 py-2 font-body disabled:opacity-60"
          >
            {loading ? 'Adding…' : 'Add teams'}
          </button>
        </form>
      </div>

      <div>
        <p className="font-display uppercase tracking-wide text-lg mb-3">
          {classification} teams ({teams.length})
        </p>
        <div className="border border-charcoal/10 rounded-lg divide-y divide-charcoal/10 max-h-[420px] overflow-y-auto">
          {teams.length === 0 ? (
            <p className="px-4 py-4 text-sm text-graphite">No teams added yet.</p>
          ) : (
            teams.map((team) => (
              <div key={team.schoolSeasonId} className="px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{team.name}</span>
                  <button
                    onClick={() => handleRemove(team.schoolSeasonId)}
                    className="text-xs text-graphite hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>

                {team.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {team.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="inline-flex items-center gap-1 bg-paper text-xs px-2 py-0.5 rounded-full"
                      >
                        {alias}
                        <button
                          onClick={() => handleRemoveAlias(team, alias)}
                          className="text-graphite hover:text-red-600"
                          aria-label={`Remove alias ${alias}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-1.5 mt-1.5">
                  <input
                    type="text"
                    value={aliasDrafts[team.schoolId] ?? ''}
                    onChange={(e) =>
                      setAliasDrafts((d) => ({ ...d, [team.schoolId]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddAlias(team)
                      }
                    }}
                    placeholder="Add a nickname…"
                    className="flex-1 border border-charcoal/20 rounded px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => handleAddAlias(team)}
                    className="text-xs px-2 py-1 border border-charcoal/20 rounded hover:bg-paper"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
