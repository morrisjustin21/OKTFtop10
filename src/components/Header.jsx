import { Link } from 'react-router-dom'
import { formatDateTime } from '../lib/formatDate.js'

const OK_BLUE = '#0073CF'

export default function Header({
  gender,
  onGenderChange,
  classification,
  onClassificationChange,
  seasons,
  seasonId,
  onSeasonChange,
  lastUpdated,
}) {
  const activeSeasonName = (seasons ?? []).find((s) => s.id === seasonId)?.name ?? ''

  return (
    <header>
      <div style={{ background: OK_BLUE, height: '5px' }} />
      <div className="bg-slate text-paper">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="36" height="18" viewBox="0 0 100 48.4" aria-hidden="true" className="shrink-0">
              <path
                d="M0.0,0.0 L0.0,7.2 L34.7,7.2 L34.9,35.2 L38.6,37.8 L42.4,36.9 L44.6,40.0 L50.8,40.7 L52.5,42.2 L56.9,41.0 L58.8,44.8 L62.7,43.4 L65.5,45.8 L67.7,44.3 L68.2,47.0 L70.6,43.9 L71.6,45.3 L74.7,44.6 L77.8,47.5 L80.7,45.3 L86.5,44.1 L88.9,45.1 L91.1,43.6 L99.3,48.4 L100.0,21.4 L97.8,0.0 Z"
                fill={OK_BLUE}
              />
            </svg>
            <div>
              <p className="font-display uppercase tracking-wide text-2xl leading-none">
                Oklahoma Track and Field Rankings
              </p>
              <p className="text-sm text-paper/80 mt-1">
                Class {classification} &middot; {activeSeasonName}
              </p>
              {lastUpdated && (
                <p className="text-xs text-paper/60 mt-0.5">
                  Last updated {formatDateTime(lastUpdated)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              className="bg-slate-dark text-paper border border-paper/30 rounded px-3 py-1.5 text-sm font-body"
              value={seasonId}
              onChange={(e) => onSeasonChange(e.target.value)}
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="bg-slate-dark text-paper border border-paper/30 rounded px-3 py-1.5 text-sm font-body"
              value={classification}
              onChange={(e) => onClassificationChange(e.target.value)}
            >
              <option value="6A">6A</option>
              <option value="5A">5A</option>
              <option value="4A">4A</option>
              <option value="3A">3A</option>
              <option value="2A">2A</option>
              <option value="A">A</option>
            </select>

            <div className="flex bg-slate-dark rounded overflow-hidden border border-paper/30">
              <button
                className={`px-3 py-1.5 text-sm font-body ${
                  gender === 'boys' ? 'bg-paper text-charcoal' : 'text-paper'
                }`}
                onClick={() => onGenderChange('boys')}
              >
                Boys
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-body ${
                  gender === 'girls' ? 'bg-paper text-charcoal' : 'text-paper'
                }`}
                onClick={() => onGenderChange('girls')}
              >
                Girls
              </button>
            </div>

            <Link
              to="/meets"
              className="text-sm underline text-paper/80 hover:text-paper whitespace-nowrap"
            >
              Meets
            </Link>

            <Link
              to="/print"
              className="text-sm underline text-paper/80 hover:text-paper whitespace-nowrap"
            >
              Print report
            </Link>
          </div>
        </div>
      </div>
      <div className="lane-line" />
    </header>
  )
}
