// Parses classic Hy-Tek Meet Manager text results — recognizable by the
// "====" separator bars, "Yr"/"H#" abbreviated columns, and the trailing
// "a" (auto/electronic timing) or "h" (hand timing) suffix on times.
// This is a very common export format across many timing companies, not
// specific to any one platform. Verified against two real meet exports
// with different level wording (one used "Varsity"/"JV", another used
// "High School"/"Freshman") — the level word itself is informational
// only and doesn't need to be a fixed set, since event matching works
// against the whole heading remainder regardless of what precedes it.
//
// Individual/field events:
//   Boys Varsity 100 Meters       (or: Boys High School 100 Meters)
//   ============================================================
//    Athlete Yr Team Mark H#
//   ============================================================
//    1 Quinton Mask 12 MacArthur 10.69a
//    -- Ben Cruz 12 Moore DNS
//
// Relays list the team + time, then a separate line naming the squad
// letter (no runner names in this format). Place is usually numeric or
// "--", but has also been seen as "X" for exhibition/unofficial entries:
//   Boys Varsity 4x100 Relay
//   ======================================================
//    Team Time H#
//   ======================================================
//    1 Mustang 42.59a
//    1) A

import { EVENTS } from '../data/mockResults.js'
import { normalizeGrade } from './grade.js'

const HEADING_RE = /^(Boys|Girls)\s+(.+)$/i

// Freshman-level results get flagged for review (same idea as MileSplit's
// MS/Open flag) since they're a different competitive tier than varsity;
// everything else (Varsity, JV, Junior Varsity, High School, or no level
// word at all) is treated as standard and included by default.
const LEVEL_WORDS_RE = /\b(Varsity|JV|Junior Varsity|High School|Freshman)\b/i
function normalizeLevel(word) {
  if (!word) return null
  return word.toLowerCase() === 'freshman' ? 'FRESHMAN' : 'HS'
}

const EVENT_KEYWORDS = [
  { id: 'shortH', patterns: [/100\s*meters?\s+hurdles/i, /110\s*meters?\s+hurdles/i, /100m hurdles/i, /110m hurdles/i] },
  { id: '300H', patterns: [/300\s*meters?\s+hurdles/i, /300m hurdles/i] },
  { id: '4x100', patterns: [/4x100\s*(?:meters?)?\s*relay/i] },
  { id: '4x200', patterns: [/4x200\s*(?:meters?)?\s*relay/i] },
  { id: '4x400', patterns: [/4x400\s*(?:meters?)?\s*relay/i] },
  { id: '4x800', patterns: [/4x800\s*(?:meters?)?\s*relay/i] },
  { id: '3200m', patterns: [/\b3200\s*meters?\b/i] },
  { id: '1600m', patterns: [/\b1600\s*meters?\b/i] },
  { id: '800m', patterns: [/\b800\s*meters?\b/i] },
  { id: '400m', patterns: [/\b400\s*meters?\b/i] },
  { id: '200m', patterns: [/\b200\s*meters?\b/i] },
  { id: '100m', patterns: [/\b100\s*meters?\b/i] },
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

const SEP_RE = /^=+$/
const IND_HEADER_RE = /^\s*(?:Athlete|Name)\s+Yr\s+Team\s+Mark\s+H#(?:\s+Wind)?\s*$/i
const RELAY_HEADER_RE = /^\s*(?:Team\s+Time\s+H#|Name\s+Yr\s+Team\s+Mark\s+H#(?:\s+Wind)?)\s*$/i

// Place is usually numeric or "--", but "X" has also been seen for
// exhibition/unofficial entries. Grade anchors the split between name
// and team — both can be multi-word Title Case, so there's no other
// reliable boundary. Some field events (long/triple jump) list a wind
// reading after the heat number, e.g. "19-5.25 2 -0.0".
const IND_ROW_RE =
  /^\s*(\d+|--|X)\s+(.+?)\s+(\d{1,2})\s+(.+?)\s+((?:\d{1,2}:)?\d{1,3}\.\d{2}[ah]?|\d{1,3}-\d{1,2}(?:\.\d+)?|DNS|DQ|ND|NH|DNF|SCR|NM)\s*(\d+)?\s*(-?\d+\.\d+)?\s*$/

const RELAY_ROW_RE =
  /^\s*(\d+|--|X)\s+(.+?)\s+((?:\d{1,2}:)?\d{1,3}\.\d{2}[ah]?|DNS|DQ|SCR)\s*(\d+)?\s*(-?\d+\.\d+)?\s*$/

const LEG_LETTER_RE = /^\s*\d+\)\s*([A-Z])\s*$/

export function parseHyTekText(lines) {
  const rows = []
  let currentEventId = null
  let currentGender = null
  let currentLevel = null

  for (const raw of lines) {
    if (!raw.trim()) continue

    const heading = raw.match(HEADING_RE)
    if (heading) {
      currentGender = heading[1].toLowerCase() === 'girls' ? 'girls' : 'boys'
      currentEventId = matchEventId(heading[2])
      const levelMatch = heading[2].match(LEVEL_WORDS_RE)
      currentLevel = normalizeLevel(levelMatch ? levelMatch[1] : null)
      continue
    }

    if (SEP_RE.test(raw.trim()) || IND_HEADER_RE.test(raw) || RELAY_HEADER_RE.test(raw)) continue
    if (!currentEventId) continue

    const leg = raw.match(LEG_LETTER_RE)
    if (leg) {
      const last = rows[rows.length - 1]
      if (last && last.type === 'relay') last.relayTeam = leg[1]
      continue
    }

    if (isRelay(currentEventId)) {
      const m = raw.match(RELAY_ROW_RE)
      if (m) {
        const [, place, team, markRaw] = m
        rows.push({
          type: 'relay',
          eventId: currentEventId,
          gender: currentGender ?? 'boys',
          level: currentLevel,
          place: place === '--' || place === 'X' ? null : parseInt(place, 10),
          schoolRaw: team.trim(),
          markRaw: markRaw.trim(),
        })
      }
      continue
    }

    const m = raw.match(IND_ROW_RE)
    if (m) {
      const [, place, name, gradeRaw, team, markRaw] = m
      const nameParts = name.trim().split(' ')
      const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : name.trim()
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
      rows.push({
        type: 'individual',
        eventId: currentEventId,
        gender: currentGender ?? 'boys',
        level: currentLevel,
        place: place === '--' || place === 'X' ? null : parseInt(place, 10),
        firstName,
        lastName,
        schoolRaw: team.trim(),
        markRaw: markRaw.trim(),
        grade: normalizeGrade(gradeRaw),
      })
    }
  }

  return rows
}
