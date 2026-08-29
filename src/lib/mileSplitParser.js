// Parses MileSplit's "raw" results view — a plain tab-delimited export,
// distinct from their JS-rendered "formatted" view (which has no usable
// text to scrape). Verified against a real ok.milesplit.com meet's
// /results/<id>/raw page. Event headings look like:
//
//   Girls Girls 1 Mile Run (MS) Finals
//   Boys Boys 1 Mile Run (HS) Finals
//   Women Women's 1 Mile Run (Open) Finals
//
// (the gender word appears twice — once as a division label, once as
// part of the event name — that's MileSplit's own formatting, not a
// copy/paste artifact). (HS)/(MS)/(Open) marks the competition level;
// only (HS) rows matter for a high-school-only site, so MS/Open rows are
// parsed but flagged so they can be excluded in review rather than
// silently dropped.
//
// Result rows are tab-separated: PLACE, NAME, GRADE, GENDER, TEAM, MARK,
// HEAT, WIND — except unplaced/DNS entries, which omit the PLACE column
// entirely, shifting everything left by one field.
//
// Note: this parser only covers individual/field events. MileSplit's
// relay row format hasn't been verified against real data yet — bring a
// sample of an actual relay result and it can be added.

const HEADING_RE =
  /^(Girls|Boys|Women|Men)\s+(?:Girls|Boys|Women's|Men's)\s+(.+?)\s*\(([A-Za-z]+)\)\s*(Finals|Prelims|Semis)?\s*$/i

const EVENT_KEYWORDS = [
  { id: 'shortH', patterns: [/100 meter hurdles/i, /110 meter hurdles/i] },
  { id: '300H', patterns: [/300 meter hurdles/i] },
  { id: '4x100', patterns: [/4x100 meter relay/i] },
  { id: '4x200', patterns: [/4x200 meter relay/i] },
  { id: '4x400', patterns: [/4x400 meter relay/i] },
  { id: '4x800', patterns: [/4x800 meter relay/i] },
  { id: '3200m', patterns: [/3200 meter run/i] },
  { id: '1600m', patterns: [/1600 meter run/i] },
  { id: '800m', patterns: [/800 meter run/i] },
  { id: '400m', patterns: [/400 meter dash/i] },
  { id: '200m', patterns: [/200 meter dash/i] },
  { id: '100m', patterns: [/100 meter dash/i] },
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

export function parseMileSplitText(lines) {
  const rows = []
  let currentEventId = null
  let currentGender = null
  let currentLevel = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const heading = line.match(HEADING_RE)
    if (heading) {
      const genderWord = heading[1].toLowerCase()
      currentGender = genderWord === 'girls' || genderWord === 'women' ? 'girls' : 'boys'
      currentLevel = heading[3].toUpperCase()
      currentEventId = matchEventId(heading[2])
      continue
    }

    if (!currentEventId) continue
    if (/^PLACE\t/i.test(line)) continue // column header row

    const fields = line.split('\t').map((f) => f.trim())

    // A leading numeric field is the place; unplaced/DNS rows omit it,
    // shifting every other column left by one.
    let idx = 0
    let place = null
    if (/^\d+$/.test(fields[0])) {
      place = parseInt(fields[0], 10)
      idx = 1
    }

    // Need at least name, grade, gender letter, team, mark.
    if (fields.length - idx < 5) continue

    const name = fields[idx]
    const team = fields[idx + 3]
    const markRaw = fields[idx + 4]
    if (!name || !team || !markRaw) continue

    const nameParts = name.split(' ')
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : name

    rows.push({
      type: 'individual',
      eventId: currentEventId,
      gender: currentGender ?? 'boys',
      level: currentLevel, // 'HS' | 'MS' | 'OPEN' — used to flag non-HS rows for review
      place,
      firstName,
      lastName,
      schoolRaw: team,
      markRaw,
    })
  }

  return rows
}
