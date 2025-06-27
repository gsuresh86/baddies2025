import { Match, Team, Player, Pool } from '@/types';
import Link from 'next/link';

interface MatchesTabProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  pool: Pool;
}

export default function MatchesTab({ matches, teams, players, pool }: MatchesTabProps) {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '-';
  return (
    <div className="space-y-4">
      {matches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg mb-4">
            {teams.length < 2
              ? 'Need at least 2 teams to generate matches'
              : 'No matches generated yet.'}
          </p>
        </div>
      ) : (
        matches.map((match, idx) => {
          // For team matches
          if (pool.category?.type === 'team') {
            const team1 = teams.find(t => t.id === match.team1_id);
            const team2 = teams.find(t => t.id === match.team2_id);
            const team1Wins = (match.team1_score ?? 0) > (match.team2_score ?? 0);
            const team2Wins = (match.team2_score ?? 0) > (match.team1_score ?? 0);
            const courtNo = idx % 2 === 0 ? 'Court 1' : 'Court 2';
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="block rounded-xl border border-gray-200 bg-white hover:border-blue-400 transition-all px-8 py-8 shadow-md"
              >
                <div className="flex items-center justify-between w-full gap-6 text-sm">
                  <div className="flex items-center gap-5 flex-shrink-0 min-w-0 w-64">
                    <span className={`truncate font-semibold max-w-[200px] ${team1Wins ? 'text-green-600' : 'text-gray-700'}`}>{team1?.name}</span>
                    <span className="text-base font-bold text-gray-400">vs</span>
                    <span className={`truncate font-semibold max-w-[200px] ${team2Wins ? 'text-green-600' : 'text-gray-700'}`}>{team2?.name}</span>
                  </div>
                  <span className="px-3 py-1 rounded bg-gray-100 text-xs font-medium text-gray-600 whitespace-nowrap flex-shrink-0">{courtNo}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-lg text-blue-700 font-bold">{match.team1_score ?? 0}</span>
                    <span className="text-lg text-gray-400">-</span>
                    <span className="text-lg text-red-700 font-bold">{match.team2_score ?? 0}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    match.completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {match.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </Link>
            );
          }
          // For player matches
          if (pool.category?.type === 'player') {
            const player1Name = getPlayerName((match as any).player1_id);
            const player2Name = getPlayerName((match as any).player2_id);
            const player1Wins = (match.team1_score ?? 0) > (match.team2_score ?? 0);
            const player2Wins = (match.team2_score ?? 0) > (match.team1_score ?? 0);
            const courtNo = idx % 2 === 0 ? 'Court 1' : 'Court 2';
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="block rounded-xl border border-gray-200 bg-white hover:border-blue-400 transition-all px-8 py-8 shadow-md"
              >
                <div className="flex items-center justify-between w-full gap-6 text-sm">
                  <div className="flex items-center gap-5 flex-shrink-0 min-w-0 w-64">
                    <span className={`truncate font-semibold max-w-[200px] ${player1Wins ? 'text-green-600' : 'text-gray-700'}`}>{player1Name}</span>
                    <span className="text-base font-bold text-gray-400">vs</span>
                    <span className={`truncate font-semibold max-w-[200px] ${player2Wins ? 'text-green-600' : 'text-gray-700'}`}>{player2Name}</span>
                  </div>
                  <span className="px-3 py-1 rounded bg-gray-100 text-xs font-medium text-gray-600 whitespace-nowrap flex-shrink-0">{courtNo}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-lg text-blue-700 font-bold">{match.team1_score ?? 0}</span>
                    <span className="text-lg text-gray-400">-</span>
                    <span className="text-lg text-red-700 font-bold">{match.team2_score ?? 0}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    match.completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {match.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </Link>
            );
          }
          // For pair matches (placeholder)
          if (pool.category?.type === 'pair') {
            return (
              <div key={match.id} className="block rounded-xl border border-gray-200 bg-white px-8 py-8 shadow-md text-center">
                <span className="text-gray-500">Pair match display not implemented yet.</span>
              </div>
            );
          }
          return null;
        })
      )}
    </div>
  );
} 