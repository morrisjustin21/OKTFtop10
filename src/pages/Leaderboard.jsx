import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import EventTabs from '../components/EventTabs.jsx'
import LeaderboardTable from '../components/LeaderboardTable.jsx'
import { EVENTS } from '../data/mockResults.js'
import { fetchLeaderboard } from '../lib/leaderboardQueries.js'

export default function Leaderboard() {
  const [gender, setGender] = useState('boys')
  const [activeEventId, setActiveEventId] = useState(EVENTS[0].id)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  const activeEvent = EVENTS.find((e) => e.id === activeEventId)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchLeaderboard(activeEventId, gender, '5A', 16).then((data) => {
      if (active) {
        setResults(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [activeEventId, gender])

  return (
    <div className="min-h-screen">
      <Header gender={gender} onGenderChange={setGender} />
      <EventTabs events={EVENTS} activeEvent={activeEventId} onSelect={setActiveEventId} />

      <main className="max-w-4xl mx-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-graphite">Loading leaderboard…</p>
        ) : (
          <LeaderboardTable event={activeEvent} gender={gender} results={results} />
        )}
      </main>
    </div>
  )
}
