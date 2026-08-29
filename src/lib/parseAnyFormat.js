import { parseResultsText } from './resultsParser.js'
import { parseMileSplitText } from './mileSplitParser.js'
import { parseHyTekText } from './hyTekMeetManagerParser.js'
import { parseTwoLineText } from './twoLineFormatParser.js'

// Each parser gets a shot at the text; the first one that finds any rows
// wins. Order matters only as a tie-breaker (unlikely two formats both
// match the same text), so list the more distinctive format first.
const FORMATS = [
  { name: 'MileSplit (raw)', parse: parseMileSplitText },
  { name: 'Hy-Tek Meet Manager', parse: parseHyTekText },
  { name: 'Two-line results export', parse: parseTwoLineText },
  { name: 'Web results export', parse: parseResultsText },
]

export function parseAnyFormat(lines) {
  for (const format of FORMATS) {
    const rows = format.parse(lines)
    if (rows.length > 0) {
      return { rows, formatName: format.name }
    }
  }
  return { rows: [], formatName: null }
}
