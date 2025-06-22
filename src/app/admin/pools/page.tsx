'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentStore, supabase } from '@/lib/store';
import { Pool, Team, Player } from '@/types';
import AuthGuard from '@/components/AuthGuard';

export default function AdminPoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newPoolName, setNewPoolName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [maxTeams, setMaxTeams] = useState(4);
  
  // Modal states
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data...');
      
      // Use simple queries like the dashboard first
      const [poolsResult, teamsResult, playersResult] = await Promise.all([
        supabase.from('pools').select('*').order('name'),
        supabase.from('teams').select('*').order('name'),
        supabase.from('players').select('*').order('name')
      ]);
      
      console.log('Pools result:', poolsResult);
      console.log('Teams result:', teamsResult);
      console.log('Players result:', playersResult);
      
      if (poolsResult.error) {
        console.error('Error fetching pools:', poolsResult.error);
        alert(`Error fetching pools: ${poolsResult.error.message}`);
      }
      if (teamsResult.error) {
        console.error('Error fetching teams:', teamsResult.error);
      }
      if (playersResult.error) {
        console.error('Error fetching players:', playersResult.error);
      }
      
      // Set basic data first
      setPools(poolsResult.data || []);
      setTeams(teamsResult.data || []);
      setPlayers(playersResult.data || []);
      
      // Now try to get detailed data with relationships
      try {
        const detailedPools = await tournamentStore.getPools();
        console.log('Detailed pools:', detailedPools);
        setPools(detailedPools);
      } catch (error) {
        console.error('Error fetching detailed pools:', error);
      }
      
      try {
        const detailedTeams = await tournamentStore.getTeams();
        console.log('Detailed teams:', detailedTeams);
        setTeams(detailedTeams);
      } catch (error) {
        console.error('Error fetching detailed teams:', error);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) return;
    
    try {
      await tournamentStore.createPool(newPoolName.trim(), maxTeams);
      setNewPoolName('');
      setMaxTeams(4);
      setShowCreatePool(false);
      fetchData();
    } catch (error) {
      console.error('Error creating pool:', error);
      alert('Error creating pool');
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      await tournamentStore.createTeam(newTeamName.trim());
      setNewTeamName('');
      setShowCreateTeam(false);
      fetchData();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team');
    }
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    try {
      await tournamentStore.createPlayer({
        name: newPlayerName.trim(),
        email: newPlayerEmail.trim() || undefined,
        phone: newPlayerPhone.trim() || undefined
      });
      setNewPlayerName('');
      setNewPlayerEmail('');
      setNewPlayerPhone('');
      setShowCreatePlayer(false);
      fetchData();
    } catch (error) {
      console.error('Error creating player:', error);
      alert('Error creating player');
    }
  };

  const handleDeletePool = async (poolId: string) => {
    if (!confirm('Are you sure you want to delete this pool? This action cannot be undone.')) {
      return;
    }
    
    try {
      await tournamentStore.deletePool(poolId);
      fetchData();
    } catch (error) {
      console.error('Error deleting pool:', error);
      alert('Error deleting pool');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }
    
    try {
      await tournamentStore.deleteTeam(teamId);
      fetchData();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Error deleting team');
    }
  };

  const handleAssignTeamToPool = async (teamId: string, poolId: string) => {
    try {
      await tournamentStore.assignTeamToPool(teamId, poolId);
      setShowAssignTeam(false);
      setSelectedPool(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning team to pool:', error);
      alert('Error assigning team to pool');
    }
  };

  const handleRemoveTeamFromPool = async (teamId: string) => {
    try {
      await tournamentStore.removeTeamFromPool(teamId);
      fetchData();
    } catch (error) {
      console.error('Error removing team from pool:', error);
      alert('Error removing team from pool');
    }
  };

  const handleRemovePlayerFromTeam = async (teamId: string, playerId: string) => {
    try {
      await tournamentStore.removePlayerFromTeam(teamId, playerId);
      fetchData();
    } catch (error) {
      console.error('Error removing player from team:', error);
      alert('Error removing player from team');
    }
  };

  const openAssignTeamModal = async (pool: Pool) => {
    setSelectedPool(pool);
    try {
      const availableTeamsData = await tournamentStore.getTeamsNotInPool();
      setAvailableTeams(availableTeamsData);
      setShowAssignTeam(true);
    } catch (error) {
      console.error('Error fetching available teams:', error);
    }
  };

  const openAddPlayerModal = async (team: Team) => {
    try {
      setSelectedTeam(team);
      setShowCreatePlayer(true);
    } catch (error) {
      console.error('Error opening add player modal:', error);
    }
  };

  const generateMatchesForPool = async (poolId: string) => {
    try {
      await tournamentStore.generateMatchesForPool(poolId);
      alert('Matches generated successfully!');
    } catch (error) {
      console.error('Error generating matches:', error);
      alert('Error generating matches');
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tournament Management</h1>
          <p className="text-gray-600">Create and manage tournament pools, teams, players, and fixtures</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pools</p>
                <p className="text-3xl font-bold text-blue-600">{pools.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🏊‍♂️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-3xl font-bold text-green-600">{teams.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-3xl font-bold text-purple-600">{players.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">🏸</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Pools</p>
                <p className="text-3xl font-bold text-orange-600">
                  {pools.filter(pool => pool.teamCount && pool.teamCount > 0).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setShowCreatePool(true)}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ➕ Create Pool
          </button>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ➕ Create Team
          </button>
          <button
            onClick={() => setShowCreatePlayer(true)}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            ➕ Add Player
          </button>
          <Link
            href="/admin/players"
            className="px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors text-center"
          >
            👥 Manage Players
          </Link>
          <Link
            href="/admin/teams"
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
          >
            🏸 Manage Teams
          </Link>
        </div>

        {/* Pools Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Tournament Pools</h2>
            <p className="text-gray-600 mt-1">Manage pools and team assignments</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">Loading pools...</p>
              </div>
            ) : pools.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🏊‍♂️</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No pools created yet</h3>
                <p className="text-gray-600">Create your first pool to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pools.map((pool) => (
                  <div key={pool.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{pool.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {pool.teamCount || 0} teams • Max: {pool.max_teams} teams
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAssignTeamModal(pool)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Assign Team
                        </button>
                        <button
                          onClick={() => generateMatchesForPool(pool.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Generate Matches
                        </button>
                        <button
                          onClick={() => handleDeletePool(pool.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {pool.teams && pool.teams.length > 0 ? (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3">Teams in this Pool:</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {pool.teams.map((team) => (
                            <div key={team.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-800">{team.name}</span>
                                <button
                                  onClick={() => handleRemoveTeamFromPool(team.id)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="text-sm text-gray-600">
                                {team.players?.length || 0} players
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No teams assigned to this pool yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Teams Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Teams</h2>
            <p className="text-gray-600 mt-1">Manage teams and player assignments</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">Loading teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No teams created yet</h3>
                <p className="text-gray-600">Create your first team to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Pool: {team.pool?.name || 'Unassigned'}
                    </div>
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Players ({team.players?.length || 0}):
                      </div>
                      {team.players && team.players.length > 0 ? (
                        <div className="space-y-1">
                          {team.players.map((player) => (
                            <div key={player.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{player.name}</span>
                              <button
                                onClick={() => handleRemovePlayerFromTeam(team.id, player.id)}
                                className="text-red-500 hover:text-red-600 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs">No players assigned</p>
                      )}
                    </div>
                    <button
                      onClick={() => openAddPlayerModal(team)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add Player
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Pool Modal */}
        {showCreatePool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Pool</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pool Name</label>
                  <input
                    type="text"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    placeholder="e.g., Pool A, Men's Singles"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Teams</label>
                  <input
                    type="number"
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(parseInt(e.target.value))}
                    min="2"
                    max="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreatePool}
                  disabled={!newPoolName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Pool
                </button>
                <button
                  onClick={() => setShowCreatePool(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Team</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Team Alpha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Team
                </button>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Player Modal */}
        {showCreatePlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedTeam ? `Add Player to ${selectedTeam.name}` : 'Create New Player'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player Name *</label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Player name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newPlayerEmail}
                    onChange={(e) => setNewPlayerEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newPlayerPhone}
                    onChange={(e) => setNewPlayerPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreatePlayer}
                  disabled={!newPlayerName.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedTeam ? 'Add Player' : 'Create Player'}
                </button>
                <button
                  onClick={() => {
                    setShowCreatePlayer(false);
                    setSelectedTeam(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Team Modal */}
        {showAssignTeam && selectedPool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Assign Team to {selectedPool.name}
              </h3>
              {availableTeams.length === 0 ? (
                <p className="text-gray-600 mb-4">No available teams to assign</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableTeams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">{team.name}</span>
                      <button
                        onClick={() => handleAssignTeamToPool(team.id, selectedPool.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowAssignTeam(false);
                    setSelectedPool(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
} 