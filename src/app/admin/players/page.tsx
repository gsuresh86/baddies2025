'use client';
import { useState, useEffect, useCallback } from 'react';
import { tournamentStore, supabase } from '@/lib/store';
import { Player, Team } from '@/types';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/contexts/ToastContext';
import { playerCategories, categoryLabels, PlayerCategory } from '@/lib/utils';

const STAGE_OPTIONS = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4',
  'Round 5',
  'Round 6',
];

export default function AdminPlayersPage() {
  const { showSuccess, showError } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Form states
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // Edit player form
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerEmail, setEditPlayerEmail] = useState('');
  const [editPlayerPhone, setEditPlayerPhone] = useState('');
  const [editPlayerCategory, setEditPlayerCategory] = useState('');

  // Add state for assign-to-team modal
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [assignPlayer, setAssignPlayer] = useState<Player | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Inside AdminPlayersPage, add state for saving stage
  const [savingStage, setSavingStage] = useState<Record<string, boolean>>({});

  // Inside AdminPlayersPage, add state for stage filter
  const [stageFilter, setStageFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [playersResult, teamsResult] = await Promise.all([
        supabase.from('t_players').select('*').order('name'),
        supabase.from('teams').select('*').order('name')
      ]);
      
      if (playersResult.error) {
        console.error('Error fetching players:', playersResult.error);
        showError('Error fetching players');
      }
      if (teamsResult.error) {
        console.error('Error fetching teams:', teamsResult.error);
        showError('Error fetching teams');
      }
      
      setPlayers(playersResult.data || []);
      setFilteredPlayers(playersResult.data || []);
      setTeams(teamsResult.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Filter players based on search query and active tab
    let filtered = players;
    
    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = players.filter(player => player.category === activeTab);
    }
    
    // Apply stage filter
    if (activeTab === PlayerCategory.MensTeam && stageFilter && stageFilter !== 'all') {
      filtered = filtered.filter(player => (player as any).stage === stageFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.email && player.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (player.phone && player.phone.includes(searchQuery))
      );
    }
    
    setFilteredPlayers(filtered);
  }, [searchQuery, players, activeTab, stageFilter]);

  const handleUpdatePlayer = async () => {
    if (!selectedPlayer || !editPlayerName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('t_players')
        .update({
          name: editPlayerName.trim(),
          email: editPlayerEmail.trim() || undefined,
          phone: editPlayerPhone.trim() || undefined,
          category: editPlayerCategory || undefined
        })
        .eq('id', selectedPlayer.id);
      
      if (error) throw error;
      
      showSuccess('Player updated successfully');
      setShowEditPlayer(false);
      setSelectedPlayer(null);
      fetchData();
    } catch (error) {
      console.error('Error updating player:', error);
      showError('Error updating player');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const searchResults = await supabase
          .from('t_players')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .or(`email.ilike.%${searchQuery}%`)
          .or(`phone.ilike.%${searchQuery}%`);
        setFilteredPlayers(searchResults.data || []);
      } catch (error) {
        console.error('Error searching players:', error);
      }
    } else {
      setFilteredPlayers(players);
    }
  };

  const getTabCount = (category: string) => {
    if (category === 'all') {
      return players.length;
    }
    return players.filter(player => player.category === category).length;
  };

  const isTeamEligible = (category: string) => {
    return category === "Men's Singles & Doubles (Team Event)";
  };

  // Utility to safely get category label from categoryLabels
  function getCategoryLabel(key: string): string | undefined {
    // Try to match by PlayerCategory enum value
    if (Object.prototype.hasOwnProperty.call(categoryLabels, key)) {
      return categoryLabels[key as PlayerCategory].label;
    }
    // Try to match by code
    const byCode = Object.values(categoryLabels).find(v => v.code === key);
    if (byCode) return byCode.label;
    // Try to match by label
    const byLabel = Object.values(categoryLabels).find(v => v.label === key);
    if (byLabel) return byLabel.label;
    return undefined;
  }

  // Handler to update stage
  const handleStageChange = async (playerId: string, newStage: string) => {
    setSavingStage(prev => ({ ...prev, [playerId]: true }));
    try {
      const { error } = await supabase
        .from('t_players')
        .update({ stage: newStage })
        .eq('id', playerId);
      if (error) throw error;
      // Update local state
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, stage: newStage } : p));
      setFilteredPlayers(prev => prev.map(p => p.id === playerId ? { ...p, stage: newStage } : p));
    } catch (error) {
      showError('Error updating stage', error instanceof Error ? error.message : String(error));
    } finally {
      setSavingStage(prev => ({ ...prev, [playerId]: false }));
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Player Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage all tournament players by category</p>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 mb-6 sm:mb-8">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players by name..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All ({getTabCount('all')})
              </button>
              {playerCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === category
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span title={categoryLabels[category]?.label || category}>
                    {categoryLabels[category]?.code || category}
                  </span> ({getTabCount(category)})
                </button>
              ))}
            </nav>
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {activeTab === 'all' ? 'All Players' : getCategoryLabel(activeTab) || activeTab}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredPlayers.length} players
              {searchQuery && ` for "${searchQuery}"`}
              {activeTab !== 'all' && isTeamEligible(activeTab) && ' (Team assignment eligible)'}
            </p>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">Loading players...</p>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl sm:text-6xl mb-4">🏸</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">
                  {searchQuery ? 'No players found' : `No players in ${activeTab === 'all' ? 'any category' : getCategoryLabel(activeTab) || activeTab}`}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {searchQuery ? 'Try adjusting your search terms' : 'No players available'}
                </p>
              </div>
            ) : (
              <>
                {/* Above the table, add the stage filter dropdown for Men's Team */}
                {activeTab === PlayerCategory.MensTeam && (
                  <div className="mb-4 flex items-center gap-2">
                    <label className="font-bold text-gray-700 whitespace-nowrap mb-0">Filter by Stage:</label>
                    <select
                      className="w-32 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                      value={stageFilter}
                      onChange={e => setStageFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      {STAGE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full min-w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm">Name & Partner Name</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm hidden sm:table-cell">Skill Level</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm hidden md:table-cell">Phone</th>
                        {activeTab === PlayerCategory.MensTeam && (
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm">Stage</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlayers.map((player) => {
                        const isDoubles = player.category === PlayerCategory.WomensDoubles || player.category === PlayerCategory.MixedDoubles || player.category === PlayerCategory.FamilyMixedDoubles;
                        return (
                          <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="font-medium text-gray-800 text-sm">
                                {player.name}{isDoubles && player.partner_name ? ` / ${player.partner_name}` : ''}
                                <div className="text-xs text-gray-500 sm:hidden">
                                  {player.phone && `${player.phone}`}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                              <div className="text-gray-600 text-sm">{player.level || '-'}</div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                              <div className="text-gray-600 text-sm">{player.phone || '-'}</div>
                            </td>
                            {activeTab === PlayerCategory.MensTeam && (
                              <td className="py-2 sm:py-3 px-2 sm:px-4">
                                <select
                                  className="w-32 p-1 rounded border border-gray-300 text-gray-900 bg-white text-xs sm:text-sm"
                                  value={(player as any).stage || ''}
                                  disabled={!!savingStage[player.id]}
                                  onChange={e => handleStageChange(player.id, e.target.value)}
                                >
                                  <option value="">All</option>
                                  {STAGE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                {savingStage[player.id] && (
                                  <span className="ml-2 text-blue-600 text-xs">Saving...</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Edit Player Modal */}
        {showEditPlayer && selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Player</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player Name *</label>
                  <input
                    type="text"
                    value={editPlayerName}
                    onChange={(e) => setEditPlayerName(e.target.value)}
                    placeholder="Player name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editPlayerCategory}
                    onChange={(e) => setEditPlayerCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Select Category</option>
                    {playerCategories.map(category => (
                      <option key={category} value={category}>
                        <span title={categoryLabels[category]?.label || category}>
                          {categoryLabels[category]?.code || category}
                        </span>
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editPlayerEmail}
                    onChange={(e) => setEditPlayerEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPlayerPhone}
                    onChange={(e) => setEditPlayerPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdatePlayer}
                  disabled={!editPlayerName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Player
                </button>
                <button
                  onClick={() => {
                    setShowEditPlayer(false);
                    setSelectedPlayer(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign to Team Modal */}
        {showAssignTeam && assignPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign {assignPlayer?.name} to a Team</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Team</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                  >
                    <option value="">-- Select a team --</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    if (!selectedTeamId || !assignPlayer) return;
                    try {
                      await tournamentStore.addPlayerToTeam(selectedTeamId, assignPlayer.id);
                      setShowAssignTeam(false);
                      setAssignPlayer(null);
                      setSelectedTeamId('');
                      showSuccess('Player assigned to team successfully');
                      fetchData();
                    } catch (error) {
                      showError('Error assigning player to team', error instanceof Error ? error.message : String(error));
                    }
                  }}
                  disabled={!selectedTeamId}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowAssignTeam(false);
                    setAssignPlayer(null);
                    setSelectedTeamId('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
} 