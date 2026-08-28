import { Link } from 'react-router-dom'

export default function Header({ gender, onGenderChange, classification, onClassificationChange }) {
  return (
    <header>
      <div className="bg-slate text-paper">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-display uppercase tracking-wide text-2xl leading-none">
              OK Track Rankings
            </p>
            <p className="text-sm text-paper/80 mt-1">Class {classification} &middot; outdoor season</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              className="bg-slate-dark text-paper border border-paper/30 rounded px-3 py-1.5 text-sm font-body"
              value={classification}
              onChange={(e) => onClassificationChange(e.target.value)}
            >
              <option value="5A">5A</option>
              <option value="6A">6A</option>
              <option value="4A" disabled>
                4A (coming soon)
              </option>
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
