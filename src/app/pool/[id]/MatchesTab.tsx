import React from 'react';
import { Match, Team } from '@/types';

export default function MatchesTab({ matches, teams }: { matches: Match[]; teams: Team[] }) {
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
        matches.map((match) => {
          const team1 = teams.find(t => t.id === match.team1_id);
          const team2 = teams.find(t => t.id === match.team2_id);
          const team1Wins = (match.team1_score ?? 0) > (match.team2_score ?? 0);
          const team2Wins = (match.team2_score ?? 0) > (match.team1_score ?? 0);
          return (
            <div key={match.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className={`text-lg font-semibold ${team1Wins ? 'text-green-600' : 'text-gray-500'}`}>{team1?.name}</span>
                  <span className="text-2xl font-bold text-gray-400">vs</span>
                  <span className={`text-lg font-semibold ${team2Wins ? 'text-green-600' : 'text-gray-500'}`}>{team2?.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    match.completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {match.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{match.team1_score}</div>
                  <div className="text-sm text-gray-600">Games Won</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{match.team2_score}</div>
                  <div className="text-sm text-gray-600">Games Won</div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
} 