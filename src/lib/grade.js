// Most formats give a numeric grade (9-12) directly, but some use class
// abbreviations instead — normalize both into a plain number.
const CLASS_ABBREVIATIONS = { FR: 9, SO: 10, JR: 11, SR: 12 }

export function normalizeGrade(raw) {
  if (!raw) return null
  const trimmed = raw.trim().toUpperCase()
  if (CLASS_ABBREVIATIONS[trimmed]) return CLASS_ABBREVIATIONS[trimmed]
  const num = parseInt(trimmed, 10)
  return Number.isNaN(num) ? null : num
}
