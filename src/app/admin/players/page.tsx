'use client';
import { useState, useEffect } from 'react';
import { tournamentStore } from '@/lib/store';
import { Player, Team } from '@/types';

export default function AdminPlayersPage() {
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

  // Player categories
  const playerCategories = [
    "Men's Singles & Doubles (Team Event)",
    "Women's Singles",
    "Boys under 13 (Born on/after July 1st 2012)",
    "Girls under 13 (Born on/after July 1st 2012)",
    "Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)",
    "Girls under 18 (Born on/after July 1st 2007)",
    "Mixed Doubles",
  ];

  const categoryLabels: Record<string, string> = {
    "Men's Singles & Doubles (Team Event)": "Men's Team",
    "Women's Singles": "Women Singles",
    "Boys under 13 (Born on/after July 1st 2012)": "Boys U13",
    "Girls under 13 (Born on/after July 1st 2012)": "Girls U13",
    "Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)": "Family Mixed",
    "Girls under 18 (Born on/after July 1st 2007)": "Girls U18",
    "Mixed Doubles": "Mixed Doubles",
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter players based on search query and active tab
    let filtered = players;
    
    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = players.filter(player => player.category === activeTab);
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
  }, [searchQuery, players, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [playersData, teamsData] = await Promise.all([
        tournamentStore.getPlayers(),
        tournamentStore.getTeams()
      ]);
      setPlayers(playersData);
      setFilteredPlayers(playersData);
      setTeams(teamsData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdatePlayer = async () => {
    if (!selectedPlayer || !editPlayerName.trim()) return;
    
    try {
      await tournamentStore.updatePlayer(selectedPlayer.id, {
        name: editPlayerName.trim(),
        email: editPlayerEmail.trim() || undefined,
        phone: editPlayerPhone.trim() || undefined,
        category: editPlayerCategory || undefined
      });
      setShowEditPlayer(false);
      setSelectedPlayer(null);
      fetchData();
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Error updating player');
    }
  };


  const getPlayerTeams = (playerId: string): Team[] => {
    return teams.filter(team => 
      team.players?.some(player => player.id === playerId)
    );
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const searchResults = await tournamentStore.searchPlayers(searchQuery);
        setFilteredPlayers(searchResults);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              placeholder="Search players by name, email, or phone..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Search
            </button>
            <button
              onClick={() => setSearchQuery('')}
              className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors text-sm"
            >
              Clear
            </button>
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
                {categoryLabels[category]} ({getTabCount(category)})
              </button>
            ))}
          </nav>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {activeTab === 'all' ? 'All Players' : categoryLabels[activeTab] || activeTab}
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
                {searchQuery ? 'No players found' : `No players in ${activeTab === 'all' ? 'any category' : categoryLabels[activeTab] || activeTab}`}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : 'No players available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm">Name</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm hidden sm:table-cell">Email</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm hidden md:table-cell">Phone</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm">Category</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm">Teams</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm">Status</th>
                    {activeTab === "Men's Singles & Doubles (Team Event)" && (
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => {
                    const playerTeams = getPlayerTeams(player.id);
                    const isEligibleForTeam = isTeamEligible(player.category || '');
                    return (
                      <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="font-medium text-gray-800 text-sm">
                            {player.name}
                            <div className="text-xs text-gray-500 sm:hidden">
                              {player.email && `${player.email}`}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <div className="text-gray-600 text-sm">{player.email || '-'}</div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                          <div className="text-gray-600 text-sm">{player.phone || '-'}</div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="text-gray-600 text-xs sm:text-sm">
                            {categoryLabels[player.category || ''] || player.category || 'Unspecified'}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="text-gray-600 text-xs sm:text-sm">
                            {isEligibleForTeam ? (
                              playerTeams.length > 0 ? (
                                <div className="space-y-1">
                                  {playerTeams.map(team => (
                                    <div key={team.id} className="text-xs sm:text-sm">
                                      {team.name}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-orange-600 text-xs sm:text-sm">Unassigned</span>
                              )
                            ) : (
                              <span className="text-gray-400 text-xs sm:text-sm">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          {isEligibleForTeam ? (
                            <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
                              playerTeams.length > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {playerTeams.length > 0 ? 'Assigned' : 'Unassigned'}
                            </span>
                          ) : (
                            <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              Individual
                            </span>
                          )}
                        </td>
                        {activeTab === "Men's Singles & Doubles (Team Event)" && (
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="flex gap-1 sm:gap-2">
                              {playerTeams.length === 0 ? (
                                <button
                                  onClick={() => {
                                    setAssignPlayer(player);
                                    setShowAssignTeam(true);
                                    setSelectedTeamId('');
                                  }}
                                  className="px-2 sm:px-3 py-1 bg-purple-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-purple-700"
                                >
                                  Assign
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const team = playerTeams[0];
                                    if (!team) return;
                                    if (!confirm(`Unassign ${player.name} from team ${team.name}?`)) return;
                                    try {
                                      await tournamentStore.removePlayerFromTeam(team.id, player.id);
                                      fetchData();
                                    } catch (error) {
                                      alert(`Error unassigning player from team: ${error}`);
                                    }
                                  }}
                                  className="px-2 sm:px-3 py-1 bg-orange-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-orange-700"
                                >
                                  Unassign
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                      {categoryLabels[category]}
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign {assignPlayer.name} to a Team</h3>
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
                  if (!selectedTeamId) return;
                  try {
                    await tournamentStore.addPlayerToTeam(selectedTeamId, assignPlayer.id);
                    setShowAssignTeam(false);
                    setAssignPlayer(null);
                    setSelectedTeamId('');
                    fetchData();
                  } catch (error) {
                    alert(`Error assigning player from team ${error}`);
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
  );
} 