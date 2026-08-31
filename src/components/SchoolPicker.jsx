import { useEffect, useState } from 'react'
import { normalizeSchoolName } from '../lib/schoolNameMatch.js'

export default function SchoolPicker({ schools, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setQuery(value?.name ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.id])

  const matches = query.trim()
    ? schools.filter((s) => {
        const q = query.toLowerCase()
        const qNormalized = normalizeSchoolName(query)
        return (
          s.name.toLowerCase().includes(q) ||
          normalizeSchoolName(s.name).includes(qNormalized) ||
          (s.aliases ?? []).some(
            (a) => a.toLowerCase().includes(q) || normalizeSchoolName(a).includes(qNormalized)
          )
        )
      })
    : []

  function handleChange(v) {
    setQuery(v)
    setOpen(true)
    if (value && v !== value.name) onChange(null)
  }

  function handleSelect(s) {
    setQuery(s.name)
    setOpen(false)
    onChange(s)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'Start typing a school name…'}
        className="w-full border border-charcoal/20 rounded px-3 py-2"
        autoComplete="off"
      />
      {open && query && !value && matches.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-charcoal/20 rounded mt-1 max-h-48 overflow-y-auto shadow-sm">
          {matches.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => handleSelect(s)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-paper"
            >
              {s.name}
              {s.aliases?.length > 0 && (
                <span className="text-graphite"> ({s.aliases.join(', ')})</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && query && !value && matches.length === 0 && (
        <p className="text-xs text-graphite mt-1">
          No match — add this team on the Teams tab first.
        </p>
      )}
    </div>
  )
}
