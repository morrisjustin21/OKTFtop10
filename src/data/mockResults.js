// Event catalog. `unit` drives how marks are formatted and sorted:
// 'time' = ascending (lowest wins), 'distance' = descending (highest wins).
export const EVENTS = [
  { id: '100m', name: '100m dash', category: 'track', unit: 'time' },
  { id: '200m', name: '200m dash', category: 'track', unit: 'time' },
  { id: '400m', name: '400m dash', category: 'track', unit: 'time' },
  { id: '800m', name: '800m run', category: 'track', unit: 'time' },
  { id: '1600m', name: '1600m run', category: 'track', unit: 'time' },
  { id: '3200m', name: '3200m run', category: 'track', unit: 'time' },
  { id: '110H', name: '110m hurdles', category: 'track', unit: 'time' },
  { id: '300H', name: '300m hurdles', category: 'track', unit: 'time' },
  { id: '4x100', name: '4x100 relay', category: 'track', unit: 'time' },
  { id: '4x400', name: '4x400 relay', category: 'track', unit: 'time' },
  { id: 'LJ', name: 'Long jump', category: 'field', unit: 'distance' },
  { id: 'TJ', name: 'Triple jump', category: 'field', unit: 'distance' },
  { id: 'HJ', name: 'High jump', category: 'field', unit: 'distance' },
  { id: 'PV', name: 'Pole vault', category: 'field', unit: 'distance' },
  { id: 'SP', name: 'Shot put', category: 'field', unit: 'distance' },
  { id: 'DT', name: 'Discus', category: 'field', unit: 'distance' },
]

// Sample marks for a couple of events so the leaderboard renders something
// meaningful out of the box. Replace with live Supabase data once results
// start flowing in — see src/pages/Leaderboard.jsx.
export const MOCK_RESULTS = {
  '100m': {
    boys: [
      { athlete: 'Marcus Webb', school: 'Duncan', mark: '10.72', meetDate: '2026-04-11' },
      { athlete: 'Devon Price', school: 'Ardmore', mark: '10.81', meetDate: '2026-04-04' },
      { athlete: 'Kaleb Ruiz', school: 'Elk City', mark: '10.89', meetDate: '2026-04-11' },
      { athlete: 'Trey Ogden', school: 'Chickasha', mark: '10.94', meetDate: '2026-03-28' },
      { athlete: 'Jaylen Combs', school: 'Lawton', mark: '11.02', meetDate: '2026-04-04' },
    ],
    girls: [
      { athlete: 'Ava Simmons', school: 'Duncan', mark: '12.14', meetDate: '2026-04-11' },
      { athlete: 'Brooke Tanner', school: 'Ardmore', mark: '12.29', meetDate: '2026-04-04' },
      { athlete: 'Maddie Cole', school: 'Elk City', mark: '12.35', meetDate: '2026-03-28' },
    ],
  },
  LJ: {
    boys: [
      { athlete: 'Trey Ogden', school: 'Chickasha', mark: "21'04\"", meetDate: '2026-04-04' },
      { athlete: 'Marcus Webb', school: 'Duncan', mark: "20'11\"", meetDate: '2026-04-11' },
    ],
    girls: [{ athlete: 'Ava Simmons', school: 'Duncan', mark: "17'02\"", meetDate: '2026-04-11' }],
  },
}

export function getResults(eventId, gender) {
  return MOCK_RESULTS[eventId]?.[gender] ?? []
}
