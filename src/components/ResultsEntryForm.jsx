import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { EVENTS } from '../data/mockResults.js'
import { parseMarkValue } from '../lib/marks.js'

const CLASSIFICATIONS = ['5A']

export default function ResultsEntryForm() {
  const [classification, setClassification] = useState('5A')
  const [gender, setGender] = useState('boys')
  const [eventId, setEventId] = useState(EVENTS[0].id)

  const [schools, setSchools] = useState([])
  const [schoolQuery, setSchoolQuery] = useState('')
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

  const activeEvent = EVENTS.find((e) => e.id === eventId)

  useEffect(() => {
    loadSchools()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classification])

  async function loadSchools() {
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, aliases')
      .eq('classification', classification)
      .order('name')
    if (!error) setSchools(data ?? [])
  }

  // Matches on the school's real name OR any alias, so "Duncan Demons"
  // finds "Duncan" if that alias was added on the admin Teams screen.
  const schoolMatches =
    schoolQuery.trim().length === 0
      ? []
      : schools.filter((s) => {
          const q = schoolQuery.toLowerCase()
          return (
            s.name.toLowerCase().includes(q) ||
            (s.aliases ?? []).some((a) => a.toLowerCase().includes(q))
          )
        })

  function selectSchool(school) {
    setSelectedSchool(school)
    setSchoolQuery(school.name)
  }

  function handleSchoolQueryChange(value) {
    setSchoolQuery(value)
    if (selectedSchool && value !== selectedSchool.name) setSelectedSchool(null)
  }

  async function findOrCreateMeet() {
    const { data: existing } = await supabase
      .from('meets')
      .select('id')
      .eq('name', meetName.trim())
      .eq('meet_date', meetDate)
      .maybeSingle()
    if (existing) return existing.id

    const { data: created, error } = await supabase
      .from('meets')
      .insert({ name: meetName.trim(), meet_date: meetDate })
      .select('id')
      .single()
    if (error) throw error
    return created.id
  }

  async function findOrCreateAthlete(schoolId) {
    const { data: existing } = await supabase
      .from('athletes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('gender', gender)
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim())
      .maybeSingle()
    if (existing) return existing.id

    const { data: created, error } = await supabase
      .from('athletes')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender,
        school_id: schoolId,
      })
      .select('id')
      .single()
    if (error) throw error
    return created.id
  }

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
      const meetId = await findOrCreateMeet()
      const athleteId = await findOrCreateAthlete(selectedSchool.id)

      const { error: resultError } = await supabase.from('results').insert({
        athlete_id: athleteId,
        event_id: eventId,
        meet_id: meetId,
        mark_value: markValue,
        mark_display: markRaw.trim(),
        wind: wind.trim() ? parseFloat(wind) : null,
        source: 'manual',
        verified: true,
      })
      if (resultError) throw resultError

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

          <div className="relative">
            <label className="text-xs uppercase tracking-wide text-graphite">School</label>
            <input
              type="text"
              value={schoolQuery}
              onChange={(e) => handleSchoolQueryChange(e.target.value)}
              placeholder="Start typing a school name…"
              className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
              autoComplete="off"
            />
            {schoolQuery && !selectedSchool && schoolMatches.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-charcoal/20 rounded mt-1 max-h-48 overflow-y-auto shadow-sm">
                {schoolMatches.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => selectSchool(s)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-lane"
                  >
                    {s.name}
                    {s.aliases?.length > 0 && (
                      <span className="text-graphite"> ({s.aliases.join(', ')})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {schoolQuery && !selectedSchool && schoolMatches.length === 0 && (
              <p className="text-xs text-graphite mt-1">
                No match — check spelling or add this team on the Teams tab first.
              </p>
            )}
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
