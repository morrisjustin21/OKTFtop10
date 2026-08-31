// Strips a trailing "High School" / "Senior High School" / "HS" (or
// similar) suffix so that, for example, "Duncan" and "Duncan High
// School" are always treated as the same team — this is a universal
// rule, not something that has to be added as a per-school alias.
const SUFFIX_RE = /\s+(senior\s+high\s+school|high\s+school|senior\s+high|high|h\.?s\.?)\.?\s*$/i

export function normalizeSchoolName(name) {
  if (!name) return ''
  return name.trim().replace(SUFFIX_RE, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

// True if two school name strings should be considered the same team,
// either literally or once the High School/HS suffix is stripped from
// either side.
export function schoolNamesMatch(a, b) {
  if (!a || !b) return false
  const rawA = a.toLowerCase().trim()
  const rawB = b.toLowerCase().trim()
  if (rawA === rawB) return true
  return normalizeSchoolName(a) === normalizeSchoolName(b)
}
