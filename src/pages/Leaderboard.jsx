import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import EventTabs from '../components/EventTabs.jsx'
import LeaderboardTable from '../components/LeaderboardTable.jsx'
import { EVENTS } from '../data/mockResults.js'
import { fetchLeaderboard } from '../lib/leaderboardQueries.js'
import { useSeasons } from '../lib/useSeasons.js'

export default function Leaderboard() {
  const { seasons, currentSeason } = useSeasons()
  const [seasonId, setSeasonId] = useState('')
  const [classification, setClassification] = useState('5A')
  const [gender, setGender] = useState('boys')
  const [activeEventId, setActiveEventId] = useState(EVENTS[0].id)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seasonId && currentSeason) setSeasonId(currentSeason.id)
  }, [seasonId, currentSeason])

  const activeEvent = EVENTS.find((e) => e.id === activeEventId)

  useEffect(() => {
    if (!seasonId) return
    let active = true
    setLoading(true)
    fetchLeaderboard(activeEventId, gender, seasonId, classification, 16).then((data) => {
      if (active) {
        setResults(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [activeEventId, gender, seasonId, classification])

  return (
    <div className="min-h-screen">
      <Header
        gender={gender}
        onGenderChange={setGender}
        classification={classification}
        onClassificationChange={setClassification}
        seasons={seasons}
        seasonId={seasonId}
        onSeasonChange={setSeasonId}
      />
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
