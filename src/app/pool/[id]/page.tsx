'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/store';
import { Pool, Team, Player, Match } from '@/types';

export default function PoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [pool, setPool] = useState<Pool | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teams' | 'matches'>('teams');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlayers, setNewTeamPlayers] = useState(['', '', '', '', '', '']);
  const [addingTeam, setAddingTeam] = useState(false);

  // Fetch pool, teams, and matches from Supabase
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      // Fetch pool
      const { data: poolData } = await supabase.from('pools').select('*').eq('id', id).single();
      setPool(poolData as Pool);
      // Fetch teams
      const { data: teamData } = await supabase.from('teams').select('*').eq('pool_id', id);
      let teamsWithPlayers: Team[] = [];
      if (teamData && teamData.length > 0) {
        // Fetch players for each team
        for (const team of teamData) {
          const { data: players } = await supabase.from('players').select('*').eq('team_id', team.id);
          teamsWithPlayers.push({ ...team, players: players || [] });
        }
      }
      setTeams(teamsWithPlayers);
      // Fetch matches
      const { data: matchData } = await supabase.from('matches').select('*').eq('pool_id', id);
      setMatches(matchData || []);
      setLoading(false);
    }
    fetchAll();
  }, [id]);

  // Add a new team and its players
  const handleAddTeam = async () => {
    if (!newTeamName.trim() || newTeamPlayers.some(p => !p.trim())) return;
    setAddingTeam(true);
    // Insert team
    const { data: team, error: teamError } = await supabase.from('teams').insert([
      { id: `team-${Date.now()}`, name: newTeamName.trim(), pool_id: id }
    ]).select().single();
    if (teamError || !team) {
      setAddingTeam(false);
      return;
    }
    // Insert players
    const playersToInsert = newTeamPlayers.map((name, idx) => ({
      id: `p-${Date.now()}-${idx}`,
      name: name.trim(),
      team_id: team.id
    }));
    await supabase.from('players').insert(playersToInsert);
    // Refresh teams
    const { data: players } = await supabase.from('players').select('*').eq('team_id', team.id);
    setTeams([...teams, { ...team, players: players || [] }]);
    setShowAddTeam(false);
    setNewTeamName('');
    setNewTeamPlayers(['', '', '', '', '', '']);
    setAddingTeam(false);
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-500 text-lg">Loading...</p></div>;
  }
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
            {teams.length}/{pool.max_teams} teams • {matches.length} matches
          </p>
        </div>
        <div className="flex gap-3">
          {teams.length < pool.max_teams && (
            <button
              onClick={() => setShowAddTeam(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Team
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder={`Player ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddTeam(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={addingTeam}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTeam}
                  disabled={!newTeamName.trim() || newTeamPlayers.some(p => !p.trim()) || addingTeam}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {addingTeam ? 'Adding...' : 'Add Team'}
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
            { id: 'teams', label: 'Teams', count: teams.length },
            { id: 'matches', label: 'Matches', count: matches.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'teams' | 'matches')}
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
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{team.name}</h3>
                <div className="space-y-2">
                  {team.players?.map((player, index) => (
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
                const team1 = teams.find(t => t.id === match.team1Id);
                const team2 = teams.find(t => t.id === match.team2Id);
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
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
} 