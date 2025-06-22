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
  
  // Form states
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // New player form
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  
  // Edit player form
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerEmail, setEditPlayerEmail] = useState('');
  const [editPlayerPhone, setEditPlayerPhone] = useState('');

  // Add state for assign-to-team modal
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [assignPlayer, setAssignPlayer] = useState<Player | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter players based on search query
    if (searchQuery.trim()) {
      const filtered = players.filter(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.email && player.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (player.phone && player.phone.includes(searchQuery))
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers(players);
    }
  }, [searchQuery, players]);

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

  const handleUpdatePlayer = async () => {
    if (!selectedPlayer || !editPlayerName.trim()) return;
    
    try {
      await tournamentStore.updatePlayer(selectedPlayer.id, {
        name: editPlayerName.trim(),
        email: editPlayerEmail.trim() || undefined,
        phone: editPlayerPhone.trim() || undefined
      });
      setShowEditPlayer(false);
      setSelectedPlayer(null);
      fetchData();
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Error updating player');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return;
    }
    
    try {
      await tournamentStore.deletePlayer(playerId);
      fetchData();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Error deleting player');
    }
  };

  const openEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setEditPlayerName(player.name);
    setEditPlayerEmail(player.email || '');
    setEditPlayerPhone(player.phone || '');
    setShowEditPlayer(true);
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Player Management</h1>
        <p className="text-gray-600">Manage all tournament players with search and filtering</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Players</p>
              <p className="text-3xl font-bold text-blue-600">{players.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏸</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Players</p>
              <p className="text-3xl font-bold text-green-600">
                {players.filter(player => getPlayerTeams(player.id).length > 0).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unassigned Players</p>
              <p className="text-3xl font-bold text-orange-600">
                {players.filter(player => getPlayerTeams(player.id).length === 0).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players by name, email, or phone..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowCreatePlayer(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              ➕ Add Player
            </button>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">All Players</h2>
          <p className="text-gray-600 mt-1">
            Showing {filteredPlayers.length} of {players.length} players
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading players...</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏸</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchQuery ? 'No players found' : 'No players created yet'}
              </h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : 'Create your first player to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Teams</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => {
                    const playerTeams = getPlayerTeams(player.id);
                    return (
                      <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800">{player.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">{player.email || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">{player.phone || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">
                            {playerTeams.length > 0 ? (
                              <div className="space-y-1">
                                {playerTeams.map(team => (
                                  <div key={team.id} className="text-sm">
                                    {team.name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-orange-600 text-sm">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            playerTeams.length > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {playerTeams.length > 0 ? 'Assigned' : 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditPlayer(player)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                            >
                              Delete
                            </button>
                            {getPlayerTeams(player.id).length === 0 ? (
                              <button
                                onClick={() => {
                                  setAssignPlayer(player);
                                  setShowAssignTeam(true);
                                  setSelectedTeamId('');
                                }}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700"
                              >
                                Assign to Team
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  const team = getPlayerTeams(player.id)[0];
                                  if (!team) return;
                                  if (!confirm(`Unassign ${player.name} from team ${team.name}?`)) return;
                                  try {
                                    await tournamentStore.removePlayerFromTeam(team.id, player.id);
                                    fetchData();
                                  } catch (error) {
                                    alert('Error unassigning player from team');
                                  }
                                }}
                                className="px-3 py-1 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700"
                              >
                                Unassign
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Player Modal */}
      {showCreatePlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Player</h3>
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Player
              </button>
              <button
                onClick={() => setShowCreatePlayer(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {showEditPlayer && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
                    alert('Error assigning player to team');
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