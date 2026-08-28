export default function LeaderboardTable({ event, gender, results }) {
  return (
    <div className="bg-white border border-charcoal/10 rounded-lg overflow-hidden">
      <div className="flex items-baseline gap-2 px-4 py-3 border-b border-charcoal/10">
        <p className="font-display uppercase tracking-wide text-lg">
          {gender === 'boys' ? 'Boys' : 'Girls'} {event.name}
        </p>
        <span className="text-xs text-graphite">{results.length} marks recorded</span>
      </div>

      {results.length === 0 ? (
        <p className="px-4 py-6 text-sm text-graphite">
          No marks recorded yet for this event. Once results are entered, the top marks will
          show up here.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-graphite text-left">
              <th className="px-4 py-2 font-normal w-12">Rank</th>
              <th className="px-2 py-2 font-normal">Athlete</th>
              <th className="px-2 py-2 font-normal">School</th>
              <th className="px-4 py-2 font-normal text-right">Mark</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const rank = i + 1
              const badgeColor =
                rank === 1
                  ? 'bg-accent text-white'
                  : rank === 2
                    ? 'bg-silver text-white'
                    : rank === 3
                      ? 'bg-bronze text-white'
                      : 'text-graphite'
              return (
                <tr key={`${r.athlete}-${r.meetDate}`} className="border-t border-charcoal/10">
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${badgeColor}`}
                    >
                      {rank}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 font-medium">{r.athlete}</td>
                  <td className="px-2 py-2.5 text-graphite">{r.school}</td>
                  <td className="px-4 py-2.5 text-right mark text-base">{r.mark}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
