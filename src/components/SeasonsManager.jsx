import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function SeasonsManager() {
  const [seasons, setSeasons] = useState([])
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    loadSeasons()
  }, [])

  async function loadSeasons() {
    const { data, error } = await supabase
      .from('seasons')
      .select('id, name, year, is_current')
      .order('year', { ascending: false })
    if (!error) setSeasons(data ?? [])
  }

  async function handleCreate(e) {
    e.preventDefault()
    setStatus(null)
    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Give the season a name, e.g. "2027 Outdoor".' })
      return
    }
    setLoading(true)
    const { error } = await supabase.from('seasons').insert({ name: name.trim(), year })
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }
    setStatus({ type: 'success', message: `Created ${name.trim()}.` })
    setName('')
    loadSeasons()
  }

  // Only one season can be "current" — unset the old one first, then set
  // the new one, since a partial unique index enforces exactly one.
  async function handleSetCurrent(season) {
    setStatus(null)
    const { error: clearError } = await supabase
      .from('seasons')
      .update({ is_current: false })
      .eq('is_current', true)
    if (clearError) {
      setStatus({ type: 'error', message: clearError.message })
      return
    }
    const { error: setError } = await supabase
      .from('seasons')
      .update({ is_current: true })
      .eq('id', season.id)
    if (setError) {
      setStatus({ type: 'error', message: setError.message })
      return
    }
    loadSeasons()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <p className="font-display uppercase tracking-wide text-lg mb-1">Add a season</p>
        <p className="text-sm text-graphite mb-3">
          Create a new season before entering results for it — e.g. once outdoor season 2027
          starts, add "2027 Outdoor" here and mark it current.
        </p>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-graphite">Season name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2027 Outdoor"
              className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-graphite">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
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
            className="bg-accent text-white rounded px-4 py-2 font-body disabled:opacity-60"
          >
            {loading ? 'Adding…' : 'Add season'}
          </button>
        </form>
      </div>

      <div>
        <p className="font-display uppercase tracking-wide text-lg mb-3">All seasons</p>
        <div className="border border-charcoal/10 rounded-lg divide-y divide-charcoal/10">
          {seasons.length === 0 ? (
            <p className="px-4 py-4 text-sm text-graphite">No seasons yet.</p>
          ) : (
            seasons.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{s.name}</p>
                  {s.is_current && (
                    <span className="text-xs text-accent font-medium">Current season</span>
                  )}
                </div>
                {!s.is_current && (
                  <button
                    onClick={() => handleSetCurrent(s)}
                    className="text-xs px-3 py-1.5 border border-charcoal/20 rounded hover:bg-paper"
                  >
                    Set as current
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
