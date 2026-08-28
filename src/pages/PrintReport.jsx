import { useEffect, useState } from 'react'
import { EVENTS } from '../data/mockResults.js'
import { fetchLeaderboard } from '../lib/leaderboardQueries.js'
import { formatDate } from '../lib/formatDate.js'

const CLASSIFICATION = '5A'

// Manually grouped (rather than auto-flowed) so each printed page has a
// predictable, even layout instead of columns of wildly different heights.
// 4 pages = 2 physical sheets (front/back each) once double-sided printing
// is enabled.
const PAGE_LAYOUTS = [
  {
    label: 'Sheet 1 \u00b7 Front \u2014 Relays',
    columns: [
      ['4x100', '4x200'],
      ['4x400', '4x800'],
    ],
  },
  {
    label: 'Sheet 1 \u00b7 Back \u2014 Sprints & middle distance',
    columns: [
      ['100m', '200m'],
      ['400m', '800m'],
    ],
  },
  {
    label: 'Sheet 2 \u00b7 Front \u2014 Distance & hurdles',
    columns: [
      ['1600m', '3200m'],
      ['shortH', '300H'],
    ],
  },
  {
    label: 'Sheet 2 \u00b7 Back \u2014 Field events',
    columns: [
      ['LJ', 'HJ', 'PV'],
      ['SP', 'DT'],
    ],
  },
]

export default function PrintReport() {
  const [dataByGenderEvent, setDataByGenderEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadAll() {
      const genders = ['boys', 'girls']
      const results = {}
      for (const gender of genders) {
        results[gender] = {}
        await Promise.all(
          EVENTS.map(async (event) => {
            results[gender][event.id] = await fetchLeaderboard(event.id, gender, CLASSIFICATION, 16)
          })
        )
      }
      if (active) {
        setDataByGenderEvent(results)
        setLoading(false)
      }
    }
    loadAll()
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <style>{`
        .no-print-report-btn:hover { opacity: 0.9; }
        @media print {
          .no-print { display: none !important; }
          @page { size: letter; margin: 0.35in; }
        }
        .report-page {
          break-after: page;
          padding: 0 24px 16px;
        }
        .report-page:last-child {
          break-after: auto;
        }
        .event-block {
          break-inside: avoid;
          margin-bottom: 14px;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          line-height: 1.4;
        }
        .report-table td {
          padding: 1.5px 6px 1.5px 0;
        }
        .report-columns {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          align-items: start;
        }
      `}</style>

      <div className="no-print flex items-center justify-between px-4 py-4 bg-paper border-b border-charcoal/10 sticky top-0">
        <div>
          <p className="font-display uppercase tracking-wide text-lg">5A rankings report</p>
          <p className="text-xs text-graphite">
            Use your browser's print dialog. To get each sheet's front and back on one physical
            page, enable "print on both sides" — otherwise front and back print separately.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={loading}
          className="no-print-report-btn bg-accent text-white rounded px-4 py-2 text-sm font-body disabled:opacity-60 shrink-0 ml-4"
        >
          {loading ? 'Loading…' : 'Print / Save as PDF'}
        </button>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-graphite">Loading rankings for every event…</p>
      ) : (
        ['boys', 'girls'].map((gender) =>
          PAGE_LAYOUTS.map((page, pageIndex) => (
            <div key={`${gender}-${pageIndex}`} className="report-page">
              <div className="flex items-baseline justify-between border-b-2 border-charcoal pb-1 mb-3 pt-4">
                <p className="font-display uppercase tracking-wide text-sm">
                  {gender === 'boys' ? 'Boys' : 'Girls'} 5A rankings — {page.label}
                </p>
                <p style={{ fontSize: '8px', color: '#888' }}>
                  Generated {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="report-columns">
                {page.columns.map((eventIds, colIndex) => (
                  <div key={colIndex}>
                    {eventIds.map((eventId) => {
                      const event = EVENTS.find((e) => e.id === eventId)
                      const rows = dataByGenderEvent[gender]?.[eventId] ?? []
                      return (
                        <div key={eventId} className="event-block">
                          <p
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              marginBottom: '3px',
                              borderBottom: '1px solid #ccc',
                            }}
                          >
                            {event?.name ?? eventId}
                          </p>
                          <table className="report-table">
                            <thead>
                              <tr style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase' }}>
                                <td></td>
                                <td>Athlete</td>
                                <td>School</td>
                                <td>Meet</td>
                                <td style={{ textAlign: 'right' }}>Mark</td>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.length === 0 && (
                                <tr>
                                  <td style={{ color: '#999' }}>No marks yet</td>
                                </tr>
                              )}
                              {rows.map((r, i) => (
                                <tr key={i}>
                                  <td style={{ width: '12px' }}>{i + 1}</td>
                                  <td>{r.athlete}</td>
                                  <td style={{ color: '#666' }}>{r.school}</td>
                                  <td style={{ color: '#666' }}>
                                    {r.meetName}
                                    {r.meetDate ? ` \u00b7 ${formatDate(r.meetDate)}` : ''}
                                  </td>
                                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                    {r.mark}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))
        )
      )}
    </div>
  )
}
