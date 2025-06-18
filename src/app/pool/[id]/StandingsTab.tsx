import React from 'react';
import { TournamentStandings } from '@/types';

export default function StandingsTab({ standings }: { standings: TournamentStandings[] }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MP</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MW</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ML</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GW</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GL</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {standings.map((standing, index) => (
            <tr key={standing.teamId} className={index < 2 ? 'bg-yellow-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.teamName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{standing.matchesPlayed}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{standing.matchesWon}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{standing.matchesLost}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{standing.gamesWon}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{standing.gamesLost}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{standing.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 