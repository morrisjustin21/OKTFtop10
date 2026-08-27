import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

// Only 5A is open for entry at launch — same restriction as the public
// leaderboard's classification switcher. Add more codes here once you're
// ready to expand (they also need a row in the `classifications` table).
const CLASSIFICATIONS = ['5A']

export default function TeamsEntryForm() {
  const [classification, setClassification] = useState('5A')
  const [bulkText, setBulkText] = useState('')
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message }
  const [aliasDrafts, setAliasDrafts] = useState({}) // { [teamId]: 'text being typed' }

  useEffect(() => {
    loadTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classification])

  async function loadTeams() {
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, aliases')
      .eq('classification', classification)
      .order('name')
    if (!error) setTeams(data ?? [])
  }

  async function handleAddTeams(e) {
    e.preventDefault()
    setStatus(null)

    // One team name per line; ignore blank lines and trim whitespace.
    const names = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (names.length === 0) {
      setStatus({ type: 'error', message: 'Paste at least one team name, one per line.' })
      return
    }

    setLoading(true)
    // onConflict skips rows that already exist for this classification,
    // so pasting the same list twice is safe and won't create duplicates.
    const rows = names.map((name) => ({ name, classification }))
    const { error } = await supabase
      .from('schools')
      .upsert(rows, { onConflict: 'name,classification', ignoreDuplicates: true })

    setLoading(false)
    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }

    setStatus({ type: 'success', message: `Added ${names.length} team(s) to ${classification}.` })
    setBulkText('')
    loadTeams()
  }

  async function handleRemove(id) {
    const { error } = await supabase.from('schools').delete().eq('id', id)
    if (!error) loadTeams()
  }

  async function handleAddAlias(team) {
    const alias = (aliasDrafts[team.id] ?? '').trim()
    if (!alias) return
    const nextAliases = [...(team.aliases ?? []), alias]
    const { error } = await supabase
      .from('schools')
      .update({ aliases: nextAliases })
      .eq('id', team.id)
    if (!error) {
      setAliasDrafts((d) => ({ ...d, [team.id]: '' }))
      loadTeams()
    }
  }

  async function handleRemoveAlias(team, alias) {
    const nextAliases = (team.aliases ?? []).filter((a) => a !== alias)
    const { error } = await supabase
      .from('schools')
      .update({ aliases: nextAliases })
      .eq('id', team.id)
    if (!error) loadTeams()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <p className="font-display uppercase tracking-wide text-lg mb-3">Add teams</p>
        <form onSubmit={handleAddTeams} className="space-y-3">
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
            disabled={loading}
            className="bg-cinder text-lane rounded px-4 py-2 font-body disabled:opacity-60"
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
              <div key={team.id} className="px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{team.name}</span>
                  <button
                    onClick={() => handleRemove(team.id)}
                    className="text-xs text-graphite hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>

                {team.aliases?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {team.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="inline-flex items-center gap-1 bg-lane text-xs px-2 py-0.5 rounded-full"
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
                    value={aliasDrafts[team.id] ?? ''}
                    onChange={(e) =>
                      setAliasDrafts((d) => ({ ...d, [team.id]: e.target.value }))
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
                    className="text-xs px-2 py-1 border border-charcoal/20 rounded hover:bg-lane"
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
