'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { tournamentStore, supabase } from '@/lib/store';
import { Match, Pool, Team, Player, Category } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function AdminMatchesPage() {
  const { showSuccess, showError } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<string>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching matches data...');
      
      // Test basic matches query first
      console.log('Testing basic matches query...');
      const basicMatchesTest = await supabase.from('matches').select('*');
      console.log('Basic matches test result:', basicMatchesTest);
      
      if (basicMatchesTest.error) {
        console.error('Basic matches test error:', basicMatchesTest.error);
        showError('Error fetching matches', basicMatchesTest.error.message);
      }
      
      // Use simple queries like the dashboard first
      const [matchesResult, poolsResult, teamsResult, playersResult, categoriesResult] = await Promise.all([
        supabase.from('matches').select('*').order('created_at', { ascending: false }),
        supabase.from('pools').select('*').order('name'),
        supabase.from('teams').select('*').order('name'),
        supabase.from('t_players').select('*').order('name'),
        supabase.from('categories').select('*').order('label'),
      ]);
      
      console.log('Matches result:', matchesResult);
      console.log('Pools result:', poolsResult);
      console.log('Teams result:', teamsResult);
      console.log('Players result:', playersResult);
      console.log('Categories result:', categoriesResult);
      
      if (matchesResult.error) {
        console.error('Error fetching matches:', matchesResult.error);
        showError('Error fetching matches', matchesResult.error.message);
      }
      if (poolsResult.error) {
        console.error('Error fetching pools:', poolsResult.error);
      }
      if (teamsResult.error) {
        console.error('Error fetching teams:', teamsResult.error);
      }
      if (playersResult.error) {
        console.error('Error fetching players:', playersResult.error);
      }
      if (categoriesResult.error) {
        console.error('Error fetching categories:', categoriesResult.error);
      }
      
      setMatches(matchesResult.data || []);
      setPools(poolsResult.data || []);
      setTeams(teamsResult.data || []);
      setPlayers(playersResult.data || []);
      setCategories(categoriesResult.data || []);
      
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
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      
      showSuccess('Match created successfully');
      fetchData();
    } catch (error) {
      console.error('Error creating match:', error);
      showError('Error creating match');
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
      
      showSuccess('Score updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating score:', error);
      showError('Error updating score');
    }
  };

  const generateMatchesForPool = async (poolId: string) => {
    try {
      await tournamentStore.generateMatchesForPool(poolId);
      showSuccess('Matches generated successfully!');
      fetchData();
    } catch (error) {
      console.error('Error generating matches:', error);
      showError('Error generating matches');
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

  const getCategoryForMatch = useCallback((match: Match) => {
    const pool = pools.find(p => p.id === match.pool_id);
    if (!pool) return undefined;
    return categories.find(c => c.id === pool.category_id);
  }, [pools, categories]);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '-';

  const filteredMatches = useMemo(() => {
    let ms = selectedPool === 'all' ? matches : matches.filter(match => match.pool_id === selectedPool);
    if (activeCategoryId !== 'all') {
      ms = ms.filter(match => getCategoryForMatch(match)?.id === activeCategoryId);
    }
    return ms;
  }, [matches, selectedPool, activeCategoryId, getCategoryForMatch]);

  function getStatusBorderColor(status: string) {
    switch (status) {
      case 'completed': return 'border-green-500';
      case 'in_progress': return 'border-yellow-400';
      case 'cancelled': return 'border-red-500';
      default: return 'border-blue-400'; // scheduled or unknown
    }
  }

  function renderUpdateScoreModal() {
    if (!showUpdateScore || !selectedMatch) return null;
    const matchCategory = getCategoryForMatch(selectedMatch);
    const matchType = matchCategory?.type;
    let participant1 = '', participant2 = '';
    if (matchType === 'team') {
      participant1 = getTeamName(selectedMatch.team1_id);
      participant2 = getTeamName(selectedMatch.team2_id);
    } else if (matchType === 'player') {
      participant1 = getPlayerName((selectedMatch as any).player1_id);
      participant2 = getPlayerName((selectedMatch as any).player2_id);
    } else if (matchType === 'pair') {
      participant1 = 'Pair 1';
      participant2 = 'Pair 2';
    }
    
    // Calculate wins for highlighting
    const team1Wins = (selectedMatch.team1_score ?? 0) > (selectedMatch.team2_score ?? 0);
    const team2Wins = (selectedMatch.team2_score ?? 0) > (selectedMatch.team1_score ?? 0);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-auto flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Match Score</h3>
          <div className="flex items-center justify-center gap-2 w-full mb-6">
            <span className={`font-semibold text-center ${team1Wins ? 'text-green-700 font-bold' : 'text-gray-800'}`} title={participant1}>{participant1}</span>
            <span className="font-bold text-gray-500">vs</span>
            <span className={`font-semibold text-center ${team2Wins ? 'text-green-700 font-bold' : 'text-gray-800'}`} title={participant2}>{participant2}</span>
          </div>
          <div className="flex items-center justify-center gap-4 w-full mb-6">
            <input
              type="number"
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
              min="0"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-center"
            />
            <input
              type="number"
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
              min="0"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-center"
            />
          </div>
          <div className="w-full mb-6">
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
          <div className="flex gap-3 w-full">
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
    );
  }

  return (
    <div className="mx-auto">
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

      {/* Category Selector */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <label htmlFor="category-select" className="text-sm font-medium text-gray-700">Category:</label>
        <select
          id="category-select"
          value={activeCategoryId}
          onChange={e => setActiveCategoryId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        >
          <option value="all">All</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
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
              {filteredMatches.map((match) => {
                const matchCategory = getCategoryForMatch(match);
                const matchType = matchCategory?.type;
                const team1Wins = (match.team1_score ?? 0) > (match.team2_score ?? 0);
                const team2Wins = (match.team2_score ?? 0) > (match.team1_score ?? 0);
                // Team match card
                if (matchType === 'team') {
                  return (
                    <div key={match.id} className={`flex flex-col sm:flex-row items-stretch rounded-xl shadow-sm border-l-8 ${getStatusBorderColor(match.status || '')} p-0 overflow-hidden gap-0`}> 
                      {/* Participants and Scores */}
                      <div className="flex flex-col items-center w-full py-4">
                        <div className="flex items-center justify-center gap-2 w-full mb-2">
                          <span className={`font-semibold text-center ${team1Wins ? 'text-green-700 font-bold' : 'text-gray-800'}`} title={getTeamName(match.team1_id)}>{getTeamName(match.team1_id)}</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 w-full">
                          <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 drop-shadow">{match.team1_score ?? '-'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full py-4">
                        <div className="flex items-center justify-center gap-2 w-full mb-2">
                          <span className={`font-semibold text-center ${team2Wins ? 'text-green-700 font-bold' : 'text-gray-800'}`} title={getTeamName(match.team2_id)}>{getTeamName(match.team2_id)}</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 w-full">
                          <span className="text-2xl sm:text-3xl font-extrabold text-red-700 drop-shadow">{match.team2_score ?? '-'}</span>
                        </div>
                      </div>
                      {/* Info and Actions */}
                      <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-between bg-white/80 px-4 py-3 border-t sm:border-t-0 sm:border-l border-blue-100">
                        {/* Pool and Category in a single row, left-aligned, with truncation */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg font-bold text-gray-800 truncate max-w-[180px]" title={getPoolName(match.pool_id)}>{getPoolName(match.pool_id)}</span>
                          <span className="mx-1 text-gray-400">•</span>
                          <span className="text-lg font-bold text-blue-700 truncate max-w-[180px]" title={matchCategory?.label}>{matchCategory?.label}</span>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status || 'scheduled')}`}>{getStatusIcon(match.status || 'scheduled')}</span>
                        </div>
                        {/* Actions aligned right on desktop, stacked on mobile */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto sm:justify-end">
                          <button onClick={() => openUpdateScoreModal(match)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 w-full sm:w-auto">Score</button>
                          {matchType === 'team' && (
                            <a href={`/admin/matches/${match.id}/manage`} className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium hover:bg-gray-300 w-full sm:w-auto text-center" style={{ textDecoration: 'none' }}>Lineup</a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                // Player match card
                if (matchType === 'player') {
                  const player1Name = getPlayerName((match as any).player1_id);
                  const player2Name = getPlayerName((match as any).player2_id);
                  const player1Wins = (match.team1_score ?? 0) > (match.team2_score ?? 0);
                  const player2Wins = (match.team2_score ?? 0) > (match.team1_score ?? 0);
                  return (
                    <div key={match.id} className={`flex flex-col sm:flex-row items-stretch rounded-xl shadow-sm border-l-8 ${getStatusBorderColor(match.status || '')} p-0 overflow-hidden gap-0`}> 
                      {/* Participants and Scores */}
                      <div className="flex flex-col items-center w-full py-4">
                        <div className="flex items-center justify-center gap-2 w-full mb-2">
                          <span className={`font-semibold text-center ${player1Wins ? 'text-green-700 font-bold' : 'text-gray-800'}`} title={player1Name}>{player1Name}</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 w-full">
                          <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 drop-shadow">{match.team1_score ?? '-'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full py-4">
                        <div className="flex items-center justify-center gap-2 w-full mb-2">
                          <span className={`font-semibold text-center ${player2Wins ? 'text-green-700 font-bold' : 'text-gray-800'}`} title={player2Name}>{player2Name}</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 w-full">
                          <span className="text-2xl sm:text-3xl font-extrabold text-red-700 drop-shadow">{match.team2_score ?? '-'}</span>
                        </div>
                      </div>
                      {/* Info and Actions */}
                      <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-between bg-white/80 px-4 py-3 border-t sm:border-t-0 sm:border-l border-blue-100">
                        {/* Pool and Category in a single row, left-aligned, with truncation */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg font-bold text-gray-800 truncate max-w-[180px]" title={getPoolName(match.pool_id)}>{getPoolName(match.pool_id)}</span>
                          <span className="mx-1 text-gray-400">•</span>
                          <span className="text-lg font-bold text-blue-700 truncate max-w-[180px]" title={matchCategory?.label}>{matchCategory?.label}</span>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status || 'scheduled')}`}>{getStatusIcon(match.status || 'scheduled')}</span>
                        </div>
                        {/* Actions aligned right on desktop, stacked on mobile */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto sm:justify-end">
                          <button onClick={() => openUpdateScoreModal(match)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 w-full sm:w-auto">Score</button>
                        </div>
                      </div>
                    </div>
                  );
                }
                // Pair match card (placeholder)
                if (matchType === 'pair') {
                  return (
                    <div key={match.id} className="border border-purple-200 rounded-lg p-6 bg-purple-50 text-center">
                      <span className="text-purple-700">Pair match display not implemented yet.</span>
                    </div>
                  );
                }
                return null;
              })}
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
      {renderUpdateScoreModal()}
    </div>
  );
} 