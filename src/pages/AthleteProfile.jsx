import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchAthleteProfile } from '../lib/athleteQueries.js'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function AthleteProfile() {
  const { athleteId } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchAthleteProfile(athleteId).then((data) => {
      if (active) {
        setProfile(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [athleteId])

  return (
    <div className="min-h-screen">
      <div className="bg-slate text-paper">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <Link to="/" className="text-sm underline text-paper/80">
            &larr; Back to leaderboard
          </Link>
          {profile?.athlete && (
            <>
              <p className="font-display uppercase tracking-wide text-2xl leading-none mt-2">
                {profile.athlete.first_name} {profile.athlete.last_name}
              </p>
              <p className="text-sm text-paper/80 mt-1">{profile.athlete.schools?.name}</p>
            </>
          )}
        </div>
      </div>
      <div className="lane-line" />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading && <p className="text-sm text-graphite">Loading…</p>}

        {!loading && !profile?.athlete && (
          <p className="text-sm text-graphite">Couldn&apos;t find that athlete.</p>
        )}

        {!loading && profile?.athlete && profile.eventGroups.length === 0 && (
          <p className="text-sm text-graphite">No results recorded yet.</p>
        )}

        {!loading &&
          profile?.eventGroups.map((group) => (
            <div
              key={group.eventId}
              className="bg-white border border-charcoal/10 rounded-lg overflow-hidden mb-4"
            >
              <div className="px-4 py-3 border-b border-charcoal/10">
                <p className="font-display uppercase tracking-wide text-base">
                  {group.eventName}
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-graphite text-left">
                    <th className="px-4 py-2 font-normal">Meet</th>
                    <th className="px-2 py-2 font-normal">Date</th>
                    <th className="px-4 py-2 font-normal text-right">Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {group.results.map((r) => (
                    <tr key={r.id} className="border-t border-charcoal/10">
                      <td className="px-4 py-2.5">{r.meetName}</td>
                      <td className="px-2 py-2.5 text-graphite">{formatDate(r.meetDate)}</td>
                      <td className="px-4 py-2.5 text-right mark text-base">
                        {r.mark}
                        {r.isBest && (
                          <span className="ml-2 text-xs font-body font-medium text-accent align-middle">
                            PB
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </main>
    </div>
  )
}
