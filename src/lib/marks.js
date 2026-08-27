// Turns whatever a coach types into a sortable number, while the original
// text is kept as-is for display (see mark_display in the results table).

// Accepts "10.72" or "1:02.45" (min:sec) — returns total seconds.
function parseTime(raw) {
  const value = raw.trim()
  const parts = value.split(':')
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0])
    const seconds = parseFloat(parts[1])
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null
    return minutes * 60 + seconds
  }
  const seconds = parseFloat(value)
  return Number.isNaN(seconds) ? null : seconds
}

// Accepts "21'04\"" (feet + inches), Hy-Tek's "21-04.00" (feet-inches.
// hundredths) format, or a plain decimal like "21.33" (feet) — returns
// total feet as a decimal.
function parseDistance(raw) {
  const value = raw.trim()

  const feetInchesQuote = value.match(/^(\d+)'\s*(\d+(?:\.\d+)?)"?$/)
  if (feetInchesQuote) {
    const feet = parseFloat(feetInchesQuote[1])
    const inches = parseFloat(feetInchesQuote[2])
    return feet + inches / 12
  }

  const feetInchesDash = value.match(/^(\d+)-(\d+(?:\.\d+)?)$/)
  if (feetInchesDash) {
    const feet = parseFloat(feetInchesDash[1])
    const inches = parseFloat(feetInchesDash[2])
    return feet + inches / 12
  }

  const decimal = parseFloat(value)
  return Number.isNaN(decimal) ? null : decimal
}

export function parseMarkValue(unit, raw) {
  if (!raw || !raw.trim()) return null
  return unit === 'time' ? parseTime(raw) : parseDistance(raw)
}
