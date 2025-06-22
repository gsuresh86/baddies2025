'use client';

import { useState, useEffect } from 'react';
import { tournamentStore, supabase } from '@/lib/store';
import { Match, Pool, Team } from '@/types';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<string>('all');
  
  // Form states
  const [newMatchTeam1, setNewMatchTeam1] = useState('');
  const [newMatchTeam2, setNewMatchTeam2] = useState('');
  const [newMatchPool, setNewMatchPool] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('');
  const [newMatchCourt, setNewMatchCourt] = useState('');
  
  // Modal states
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showUpdateScore, setShowUpdateScore] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [matchStatus, setMatchStatus] = useState('scheduled');

  // Add this derived variable for modal team filtering
  const teamsInSelectedModalPool = newMatchPool
    ? teams.filter(team => team.pool_id === newMatchPool)
    : [];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching matches data...');
      
      // Test basic matches query first
      console.log('Testing basic matches query...');
      const basicMatchesTest = await supabase.from('matches').select('*');
      console.log('Basic matches test result:', basicMatchesTest);
      
      if (basicMatchesTest.error) {
        console.error('Basic matches test error:', basicMatchesTest.error);
        alert(`Error fetching matches: ${basicMatchesTest.error.message}`);
      }
      
      // Use simple queries like the dashboard first
      const [matchesResult, poolsResult, teamsResult] = await Promise.all([
        supabase.from('matches').select('*').order('created_at', { ascending: false }),
        supabase.from('pools').select('*').order('name'),
        supabase.from('teams').select('*').order('name')
      ]);
      
      console.log('Matches result:', matchesResult);
      console.log('Pools result:', poolsResult);
      console.log('Teams result:', teamsResult);
      
      if (matchesResult.error) {
        console.error('Error fetching matches:', matchesResult.error);
        alert(`Error fetching matches: ${matchesResult.error.message}`);
      }
      if (poolsResult.error) {
        console.error('Error fetching pools:', poolsResult.error);
      }
      if (teamsResult.error) {
        console.error('Error fetching teams:', teamsResult.error);
      }
      
      setMatches(matchesResult.data || []);
      setPools(poolsResult.data || []);
      setTeams(teamsResult.data || []);
      
      // Now try to get detailed data with relationships
      try {
        const detailedMatches = await tournamentStore.getMatches();
        console.log('Detailed matches:', detailedMatches);
        setMatches(detailedMatches);
      } catch (error) {
        console.error('Error fetching detailed matches:', error);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  const handleCreateMatch = async () => {
    if (!newMatchTeam1 || !newMatchTeam2 || !newMatchPool) return;
    
    try {
      const matchData = {
        team1_id: newMatchTeam1,
        team2_id: newMatchTeam2,
        pool_id: newMatchPool,
        scheduled_date: newMatchDate ? `${newMatchDate}T${newMatchTime || '00:00'}:00` : undefined,
        court: newMatchCourt || undefined,
        status: 'scheduled' as const
      };
      
      await tournamentStore.createMatch(matchData);
      
      // Reset form
      setNewMatchTeam1('');
      setNewMatchTeam2('');
      setNewMatchPool('');
      setNewMatchDate('');
      setNewMatchTime('');
      setNewMatchCourt('');
      setShowCreateMatch(false);
      
      fetchData();
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error creating match');
    }
  };

  const handleUpdateScore = async () => {
    if (!selectedMatch || !team1Score || !team2Score) return;
    
    try {
      const scoreData = {
        team1_score: parseInt(team1Score),
        team2_score: parseInt(team2Score),
        status: matchStatus
      };
      
      await tournamentStore.updateMatchScore(selectedMatch.id, scoreData);
      
      // Reset form
      setTeam1Score('');
      setTeam2Score('');
      setMatchStatus('scheduled');
      setShowUpdateScore(false);
      setSelectedMatch(null);
      
      fetchData();
    } catch (error) {
      console.error('Error updating score:', error);
      alert('Error updating score');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return;
    }
    
    try {
      await tournamentStore.deleteMatch(matchId);
      fetchData();
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error deleting match');
    }
  };

  const generateMatchesForPool = async (poolId: string) => {
    try {
      await tournamentStore.generateMatchesForPool(poolId);
      alert('Matches generated successfully!');
      fetchData();
    } catch (error) {
      console.error('Error generating matches:', error);
      alert('Error generating matches');
    }
  };

  const openUpdateScoreModal = (match: Match) => {
    setSelectedMatch(match);
    setTeam1Score(match.team1_score?.toString() || '');
    setTeam2Score(match.team2_score?.toString() || '');
    setMatchStatus(match.status || 'scheduled');
    setShowUpdateScore(true);
  };

  const getTeamName = (teamId: string) => {
    return teams.find(team => team.id === teamId)?.name || 'Unknown Team';
  };

  const getPoolName = (poolId: string) => {
    return pools.find(pool => pool.id === poolId)?.name || 'Unknown Pool';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'cancelled': return '❌';
      default: return '⏰';
    }
  };

  const filteredMatches = selectedPool === 'all' 
    ? matches 
    : matches.filter(match => match.pool_id === selectedPool);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Match Management</h1>
        <p className="text-gray-600">Create and manage tournament matches, update scores, and track results</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-3xl font-bold text-blue-600">{matches.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏸</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {matches.filter(m => m.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">
                {matches.filter(m => m.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-3xl font-bold text-gray-600">
                {matches.filter(m => m.status === 'scheduled').length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <select
            value={selectedPool}
            onChange={(e) => setSelectedPool(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="all">All Pools</option>
            {pools.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateMatch(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ➕ Create Match
          </button>
          {selectedPool !== 'all' && (
            <button
              onClick={() => generateMatchesForPool(selectedPool)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              🎲 Generate Matches
            </button>
          )}
        </div>
      </div>

      {/* Matches List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Tournament Matches</h2>
          <p className="text-gray-600 mt-1">
            {selectedPool === 'all' ? 'All matches' : `Matches in ${getPoolName(selectedPool)}`}
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏸</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No matches found</h3>
              <p className="text-gray-600">
                {selectedPool === 'all' 
                  ? 'Create your first match to get started' 
                  : 'Generate matches for this pool or create individual matches'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(match.status || 'scheduled')}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {getTeamName(match.team1_id)} vs {getTeamName(match.team2_id)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Pool: {getPoolName(match.pool_id)}
                          {match.court && ` • Court: ${match.court}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status || 'scheduled')}`}>
                        {match.status?.replace('_', ' ') || 'scheduled'}
                      </span>
                      <button
                        onClick={() => openUpdateScoreModal(match)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Update Score
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <a
                        href={`/admin/matches/${match.id}/manage`}
                        className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        style={{ textDecoration: 'none' }}
                      >
                        Manage Lineup
                      </a>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {match.team1_score !== null ? match.team1_score : '-'}
                      </div>
                      <div className="text-sm text-gray-600">{getTeamName(match.team1_id)}</div>
                    </div>
                    <div className="text-center flex items-center justify-center">
                      <div className="text-lg font-medium text-gray-500">VS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {match.team2_score !== null ? match.team2_score : '-'}
                      </div>
                      <div className="text-sm text-gray-600">{getTeamName(match.team2_id)}</div>
                    </div>
                  </div>
                  
                  {match.scheduled_date && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Scheduled: {new Date(match.scheduled_date).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Match Modal */}
      {showCreateMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Match</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pool *</label>
                <select
                  value={newMatchPool}
                  onChange={(e) => {
                    setNewMatchPool(e.target.value);
                    setNewMatchTeam1(''); // Reset team selections when pool changes
                    setNewMatchTeam2('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select Pool</option>
                  {pools.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team 1 *</label>
                <select
                  value={newMatchTeam1}
                  onChange={(e) => setNewMatchTeam1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  disabled={!newMatchPool}
                >
                  <option value="">Select Team 1</option>
                  {teamsInSelectedModalPool.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team 2 *</label>
                <select
                  value={newMatchTeam2}
                  onChange={(e) => setNewMatchTeam2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  disabled={!newMatchPool}
                >
                  <option value="">Select Team 2</option>
                  {teamsInSelectedModalPool.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newMatchDate}
                    onChange={(e) => setNewMatchDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newMatchTime}
                    onChange={(e) => setNewMatchTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                <input
                  type="text"
                  value={newMatchCourt}
                  onChange={(e) => setNewMatchCourt(e.target.value)}
                  placeholder="e.g., Court 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateMatch}
                disabled={!newMatchTeam1 || !newMatchTeam2 || !newMatchPool}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Match
              </button>
              <button
                onClick={() => setShowCreateMatch(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Score Modal */}
      {showUpdateScore && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Match Score</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                {getTeamName(selectedMatch.team1_id)} vs {getTeamName(selectedMatch.team2_id)}
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getTeamName(selectedMatch.team1_id)} Score
                  </label>
                  <input
                    type="number"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getTeamName(selectedMatch.team2_id)} Score
                  </label>
                  <input
                    type="number"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateScore}
                disabled={!team1Score || !team2Score}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Score
              </button>
              <button
                onClick={() => {
                  setShowUpdateScore(false);
                  setSelectedMatch(null);
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