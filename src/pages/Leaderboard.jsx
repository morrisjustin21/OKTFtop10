import { useState } from 'react'
import Header from '../components/Header.jsx'
import EventTabs from '../components/EventTabs.jsx'
import LeaderboardTable from '../components/LeaderboardTable.jsx'
import { EVENTS, getResults } from '../data/mockResults.js'

export default function Leaderboard() {
  const [gender, setGender] = useState('boys')
  const [activeEventId, setActiveEventId] = useState(EVENTS[0].id)

  const activeEvent = EVENTS.find((e) => e.id === activeEventId)
  const results = getResults(activeEventId, gender)

  return (
    <div className="min-h-screen">
      <Header gender={gender} onGenderChange={setGender} />
      <EventTabs events={EVENTS} activeEvent={activeEventId} onSelect={setActiveEventId} />

      <main className="max-w-4xl mx-auto px-4 py-4">
        <LeaderboardTable event={activeEvent} gender={gender} results={results} />
      </main>
    </div>
  )
}
