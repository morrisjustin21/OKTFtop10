// Parses the meet-results PDF format actually used for OSSAA meets like
// the Ardmore Invitational: event headings look like
//
//   #7  Girls' 100 Meters  High School  [Finals]
//
// followed by either individual/field rows —
//
//   1  Keeton, Maddison  12  UNATTACHED  15.40  10
//   -- Chatman, Brooklyn     ARDMORE     NM
//
// — or, for relays, a team + leg row pair —
//
//   2  ARDMORE  'A'  49.21  16
//   1) Thompson, La'Bria 10  2) Paschel, Amir 12  3) ...  4) ...
//
// Team names are always ALL CAPS in this format, which is what lets the
// row regex tell a school apart from an athlete name. Tuned and verified
// against a real results export; other meet software may format
// differently, so PdfImportForm's review table remains the safety net
// for anything that doesn't match cleanly.

const HEADING_RE = /^#\d+\s+(Girls|Boys)\W*\s+(.+?)\s+High School\b/i

const RELAY_ROW_RE =
  /^(\d+|--)\s+([A-Z][A-Z' .\-]*[A-Z])\s+'([A-Z])'\s+((?:\d{1,2}:)?\d{1,3}\.\d{2}|DNS|DNF|DQ|SCR)\s*(\d{1,2})?\s*$/

const ROW_RE =
  /^(\d+|--)\s+([A-Za-z.'\-]+(?:\s[A-Za-z.'\-]+)*,\s*[A-Za-z0-9 .'\-()]+?)\s+(?:(\d{1,2})\s+)?([A-Z][A-Z' .\-]*[A-Z]|[A-Z])\s+((?:\d{1,2}:)?\d{1,3}\.\d{2}|\d{1,3}-\d{1,2}\.\d{2}|DNS|DNF|DQ|SCR|NM|NH)\s*(\d{1,2})?\s*$/

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
    if (line.startsWith('1)')) continue // relay leg listing — not needed for team results

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
      const [, place, nameRaw, , teamRaw, markRaw] = rowMatch
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
      })
    }
  }

  return rows
}
