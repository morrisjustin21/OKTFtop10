export default function EventTabs({ events, activeEvent, onSelect }) {
  const track = events.filter((e) => e.category === 'track')
  const relay = events.filter((e) => e.category === 'relay')
  const field = events.filter((e) => e.category === 'field')

  const renderGroup = (label, group) => (
    <div className="mb-3">
      <p className="text-xs uppercase tracking-wide text-graphite mb-1.5">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {group.map((event) => {
          const isActive = event.id === activeEvent
          return (
            <button
              key={event.id}
              onClick={() => onSelect(event.id)}
              className={`shrink-0 px-3 py-1.5 text-sm font-body rounded-t border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-cinder text-charcoal font-medium'
                  : 'border-transparent text-graphite hover:text-charcoal'
              }`}
            >
              {event.name}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4">
      {renderGroup('Individual', track)}
      {renderGroup('Relays', relay)}
      {renderGroup('Field', field)}
    </div>
  )
}
