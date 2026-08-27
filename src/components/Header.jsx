export default function Header({ gender, onGenderChange }) {
  return (
    <header>
      <div className="bg-cinder text-lane">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-display uppercase tracking-wide text-2xl leading-none">
              OK Track Rankings
            </p>
            <p className="text-sm text-lane/80 mt-1">Class 5A &middot; outdoor season</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Only 5A is active for launch — schema already supports more classes */}
            <select
              className="bg-cinder-dark text-lane border border-lane/30 rounded px-3 py-1.5 text-sm font-body"
              value="5A"
              disabled
            >
              <option value="5A">5A</option>
              <option value="4A" disabled>
                4A (coming soon)
              </option>
              <option value="6A" disabled>
                6A (coming soon)
              </option>
            </select>

            <div className="flex bg-cinder-dark rounded overflow-hidden border border-lane/30">
              <button
                className={`px-3 py-1.5 text-sm font-body ${
                  gender === 'boys' ? 'bg-lane text-charcoal' : 'text-lane'
                }`}
                onClick={() => onGenderChange('boys')}
              >
                Boys
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-body ${
                  gender === 'girls' ? 'bg-lane text-charcoal' : 'text-lane'
                }`}
                onClick={() => onGenderChange('girls')}
              >
                Girls
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="lane-line" />
    </header>
  )
}
