import { useState } from 'react'
import { EVENTS } from '../data/mockResults.js'
import { parseMarkValue } from '../lib/marks.js'
import { useSchools } from '../lib/useSchools.js'
import { findOrCreateMeet, findOrCreateAthlete, insertResult } from '../lib/resultsRepository.js'
import SchoolPicker from './SchoolPicker.jsx'

const CLASSIFICATIONS = ['5A']

export default function ResultsEntryForm() {
  const [classification, setClassification] = useState('5A')
  const [gender, setGender] = useState('boys')
  const [eventId, setEventId] = useState(EVENTS[0].id)
  const [selectedSchool, setSelectedSchool] = useState(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [meetName, setMeetName] = useState('')
  const [meetDate, setMeetDate] = useState('')
  const [markRaw, setMarkRaw] = useState('')
  const [wind, setWind] = useState('')

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [sessionLog, setSessionLog] = useState([])

  const schools = useSchools(classification)
  const activeEvent = EVENTS.find((e) => e.id === eventId)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)

    if (!selectedSchool) {
      setStatus({ type: 'error', message: 'Pick a school from the list before submitting.' })
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      setStatus({ type: 'error', message: "Enter the athlete's first and last name." })
      return
    }
    if (!meetName.trim() || !meetDate) {
      setStatus({ type: 'error', message: 'Enter a meet name and date.' })
      return
    }
    const markValue = parseMarkValue(activeEvent.unit, markRaw)
    if (markValue === null) {
      setStatus({
        type: 'error',
        message:
          activeEvent.unit === 'time'
            ? "Couldn't read that time — try \"10.72\" or \"1:02.45\"."
            : "Couldn't read that mark — try 21'04\" or a decimal like 21.33.",
      })
      return
    }

    setLoading(true)
    try {
      const meetId = await findOrCreateMeet(meetName.trim(), meetDate)
      const athleteId = await findOrCreateAthlete({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        schoolId: selectedSchool.id,
      })
      await insertResult({
        athleteId,
        eventId,
        meetId,
        gender,
        markValue,
        markDisplay: markRaw.trim(),
        wind: wind.trim() ? parseFloat(wind) : null,
        source: 'manual',
        verified: true,
      })

      setSessionLog((log) => [
        {
          athlete: `${firstName.trim()} ${lastName.trim()}`,
          school: selectedSchool.name,
          event: activeEvent.name,
          mark: markRaw.trim(),
        },
        ...log,
      ])
      setStatus({ type: 'success', message: 'Result added.' })
      // Keep event/gender/school/meet as-is for quick repeat entry from
      // the same meet; only clear the per-athlete fields.
      setFirstName('')
      setLastName('')
      setMarkRaw('')
      setWind('')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <p className="font-display uppercase tracking-wide text-lg mb-3">Add a result</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-xs uppercase tracking-wide text-graphite">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-graphite">Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
            >
              <optgroup label="Individual">
                {EVENTS.filter((ev) => ev.category === 'track').map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Relays">
                {EVENTS.filter((ev) => ev.category === 'relay').map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Field">
                {EVENTS.filter((ev) => ev.category === 'field').map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-graphite">School</label>
            <SchoolPicker schools={schools} value={selectedSchool} onChange={setSelectedSchool} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-graphite">
                Athlete first name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-graphite">
                Athlete last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-graphite">Meet name</label>
              <input
                type="text"
                value={meetName}
                onChange={(e) => setMeetName(e.target.value)}
                placeholder="e.g. Duncan Relays"
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-graphite">Meet date</label>
              <input
                type="date"
                value={meetDate}
                onChange={(e) => setMeetDate(e.target.value)}
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-graphite">
                Mark {activeEvent.unit === 'time' ? '(e.g. 10.72 or 1:02.45)' : '(e.g. 21\'04")'}
              </label>
              <input
                type="text"
                value={markRaw}
                onChange={(e) => setMarkRaw(e.target.value)}
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1 mark"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-graphite">
                Wind (optional)
              </label>
              <input
                type="text"
                value={wind}
                onChange={(e) => setWind(e.target.value)}
                placeholder="e.g. +1.2"
                className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              />
            </div>
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
            {loading ? 'Adding…' : 'Add result'}
          </button>
        </form>
      </div>

      <div>
        <p className="font-display uppercase tracking-wide text-lg mb-3">
          Added this session ({sessionLog.length})
        </p>
        <div className="border border-charcoal/10 rounded-lg divide-y divide-charcoal/10 max-h-[500px] overflow-y-auto">
          {sessionLog.length === 0 ? (
            <p className="px-4 py-4 text-sm text-graphite">
              Results you add will show up here as a quick running log.
            </p>
          ) : (
            sessionLog.map((entry, i) => (
              <div key={i} className="px-4 py-2 text-sm">
                <p className="font-medium">
                  {entry.athlete} <span className="text-graphite">— {entry.school}</span>
                </p>
                <p className="text-graphite">
                  {entry.event} · <span className="mark">{entry.mark}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
