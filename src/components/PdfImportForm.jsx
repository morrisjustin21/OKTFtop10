import { useEffect, useState } from 'react'
import { EVENTS } from '../data/mockResults.js'
import { parseMarkValue } from '../lib/marks.js'
import { useSchools } from '../lib/useSchools.js'
import { useSeasons } from '../lib/useSeasons.js'
import { extractTextLines } from '../lib/pdfText.js'
import { parseAnyFormat } from '../lib/parseAnyFormat.js'
import {
  findOrCreateMeet,
  findOrCreateAthlete,
  insertResult,
  insertRelayResult,
} from '../lib/resultsRepository.js'
import { normalizeSchoolName, schoolNamesMatch } from '../lib/schoolNameMatch.js'
import SchoolPicker from './SchoolPicker.jsx'

const NON_SCORING_MARKS = new Set(['DNS', 'DNF', 'DQ', 'SCR', 'NM', 'NH'])

function guessSchool(schools, schoolRaw) {
  if (!schoolRaw) return null
  let q = schoolRaw.trim()
  // Long team names get truncated with an ellipsis in narrower table
  // columns (e.g. "EDMOND NOR…" for Edmond North) — treat that as a
  // prefix to match against, not a literal substring.
  const truncated = q.endsWith('\u2026')
  if (truncated) q = q.slice(0, -1).trim()
  const qLower = q.toLowerCase()
  const qNormalized = normalizeSchoolName(q)

  return (
    // Exact match, or exact match once "High School"/"HS" is stripped
    // from either side (e.g. "Duncan" ↔ "Duncan High School").
    schools.find((s) => schoolNamesMatch(s.name, q)) ??
    schools.find((s) =>
      truncated
        ? s.name.toLowerCase().startsWith(qLower) || normalizeSchoolName(s.name).startsWith(qNormalized)
        : s.name.toLowerCase().includes(qLower) || normalizeSchoolName(s.name).includes(qNormalized)
    ) ??
    schools.find((s) => (s.aliases ?? []).some((a) => schoolNamesMatch(a, q))) ??
    null
  )
}

