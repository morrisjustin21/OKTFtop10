import { Link } from 'react-router-dom'

const OK_BLUE = '#0073CF'

export default function Header({
  gender,
  onGenderChange,
  classification,
  onClassificationChange,
  seasons,
  seasonId,
  onSeasonChange,
}) {
  const activeSeasonName = seasons.find((s) => s.id === seasonId)?.name ?? ''

  return (
    <header>
      <div style={{ background: OK_BLUE, height: '5px' }} />
      <div className="bg-slate text-paper">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="34" height="24" viewBox="0 0 100 70" aria-hidden="true" className="shrink-0">
              <path
                d="M0,3 L33,3 L33,22 L97,22 L97,58 L90,58 L90,64 L83,62 L76,65 L69,61 L62,64 L55,60 L48,63 L41,59 L34,62 L27,58 L20,61 L15,57 L15,22 L0,22 Z"
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
