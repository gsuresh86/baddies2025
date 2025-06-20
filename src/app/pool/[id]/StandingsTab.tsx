import React from 'react';
import { TournamentStandings } from '@/types';

export default function StandingsTab({ standings }: { standings: TournamentStandings[] }) {
  return (
    <div className="overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-white/20 to-white/10 border-b border-white/20">
              <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Team</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">MP</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">W</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">L</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">GW</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">GL</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {standings.map((standing, index) => (
              <tr 
                key={standing.teamId} 
                className={`transition-all duration-200 hover:bg-white/10 ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/20 border-l-4 border-yellow-400' :
                  index === 1 ? 'bg-gradient-to-r from-gray-400/30 to-gray-500/20 border-l-4 border-gray-300' :
                  index === 2 ? 'bg-gradient-to-r from-orange-500/30 to-orange-600/20 border-l-4 border-orange-400' :
                  'hover:bg-white/5'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                    {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                    {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-300' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-300' :
                      'text-white'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 text-white font-bold text-sm">
                      {standing.teamName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-semibold">{standing.teamName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-white/90 font-medium">{standing.matchesPlayed}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-green-300 font-bold">{standing.matchesWon}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-red-300 font-bold">{standing.matchesLost}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-blue-300 font-medium">{standing.gamesWon}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-purple-300 font-medium">{standing.gamesLost}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="bg-gradient-to-r from-blue-600/50 to-purple-600/50 rounded-lg px-3 py-1 inline-block">
                    <span className="text-white font-bold text-lg">{standing.points}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {standings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-white/80 text-lg">No standings available yet. Matches need to be completed to show rankings.</p>
        </div>
      )}
    </div>
  );
} 