import { Link } from 'react-router-dom'

export default function Header({ gender, onGenderChange, classification, onClassificationChange }) {
  return (
    <header>
      <div style={{ background: '#005EB8', height: '5px' }} />
      <div className="bg-slate text-paper">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg
              width="30"
              height="30"
              viewBox="0 0 100 100"
              fill="currentColor"
              className="text-paper shrink-0"
              aria-hidden="true"
            >
              <path d="M8,38 L8,52 L28,52 L28,34 L52,32 L55,16 L94,16 L96,54 L84,57 L84,94 L22,97 L18,68 L8,68 Z" />
            </svg>
            <div>
              <p className="font-display uppercase tracking-wide text-2xl leading-none">
                Oklahoma Track and Field Rankings
              </p>
              <p className="text-sm text-paper/80 mt-1">Class {classification} &middot; outdoor season</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
