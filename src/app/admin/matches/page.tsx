'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { tournamentStore, supabase } from '@/lib/store';
import { Match } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export default function AdminMatchesPage() {
  const { showSuccess, showError } = useToast();
  const { players, teams, pools, categories, poolPlayers, matches: cachedMatches } = useData();
  const [matches, setMatches] = useState<Match[]>([]);
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

  // Get participants (teams or players) for the selected pool
  const participantsInSelectedModalPool = useMemo(() => {
    if (!newMatchPool) return [];
    
    const selectedPool = pools.find(p => p.id === newMatchPool);
    if (!selectedPool) return [];
    
    // Check if this is a team-based category (like Men's Team)
    const isTeamCategory = selectedPool.category?.type === 'team';
    
    if (isTeamCategory) {
      // For team categories, return teams in this pool
      const teamsInPool = teams.filter(team => team.pool_id === newMatchPool);
      return teamsInPool;
    } else {
      // For player/pair categories, return players in this pool
      const poolPlayerIds = poolPlayers
        .filter(pp => pp.pool_id === newMatchPool)
        .map(pp => pp.player_id);
      
      const playersInPool = players.filter(player => poolPlayerIds.includes(player.id));
      return playersInPool;
    }
  }, [newMatchPool, pools, teams, poolPlayers, players]);

  // Get the selected pool to determine if it's team-based or player-based
  const selectedPoolForModal = useMemo(() => {
    return pools.find(p => p.id === newMatchPool);
  }, [newMatchPool, pools]);

  // Check if the selected pool is for a team category
  const isTeamCategory = selectedPoolForModal?.category?.type === 'team';

  // Get display name for a participant (team name or player name)
  const getParticipantDisplayName = (participant: any) => {
    if (isTeamCategory) {
      return participant.name; // Team name
    } else {
      // For player categories, show player name with partner if available
      if (participant.partner_name) {
        return `${participant.name} / ${participant.partner_name}`;
      }
      return participant.name;
    }
  };

  // Add state for editing
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCourt, setEditCourt] = useState('');

  // Handler to start editing
  const startEditMatch = (match: Match) => {
    setEditingMatchId(match.id);
    // Parse date and time from scheduled_date in IST
    const { date, time } = getISTTimeFromStored(match.scheduled_date);
    setEditDate(date);
    setEditTime(time);
    setEditCourt(match.court || '');
  };

  // Handler to cancel editing
  const cancelEditMatch = () => {
    setEditingMatchId(null);
    setEditDate('');
    setEditTime('');
    setEditCourt('');
  };

  // Handler to save changes
  const saveEditMatch = async (match: Match) => {
    try {
      let scheduledDate = null;
      if (editDate && editTime) {
        // Store IST time directly as ISO string
        scheduledDate = `${editDate}T${editTime}:00+05:30`; // IST timezone offset
      }
      
      const updated = {
        scheduled_date: scheduledDate,
        court: editCourt || null,
      };
      const { error } = await supabase
        .from('matches')
        .update(updated)
        .eq('id', match.id);
      if (error) throw error;
      showSuccess('Match updated');
      setEditingMatchId(null);
      fetchData();
    } catch (err) {
      showError('Error updating match', err as string);
    }
  };

  // Helper function to format date and time in IST
  const formatISTDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return { date: '-', time: '-' };
    try {
      // Parse the date string (could be UTC or IST)
      const dt = new Date(dateString);
      
      // Extract date and time in IST format
      const istDate = dt.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const istTime = dt.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return { date: istDate, time: istTime };
    } catch (error) {
      console.error('Error formatting date and time:', error);
      return { date: '-', time: '-' };
    }
  };

  // Helper function to get IST time from stored date
  const getISTTimeFromStored = (storedDateString: string | undefined | null) => {
    if (!storedDateString) return { date: '', time: '' };
    try {
      const dt = new Date(storedDateString);
      // Convert to IST for editing
      const istDate = dt.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD
      
      const istTime = dt.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      return { date: istDate, time: istTime };
    } catch (error) {
      console.error('Error getting IST time from stored date:', error);
      return { date: '', time: '' };
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Using cached matches data...');
      
      // Use cached matches data from DataContext
      setMatches(cachedMatches);
      
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, [cachedMatches]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateMatch = async () => {
    if (!newMatchTeam1 || !newMatchTeam2 || !newMatchPool) return;
    
    try {
      // Determine if this is a team-based or player-based category
      const selectedPool = pools.find(p => p.id === newMatchPool);
      const isTeamCategory = selectedPool?.category?.type === 'team';
      
      // Get the next match number for this category and pool
      const nextMatchNumber = getNextMatchNumber(selectedPool?.category_id || '', newMatchPool);
      
      const matchData: any = {
        pool_id: newMatchPool,
        scheduled_date: newMatchDate ? `${newMatchDate}T${newMatchTime || '00:00'}:00` : undefined,
        court: newMatchCourt || undefined,
        status: 'scheduled' as const,
        match_no: nextMatchNumber
      };
      
      if (isTeamCategory) {
        // For team categories, use team1_id and team2_id
        matchData.team1_id = newMatchTeam1;
        matchData.team2_id = newMatchTeam2;
      } else {
        // For player categories, use player1_id and player2_id
        matchData.player1_id = newMatchTeam1;
        matchData.player2_id = newMatchTeam2;
      }
      
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

  const openUpdateScoreModal = (match: Match) => {
    setSelectedMatch(match);
    setTeam1Score(match.team1_score?.toString() || '');
    setTeam2Score(match.team2_score?.toString() || '');
    setMatchStatus(match.status || 'scheduled');
    setShowUpdateScore(true);
  };

  const getTeamName = useCallback((teamId: string) => {
    return teams.find(team => team.id === teamId)?.name || 'Unknown Team';
  }, [teams]);

  const getPoolName = useCallback((poolId: string) => {
    return pools.find(pool => pool.id === poolId)?.name || 'Unknown Pool';
  }, [pools]);

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

  // Excel Export function
  const exportToExcel = () => {
    const headers = [
      'Match ID',
      'Team 1',
      'Team 2', 
      'Pool',
      'Category',
      'Date',
      'Time',
      'Court',
      'Status',
      'Team 1 Score',
      'Team 2 Score',
      'Created At'
    ];

    const data = filteredMatches.map((match) => {
      const matchCategory = getCategoryForMatch(match);
      const matchType = matchCategory?.type;
      const { date, time } = formatISTDateTime(match.scheduled_date);
      
      // Helper to get participant names
      const getParticipantNames = () => {
        if (matchType === 'team') {
          return {
            participant1: getTeamName(match.team1_id || ''),
            participant2: getTeamName(match.team2_id || '')
          };
        } else if (matchType === 'player') {
          const player1 = players.find(p => p.id === (match as any).player1_id);
          const player2 = players.find(p => p.id === (match as any).player2_id);
          return {
            participant1: player1 ? player1.name : '-',
            participant2: player2 ? player2.name : '-'
          };
        } else if (matchType === 'pair') {
          const player1 = players.find(p => p.id === (match as any).player1_id);
          const player2 = players.find(p => p.id === (match as any).player2_id);
          const player1Full = player1 ? (player1.partner_name ? `${player1.name} / ${player1.partner_name}` : player1.name) : '-';
          const player2Full = player2 ? (player2.partner_name ? `${player2.name} / ${player2.partner_name}` : player2.name) : '-';
          return {
            participant1: player1Full,
            participant2: player2Full
          };
        }
        return { participant1: '-', participant2: '-' };
      };
      
      const { participant1, participant2 } = getParticipantNames();
      
      return [
        match.id,
        participant1,
        participant2,
        getPoolName(match.pool_id),
        matchCategory?.label || '-',
        date,
        time,
        match.court || '-',
        match.status || 'scheduled',
        match.team1_score || '-',
        match.team2_score || '-',
        match.created_at ? new Date(match.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matches');
    
    // Auto-size columns
    const columnWidths = [
      { wch: 15 }, // Match ID
      { wch: 25 }, // Team 1
      { wch: 25 }, // Team 2
      { wch: 15 }, // Pool
      { wch: 20 }, // Category
      { wch: 12 }, // Date
      { wch: 10 }, // Time
      { wch: 8 },  // Court
      { wch: 12 }, // Status
      { wch: 12 }, // Team 1 Score
      { wch: 12 }, // Team 2 Score
      { wch: 20 }  // Created At
    ];
    worksheet['!cols'] = columnWidths;
    
    const fileName = `tournament-matches-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Memoize expensive computations
  const getCategoryForMatch = useCallback((match: Match) => {
    const pool = pools.find(p => p.id === match.pool_id);
    if (!pool) return undefined;
    return categories.find(c => c.id === pool.category_id);
  }, [pools, categories]);

  const getPlayerName = useCallback((id: string) => {
    return players.find(p => p.id === id)?.name || '-';
  }, [players]);

  const filteredMatches = useMemo(() => {
    let ms = selectedPool === 'all' ? matches : matches.filter(match => match.pool_id === selectedPool);
    if (activeCategoryId !== 'all') {
      ms = ms.filter(match => getCategoryForMatch(match)?.id === activeCategoryId);
    }
    
    // Sort by scheduled date and time when "All Categories" is selected
    if (activeCategoryId === 'all') {
      ms = ms.sort((a, b) => {
        // Handle matches without scheduled dates
        if (!a.scheduled_date && !b.scheduled_date) return 0;
        if (!a.scheduled_date) return 1; // Put unscheduled matches at the end
        if (!b.scheduled_date) return -1;
        
        // Sort by scheduled date and time
        const dateA = new Date(a.scheduled_date);
        const dateB = new Date(b.scheduled_date);
        return dateA.getTime() - dateB.getTime();
      });
    }
    
    return ms;
  }, [matches, selectedPool, activeCategoryId, getCategoryForMatch]);

  function renderUpdateScoreModal() {
    if (!showUpdateScore || !selectedMatch) return null;
    const matchCategory = getCategoryForMatch(selectedMatch);
    const matchType = matchCategory?.type;
    let participant1 = '', participant2 = '';
    if (matchType === 'team') {
      participant1 = getTeamName(selectedMatch.team1_id || '');
      participant2 = getTeamName(selectedMatch.team2_id || '');
    } else if (matchType === 'player') {
      participant1 = getPlayerName((selectedMatch as any).player1_id || '');
      participant2 = getPlayerName((selectedMatch as any).player2_id || '');
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

  // Add state for generate matches modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCategory, setGenerateCategory] = useState('');
  const [generateDate, setGenerateDate] = useState('');
  const [generateTime, setGenerateTime] = useState('');
  const [generateDuration, setGenerateDuration] = useState(30);
  const [generatePreview, setGeneratePreview] = useState<any[]>([]);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  // Add state for selected pools in generate modal
  const [generatePools, setGeneratePools] = useState<string[]>([]);

  // Open modal
  const openGenerateModal = () => {
    setShowGenerateModal(true);
    setGenerateCategory('');
    setGenerateDate('');
    setGenerateTime('');
    setGenerateDuration(30);
    setGeneratePreview([]);
    setGenerateError(null);
  };

  // Get pools for selected category
  const getPoolsForCategory = useCallback((categoryId: string) => {
    return pools.filter(pool => pool.category_id === categoryId);
  }, [pools]);

  // Helper to get all possible matches for all pools in a category
  const getAllPossibleMatchesForCategory = useCallback(async (categoryId: string, poolId?: string) => {
    let categoryPools = getPoolsForCategory(categoryId);
    if (poolId) {
      categoryPools = categoryPools.filter(pool => pool.id === poolId);
    }
    if (!categoryPools.length) return [];

    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];

    const allMatches: any[] = [];
    const maxMatchesPerPool = 50; // Limit matches per pool

    for (const pool of categoryPools) {
      if (category.type === 'team') {
        const poolTeams = teams.filter(t => t.pool_id === pool.id);
        let matchCount = 0;
        for (let i = 0; i < poolTeams.length && matchCount < maxMatchesPerPool; i++) {
          for (let j = i + 1; j < poolTeams.length && matchCount < maxMatchesPerPool; j++) {
            allMatches.push({
              team1_id: poolTeams[i].id,
              team2_id: poolTeams[j].id,
              pool_id: pool.id
            });
            matchCount++;
          }
        }
      } else if (category.type === 'player' || category.type === 'pair') {
        // Fetch players for this pool from pool_players table
        const { data: poolPlayers, error } = await supabase
          .from('pool_players')
          .select('player_id')
          .eq('pool_id', pool.id);
        if (error) {
          console.error(`Error fetching players for pool ${pool.id}:`, error);
          continue;
        }
        if (!poolPlayers || poolPlayers.length < 2) continue;
        let matchCount = 0;
        for (let i = 0; i < poolPlayers.length && matchCount < maxMatchesPerPool; i++) {
          for (let j = i + 1; j < poolPlayers.length && matchCount < maxMatchesPerPool; j++) {
            allMatches.push({
              player1_id: poolPlayers[i].player_id,
              player2_id: poolPlayers[j].player_id,
              pool_id: pool.id
            });
            matchCount++;
          }
        }
      }
    }
    return allMatches;
  }, [categories, teams, getPoolsForCategory]);

  // Handler to analyze and preview schedule with timeout protection
  const handleAnalyzeGenerate = useCallback(async () => {
    setGenerateError(null);
    if (!generateCategory || !generateDate || !generateTime || !generateDuration) {
      setGenerateError('Please fill all fields');
      return;
    }
    const timeoutId = setTimeout(() => {
      setGenerateError('Analysis is taking too long. Please try with fewer matches.');
    }, 10000);
    try {
      let matches: any[] = [];
      if (!generatePools.length) {
        matches = await getAllPossibleMatchesForCategory(generateCategory);
      } else if (generatePools.length === 1) {
        matches = await getAllPossibleMatchesForCategory(generateCategory, generatePools[0]);
      } else {
        // Multiple pools selected
        matches = [];
        for (const poolId of generatePools) {
          const poolMatches = await getAllPossibleMatchesForCategory(generateCategory, poolId);
          matches = matches.concat(poolMatches);
        }
      }
      if (!matches.length) {
        setGenerateError('No matches to generate');
        clearTimeout(timeoutId);
        return;
      }
      const limitedMatches = matches.slice(0, 100); // Max 100 matches
      const shuffledMatches = limitedMatches.sort(() => Math.random() - 0.5);
      // Assign courts and times in parallel, then assign match_no
      const preview = [];
      let currentTime = new Date(`${generateDate}T${generateTime}:00+05:30`);
      // Track last scheduled time for each participant (array of Date objects)
      const participantTimes: Record<string, Date[]> = {};
      const minGapMs = 30 * 60 * 1000; // 30 minutes in ms
      const unscheduled = [...shuffledMatches];
      while (unscheduled.length > 0) {
        for (const court of ['C', 'G']) {
          let foundIdx = -1;
          for (let j = 0; j < unscheduled.length; j++) {
            const match = unscheduled[j];
            let participants: string[] = [];
            if (match.team1_id && match.team2_id) {
              participants = [match.team1_id, match.team2_id];
            } else if (match.player1_id && match.player2_id) {
              participants = [match.player1_id, match.player2_id];
            }
            // Check 30m gap for all participants
            const hasRecent = participants.some(pid =>
              (participantTimes[pid] || []).some(t => Math.abs(currentTime.getTime() - t.getTime()) < minGapMs)
            );
            if (!hasRecent) {
              foundIdx = j;
              break;
            }
          }
          if (foundIdx !== -1) {
            const match = unscheduled[foundIdx];
            preview.push({
              ...match,
              scheduled_date: currentTime.toISOString(),
              court,
            });
            let participants: string[] = [];
            if (match.team1_id && match.team2_id) {
              participants = [match.team1_id, match.team2_id];
            } else if (match.player1_id && match.player2_id) {
              participants = [match.player1_id, match.player2_id];
            }
            participants.forEach(pid => {
              if (!participantTimes[pid]) participantTimes[pid] = [];
              participantTimes[pid].push(new Date(currentTime));
            });
            unscheduled.splice(foundIdx, 1);
          }
        }
        // Always increment time, even if no matches scheduled in this slot (to avoid infinite loop)
        currentTime = new Date(currentTime.getTime() + generateDuration * 60000);
      }
      // Assign match_no as <category_code>-<sequence_no>
      const category = categories.find(c => c.id === generateCategory);
      const code = category ? category.code || (category.label.replace(/\s/g, '').substring(0, 3)) : 'CAT';
      preview.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
      preview.forEach((m, idx) => {
        m.match_no = `${code}-${String(idx + 1).padStart(3, '0')}`;
      });
      setGeneratePreview(preview);
      clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error analyzing matches:', error);
      clearTimeout(timeoutId);
      setGenerateError('Error analyzing matches');
    }
  }, [generateCategory, generateDate, generateTime, generateDuration, getAllPossibleMatchesForCategory, categories, generatePools]);

  // Handler to confirm and save generated matches
  const handleConfirmGenerate = async () => {
    if (generatePools.length === 1) {
      setGenerateLoading(true);
      setGenerateError(null);
      try {
        await tournamentStore.generateMatchesForPool(generatePools[0]);
        setShowGenerateModal(false);
        setGeneratePreview([]);
        setGenerateCategory('');
        setGeneratePools([]);
        showSuccess('Matches generated successfully!');
        fetchData();
      } catch (err: any) {
        setGenerateError(err.message || 'Error generating matches');
      }
      setGenerateLoading(false);
      return;
    }
    if (!generatePreview.length) return;
    setGenerateLoading(true);
    setGenerateError(null);
    try {
      // Add status to each match (pool_id is already included)
      const matchesToInsert = generatePreview.map(m => ({
        ...m,
        status: 'scheduled',
      }));
      const { error } = await supabase.from('matches').insert(matchesToInsert);
      if (error) throw error;
      setShowGenerateModal(false);
      setGeneratePreview([]);
      setGenerateCategory('');
      showSuccess('Matches generated successfully!');
      fetchData();
    } catch (err: any) {
      setGenerateError(err.message || 'Error generating matches');
    }
    setGenerateLoading(false);
  };

  // Get the next match number for a given category and pool
  const getNextMatchNumber = useCallback((categoryId: string, poolId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 'CAT-001';
    
    const code = category.code || category.label.replace(/\s/g, '').substring(0, 3);
    
    // Get existing matches for this category and pool
    const existingMatches = matches.filter(match => {
      const matchPool = pools.find(p => p.id === match.pool_id);
      return matchPool?.category_id === categoryId && match.pool_id === poolId;
    });
    
    // Find the highest sequence number
    let maxSequence = 0;
    existingMatches.forEach(existingMatch => {
      if (existingMatch.match_no) {
        const matchNoPattern = new RegExp(`^${code}-(\\d+)$`);
        const matchResult = existingMatch.match_no.match(matchNoPattern);
        if (matchResult && matchResult[1]) {
          const sequence = parseInt(matchResult[1]);
          if (sequence > maxSequence) {
            maxSequence = sequence;
          }
        }
      }
    });
    
    // Return next sequence number
    const nextSequence = maxSequence + 1;
    return `${code}-${String(nextSequence).padStart(3, '0')}`;
  }, [categories, matches, pools]);

  // --- PDF Score Sheet Generation ---
  function groupMatchesByCourt(matches: Match[]) {
    const grouped: Record<string, Match[]> = {};
    matches.forEach((m) => {
      const court = m.court || 'Unknown';
      if (!grouped[court]) grouped[court] = [];
      grouped[court].push(m);
    });
    return grouped;
  }

  function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  function getParticipantNamesForSheet(match: Match) {
    const matchCategory = getCategoryForMatch(match);
    const matchType = matchCategory?.type;
    if (matchType === 'team') {
      return [getTeamName(match.team1_id || ''), getTeamName(match.team2_id || '')];
    } else if (matchType === 'player') {
      const player1 = players.find(p => p.id === match.player1_id);
      const player2 = players.find(p => p.id === match.player2_id);
      return [player1?.name || '-', player2?.name || '-'];
    } else if (matchType === 'pair') {
      const player1 = players.find(p => p.id === match.player1_id);
      const player2 = players.find(p => p.id === match.player2_id);
      // Use only first names for player and partner
      const player1First = player1 ? player1.name.split(' ')[0] : '-';
      const player2First = player2 ? player2.name.split(' ')[0] : '-';
      const player1PartnerFirst = player1?.partner_name ? player1.partner_name.split(' ')[0] : '';
      const player2PartnerFirst = player2?.partner_name ? player2.partner_name.split(' ')[0] : '';
      const player1Full = player1PartnerFirst ? `${player1First} / ${player1PartnerFirst}` : player1First;
      const player2Full = player2PartnerFirst ? `${player2First} / ${player2PartnerFirst}` : player2First;
      return [player1Full, player2Full];
    }
    return ['-', '-'];
  }

  // Add state for generate matches modal
  const [showScoreSheetModal, setShowScoreSheetModal] = useState(false);
  const [scoreSheetDate, setScoreSheetDate] = useState('');

  // Helper to filter matches by selected date
  const getMatchesForScoreSheet = () => {
    if (!scoreSheetDate) return filteredMatches;
    return filteredMatches.filter(m => {
      if (!m.scheduled_date) return false;
      const matchDate = new Date(m.scheduled_date);
      const matchDateStr = matchDate.toISOString().split('T')[0];
      return matchDateStr === scoreSheetDate;
    });
  };

  // PDF generation for selected date
  function generateScoreSheetPDFForDate() {
    const matchesToPrint = getMatchesForScoreSheet();
    const grouped = groupMatchesByCourt(matchesToPrint);
    const doc = new jsPDF();
    let firstPage = true;
    // Base64 PNG for logo
    Object.entries(grouped).forEach(([court, matches]) => {
      const matchChunks = chunkArray(matches, 5);
      matchChunks.forEach((chunk) => {
        if (!firstPage) doc.addPage();
        firstPage = false;
        // Add Baddies logo at top left
        // Header
        doc.setFontSize(18);
        doc.setTextColor(41, 128, 185); // blue
        doc.text('PBEL City Badminton 2025', 105, 18, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Court: ${court}`, 20, 28);
        doc.text('Score Sheet (30 Points)', 160, 28, { align: 'right' });
        doc.setLineWidth(0.5);
        doc.line(15, 32, 195, 32);
        let y = 40;
        chunk.forEach((match, idx) => {
          const [p1, p2] = getParticipantNamesForSheet(match);
          // Get category for this match
          const matchCategory = getCategoryForMatch(match);
          // Color map for category code
          const categoryColorMap: Record<string, { bg: [number, number, number], text: [number, number, number] }> = {
            'MT': { bg: [41, 128, 185], text: [255,255,255] }, // blue (Men's Team)
            'WS': { bg: [39, 174, 96], text: [255,255,255] }, // green (Women's Singles)
            'WD': { bg: [142, 68, 173], text: [255,255,255] }, // purple (Women's Doubles)
            'XD': { bg: [243, 156, 18], text: [255,255,255] }, // orange (Mixed Doubles)
            'BU18': { bg: [52, 152, 219], text: [255,255,255] }, // light blue (Boys U18)
            'BU13': { bg: [22, 160, 133], text: [255,255,255] }, // teal (Boys U13)
            'GU18': { bg: [231, 76, 60], text: [255,255,255] }, // red (Girls U18)
            'GU13': { bg: [241, 196, 15], text: [0,0,0] }, // yellow (Girls U13)
            'FM': { bg: [127, 140, 141], text: [255,255,255] }, // gray (Family Mixed)
            'default': { bg: [155, 89, 182], text: [255,255,255] } // fallback purple
          };
          const catCode = matchCategory?.code || 'default';
          const catColor = categoryColorMap[catCode] || categoryColorMap['default'];
          // Colored match label
          doc.setFillColor(...catColor.bg);
          doc.setTextColor(...catColor.text);
          doc.setFontSize(12);
          doc.rect(20, y-5, 40, 8, 'F');
          doc.text(`Match #${match.match_no || '-'}`, 22, y, { baseline: 'middle' });
          doc.setTextColor(0,0,0);
          doc.setFontSize(11);
          doc.text(`Date: ${formatISTDateTime(match.scheduled_date).date}`, 70, y);
          doc.text(`Time: ${formatISTDateTime(match.scheduled_date).time}`, 130, y);
          y += 8;
          // Player 1 row
          doc.setFontSize(10);
          doc.text(p1, 20, y+6);
          // Draw score boxes on the same row
          for (let i = 0; i < 30; i++) {
            doc.rect(70 + i*4, y, 4, 8);
            doc.setFontSize(7);
            doc.text(String(i+1), 72 + i*4 - (i+1 >= 10 ? 1 : 0), y+6);
          }
          y += 10;
          // Player 2 row
          doc.setFontSize(10);
          doc.text(p2, 20, y+6);
          for (let i = 0; i < 30; i++) {
            doc.rect(70 + i*4, y, 4, 8);
            doc.setFontSize(7);
            doc.text(String(i+1), 72 + i*4 - (i+1 >= 10 ? 1 : 0), y+6);
          }
          y += 14;
          // Add Referee Name and Signature fields
          doc.setFontSize(9);
          doc.text('Referee Name: ____________________', 20, y + 6);
          doc.text('Signature: ____________________', 120, y + 6);
          y += 14;
          if (idx < chunk.length - 1) {
            doc.setDrawColor(180);
            doc.line(20, y, 190, y);
            y += 6;
          }
        });
      });
    });
    doc.save('PBEL_Badminton_Score_Sheets.pdf');
    setShowScoreSheetModal(false);
  }

  return (
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Match Management</h1>
        <p className="text-gray-600">Create and manage tournament matches, update scores, and track results</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{matches.length}</p>
            </div>
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
              <span className="text-xl md:text-2xl">🏸</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {matches.filter(m => m.status === 'completed').length}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-green-100 rounded-lg">
              <span className="text-xl md:text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600">
                {matches.filter(m => m.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
              <span className="text-xl md:text-2xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-600">
                {matches.filter(m => m.status === 'scheduled').length}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
              <span className="text-xl md:text-2xl">⏰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col gap-2 w-full max-w-2xl">
        <div className="flex flex-row gap-2 w-full">
          <div className="w-[200px] min-w-[200px]">
            <label htmlFor="category-select" className="text-sm font-medium text-gray-700">Category:</label>
            <select
              id="category-select"
              value={activeCategoryId}
              onChange={e => setActiveCategoryId(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
            >
              <option value="all">All</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="w-[200px] min-w-[200px]">
            <label htmlFor="pool-select" className="text-sm font-medium text-gray-700">Pool:</label>
            <select
              id="pool-select"
              value={selectedPool}
              onChange={e => setSelectedPool(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
            >
              <option value="all">All</option>
              {pools
                .filter(pool => activeCategoryId === 'all' || pool.category_id === activeCategoryId)
                .map(pool => (
                  <option key={pool.id} value={pool.id}>{pool.name}</option>
                ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mt-1">
          <button
            onClick={() => setShowCreateMatch(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
          >
            <span>➕</span> <span>Match</span>
          </button>
          <button
            onClick={openGenerateModal}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
          >
            <span>🎲</span> <span>Matches</span>
          </button>
          <button
            onClick={exportToExcel}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm"
          >
            <span>📊</span> <span>Excel</span>
          </button>
          <button
            onClick={() => setShowScoreSheetModal(true)}
            className="px-3 py-1.5 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors flex items-center gap-1 text-sm"
          >
            <span>📝</span> <span>Sheets</span>
          </button>
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
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Match</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Pool</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Match No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Court</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMatches.map((match) => {
                    const matchCategory = getCategoryForMatch(match);
                    const matchType = matchCategory?.type;
                    const isEditing = editingMatchId === match.id;
                    
                    // Helper to get participant names
                    const getParticipantNames = () => {
                      if (matchType === 'team') {
                        return {
                          participant1: getTeamName(match.team1_id || ''),
                          participant2: getTeamName(match.team2_id || '')
                        };
                      } else if (matchType === 'player') {
                        const player1 = players.find(p => p.id === (match as any).player1_id);
                        const player2 = players.find(p => p.id === (match as any).player2_id);
                        return {
                          participant1: player1 ? player1.name.split(' ')[0] : '-',
                          participant2: player2 ? player2.name.split(' ')[0] : '-'
                        };
                      } else if (matchType === 'pair') {
                        const player1 = players.find(p => p.id === (match as any).player1_id);
                        const player2 = players.find(p => p.id === (match as any).player2_id);
                        const player1FirstName = player1 ? player1.name.split(' ')[0] : '-';
                        const player2FirstName = player2 ? player2.name.split(' ')[0] : '-';
                        const player1PartnerFirstName = player1?.partner_name ? player1.partner_name.split(' ')[0] : '';
                        const player2PartnerFirstName = player2?.partner_name ? player2.partner_name.split(' ')[0] : '';
                        return {
                          participant1: player1PartnerFirstName ? `${player1FirstName} / ${player1PartnerFirstName}` : player1FirstName,
                          participant2: player2PartnerFirstName ? `${player2FirstName} / ${player2PartnerFirstName}` : player2FirstName
                        };
                      }
                      return { participant1: '-', participant2: '-' };
                    };
                    
                    const { participant1, participant2 } = getParticipantNames();
                    const { date, time } = formatISTDateTime(match.scheduled_date);
                    const poolName = pools.find(p => p.id === match.pool_id)?.name || '-';
                    
                    return (
                      <tr key={match.id} className={`hover:bg-gray-50 ${isEditing ? 'bg-yellow-50' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            <div className="font-semibold">{participant1}</div>
                            <div className="text-gray-500 text-xs">vs</div>
                            <div className="font-semibold">{participant2}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{poolName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{match.match_no || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {isEditing ? (
                            <input 
                              type="date" 
                              value={editDate} 
                              onChange={e => setEditDate(e.target.value)} 
                              className="px-2 py-1 border rounded text-sm w-full"
                            />
                          ) : (
                            date
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {isEditing ? (
                            <input 
                              type="time" 
                              value={editTime} 
                              onChange={e => setEditTime(e.target.value)} 
                              className="px-2 py-1 border rounded text-sm w-full"
                            />
                          ) : (
                            time
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {isEditing ? (
                            <select 
                              value={editCourt} 
                              onChange={e => setEditCourt(e.target.value)} 
                              className="px-2 py-1 border rounded text-sm w-full"
                            >
                              <option value="">-</option>
                              <option value="C">C</option>
                              <option value="G">G</option>
                            </select>
                          ) : (
                            match.court || '-'
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status || 'scheduled')}`}>{getStatusIcon(match.status || 'scheduled')}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600">{match.team1_score ?? '-'}</span>
                            <span className="text-gray-400">-</span>
                            <span className="font-bold text-red-600">{match.team2_score ?? '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <button 
                                  onClick={() => saveEditMatch(match)} 
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={cancelEditMatch} 
                                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => startEditMatch(match)} 
                                  className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => openUpdateScoreModal(match)} 
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                  Score
                                </button>
                                {matchType === 'team' && (
                                  <a 
                                    href={`/admin/matches/${match.id}/manage`} 
                                    className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 text-center"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    Lineup
                                  </a>
                                )}
                              </>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isTeamCategory ? 'Team 1' : 'Player 1'} *
                </label>
                <select
                  value={newMatchTeam1}
                  onChange={(e) => setNewMatchTeam1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  disabled={!newMatchPool}
                >
                  <option value="">Select {isTeamCategory ? 'Team' : 'Player'} 1</option>
                  {participantsInSelectedModalPool.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {getParticipantDisplayName(participant)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isTeamCategory ? 'Team 2' : 'Player 2'} *
                </label>
                <select
                  value={newMatchTeam2}
                  onChange={(e) => setNewMatchTeam2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  disabled={!newMatchPool}
                >
                  <option value="">Select {isTeamCategory ? 'Team' : 'Player'} 2</option>
                  {participantsInSelectedModalPool.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {getParticipantDisplayName(participant)}
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
                <select
                  value={newMatchCourt}
                  onChange={(e) => setNewMatchCourt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select Court</option>
                  <option value="C">C</option>
                  <option value="G">G</option>
                </select>
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

      {/* Generate Matches Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Matches</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={generateCategory} onChange={e => setGenerateCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              {generateCategory && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  Will generate matches from all pools in: <strong>{categories.find(c => c.id === generateCategory)?.label}</strong>
                  <br />
                  Pools: {getPoolsForCategory(generateCategory).map(p => p.name).join(', ')}
                </div>
              )}
              {generateCategory && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pools</label>
                  <select
                    multiple
                    value={generatePools}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      setGeneratePools(options);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32"
                  >
                    {getPoolsForCategory(generateCategory).map(pool => (
                      <option key={pool.id} value={pool.id}>{pool.name}</option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple pools. Leave empty to select all pools.</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={generateDate} onChange={e => setGenerateDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="time" value={generateTime} onChange={e => setGenerateTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration per match (minutes)</label>
                <input type="number" min={5} value={generateDuration} onChange={e => setGenerateDuration(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              {generateError && <div className="text-red-600 text-sm">{generateError}</div>}
              <div className="flex gap-3">
                <button onClick={handleAnalyzeGenerate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Analyze</button>
                <button onClick={() => setShowGenerateModal(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400">Cancel</button>
              </div>
            </div>
            {generatePreview.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-2">Preview Schedule ({generatePreview.length} matches)</h4>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                  {generatePreview.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b last:border-b-0">
                      <span className="text-sm text-gray-800">
                        {m.team1_id && m.team2_id && (
                          <>
                            {getTeamName(m.team1_id)} vs {getTeamName(m.team2_id)}
                          </>
                        )}
                        {m.player1_id && m.player2_id && (
                          <>
                            {getPlayerName(m.player1_id)} vs {getPlayerName(m.player2_id)}
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-600">{formatISTDateTime(m.scheduled_date).date} {formatISTDateTime(m.scheduled_date).time}</span>
                      <span className="text-xs text-gray-600">Court: {m.court}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleConfirmGenerate} disabled={generateLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">Confirm & Save</button>
                  <button onClick={() => setGeneratePreview([])} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400">Edit</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showScoreSheetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xs mx-auto flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Date for Score Sheet</h3>
            <input
              type="date"
              value={scoreSheetDate}
              onChange={e => setScoreSheetDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white mb-4"
            />
            <div className="flex gap-3 w-full">
              <button
                onClick={generateScoreSheetPDFForDate}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
              >
                Generate
              </button>
              <button
                onClick={() => setShowScoreSheetModal(false)}
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