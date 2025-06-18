'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentStore } from '@/lib/store';
import { Pool, TournamentStandings } from '@/types';

interface PoolPageProps {
  params: {
    id: string;
  };
}

export default function PoolPage({ params }: PoolPageProps) {
  const [pool, setPool] = useState<Pool | null>(null);
  const [standings, setStandings] = useState<TournamentStandings[]>([]);
  const [activeTab, setActiveTab] = useState<'teams' | 'matches' | 'standings'>('teams');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlayers, setNewTeamPlayers] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    const poolData = tournamentStore.getPoolById(params.id);
    if (poolData) {
      setPool(poolData);
      setStandings(tournamentStore.getPoolStandings(params.id));
    }
  }, [params.id]);

  const handleAddTeam = () => {
    if (newTeamName.trim() && newTeamPlayers.every(p => p.trim())) {
      const players = newTeamPlayers.map((name, index) => ({
        id: `p-${Date.now()}-${index}`,
        name: name.trim(),
      }));
      
      const newTeam = tournamentStore.createTeam(newTeamName.trim(), players);
      tournamentStore.addTeamToPool(newTeam.id, params.id);
      
      // Refresh pool data
      const updatedPool = tournamentStore.getPoolById(params.id);
      if (updatedPool) {
        setPool(updatedPool);
        setStandings(tournamentStore.getPoolStandings(params.id));
      }
      
      // Reset form
      setNewTeamName('');
      setNewTeamPlayers(['', '', '', '', '', '']);
      setShowAddTeam(false);
    }
  };

  const handleGenerateMatches = () => {
    if (pool && pool.teams.length >= 2) {
      tournamentStore.generateMatchesForPool(params.id);
      const updatedPool = tournamentStore.getPoolById(params.id);
      if (updatedPool) {
        setPool(updatedPool);
        setActiveTab('matches');
      }
    }
  };

  if (!pool) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Pool not found</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{pool.name}</h1>
          <p className="text-gray-600 mt-1">
            {pool.teams.length}/{pool.maxTeams} teams • {pool.matches.length} matches
          </p>
        </div>
        <div className="flex gap-3">
          {pool.teams.length < pool.maxTeams && (
            <button
              onClick={() => setShowAddTeam(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Team
            </button>
          )}
          {pool.teams.length >= 2 && pool.matches.length === 0 && (
            <button
              onClick={handleGenerateMatches}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Generate Matches
            </button>
          )}
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Players (6 required)
                </label>
                <div className="space-y-2">
                  {newTeamPlayers.map((player, index) => (
                    <input
                      key={index}
                      type="text"
                      value={player}
                      onChange={(e) => {
                        const updated = [...newTeamPlayers];
                        updated[index] = e.target.value;
                        setNewTeamPlayers(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Player ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddTeam(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTeam}
                  disabled={!newTeamName.trim() || newTeamPlayers.some(p => !p.trim())}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Add Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'teams', label: 'Teams', count: pool.teams.length },
            { id: 'matches', label: 'Matches', count: pool.matches.length },
            { id: 'standings', label: 'Standings', count: pool.teams.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'teams' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pool.teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{team.name}</h3>
                <div className="space-y-2">
                  {team.players.map((player, index) => (
                    <div key={player.id} className="flex items-center text-sm">
                      <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-900">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            {pool.matches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-4">
                  {pool.teams.length < 2 
                    ? 'Need at least 2 teams to generate matches'
                    : 'No matches generated yet. Click "Generate Matches" to create the tournament schedule.'
                  }
                </p>
                {pool.teams.length >= 2 && (
                  <button
                    onClick={handleGenerateMatches}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Generate Matches
                  </button>
                )}
              </div>
            ) : (
              pool.matches.map((match) => {
                const team1 = pool.teams.find(t => t.id === match.team1Id);
                const team2 = pool.teams.find(t => t.id === match.team2Id);
                
                return (
                  <div key={match.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-semibold">{team1?.name}</span>
                        <span className="text-2xl font-bold text-gray-400">vs</span>
                        <span className="text-lg font-semibold">{team2?.name}</span>
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
                        <div className="text-2xl font-bold text-blue-600">{match.team1Score}</div>
                        <div className="text-sm text-gray-600">Games Won</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{match.team2Score}</div>
                        <div className="text-sm text-gray-600">Games Won</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Games</h4>
                      <div className="grid gap-2">
                        {match.games.map((game, index) => (
                          <div key={game.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Game {index + 1} ({game.type})
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600">{game.team1Score}</span>
                              <span className="text-gray-400">-</span>
                              <span className="text-red-600">{game.team2Score}</span>
                              {game.completed && (
                                <span className={`px-2 py-1 rounded text-xs ${
                                  game.winner === 'team1' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {game.winner === 'team1' ? team1?.name : team2?.name}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MW
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ML
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GW
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standings.map((standing, index) => (
                  <tr key={standing.teamId} className={index < 2 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {standing.teamName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.matchesWon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.matchesLost}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.gamesWon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {standing.gamesLost}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {standing.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 