'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { tournamentStore, supabase } from '@/lib/store';
import { Pool, Team, Category, Player } from '@/types';
import AuthGuard from '@/components/AuthGuard';
import { categoryLabels } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export default function AdminPoolsPage() {
  const { showSuccess, showError } = useToast();
  const [pools, setPools] = useState<Pool[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [poolMatches, setPoolMatches] = useState<Record<string, number>>({}); // Track match count per pool
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all'); // Category filter
  
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
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching data...');
      
      // Use simple queries like the dashboard first
      const [poolsResult, teamsResult, matchesResult] = await Promise.all([
        supabase.from('pools').select('*').order('name'),
        supabase.from('teams').select('*').order('name'),
        supabase.from('matches').select('pool_id').order('created_at')
      ]);
      
      console.log('Pools result:', poolsResult);
      console.log('Teams result:', teamsResult);
      console.log('Matches result:', matchesResult);
      
      if (poolsResult.error) {
        console.error('Error fetching pools:', poolsResult.error);
        showError('Error fetching pools', poolsResult.error.message);
      }
      if (teamsResult.error) {
        console.error('Error fetching teams:', teamsResult.error);
      }
      if (matchesResult.error) {
        console.error('Error fetching matches:', matchesResult.error);
      }
      
      // Set basic data first
      setPools(poolsResult.data || []);
      setTeams(teamsResult.data || []);
      
      // Calculate match count per pool
      const matchCounts: Record<string, number> = {};
      if (matchesResult.data) {
        matchesResult.data.forEach((match: any) => {
          matchCounts[match.pool_id] = (matchCounts[match.pool_id] || 0) + 1;
        });
      }
      setPoolMatches(matchCounts);
      
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
  }, [showError]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await tournamentStore.getCategories();
      setCategories(cats);
      if (cats.length > 0) setSelectedCategoryId(cats[0].id);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [fetchData, fetchCategories]);

  const handleCreatePool = async () => {
    if (!newPoolName.trim() || !selectedCategoryId) return;
    try {
      await tournamentStore.createPool(newPoolName.trim(), maxTeams, selectedCategoryId);
      setNewPoolName('');
      setMaxTeams(4);
      setShowCreatePool(false);
      setSelectedCategoryId(categories[0]?.id || '');
      showSuccess('Pool created successfully');
      fetchData();
    } catch (error) {
      console.error('Error creating pool:', error);
      showError('Error creating pool');
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      await tournamentStore.createTeam(newTeamName.trim());
      setNewTeamName('');
      setShowCreateTeam(false);
      showSuccess('Team created successfully');
      fetchData();
    } catch (error) {
      console.error('Error creating team:', error);
      showError('Error creating team');
    }
  };

  const handleDeletePool = async (poolId: string) => {
    if (!confirm('Are you sure you want to delete this pool? This action cannot be undone.')) {
      return;
    }
    
    try {
      await tournamentStore.deletePool(poolId);
      showSuccess('Pool deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting pool:', error);
      showError('Error deleting pool');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }
    
    try {
      await tournamentStore.deleteTeam(teamId);
      showSuccess('Team deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting team:', error);
      showError('Error deleting team');
    }
  };

  const handleAssignTeamToPool = async (teamId: string, poolId: string) => {
    try {
      await tournamentStore.assignTeamToPool(teamId, poolId);
      setShowAssignTeam(false);
      setSelectedPool(null);
      showSuccess('Team assigned to pool successfully');
      fetchData();
    } catch (error) {
      console.error('Error assigning team to pool:', error);
      showError('Error assigning team to pool');
    }
  };

  const handleRemoveTeamFromPool = async (teamId: string) => {
    try {
      await tournamentStore.removeTeamFromPool(teamId);
      showSuccess('Team removed from pool successfully');
      fetchData();
    } catch (error) {
      console.error('Error removing team from pool:', error);
      showError('Error removing team from pool');
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
      showSuccess('Matches generated successfully!');
      // Refresh matches data to update the UI
      const { data: matchesResult } = await supabase.from('matches').select('pool_id').order('created_at');
      if (matchesResult) {
        const matchCounts: Record<string, number> = {};
        matchesResult.forEach((match: any) => {
          matchCounts[match.pool_id] = (matchCounts[match.pool_id] || 0) + 1;
        });
        setPoolMatches(matchCounts);
      }
    } catch (error) {
      console.error('Error generating matches:', error);
      showError('Error generating matches');
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
      
      // Filter by pool category for all categories
      if (pool.category) {
        // Get the category information from categoryLabels
        const categoryInfo = Object.values(categoryLabels).find(cat => cat.code === pool.category?.code);
        
        if (categoryInfo) {
          // Filter by the category label that matches the pool category
          filtered = filtered.filter((p: Player) => {
            // Check if player's category matches the pool category
            return p.category === categoryInfo.label || 
                   p.category === pool.category?.label ||
                   p.category === pool.category?.description;
          });
        }
      }
      
      setAvailablePlayers(filtered);
    } else {
      setAvailablePlayers([]);
    }
    setShowAssignPlayer(true);
  };

  const handleAssignPlayerToPool = async (playerId: string, poolId: string) => {
    try {
      if (selectedPlayerPool?.category?.type === 'pair') {
        // For pair categories, we need to assign the entire pair
        // First, get the partner of the selected player
        const { data: player, error: playerError } = await supabase
          .from('t_players')
          .select('partner_name')
          .eq('id', playerId)
          .single();
        
        if (playerError || !player.partner_name) {
          showError('Player must have a partner for pair-based categories');
          return;
        }
        
        // Assign the pair to the pool
        await tournamentStore.assignPairToPool(playerId, poolId);
      } else {
        // For individual categories, assign single player
        await tournamentStore.assignPlayerToPool(playerId, poolId);
      }
      
      setShowAssignPlayer(false);
      setSelectedPlayerPool(null);
      setPlayerSearchTerm('');
      showSuccess('Player assigned to pool successfully');
      fetchData();
    } catch (error) {
      console.error('Error assigning player to pool:', error);
      showError('Error assigning player to pool');
    }
  };

  const handleRemovePlayerFromPool = async (playerId: string, poolId: string) => {
    try {
      if (selectedPlayerPool?.category?.type === 'pair') {
        // For pair categories, remove the entire pair
        await tournamentStore.removePairFromPool(playerId, poolId);
      } else {
        // For individual categories, remove single player
        await tournamentStore.removePlayerFromPool(playerId, poolId);
      }
      
      showSuccess('Player removed from pool successfully');
      fetchData();
    } catch (error) {
      console.error('Error removing player from pool:', error);
      showError('Error removing player from pool');
    }
  };

  // Helper function to check if pool has matches
  const hasMatches = (poolId: string) => {
    return (poolMatches[poolId] || 0) > 0;
  };

  // Filter available players based on search term
  const filteredAvailablePlayers = availablePlayers.filter(player => {
    if (!playerSearchTerm.trim()) return true;
    
    const searchLower = playerSearchTerm.toLowerCase();
    const playerName = player.name.toLowerCase();
    const partnerName = player.partner_name?.toLowerCase() || '';
    
    return playerName.includes(searchLower) || partnerName.includes(searchLower);
  });

  // Filter pools based on selected category
  const filteredPools = pools.filter(pool => {
    if (selectedCategoryFilter === 'all') return true;
    return pool.category?.code === selectedCategoryFilter;
  });

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Tournament Pools</h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Manage pools and team assignments
                  {selectedCategoryFilter !== 'all' && (
                    <span className="ml-2 text-blue-600 font-medium">
                      • Filtered by {categoryLabels[selectedCategoryFilter as keyof typeof categoryLabels]?.label || selectedCategoryFilter}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Category:</label>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="MT">Men&apos;s Team</option>
                    <option value="WS">Women&apos;s Singles</option>
                    <option value="WD">Women&apos;s Doubles</option>
                    <option value="XD">Mixed Doubles</option>
                    <option value="BU18">Boys U18</option>
                    <option value="BU13">Boys U13</option>
                    <option value="GU18">Girls U18</option>
                    <option value="GU13">Girls U13</option>
                    <option value="FM">Family Mixed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-base sm:text-lg">Loading pools...</p>
              </div>
            ) : filteredPools.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl sm:text-6xl mb-4">🏊‍♂️</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">
                  {selectedCategoryFilter === 'all' ? 'No pools created yet' : `No pools in ${categoryLabels[selectedCategoryFilter as keyof typeof categoryLabels]?.label || selectedCategoryFilter}`}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  {selectedCategoryFilter === 'all' ? 'Create your first pool to get started' : 'Create a pool for this category to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredPools.map((pool) => (
                  <div key={pool.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">{pool.name}</h3>
                        {pool.category && (
                          <div className="text-xs sm:text-sm text-blue-700 font-medium mb-1">{pool.category.label}</div>
                        )}
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {pool.category && pool.category.code === 'MT'
                            ? `${pool.teamCount || 0} teams` 
                            : pool.category?.type === 'pair'
                            ? `${pool.players?.length || 0} pairs`
                            : `${pool.players?.length || 0} players`}
                        </p>
                      </div>
                      
                      {/* Matches Status - Top Right Corner */}
                      {hasMatches(pool.id) && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                            ✅ {poolMatches[pool.id]} matches
                          </span>
                          <Link
                            href={`/admin/matches?pool=${pool.id}`}
                            className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors whitespace-nowrap"
                          >
                            View Matches
                          </Link>
                        </div>
                      )}
                      
                      {/* Action Buttons - Only show when no matches exist */}
                      {!hasMatches(pool.id) && (
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
                      )}
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
                          <h4 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
                            {pool.category?.type === 'pair' ? 'Pairs in this Pool:' : 'Players in this Pool:'}
                          </h4>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {pool.players.map((player) => {
                              const isPairCategory = pool.category?.type === 'pair';
                              const displayName = isPairCategory && player.partner_name 
                                ? `${player.name} / ${player.partner_name}`
                                : player.name;
                              
                              return (
                                <div key={player.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                  <span className="font-medium text-gray-800 text-sm sm:text-base">{displayName}</span>
                                  <button
                                    onClick={() => handleRemovePlayerFromPool(player.id, pool.id)}
                                    className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}
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
                Assign {selectedPlayerPool.category?.type === 'pair' ? 'Pair' : 'Player'} to {selectedPlayerPool.name}
              </h3>
              
              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  value={playerSearchTerm}
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  placeholder={`Search ${selectedPlayerPool.category?.type === 'pair' ? 'players or partners' : 'players'}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
                />
              </div>
              
              {filteredAvailablePlayers.length === 0 ? (
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  {playerSearchTerm.trim() ? 'No players found matching your search' : 'No available players to assign'}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredAvailablePlayers.map((player) => {
                    const isPairCategory = selectedPlayerPool.category?.type === 'pair';
                    const displayName = isPairCategory && player.partner_name 
                      ? `${player.name} / ${player.partner_name}`
                      : player.name;
                    
                    return (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800 text-sm sm:text-base">{displayName}</span>
                        <button
                          onClick={() => handleAssignPlayerToPool(player.id, selectedPlayerPool.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700"
                        >
                          Assign
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowAssignPlayer(false);
                    setSelectedPlayerPool(null);
                    setPlayerSearchTerm('');
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