export default function PdfImportForm() {
  const { seasons, currentSeason } = useSeasons()
  const [seasonId, setSeasonId] = useState('')
  const [meetName, setMeetName] = useState('')
  const [meetDate, setMeetDate] = useState('')
  const [parsing, setParsing] = useState(false)
  const [rows, setRows] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState(null)
  const [detectedFormat, setDetectedFormat] = useState(null)
  const [pastedText, setPastedText] = useState('')
  const [inputMode, setInputMode] = useState('pdf') // 'pdf' | 'paste'

  useEffect(() => {
    if (!seasonId && currentSeason) setSeasonId(currentSeason.id)
  }, [seasonId, currentSeason])

  // No classification filter here — a single meet's results usually span
  // several classes, so match against every school in the season at once.
  const schools = useSchools(seasonId)

  function buildRowsFromParsed(lines) {
    const { rows: parsed, formatName } = parseAnyFormat(lines)
    if (parsed.length === 0) {
      setParseError(
        "Couldn't find any result rows in a known format (checked MileSplit raw exports and " +
          'the web results export style). Share a copy with me and I can add support for it.'
      )
      setRows([])
      return
    }
    setRows(
      parsed.map((r, i) => ({
        ...r,
        id: i,
        school: guessSchool(schools, r.schoolRaw),
        legs:
          r.type === 'relay'
            ? r.legs && r.legs.length > 0
              ? r.legs.map((l) => ({ firstName: l.firstName, lastName: l.lastName }))
              : [
                  { firstName: '', lastName: '' },
                  { firstName: '', lastName: '' },
                  { firstName: '', lastName: '' },
                  { firstName: '', lastName: '' },
                ]
            : undefined,
        // Non-scoring statuses (DQ, DNF, NM, etc.) aren't real marks, and
        // non-HS divisions (MS/Open, from formats like MileSplit that mix
        // levels in one meet) aren't relevant to a high-school-only site —
        // both come in unchecked so they don't get imported by mistake.
        include:
          !NON_SCORING_MARKS.has(r.markRaw.toUpperCase()) && (!r.level || r.level === 'HS'),
      }))
    )
    setDetectedFormat(formatName)
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setImportSummary(null)
    setParsing(true)
    try {
      const lines = await extractTextLines(file)
      buildRowsFromParsed(lines)
    } catch (err) {
      setParseError(`Couldn't read that PDF: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }

  function handleParsePastedText() {
    setParseError(null)
    setImportSummary(null)
    buildRowsFromParsed(pastedText.split('\n'))
  }

  function updateRow(id, patch) {
    setRows((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function updateLeg(rowId, legIndex, patch) {
    setRows((current) =>
      current.map((r) => {
        if (r.id !== rowId) return r
        const legs = [...(r.legs ?? [])]
        legs[legIndex] = { ...(legs[legIndex] ?? { firstName: '', lastName: '' }), ...patch }
        return { ...r, legs }
      })
    )
  }

  function removeRow(id) {
    setRows((current) => current.filter((r) => r.id !== id))
  }

  async function handleImport() {
    if (!meetName.trim() || !meetDate) {
      setParseError('Enter the meet name and date before importing.')
      return
    }
    setImporting(true)
    setImportSummary(null)
    let succeeded = 0
    const failed = []

    try {
      const meetId = await findOrCreateMeet(meetName.trim(), meetDate, seasonId)

      for (const row of rows) {
        if (!row.include) continue
        const event = EVENTS.find((e) => e.id === row.eventId)
        if (!event || !row.school) {
          failed.push({ row, reason: 'Missing event or school' })
          continue
        }
        const markValue = parseMarkValue(event.unit, row.markRaw)
        if (markValue === null) {
          failed.push({ row, reason: `Couldn't read mark "${row.markRaw}"` })
          continue
        }

        try {
          if (row.type === 'relay') {
            await insertRelayResult({
              schoolId: row.school.id,
              relayTeam: row.relayTeam,
              eventId: row.eventId,
              meetId,
              gender: row.gender,
              markValue,
              markDisplay: row.markRaw.trim(),
              legs: row.legs,
              source: 'csv',
              verified: true,
            })
          } else {
            if (!row.firstName.trim() || !row.lastName.trim()) {
              failed.push({ row, reason: 'Missing athlete name' })
              continue
            }
            const athleteId = await findOrCreateAthlete({
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              gender: row.gender,
              schoolId: row.school.id,
            })
            await insertResult({
              athleteId,
              eventId: row.eventId,
              meetId,
              gender: row.gender,
              markValue,
              markDisplay: row.markRaw.trim(),
              grade: row.grade,
              source: 'csv',
              verified: true,
            })
          }
          succeeded++
        } catch (err) {
          failed.push({ row, reason: err.message })
        }
      }

      setImportSummary({ succeeded, failed })
      if (failed.length === 0) {
        setRows(null)
      } else {
        const reasonById = new Map(failed.map((f) => [f.row.id, f.reason]))
        setRows(
          rows
            .filter((r) => reasonById.has(r.id))
            .map((r) => ({ ...r, failReason: reasonById.get(r.id) }))
        )
      }
    } catch (err) {
      setParseError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <p className="font-display uppercase tracking-wide text-lg mb-1">Import results from PDF</p>
      <p className="text-sm text-graphite mb-4">
        Review every row below before importing — parsing a PDF is never perfect, so this is your
        chance to fix anything that came through wrong. Rows marked DQ, DNF, NM, or similar are
        unchecked automatically since they aren't real marks.
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-graphite">Season</label>
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.is_current ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-graphite">Meet name</label>
          <input
            type="text"
            value={meetName}
            onChange={(e) => setMeetName(e.target.value)}
            placeholder="e.g. Ardmore HS Invitational"
            className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-graphite">Meet date</label>
          <input
            type="date"
            value={meetDate}
            onChange={(e) => setMeetDate(e.target.value)}
            className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setInputMode('pdf')}
            className={`text-xs px-3 py-1.5 rounded border ${
              inputMode === 'pdf'
                ? 'bg-accent text-white border-accent'
                : 'border-charcoal/20 text-graphite'
            }`}
          >
            Upload PDF
          </button>
          <button
            type="button"
            onClick={() => setInputMode('paste')}
            className={`text-xs px-3 py-1.5 rounded border ${
              inputMode === 'paste'
                ? 'bg-accent text-white border-accent'
                : 'border-charcoal/20 text-graphite'
            }`}
          >
            Paste results text
          </button>
        </div>

        {inputMode === 'pdf' ? (
          <>
            <label className="text-xs uppercase tracking-wide text-graphite">Results PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block mt-1 text-sm"
            />
            <p className="text-xs text-graphite mt-1">
              Only works if the PDF has real selectable text. A "print to PDF" of a results
              webpage is often just a flattened image — if so, use "Paste results text" instead.
            </p>
          </>
        ) : (
          <>
            <label className="text-xs uppercase tracking-wide text-graphite">
              Paste results text
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={8}
              placeholder="Open the results webpage, select all the text, copy, and paste it here…"
              className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1 text-sm font-mono"
            />
            <button
              type="button"
              onClick={handleParsePastedText}
              className="mt-2 bg-accent text-white rounded px-4 py-1.5 text-sm font-body"
            >
              Parse text
            </button>
          </>
        )}
      </div>

      {parsing && <p className="text-sm text-graphite">Reading the PDF…</p>}
      {parseError && <p className="text-sm text-red-600 mb-3">{parseError}</p>}
      {detectedFormat && rows && rows.length > 0 && (
        <p className="text-xs text-graphite mb-3">Detected format: {detectedFormat}</p>
      )}

      {importSummary && (
        <p className="text-sm text-green-700 mb-3">
          Imported {importSummary.succeeded} result(s).
          {importSummary.failed.length > 0 &&
            ` ${importSummary.failed.length} row(s) need fixes — see below.`}
        </p>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="border border-charcoal/10 rounded-lg overflow-x-auto mb-3">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-graphite text-left">
                  <th className="px-2 py-2 font-normal">Include</th>
                  <th className="px-2 py-2 font-normal">Event</th>
                  <th className="px-2 py-2 font-normal">Gender</th>
                  <th className="px-2 py-2 font-normal">Athlete / Leg</th>
                  <th className="px-2 py-2 font-normal w-56">School</th>
                  <th className="px-2 py-2 font-normal">Mark</th>
                  <th className="px-2 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-charcoal/10 align-top">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                      />
                      {row.level && row.level !== 'HS' && (
                        <p className="text-xs text-graphite mt-1">{row.level} division</p>
                      )}
                      {row.failReason && (
                        <p className="text-xs text-red-600 mt-1 max-w-[140px]">{row.failReason}</p>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={row.eventId ?? ''}
                        onChange={(e) => updateRow(row.id, { eventId: e.target.value })}
                        className="border border-charcoal/20 rounded px-2 py-1 text-sm"
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        {EVENTS.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={row.gender}
                        onChange={(e) => updateRow(row.id, { gender: e.target.value })}
                        className="border border-charcoal/20 rounded px-2 py-1 text-sm"
                      >
                        <option value="boys">Boys</option>
                        <option value="girls">Girls</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      {row.type === 'relay' ? (
                        <div className="space-y-1">
                          <p className="text-xs text-graphite">
                            Relay {row.relayTeam ? `'${row.relayTeam}'` : ''}
                          </p>
                          {(row.legs ?? []).map((leg, i) => (
                            <div key={i} className="flex gap-1">
                              <input
                                type="text"
                                value={leg.firstName}
                                onChange={(e) =>
                                  updateLeg(row.id, i, { firstName: e.target.value })
                                }
                                placeholder="First"
                                className="w-16 border border-charcoal/20 rounded px-1.5 py-0.5 text-xs"
                              />
                              <input
                                type="text"
                                value={leg.lastName}
                                onChange={(e) =>
                                  updateLeg(row.id, i, { lastName: e.target.value })
                                }
                                placeholder="Last"
                                className="w-20 border border-charcoal/20 rounded px-1.5 py-0.5 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={row.firstName}
                              onChange={(e) => updateRow(row.id, { firstName: e.target.value })}
                              placeholder="First"
                              className="w-20 border border-charcoal/20 rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="text"
                              value={row.lastName}
                              onChange={(e) => updateRow(row.id, { lastName: e.target.value })}
                              placeholder="Last"
                              className="w-24 border border-charcoal/20 rounded px-2 py-1 text-sm"
                            />
                          </div>
                          {row.grade && (
                            <p className="text-xs text-graphite mt-1">Grade {row.grade}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 w-56">
                      <SchoolPicker
                        schools={schools}
                        value={row.school}
                        onChange={(s) => updateRow(row.id, { school: s })}
                        placeholder={row.schoolRaw || 'School…'}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.markRaw}
                        onChange={(e) => updateRow(row.id, { markRaw: e.target.value })}
                        className="w-24 border border-charcoal/20 rounded px-2 py-1 text-sm mark"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-xs text-graphite hover:text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="bg-accent text-white rounded px-4 py-2 font-body disabled:opacity-60"
          >
            {importing ? 'Importing…' : `Import ${rows.filter((r) => r.include).length} result(s)`}
          </button>
        </>
      )}
    </div>
  )
}
