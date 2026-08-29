// Parses a results format where each individual result spans two lines
// (place/grade/name/mark on one line, school name on the next), gender
// is set once per "Mens Results"/"Womens Results" section header rather
// than repeated on every event, and relays list every leg runner across
// several lines, closed off by a "Team - A" style line. Verified against
// a real meet export with this structure.
//
// Individual/field events:
//   Mens Results
//   100 Meters High School - Finals
//   1.	10	Elijah Daniels		10.87a
//   Nathan Hale
//
// Field events use feet-inches-with-quote-mark notation (e.g. 48' 9"),
// sometimes with a "PB"/"SB" suffix appended directly with no space.
//
// Relays list every leg's grade + name, then the mark, then a closing
// "Team - Squad" line — the only format seen so far that actually gives
// runner names for relays:
//   4x100 Relay High School - Finals
//   1.
//   11
//   Caleb Mitchell
//   11
//   Kamaree Robertson
//   ...
//   43.45a
//   McLain - A

import { EVENTS } from '../data/mockResults.js'

const GENDER_SECTION_RE = /^(Mens|Womens|Men's|Women's)\s+Results\s*$/i
const HEADING_RE =
  /^(.+)\s+(?:High School|Freshman|JV|Junior Varsity)\s*-\s*(?:Finals|Prelims|Semis)\s*$/i
const SKIP_LINES = new Set(['splits', 'field series'])

const EVENT_KEYWORDS = [
  { id: 'shortH', patterns: [/100m hurdles/i, /110m hurdles/i] },
  { id: '300H', patterns: [/300m hurdles/i] },
  { id: '4x100', patterns: [/4x100 relay/i] },
  { id: '4x200', patterns: [/4x200 relay/i] },
  { id: '4x400', patterns: [/4x400 relay/i] },
  { id: '4x800', patterns: [/4x800 relay/i] },
  { id: '3200m', patterns: [/\b3200 meters\b/i] },
  { id: '1600m', patterns: [/\b1600 meters\b/i] },
  { id: '800m', patterns: [/\b800 meters\b/i] },
  { id: '400m', patterns: [/\b400 meters\b/i] },
  { id: '200m', patterns: [/\b200 meters\b/i] },
  { id: '100m', patterns: [/\b100 meters\b/i] },
  { id: 'LJ', patterns: [/long jump/i] },
  { id: 'HJ', patterns: [/high jump/i] },
  { id: 'PV', patterns: [/pole vault/i] },
  { id: 'SP', patterns: [/shot put/i] },
  { id: 'DT', patterns: [/discus/i] },
]

function matchEventId(label) {
  for (const { id, patterns } of EVENT_KEYWORDS) {
    if (patterns.some((p) => p.test(label))) return id
  }
  return null
}

function isRelay(eventId) {
  return EVENTS.find((e) => e.id === eventId)?.category === 'relay'
}

// A relay record closes on a "Team Name - A" style line — distinct from
// a bare place line like "1." or "--", which is checked for separately.
const TEAM_SQUAD_RE = /^(.+?)\s*-\s*([A-Z])\s*$/
const PLACE_LINE_RE = /^(\d+)\.\s*$|^(--)\s*$/

const IND_ROW_RE =
  /^(?:(\d+)\.|(--))?\s*(\d{1,2})\s+(.+?)\s+((?:\d{1,2}:)?\d{1,3}\.\d{2}a?(?:PB|SB)?|\d+'\s*\d+(?:\.\d+)?"?(?:PB|SB)?|DNS|SCR|DQ|ND|NH)\s*$/

function splitName(name) {
  const parts = name.trim().split(' ')
  return parts.length > 1
    ? { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
    : { firstName: name.trim(), lastName: '' }
}

export function parseTwoLineText(lines) {
  const rows = []
  let currentEventId = null
  let currentGender = 'boys'
  let relayBuffer = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line || !line.trim()) {
      i++
      continue
    }

    const genderMatch = line.match(GENDER_SECTION_RE)
    if (genderMatch) {
      currentGender = genderMatch[1].toLowerCase().startsWith('wom') ? 'girls' : 'boys'
      i++
      continue
    }

    const heading = line.match(HEADING_RE)
    if (heading) {
      currentEventId = matchEventId(heading[1])
      relayBuffer = []
      i++
      continue
    }

    if (SKIP_LINES.has(line.trim().toLowerCase()) || !currentEventId) {
      i++
      continue
    }

    if (isRelay(currentEventId)) {
      const teamSquad = line.match(TEAM_SQUAD_RE)
      if (teamSquad && !PLACE_LINE_RE.test(line)) {
        const team = teamSquad[1].trim()
        const relayTeam = teamSquad[2]
        const markRaw = relayBuffer.pop()
        let place = null
        if (relayBuffer.length > 0 && PLACE_LINE_RE.test(relayBuffer[0])) {
          const placeLine = relayBuffer.shift()
          const m = placeLine.match(PLACE_LINE_RE)
          place = m[1] ? parseInt(m[1], 10) : null
        }
        const legs = []
        for (let j = 0; j < relayBuffer.length - 1; j += 2) {
          legs.push(splitName(relayBuffer[j + 1]))
        }
        if (markRaw) {
          rows.push({
            type: 'relay',
            eventId: currentEventId,
            gender: currentGender,
            place,
            schoolRaw: team,
            relayTeam,
            markRaw: markRaw.trim(),
            legs,
          })
        }
        relayBuffer = []
      } else {
        relayBuffer.push(line.trim())
      }
      i++
      continue
    }

    const m = line.match(IND_ROW_RE)
    if (m) {
      const [, placeNum, placeDash, , name, markRaw] = m
      const place = placeDash || !placeNum ? null : parseInt(placeNum, 10)
      const school = i + 1 < lines.length ? lines[i + 1].trim() : ''
      const { firstName, lastName } = splitName(name)
      rows.push({
        type: 'individual',
        eventId: currentEventId,
        gender: currentGender,
        place,
        firstName,
        lastName,
        schoolRaw: school,
        markRaw: markRaw.trim(),
      })
      i += 2
      continue
    }

    i++
  }

  return rows
}
