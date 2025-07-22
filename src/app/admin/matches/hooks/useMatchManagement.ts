import { useState, useCallback, useMemo } from 'react';
import { Match } from '@/types';
import { tournamentStore, supabase } from '@/lib/store';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import {
  getNextMatchNumber,
  getCategoryForMatch,
  getISTTimeFromStored,
  getParticipantDisplayName,
  getOptionsForPool,
  getTeamName as getTeamNameUtil,
  getPlayerName as getPlayerNameUtil
} from '../utils/matchUtils';

export const useMatchManagement = () => {
  const { showSuccess, showError } = useToast();
  const { players, teams, pools, categories, poolPlayers, matches: cachedMatches, refreshData } = useData();
  
  // State for matches
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedPool, setSelectedPool] = useState<string>('all');
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>(['all']);
  const [statusFilter, setStatusFilter] = useState<string>('scheduled');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [mobileSearch, setMobileSearch] = useState('');
  
  // Create match form states
  const [newMatchTeam1, setNewMatchTeam1] = useState('');
  const [newMatchTeam2, setNewMatchTeam2] = useState('');
  const [newMatchPool, setNewMatchPool] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('');
  const [newMatchCourt, setNewMatchCourt] = useState('');
  
  // Edit match states
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCourt, setEditCourt] = useState('');
  const [editMatchNo, setEditMatchNo] = useState('');

  
  // Modal states
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScoreSheetModal, setShowScoreSheetModal] = useState(false);
  const [showCrossPoolModal, setShowCrossPoolModal] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  // Generate matches states
  const [generateCategory, setGenerateCategory] = useState('');
  const [generatePools, setGeneratePools] = useState<string[]>([]);
  const [generateDate, setGenerateDate] = useState('');
  const [generateTime, setGenerateTime] = useState('');
  const [generateDuration, setGenerateDuration] = useState(30);
  const [generatePreview, setGeneratePreview] = useState<any[]>([]);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  
  // Cross-pool match states
  const [crossCategory, setCrossCategory] = useState('');
  const [side1Pool, setSide1Pool] = useState('');
  const [side2Pool, setSide2Pool] = useState('');
  const [side1Player, setSide1Player] = useState('');
  const [side2Player, setSide2Player] = useState('');
  const [creating, setCreating] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [court, setCourt] = useState('');
  const [stage, setStage] = useState('');
  const [usePool, setUsePool] = useState(true);
  const [manualSide1, setManualSide1] = useState('');
  const [manualSide2, setManualSide2] = useState('');
  const [manualMatchCode, setManualMatchCode] = useState('');
  
  // Assign dialog states
  const [assignMatch, setAssignMatch] = useState<Match | null>(null);
  const [assignPool, setAssignPool] = useState('');
  const [assignSide1, setAssignSide1] = useState('');
  const [assignSide2, setAssignSide2] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignPool1, setAssignPool1] = useState('');
  const [assignPool2, setAssignPool2] = useState('');
  
  // Score sheet states
  const [scoreSheetDate, setScoreSheetDate] = useState('');
  
  // Computed values
  const participantsInSelectedModalPool = useMemo(() => {
    if (!newMatchPool) return [];
    
    const selectedPool = pools.find(p => p.id === newMatchPool);
    if (!selectedPool) return [];
    
    const isTeamCategory = selectedPool.category?.type === 'team';
    
    if (isTeamCategory) {
      const teamsInPool = teams.filter(team => team.pool_id === newMatchPool);
      return teamsInPool;
    } else {
      const poolPlayerIds = poolPlayers
        .filter(pp => pp.pool_id === newMatchPool)
        .map(pp => pp.player_id);
      
      const playersInPool = players.filter(player => poolPlayerIds.includes(player.id));
      return playersInPool;
    }
  }, [newMatchPool, pools, teams, poolPlayers, players]);
  
  const selectedPoolForModal = useMemo(() => {
    return pools.find(p => p.id === newMatchPool);
  }, [newMatchPool, pools]);
  
  const isTeamCategory = selectedPoolForModal?.category?.type === 'team';
  
  const poolsForCategory = useMemo(() => {
    return pools.filter(p => p.category?.code === crossCategory);
  }, [pools, crossCategory]);
  
  // Filtered matches
  const filteredMatches = useMemo(() => {
    let ms = selectedPool === 'all' ? matches : matches.filter(match => match.pool_id === selectedPool);
    
    if (!activeCategoryIds.includes('all')) {
      ms = ms.filter(match => {
        if (match.pool_id) {
          const category = getCategoryForMatch(match, pools, categories);
          return category && activeCategoryIds.includes(category.id);
        } else {
          return (match as any).category_id && activeCategoryIds.includes((match as any).category_id);
        }
      });
    }
    
    if (statusFilter !== 'all') {
      ms = ms.filter(match => (match.status || 'scheduled') === statusFilter);
    }
    
    if (dateFilter) {
      ms = ms.filter(match => {
        if (!match.scheduled_date) return false;
        const matchDate = new Date(match.scheduled_date);
        const matchDateStr = matchDate.toISOString().split('T')[0];
        return matchDateStr === dateFilter;
      });
    }
    if (stage) {
      ms = ms.filter(match => match.stage === stage);
    }
    ms = ms.sort((a, b) => {
      if (!a.scheduled_date && !b.scheduled_date) return 0;
      if (!a.scheduled_date) return 1;
      if (!b.scheduled_date) return -1;
      const dateA = new Date(a.scheduled_date);
      const dateB = new Date(b.scheduled_date);
      return dateA.getTime() - dateB.getTime();
    });
    
    return ms;
  }, [matches, selectedPool, activeCategoryIds, statusFilter, dateFilter, stage, pools, categories]);
  
  const filteredMobileMatches = useMemo(() => {
    if (!mobileSearch.trim()) return filteredMatches;
    const search = mobileSearch.trim().toLowerCase();
    return filteredMatches.filter((match) => {
      const matchCategory = match.category_id
        ? categories.find(c => c.id === match.category_id)
        : getCategoryForMatch(match, pools, categories);
      const matchType = matchCategory?.type;
      let participant1 = '';
      let participant2 = '';
      if (matchType === 'team') {
        participant1 = getTeamNameUtil(match.team1_id || '', teams).toLowerCase();
        participant2 = getTeamNameUtil(match.team2_id || '', teams).toLowerCase();
      } else if (matchType === 'player' || matchType === 'pair') {
        const player1 = players.find(p => p.id === (match as any).player1_id);
        const player2 = players.find(p => p.id === (match as any).player2_id);
        participant1 = player1 ? player1.name.toLowerCase() : '';
        participant2 = player2 ? player2.name.toLowerCase() : '';
      }
      return participant1.includes(search) || participant2.includes(search);
    });
  }, [mobileSearch, filteredMatches, categories, pools, teams, players]);
  
  // Helper functions
  const getTeamName = useCallback((teamId: string) => {
    return getTeamNameUtil(teamId, teams);
  }, [teams]);
  
  const getPlayerName = useCallback((id: string) => {
    return getPlayerNameUtil(id, players);
  }, [players]);
  
  const getParticipantDisplayNameForModal = useCallback((participant: any) => {
    return getParticipantDisplayName(participant, isTeamCategory);
  }, [isTeamCategory]);
  
  const getOptionsForPoolHelper = useCallback((poolId: string) => {
    return getOptionsForPool(poolId, pools, teams, players, poolPlayers);
  }, [pools, teams, players, poolPlayers]);
  
  // Action handlers
  const startEditMatch = useCallback((match: Match) => {
    setEditingMatchId(match.id);
    const { date, time } = getISTTimeFromStored(match.scheduled_date);
    setEditDate(date);
    setEditTime(time);
    setEditCourt(match.court || '');
    setEditMatchNo(match.match_no || '');

  }, []);
  
  const cancelEditMatch = useCallback(() => {
    setEditingMatchId(null);
    setEditDate('');
    setEditTime('');
    setEditCourt('');
    setEditMatchNo('');

  }, []);
  
  const saveEditMatch = useCallback(async (match: Match) => {
    try {
      let scheduledDate = null;
      if (editDate && editTime) {
        scheduledDate = `${editDate}T${editTime}:00+05:30`;
      }
      
      // Only update date, court, and time - preserve existing side assignments and labels
      const updated: any = {
        scheduled_date: scheduledDate,
        court: editCourt || null,
        match_no: editMatchNo || null,
      };
      
      const { error } = await supabase
        .from('matches')
        .update(updated)
        .eq('id', match.id);
      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert([
          {
            match_id: match.id,
            activity_type: 'MATCH_RESCHEDULED',
            description: `Match scheduling updated: ${scheduledDate || 'unspecified date'}${editCourt ? ` on Court ${editCourt}` : ''}${editMatchNo ? `, Match No: ${editMatchNo}` : ''}`,
            performed_by_user_id: user.id,
            metadata: { scheduled_date: scheduledDate, court: editCourt, match_no: editMatchNo }
          }
        ]);
      }
      
      showSuccess('Match updated');
      setEditingMatchId(null);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Unknown error occurred');
      showError('Error updating match', errorMessage);
    }
  }, [editDate, editTime, editCourt, editMatchNo, refreshData, showSuccess, showError]);
  
  const handleCreateMatch = useCallback(async () => {
    if (!newMatchTeam1 || !newMatchTeam2 || !newMatchPool) return;
    
    try {
      const selectedPool = pools.find(p => p.id === newMatchPool);
      const isTeamCategory = selectedPool?.category?.type === 'team';
      
      const nextMatchNumber = getNextMatchNumber(selectedPool?.category_id || '', newMatchPool, categories, matches, pools);
      
      const matchData: any = {
        pool_id: newMatchPool,
        scheduled_date: newMatchDate ? `${newMatchDate}T${newMatchTime || '00:00'}:00` : undefined,
        court: newMatchCourt || undefined,
        status: 'scheduled' as const,
        match_no: nextMatchNumber
      };
      
      if (isTeamCategory) {
        matchData.team1_id = newMatchTeam1;
        matchData.team2_id = newMatchTeam2;
      } else {
        matchData.player1_id = newMatchTeam1;
        matchData.player2_id = newMatchTeam2;
      }
      
      await tournamentStore.createMatch(matchData);
      
      setNewMatchTeam1('');
      setNewMatchTeam2('');
      setNewMatchPool('');
      setNewMatchDate('');
      setNewMatchTime('');
      setNewMatchCourt('');
      setShowCreateMatch(false);
      
      showSuccess('Match created successfully');
      await refreshData();
    } catch (error) {
      console.error('Error creating match:', error);
      showError('Error creating match');
    }
  }, [newMatchTeam1, newMatchTeam2, newMatchPool, newMatchDate, newMatchTime, newMatchCourt, pools, categories, matches, refreshData, showSuccess, showError]);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Using cached matches data...');
      setMatches(cachedMatches);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, [cachedMatches]);
  
  return {
    // State
    matches,
    loading,
    selectedPool,
    activeCategoryIds,
    statusFilter,
    dateFilter,
    mobileSearch,
    newMatchTeam1,
    newMatchTeam2,
    newMatchPool,
    newMatchDate,
    newMatchTime,
    newMatchCourt,
    editingMatchId,
    editDate,
    editTime,
    editCourt,
    editMatchNo,

    showCreateMatch,
    showGenerateModal,
    showScoreSheetModal,
    showCrossPoolModal,
    showAssignDialog,
    generateCategory,
    generatePools,
    generateDate,
    generateTime,
    generateDuration,
    generatePreview,
    generateLoading,
    generateError,
    crossCategory,
    side1Pool,
    side2Pool,
    side1Player,
    side2Player,
    creating,
    scheduleDate,
    court,
    stage,
    usePool,
    manualSide1,
    manualSide2,
    manualMatchCode,
    assignMatch,
    assignPool,
    assignSide1,
    assignSide2,
    assignLoading,
    assignPool1,
    assignPool2,
    scoreSheetDate,
    participantsInSelectedModalPool,
    selectedPoolForModal,
    isTeamCategory,
    poolsForCategory,
    filteredMatches,
    filteredMobileMatches,
    
    // Setters
    setMatches,
    setLoading,
    setSelectedPool,
    setActiveCategoryIds,
    setStatusFilter,
    setDateFilter,
    setMobileSearch,
    setNewMatchTeam1,
    setNewMatchTeam2,
    setNewMatchPool,
    setNewMatchDate,
    setNewMatchTime,
    setNewMatchCourt,
    setEditingMatchId,
    setEditDate,
    setEditTime,
    setEditCourt,
    setEditMatchNo,

    setShowCreateMatch,
    setShowGenerateModal,
    setShowScoreSheetModal,
    setShowCrossPoolModal,
    setShowAssignDialog,
    setGenerateCategory,
    setGeneratePools,
    setGenerateDate,
    setGenerateTime,
    setGenerateDuration,
    setGeneratePreview,
    setGenerateLoading,
    setGenerateError,
    setCrossCategory,
    setSide1Pool,
    setSide2Pool,
    setSide1Player,
    setSide2Player,
    setCreating,
    setScheduleDate,
    setCourt,
    setStage,
    setUsePool,
    setManualSide1,
    setManualSide2,
    setManualMatchCode,
    setAssignMatch,
    setAssignPool,
    setAssignSide1,
    setAssignSide2,
    setAssignLoading,
    setAssignPool1,
    setAssignPool2,
    setScoreSheetDate,
    
    // Actions
    startEditMatch,
    cancelEditMatch,
    saveEditMatch,
    handleCreateMatch,
    fetchData,
    getTeamName,
    getPlayerName,
    getParticipantDisplayNameForModal,
    getOptionsForPoolHelper,
    
    // Data
    players,
    teams,
    pools,
    categories,
    poolPlayers,
    refreshData
  };
}; 