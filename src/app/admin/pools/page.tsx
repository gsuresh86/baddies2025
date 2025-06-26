'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentStore, supabase } from '@/lib/store';
import { Pool, Team, Category, Player } from '@/types';
import AuthGuard from '@/components/AuthGuard';
import { categoryLabels } from '@/lib/utils';

// Utility to safely get category label from categoryLabels
function getCategoryLabel(key: string): string | undefined {
  // Try to match by code
  const byCode = Object.values(categoryLabels).find(v => v.code === key);
  if (byCode) return byCode.label;
  // Try to match by label
  const byLabel = Object.values(categoryLabels).find(v => v.label === key);
  if (byLabel) return byLabel.label;
  // Try to match by PlayerCategory enum value
  const byEnum = (categoryLabels as any)[key];
  if (byEnum) return byEnum.label;
  return undefined;
}

export default function AdminPoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newPoolName, setNewPoolName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [maxTeams, setMaxTeams] = useState(4);
  
  // Modal states
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showAssignPlayer, setShowAssignPlayer] = useState(false);
  const [selectedPlayerPool, setSelectedPlayerPool] = useState<Pool | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching data...');
      
      // Use simple queries like the dashboard first
      const [poolsResult, teamsResult] = await Promise.all([
        supabase.from('pools').select('*').order('name'),
        supabase.from('teams').select('*').order('name')
      ]);
      
      console.log('Pools result:', poolsResult);
      console.log('Teams result:', teamsResult);
      
      if (poolsResult.error) {
        console.error('Error fetching pools:', poolsResult.error);
        alert(`Error fetching pools: ${poolsResult.error.message}`);
      }
      if (teamsResult.error) {
        console.error('Error fetching teams:', teamsResult.error);
      }
      
      // Set basic data first
      setPools(poolsResult.data || []);
      setTeams(teamsResult.data || []);
      
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

  const fetchCategories = async () => {
    try {
      const cats = await tournamentStore.getCategories();
      setCategories(cats);
      if (cats.length > 0) setSelectedCategoryId(cats[0].id);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim() || !selectedCategoryId) return;
    try {
      await tournamentStore.createPool(newPoolName.trim(), maxTeams, selectedCategoryId);
      setNewPoolName('');
      setMaxTeams(4);
      setShowCreatePool(false);
      setSelectedCategoryId(categories[0]?.id || '');
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

  const generateMatchesForPool = async (poolId: string) => {
    try {
      await tournamentStore.generateMatchesForPool(poolId);
      alert('Matches generated successfully!');
    } catch (error) {
      console.error('Error generating matches:', error);
      alert('Error generating matches');
    }
  };

  const openAssignPlayerModal = async (pool: Pool) => {
    setSelectedPlayerPool(pool);
    // Fetch all players not already in this pool
    const { data, error } = await supabase
      .from('t_players')
      .select('*')
      .order('name');
    if (!error && data) {
      // Exclude already assigned
      const assignedIds = new Set((pool.players || []).map(p => p.id));
      let filtered = data.filter((p: Player) => !assignedIds.has(p.id));
      // Filter by pool category (except Family Mixed, code 'FM')
      if (pool.category && pool.category.code !== 'FM') {
        // Resolve the code and description for the pool category using categoryLabels
        const categoryCode = pool.category.code || getCategoryLabel(pool.category.code);
        const categoryDescription = pool.category.description || pool.category.label;
        filtered = filtered.filter((p: Player) =>
          p.category === categoryCode ||
          p.category === pool.category?.label ||
          p.category === categoryDescription
        );
      }
      setAvailablePlayers(filtered);
    } else {
      setAvailablePlayers([]);
    }
    setShowAssignPlayer(true);
  };

  const handleAssignPlayerToPool = async (playerId: string, poolId: string) => {
    try {
      await tournamentStore.assignPlayerToPool(playerId, poolId);
      setShowAssignPlayer(false);
      setSelectedPlayerPool(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning player to pool:', error);
      alert('Error assigning player to pool');
    }
  };

  const handleRemovePlayerFromPool = async (playerId: string, poolId: string) => {
    try {
      await tournamentStore.removePlayerFromPool(playerId, poolId);
      fetchData();
    } catch (error) {
      console.error('Error removing player from pool:', error);
      alert('Error removing player from pool');
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Tournament Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Create and manage tournament pools, teams, and fixtures</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => setShowCreatePool(true)}
            className="px-3 sm:px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            ➕ Create Pool
          </button>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="px-3 sm:px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            ➕ Create Team
          </button>
          <Link
            href="/admin/players"
            className="px-3 sm:px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors text-center text-sm sm:text-base"
          >
            👥 Manage Players
          </Link>
          <Link
            href="/admin/teams"
            className="px-3 sm:px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center text-sm sm:text-base"
          >
            🏸 Manage Teams
          </Link>
        </div>

        {/* Pools Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 sm:mb-8">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Tournament Pools</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage pools and team assignments</p>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-base sm:text-lg">Loading pools...</p>
              </div>
            ) : pools.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl sm:text-6xl mb-4">🏊‍♂️</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">No pools created yet</h3>
                <p className="text-gray-600 text-sm sm:text-base">Create your first pool to get started</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {pools.map((pool) => (
                  <div key={pool.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">{pool.name}</h3>
                        {pool.category && (
                          <div className="text-xs sm:text-sm text-blue-700 font-medium mb-1">{pool.category.label}</div>
                        )}
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {pool.category && pool.category.code === 'MT'
                            ? `${pool.teamCount || 0} teams` 
                            : `${pool.players?.length || 0} players`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pool.category && pool.category.code === 'MT' ? (
                          <button
                            onClick={() => openAssignTeamModal(pool)}
                            className="px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Assign Team
                          </button>
                        ) : (
                          <button
                            onClick={() => openAssignPlayerModal(pool)}
                            className="px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Assign Player
                          </button>
                        )}
                        <button
                          onClick={() => generateMatchesForPool(pool.id)}
                          className="px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Generate Matches
                        </button>
                        <button
                          onClick={() => handleDeletePool(pool.id)}
                          className="px-2 sm:px-3 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {pool.category && pool.category.code === 'MT' ? (
                      pool.teams && pool.teams.length > 0 ? (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">Teams in this Pool:</h4>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {pool.teams.map((team) => (
                              <div key={team.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800 text-sm sm:text-base">{team.name}</span>
                                  <button
                                    onClick={() => handleRemoveTeamFromPool(team.id)}
                                    className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {team.players?.length || 0} players
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs sm:text-sm">No teams assigned to this pool yet</p>
                      )
                    ) : (
                      pool.players && pool.players.length > 0 ? (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">Players in this Pool:</h4>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {pool.players.map((player) => (
                              <div key={player.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                <span className="font-medium text-gray-800 text-sm sm:text-base">{player.name}</span>
                                <button
                                  onClick={() => handleRemovePlayerFromPool(player.id, pool.id)}
                                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs sm:text-sm">No players assigned to this pool yet</p>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Teams Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 sm:mb-8">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">All Teams</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage teams</p>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-base sm:text-lg">Loading teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl sm:text-6xl mb-4">👥</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">No teams created yet</h3>
                <p className="text-gray-600 text-sm sm:text-base">Create your first team to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{team.name}</h3>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-3">
                      Pool: {team.pool?.name || 'Unassigned'}
                    </div>
                    <div className="mb-3">
                      <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Players ({team.players?.length || 0}):
                      </div>
                      {team.players && team.players.length > 0 ? (
                        <div className="space-y-1">
                          {team.players.map((player) => (
                            <div key={player.id} className="text-xs sm:text-sm text-gray-600">
                              {player.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs">No players assigned</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Pool Modal */}
        {showCreatePool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Create New Pool</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Pool Name</label>
                  <input
                    type="text"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    placeholder="e.g., Pool A, Men's Singles"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreatePool}
                  disabled={!newPoolName.trim() || !selectedCategoryId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Create Pool
                </button>
                <button
                  onClick={() => setShowCreatePool(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Create New Team</h3>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Team Alpha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Create Team
                </button>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Team Modal */}
        {showAssignTeam && selectedPool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Assign Team to {selectedPool.name}
              </h3>
              {availableTeams.length === 0 ? (
                <p className="text-gray-600 mb-4 text-sm sm:text-base">No available teams to assign</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableTeams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800 text-sm sm:text-base">{team.name}</span>
                      <button
                        onClick={() => handleAssignTeamToPool(team.id, selectedPool.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700"
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
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Player Modal */}
        {showAssignPlayer && selectedPlayerPool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Assign Player to {selectedPlayerPool.name}
              </h3>
              {availablePlayers.length === 0 ? (
                <p className="text-gray-600 mb-4 text-sm sm:text-base">No available players to assign</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availablePlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800 text-sm sm:text-base">{player.name}</span>
                      <button
                        onClick={() => handleAssignPlayerToPool(player.id, selectedPlayerPool.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700"
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
                    setShowAssignPlayer(false);
                    setSelectedPlayerPool(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 text-sm sm:text-base"
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