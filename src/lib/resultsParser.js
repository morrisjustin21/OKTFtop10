// Parses the meet-results text format used by the results platform behind
// OSSAA meets (e.g. Ardmore Invitational, Yukon Classic). Event headings
// look like:
//
//   #7  Girls' 100 Meters  High School  [Finals]
//   #9  Girls' 3200 Meters  Varsity  Finals
//
// The trailing words after the event name vary (High School, Varsity,
// Junior Varsity) so headings are matched loosely — anything after the
// gender word is scanned for a known event name.
//
// Rows look like:
//
//   1  Keeton, Maddison  12  UNATTACHED  15.40  10
//   -- Chatman, Brooklyn     ARDMORE     NM
//   1  Andrews, Adarian  JR  EDMOND MEM…  1:52.33  10   <- letter grade
//   2  Johnson, Austin   11  CARL ALBERT  6-02.00  6.33 <- decimal tie points
//
// or, for relays, a team + leg-listing row pair:
//
//   2  DEER CREEK (EDMOND)  'A'  49.21  16
//   1) Thompson, La'Bria 10  2) Paschel, Amir 12  ...
//
// Team names are always ALL CAPS, which is what lets the row regex tell a
// school apart from an athlete name. Long team names sometimes get
// truncated with an ellipsis in narrower table columns (e.g.
// "EDMOND NOR…" for Edmond North) — the raw truncated text is kept as
// schoolRaw so the review table's school picker can prefix-match it.

import { normalizeGrade } from './grade.js'

const HEADING_RE = /^#\d+\s+(Girls|Boys)\W*\s+(.+)$/i

// Team names may include apostrophes, periods, hyphens, parentheses (e.g.
// "DEER CREEK (EDMOND)"), and a trailing ellipsis from truncation.
const TEAM = "[A-Z][A-Z' .()\\-\u2026]*[A-Z)\u2026]"

const RELAY_ROW_RE = new RegExp(
  `^(\\d+|--)\\s+(${TEAM})\\s+'([A-Z])'\\s+((?:\\d{1,2}:)?\\d{1,3}\\.\\d{2}|DNS|DNF|DQ|SCR)\\s*(\\d+(?:\\.\\d+)?)?\\s*$`
)

const ROW_RE = new RegExp(
  '^(\\d+|--)\\s+' +
    "([A-Za-z.'\\-]+(?:\\s[A-Za-z.'\\-]+)*,\\s*[A-Za-z0-9 .'\\-()]+?)\\s+" +
    '(?:(\\d{1,2}|FR|SO|JR|SR)\\s+)?' +
    `(${TEAM})\\s+` +
    '((?:\\d{1,2}:)?\\d{1,3}\\.\\d{2}|\\d{1,3}-\\d{1,2}\\.\\d{2}|DNS|DNF|DQ|SCR|NM|NH)\\s*' +
    '(\\d+(?:\\.\\d+)?)?\\s*(?:\\(\\d+(?:\\.\\d+)?\\))?\\s*$'
)

// Order matters: check longer/more specific event names before shorter
// ones that could otherwise match as a substring (e.g. "3200 meters"
// contains "200 meters").
const EVENT_KEYWORDS = [
  { id: 'shortH', patterns: [/\b100m hurdles\b/, /\b110m hurdles\b/] },
  { id: '300H', patterns: [/\b300m hurdles\b/] },
  { id: '4x100', patterns: [/\b4x100 relay\b/] },
  { id: '4x200', patterns: [/\b4x200 relay\b/] },
  { id: '4x400', patterns: [/\b4x400 relay\b/] },
  { id: '4x800', patterns: [/\b4x800 relay\b/] },
  { id: '3200m', patterns: [/\b3200 meters\b/] },
  { id: '1600m', patterns: [/\b1600 meters\b/] },
  { id: '800m', patterns: [/\b800 meters\b/] },
  { id: '400m', patterns: [/\b400 meters\b/] },
  { id: '200m', patterns: [/\b200 meters\b/] },
  { id: '100m', patterns: [/\b100 meters\b/] },
  { id: 'LJ', patterns: [/\blong jump\b/] },
  { id: 'HJ', patterns: [/\bhigh jump\b/] },
  { id: 'PV', patterns: [/\bpole vault\b/] },
  { id: 'SP', patterns: [/\bshot put\b/] },
  { id: 'DT', patterns: [/\bdiscus\b/] },
]

function matchEventId(label) {
  const low = label.toLowerCase()
  for (const { id, patterns } of EVENT_KEYWORDS) {
    if (patterns.some((p) => p.test(low))) return id
  }
  return null
}

// Parses a relay leg-listing line like:
//   1) Thompson, La'Bria 10  2) Paschel, Amir 12  3) Stubblefield, Zaelyn 11  4) Chenault, Taliyah 11
// into an ordered array of { order, firstName, lastName }.
const LEG_RE = /(\d)\)\s*([A-Za-z.'-]+(?:\s[A-Za-z.'-]+)*),\s*([A-Za-z0-9 .'()-]+?)(?=\s+\d\)|$)/g

function parseRelayLegs(line) {
  const legs = []
  let match
  LEG_RE.lastIndex = 0
  while ((match = LEG_RE.exec(line)) !== null) {
    const order = parseInt(match[1], 10)
    const lastName = match[2].trim()
    // The grade year trails the first name (e.g. "Ally 10") — strip it.
    const firstName = match[3].trim().replace(/\s+\d{1,2}$/, '').trim()
    legs.push({ order, firstName, lastName })
  }
  return legs
}

export function parseResultsText(lines) {
  const rows = []
  let currentEventId = null
  let currentGender = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const heading = line.match(HEADING_RE)
    if (heading) {
      currentGender = heading[1].toLowerCase() === 'girls' ? 'girls' : 'boys'
      currentEventId = matchEventId(heading[2])
      continue
    }

    if (!currentEventId) continue
    if (/^(Team\s+Relay|Athlete\s+Yr)\b/i.test(line)) continue
    if (/^\d\)/.test(line)) {
      // Leg-listing line following a relay team row — attach the athlete
      // names to that row rather than treating this as its own result.
      const legs = parseRelayLegs(line)
      const lastRow = rows[rows.length - 1]
      if (legs.length > 0 && lastRow && lastRow.type === 'relay') {
        lastRow.legs = legs
      }
      continue
    }

    const relayMatch = line.match(RELAY_ROW_RE)
    if (relayMatch) {
      const [, place, teamRaw, relayLeg, markRaw] = relayMatch
      rows.push({
        type: 'relay',
        eventId: currentEventId,
        gender: currentGender ?? 'boys',
        place: place === '--' ? null : parseInt(place, 10),
        schoolRaw: teamRaw.trim(),
        relayTeam: relayLeg,
        markRaw: markRaw.trim(),
      })
      continue
    }

    const rowMatch = line.match(ROW_RE)
    if (rowMatch) {
      const [, place, nameRaw, gradeRaw, teamRaw, markRaw] = rowMatch
      const [lastName, firstNameRaw] = nameRaw.split(',').map((s) => s.trim())
      rows.push({
        type: 'individual',
        eventId: currentEventId,
        gender: currentGender ?? 'boys',
        place: place === '--' ? null : parseInt(place, 10),
        firstName: firstNameRaw ?? '',
        lastName: lastName ?? '',
        schoolRaw: teamRaw.trim(),
        markRaw: markRaw.trim(),
        grade: normalizeGrade(gradeRaw),
      })
    }
  }

  return rows
}
