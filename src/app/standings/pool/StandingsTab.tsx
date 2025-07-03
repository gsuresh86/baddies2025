import { TournamentStandings } from '@/types';

const statLabels = [
  { key: 'matchesPlayed', label: 'MP' },
  { key: 'matchesWon', label: 'W' },
  { key: 'matchesLost', label: 'L' },
  { key: 'gamesWon', label: 'GW' },
  { key: 'gamesLost', label: 'GL' },
  { key: 'points', label: 'PTS' },
];

const statColor = {
  matchesPlayed: 'text-white',
  matchesWon: 'text-green-400 font-bold',
  matchesLost: 'text-red-400 font-bold',
  gamesWon: 'text-purple-400 font-bold',
  gamesLost: 'text-orange-400 font-bold',
  points: 'text-yellow-300 font-extrabold',
};

export default function StandingsTab({ standings }: { standings: TournamentStandings[] }) {
  return (
    <div>
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-white/20 to-white/10 border-b border-white/20">
            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-bold text-white uppercase tracking-wider">Team</th>
            {statLabels.map(stat => (
              <th key={stat.key} className="px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-white uppercase tracking-wider">{stat.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {standings.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-white/80 text-base">
                <div className="text-3xl mb-2">📊</div>
                No standings available yet. Matches need to be completed to show rankings.
              </td>
            </tr>
          ) : (
            standings.map((standing) => (
              <tr
                key={standing.teamId}
                className="transition-all duration-200 hover:bg-white/10"
              >
                <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-white font-semibold">{standing.teamName}</td>
                {statLabels.map(stat => (
                  <td
                    key={stat.key}
                    className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center ${statColor[stat.key as keyof typeof statColor] || 'text-white'}`}
                  >
                    {standing[stat.key as keyof TournamentStandings]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 