'use client';

import { useState, useEffect, useCallback } from 'react';
import { tournamentStore, supabase } from '@/lib/store';
import { Team, Pool, Player } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';

export default function AdminTeamsPage() {
  const { showSuccess, showError } = useToast();
  const { players, teams: cachedTeams, pools: cachedPools, categories, teamPlayers } = useData();
  const [teams, setTeams] = useState<Team[]>([]);
  const [, setPools] = useState<Pool[]>([]);
  const [mensTeamPlayerCount, setMensTeamPlayerCount] = useState(0);
  const [mensTeamPlayers, setMensTeamPlayers] = useState<Player[]>([]);
  const [playersByLevel, setPlayersByLevel] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [poolsWithPlayers, setPoolsWithPlayers] = useState<any[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching teams data...');
      
      // Use cached data for teams, pools, and players
      setPools(cachedPools);
      
      // Build detailed teams data using cached team_players
      const detailedTeams = cachedTeams.map(team => {
        // Get pool info from cached data
        const pool = team.pool_id ? cachedPools.find(p => p.id === team.pool_id) : undefined;
        
        // Get players for this team from cached team_players
        const teamPlayerIds = teamPlayers
          .filter(tp => tp.team_id === team.id)
          .map(tp => tp.player_id);
        
        const teamPlayerDetails = players.filter(p => teamPlayerIds.includes(p.id));
        
        return {
          ...team,
          pool,
          players: teamPlayerDetails
        };
      });
      
      setTeams(detailedTeams);
      
      // Calculate Men's team players count from cached data
      const mensPlayersData = players.filter(p => p.category === "Men's Singles & Doubles (Team Event)");
      setMensTeamPlayerCount(mensPlayersData.length);
      setMensTeamPlayers(mensPlayersData);
      
      // Count by level
      const levelCounts = mensPlayersData.reduce((acc, player) => {
        const level = player.level || 'Unspecified';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setPlayersByLevel(levelCounts);
      
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, [cachedTeams, cachedPools, players, teamPlayers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch pools with players for selected category
  const fetchPoolsWithPlayers = useCallback(async (categoryId: string) => {
    if (!categoryId) return;
    
    setPoolsLoading(true);
    try {
      // Get pools for the selected category from cached data
      const poolsData = cachedPools.filter(p => p.category_id === categoryId);
      
      // Get pool players for each pool
      const poolsWithPlayersData = await Promise.all(
        poolsData.map(async (pool) => {
          const { data: poolPlayersData, error: poolPlayersError } = await supabase
            .from('pool_players')
            .select('player_id')
            .eq('pool_id', pool.id);
          
          if (poolPlayersError) throw poolPlayersError;
          
          // Get player details from cached data
          const poolPlayers = poolPlayersData?.map(pp => 
            players.find(p => p.id === pp.player_id)
          ).filter(Boolean) || [];
          
          return {
            ...pool,
            players: poolPlayers
          };
        })
      );
      
      setPoolsWithPlayers(poolsWithPlayersData);
    } catch (err) {
      console.error('Error fetching pools with players:', err);
    } finally {
      setPoolsLoading(false);
    }
  }, [cachedPools, players]);

  useEffect(() => {
    if (selectedCategory) {
      fetchPoolsWithPlayers(selectedCategory);
    } else {
      setPoolsWithPlayers([]);
    }
  }, [selectedCategory, fetchPoolsWithPlayers]);

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

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Management</h1>
        <p className="text-gray-600">Create and manage teams, assign players, and organize pools</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-600">Men&apos;s Team Players</p>
              <p className="text-3xl font-bold text-blue-600">{mensTeamPlayerCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Teams</p>
              <p className="text-3xl font-bold text-orange-600">
                {teams.filter(team => team.pool).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Men's Team Players by Level */}
      {mensTeamPlayerCount > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Men&apos;s Team Players by Level</h2>
            <p className="text-gray-600 mt-1">Breakdown of players by their skill level</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              {Object.entries(playersByLevel).map(([level, count]) => (
                <div 
                  key={level} 
                  className={`text-center p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedLevel === level 
                      ? 'bg-blue-100 border-2 border-blue-300' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                >
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600 mt-1">{level}</div>
                </div>
              ))}
            </div>
            
            {/* Players List for Selected Level */}
            {selectedLevel && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Players - {selectedLevel} Level ({playersByLevel[selectedLevel]} players)
                </h3>
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {mensTeamPlayers
                    .filter(player => (player.level || 'Unspecified') === selectedLevel)
                    .map((player) => (
                      <div key={player.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-800">{player.name}</div>
                        {player.phone && (
                          <div className="text-sm text-gray-500 mt-1">📞 {player.phone}</div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateTeam(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ➕ Create Team
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">All Teams</h2>
          <p className="text-gray-600 mt-1">Manage teams and their player assignments</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading teams...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchTerm ? 'No teams found' : 'No teams created yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first team to get started'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team) => (
                <div key={team.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{team.brand_name || team.name}</h3>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Pool Assignment */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Pool:</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {team.pool ? team.pool.name : 'Unassigned'}
                      </div>
                    </div>
                    
                    {/* Players */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Players ({team.players?.length || 0}):
                        </span>
                      </div>
                      {team.players && team.players.length > 0 ? (
                        <div className="space-y-2">
                          {team.players.map((player) => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-800">{player.name}</div>
                                {player.phone && (
                                  <div className="text-xs text-gray-500 mt-1">📞 {player.phone}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No players assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pools with Players Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Pools with Players</h2>
          <p className="text-gray-600 mt-1">View players assigned to pools by category</p>
        </div>
        <div className="p-6">
          {/* Category Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Category:</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">-- Choose a category --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label || cat.code}
                </option>
              ))}
            </select>
          </div>

          {/* Pools Display */}
          {!selectedCategory ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏸</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Select a category</h3>
              <p className="text-gray-600">Choose a category to view pools and assigned players</p>
            </div>
          ) : poolsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading pools...</p>
            </div>
          ) : poolsWithPlayers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏊</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No pools found</h3>
              <p className="text-gray-600">No pools have been created for this category yet</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {poolsWithPlayers.map((pool) => {
                const isPairCategory = pool.category?.type === 'pair';
                const participantLabel = isPairCategory ? 'pairs' : 'players';
                
                return (
                  <div key={pool.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{pool.name}</h3>
                      <span className="text-sm text-gray-500">
                        {pool.players.length}/{pool.max_teams} {participantLabel}
                      </span>
                    </div>
                    
                    {pool.players.length === 0 ? (
                      <p className="text-gray-500 text-sm">No {participantLabel} assigned</p>
                    ) : (
                      <div className="space-y-2">
                        {pool.players.map((player: any) => {
                          const displayName = isPairCategory && player.partner_name 
                            ? `${player.name} / ${player.partner_name}`
                            : player.name;
                          
                          return (
                            <div key={player.id} className="p-2 bg-gray-50 rounded">
                              <div className="text-sm font-medium text-gray-800">{displayName}</div>
                              <div className="flex flex-col gap-1 mt-1">
                                {player.phone && (
                                  <div className="text-xs text-gray-500">📞 {player.phone}</div>
                                )}
                                {player.level && (
                                  <div className="text-xs text-gray-500">
                                    Level: {player.level}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
} 