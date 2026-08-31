import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMeets } from '../lib/siteMetaQueries.js'
import { useSeasons } from '../lib/useSeasons.js'
import { formatDate } from '../lib/formatDate.js'

export default function MeetsList() {
  const { seasons, currentSeason } = useSeasons()
  const [seasonId, setSeasonId] = useState('')
  const [meets, setMeets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seasonId && currentSeason) setSeasonId(currentSeason.id)
  }, [seasonId, currentSeason])

  useEffect(() => {
    if (!seasonId) return
    let active = true
    setLoading(true)
    fetchMeets(seasonId).then((data) => {
      if (active) {
        setMeets(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [seasonId])

  return (
    <div className="min-h-screen">
      <div className="bg-slate text-paper">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-sm underline text-paper/80">
              &larr; Back to leaderboard
            </Link>
            <p className="font-display uppercase tracking-wide text-2xl leading-none mt-2">
              Meets
            </p>
          </div>
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="bg-slate-dark text-paper border border-paper/30 rounded px-3 py-1.5 text-sm font-body"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="lane-line" />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-sm text-graphite">Loading…</p>
        ) : meets.length === 0 ? (
          <p className="text-sm text-graphite">No meets added yet for this season.</p>
        ) : (
          <div className="bg-white border border-charcoal/10 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-charcoal/10">
              <p className="text-xs text-graphite">{meets.length} meet(s) added</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {meets.map((m) => (
                  <tr key={m.id} className="border-t border-charcoal/10 first:border-t-0">
                    <td className="px-4 py-2.5">{m.name}</td>
                    <td className="px-4 py-2.5 text-right text-graphite">
                      {formatDate(m.meet_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
