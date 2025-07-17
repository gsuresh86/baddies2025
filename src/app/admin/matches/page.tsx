'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { tournamentStore, supabase } from '@/lib/store';
import { Match } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import Link from 'next/link';

export default function AdminMatchesPage() {
  const { showSuccess, showError } = useToast();
  const { players, teams, pools, categories, poolPlayers, matches: cachedMatches, refreshData } = useData();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<string>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  // Add state for status and date filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Form states
  const [newMatchTeam1, setNewMatchTeam1] = useState('');
  const [newMatchTeam2, setNewMatchTeam2] = useState('');
  const [newMatchPool, setNewMatchPool] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('');
  const [newMatchCourt, setNewMatchCourt] = useState('');
  
  // Modal states
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCategory, setGenerateCategory] = useState('');
  const [generatePools, setGeneratePools] = useState<string[]>([]);
  const [generateDate, setGenerateDate] = useState('');
  const [generateTime, setGenerateTime] = useState('');
  const [generateDuration, setGenerateDuration] = useState(30);
  const [generatePreview, setGeneratePreview] = useState<any[]>([]);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Helper to get pools for a category
  const getPoolsForCategory = (categoryId: string) => pools.filter(pool => pool.category_id === categoryId);

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
  const [editMatchNo, setEditMatchNo] = useState('');

  // Handler to start editing
  const startEditMatch = (match: Match) => {
    setEditingMatchId(match.id);
    // Parse date and time from scheduled_date in IST
    const { date, time } = getISTTimeFromStored(match.scheduled_date);
    setEditDate(date);
    setEditTime(time);
    setEditCourt(match.court || '');
    setEditMatchNo(match.match_no || '');
  };

  // Handler to cancel editing
  const cancelEditMatch = () => {
    setEditingMatchId(null);
    setEditDate('');
    setEditTime('');
    setEditCourt('');
    setEditMatchNo('');
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
        match_no: editMatchNo || null,
      };
      const { error } = await supabase
        .from('matches')
        .update(updated)
        .eq('id', match.id);
      if (error) throw error;
      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert([
          {
            match_id: match.id,
            activity_type: 'MATCH_RESCHEDULED',
            description: `Match rescheduled to ${scheduledDate || 'unspecified date'}${editCourt ? ` on Court ${editCourt}` : ''}${editMatchNo ? `, Match No: ${editMatchNo}` : ''}`,
            performed_by_user_id: user.id,
            metadata: { scheduled_date: scheduledDate, court: editCourt, match_no: editMatchNo }
          }
        ]);
      }
      showSuccess('Match updated');
      setEditingMatchId(null);
      await refreshData();
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
    if (statusFilter !== 'all') {
      ms = ms.filter(match => (match.status || 'scheduled') === statusFilter);
    }
    if (dateFilter) {
      ms = ms.filter(match => {
        if (!match.scheduled_date) return false;
        const matchDate = new Date(match.scheduled_date);
        // Format as yyyy-mm-dd
        const matchDateStr = matchDate.toISOString().split('T')[0];
        return matchDateStr === dateFilter;
      });
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
  }, [matches, selectedPool, activeCategoryId, statusFilter, dateFilter, getCategoryForMatch]);

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
    let matchesToFilter = filteredMatches;
    
    // Filter by date if selected
    if (scoreSheetDate) {
      matchesToFilter = matchesToFilter.filter(m => {
        if (!m.scheduled_date) return false;
        const matchDate = new Date(m.scheduled_date);
        const matchDateStr = matchDate.toISOString().split('T')[0];
        return matchDateStr === scoreSheetDate;
      });
    }
    
    // Filter out Men's team category matches (code: 'MT')
    return matchesToFilter.filter(m => {
      const matchCategory = getCategoryForMatch(m);
      return matchCategory?.code !== 'MT';
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

  // Function to generate Men's team score sheet with 5 games (D-S-D-S-D)
  function generateMensTeamScoreSheet(doc: jsPDF, match: Match, y: number) {
    const [team1, team2] = getParticipantNamesForSheet(match);
    
    // Header for Men's Team match
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185); // blue
    doc.text('PBEL City Badminton 2025', 105, 18, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Match #${match.match_no || '-'} - Men's Team`, 20, 28);
    doc.text(`Date: ${formatISTDateTime(match.scheduled_date).date}`, 130, 28);
    doc.setLineWidth(0.5);
    doc.line(15, 32, 195, 32);
    
    // Teams section
    doc.setFontSize(12);
    doc.text(`${team1} vs ${team2}`, 105, 42, { align: 'center' });
    
    // Game types: D-S-D-S-D (Doubles-Singles-Doubles-Singles-Doubles)
    const gameTypes = [
      { name: '1st Doubles', type: 'D' },
      { name: '1st Singles', type: 'S' },
      { name: '2nd Doubles', type: 'D' },
      { name: '2nd Singles', type: 'S' },
      { name: '3rd Doubles', type: 'D' }
    ];
    
    let currentY = 50;
    
    gameTypes.forEach((game, gameIndex) => {
      // Game header
      doc.setFontSize(10);
      doc.setFillColor(41, 128, 185);
      doc.setTextColor(255, 255, 255);
      doc.rect(20, currentY-3, 160, 6, 'F');
      doc.text(`Game ${gameIndex + 1}: ${game.name} (${game.type})`, 22, currentY, { baseline: 'middle' });
      doc.setTextColor(0, 0, 0);
      currentY += 8;
      
      // Standard 2-row format like other categories
      doc.setFontSize(9);
      doc.text('P1: _________________', 20, currentY);
      // Draw score boxes for P1
      for (let i = 0; i < 30; i++) {
        doc.rect(70 + i*4, currentY, 4, 6);
        doc.setFontSize(6);
        doc.text(String(i+1), 72 + i*4 - (i+1 >= 10 ? 1 : 0), currentY+4);
      }
      currentY += 8;
      
      // Second row for P2
      doc.setFontSize(9);
      doc.text('P2: _________________', 20, currentY);
      // Draw score boxes for P2
      for (let i = 0; i < 30; i++) {
        doc.rect(70 + i*4, currentY, 4, 6);
        doc.setFontSize(6);
        doc.text(String(i+1), 72 + i*4 - (i+1 >= 10 ? 1 : 0), currentY+4);
      }
      currentY += 8;
      
      // Game result
      doc.setFontSize(8);
      doc.text('Winner: Team 1 [ ]  Team 2 [ ]', 20, currentY);
      currentY += 6;
      
      // Separator line
      if (gameIndex < gameTypes.length - 1) {
        doc.setDrawColor(180);
        doc.line(20, currentY, 190, currentY);
        currentY += 4;
      }
    });
    
    // Match result section
    currentY += 3;
    doc.setFontSize(10);
    doc.setFillColor(39, 174, 96);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, currentY-3, 160, 6, 'F');
    doc.text('MATCH RESULT', 22, currentY, { baseline: 'middle' });
    doc.setTextColor(0, 0, 0);
    currentY += 8;
    
    doc.setFontSize(9);
    doc.text('Games Won - Team 1: ___  Team 2: ___', 20, currentY);
    currentY += 6;
    doc.text('Overall Winner: Team 1 [ ]  Team 2 [ ]', 20, currentY);
    currentY += 8;
    
    // Referee section
    doc.setFontSize(8);
    doc.text('Referee Name: ____________________', 20, currentY);
    doc.text('Signature: ____________________', 120, currentY);
    
    return currentY + 10; // Return the Y position for next match
  }

  // Function to generate only Men's team score sheets
  function generateMensTeamScoreSheets() {
    const matchesToPrint = filteredMatches;
    
    // Filter only Men's team matches
    const mensTeamMatches = matchesToPrint.filter(m => {
      const matchCategory = getCategoryForMatch(m);
      return matchCategory?.code === 'MT';
    });
    
    if (mensTeamMatches.length === 0) {
      showError('No Men\'s team matches found');
      return;
    }
    
    const doc = new jsPDF();
    let currentY = 40;
    
    // Generate Men's team score sheets
    mensTeamMatches.forEach((match, idx) => {
      // Add new page only if not the first match and current page is full
      if (idx > 0 && currentY > 250) {
        doc.addPage();
        currentY = 40;
      }
      
      currentY = generateMensTeamScoreSheet(doc, match, currentY);
      
      // Add new page only if there are more matches and current page is getting full
      if (idx < mensTeamMatches.length - 1 && currentY > 200) {
        doc.addPage();
        currentY = 40;
      }
    });
    
    doc.save('PBEL_Mens_Team_Score_Sheets.pdf');
    showSuccess(`Generated ${mensTeamMatches.length} Men's team score sheet(s)`);
  }

  const handleAnalyzeGenerate = async () => {
    if (!generateCategory || generatePools.length === 0) {
      setGenerateError('Please select a category and at least one pool.');
      return;
    }
    setGenerateLoading(true);
    setGenerateError(null);
    setGeneratePreview([]);

    try {
      const generatedMatches: Match[] = [];
      const startDateTime = new Date(`${generateDate}T${generateTime}:00`);
      const duration = generateDuration * 60 * 1000; // Duration in milliseconds

      for (const poolId of generatePools) {
        const pool = pools.find(p => p.id === poolId);
        if (!pool) {
          setGenerateError(`Pool with ID ${poolId} not found.`);
          setGenerateLoading(false);
          return;
        }

        const category = categories.find(c => c.id === pool.category_id);
        if (!category) {
          setGenerateError(`Category for pool ${pool.name} not found.`);
          setGenerateLoading(false);
          return;
        }

        const isTeamCategory = category.type === 'team';
        const nextMatchNumber = getNextMatchNumber(category.id, poolId);

        const matchData: any = {
          pool_id: poolId,
          scheduled_date: startDateTime.toISOString(),
          court: 'C', // Default court
          status: 'scheduled' as const,
          match_no: nextMatchNumber
        };

        if (isTeamCategory) {
          // For team categories, use team1_id and team2_id
          matchData.team1_id = newMatchTeam1; // Assuming newMatchTeam1 and newMatchTeam2 are pre-filled for team categories
          matchData.team2_id = newMatchTeam2;
        } else {
          // For player categories, use player1_id and player2_id
          matchData.player1_id = newMatchTeam1;
          matchData.player2_id = newMatchTeam2;
        }

        generatedMatches.push(await tournamentStore.createMatch(matchData));
        startDateTime.setTime(startDateTime.getTime() + duration); // Increment time for next match
      }

      setGeneratePreview(generatedMatches);
      setShowGenerateModal(false);
      showSuccess('Matches generated successfully!');
      fetchData();
    } catch (error) {
      console.error('Error generating matches:', error);
      showError('Error generating matches', error as string);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleConfirmGenerate = async () => {
    if (generatePreview.length === 0) return;

    try {
      for (const match of generatePreview) {
        await tournamentStore.createMatch(match);
      }
      showSuccess('Matches generated and saved successfully!');
      fetchData();
      setGeneratePreview([]);
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error saving generated matches:', error);
      showError('Error saving generated matches', error as string);
    }
  };

  // Add state for mobile search
  const [mobileSearch, setMobileSearch] = useState('');

  // Filtered matches for mobile search
  const filteredMobileMatches = useMemo(() => {
    if (!mobileSearch.trim()) return filteredMatches;
    const search = mobileSearch.trim().toLowerCase();
    return filteredMatches.filter((match) => {
      const matchCategory = getCategoryForMatch(match);
      const matchType = matchCategory?.type;
      let participant1 = '';
      let participant2 = '';
      if (matchType === 'team') {
        participant1 = getTeamName(match.team1_id || '').toLowerCase();
        participant2 = getTeamName(match.team2_id || '').toLowerCase();
      } else if (matchType === 'player' || matchType === 'pair') {
        const player1 = players.find(p => p.id === (match as any).player1_id);
        const player2 = players.find(p => p.id === (match as any).player2_id);
        participant1 = player1 ? player1.name.toLowerCase() : '';
        participant2 = player2 ? player2.name.toLowerCase() : '';
      }
      return participant1.includes(search) || participant2.includes(search);
    });
  }, [mobileSearch, filteredMatches, getCategoryForMatch, getTeamName, players]);

  return (
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Match Management</h1>
        <p className="text-gray-600">Create and manage tournament matches, update scores, and track results</p>
      </div>

      {/* Matches Stats Cards - Dashboard Style, Mobile Friendly */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-xl sm:text-3xl font-bold text-blue-600">{matches.length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <span className="text-lg sm:text-2xl">🏸</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl sm:text-3xl font-bold text-green-600">{matches.filter(m => m.status === 'completed').length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <span className="text-lg sm:text-2xl">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-xl sm:text-3xl font-bold text-purple-600">{matches.filter(m => m.status === 'in_progress').length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <span className="text-lg sm:text-2xl">🔄</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-xl sm:text-3xl font-bold text-orange-600">{matches.filter(m => m.status === 'scheduled').length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <span className="text-lg sm:text-2xl">⏰</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-xl sm:text-3xl font-bold text-red-600">{matches.filter(m => m.status === 'cancelled').length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <span className="text-lg sm:text-2xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col gap-2 w-full max-w-2xl">
        <div className="flex flex-row gap-2 w-full flex-wrap">
          <div className="w-[180px] min-w-[180px]">
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
          <div className="w-[180px] min-w-[180px]">
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
          {/* Status Filter */}
          <div className="w-[180px] min-w-[180px]">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {/* Date Filter */}
          <div className="w-[180px] min-w-[180px]">
            <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">Date:</label>
            <div className="flex items-center gap-1">
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="ml-1 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold border border-gray-300"
                  title="Clear date filter"
                >
                  ✕
                </button>
              )}
            </div>
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
            onClick={() => setShowGenerateModal(true)}
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
          <button
            onClick={generateMensTeamScoreSheets}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm"
          >
            <span>🏆</span> <span>Men's Team</span>
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
          {/* Mobile search box */}
          <div className="mb-4 sm:hidden">
            <input
              type="text"
              value={mobileSearch}
              onChange={e => setMobileSearch(e.target.value)}
              placeholder="Search by player name..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
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
            <>
              {/* Mobile: Cards */}
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {filteredMobileMatches.map((match) => {
                  const matchCategory = getCategoryForMatch(match);
                  const matchType = matchCategory?.type;
                  const isEditing = editingMatchId === match.id;
                  const { participant1, participant2 } = (() => {
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
                  })();
                  const { date, time } = formatISTDateTime(match.scheduled_date);
                  const poolName = pools.find(p => p.id === match.pool_id)?.name || '-';
                  return (
                    <div key={match.id} className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-xs font-medium text-gray-600">{poolName}</div>
                          <div className="text-lg font-bold text-blue-700">{participant1} <span className="text-gray-500 text-xs">vs</span> {participant2}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status || 'scheduled')}`}>{getStatusIcon(match.status || 'scheduled')}</span>
                          <span className="text-xs text-gray-500 mt-1">{date} {time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-blue-600">{match.team1_score ?? '-'}</span>
                          <span className="text-gray-400">-</span>
                          <span className="font-bold text-red-600">{match.team2_score ?? '-'}</span>
                        </div>
                        <span className="text-gray-400">|</span>
                        <span className="text-xs text-gray-500">Court: {isEditing ? (
                          <select value={editCourt} onChange={e => setEditCourt(e.target.value)} className="px-2 py-1 border rounded text-xs">
                            <option value="">-</option>
                            <option value="C">C</option>
                            <option value="G">G</option>
                          </select>
                        ) : (match.court || '-')}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-xs text-gray-500">Match No: {isEditing ? (
                          <input
                            type="text"
                            value={editMatchNo}
                            onChange={e => setEditMatchNo(e.target.value)}
                            className="px-1 py-0.5 border rounded text-xs w-20"
                            placeholder="Match No"
                          />
                        ) : (
                          match.match_no || '-'
                        )}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="text-gray-500">Date: {isEditing ? (
                          <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="px-2 py-1 border rounded text-xs" />
                        ) : date}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">Time: {isEditing ? (
                          <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="px-2 py-1 border rounded text-xs" />
                        ) : time}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEditMatch(match)}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold text-center hover:bg-green-700 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditMatch}
                              className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg text-xs font-semibold text-center hover:bg-gray-500 transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditMatch(match)}
                            className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs font-semibold text-center hover:bg-yellow-600 transition"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Link
                          href={`/admin/matches/${match.id}`}
                          className="flex-1 px-3 py-2 bg-purple-200 text-purple-800 rounded-lg text-xs font-semibold text-center hover:bg-purple-300 transition"
                        >
                          Details
                        </Link>
                        {matchType === 'team' && (
                          <Link
                            href={`/admin/matches/${match.id}/manage`}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold text-center hover:bg-gray-300 transition"
                          >
                            Lineup
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Match</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Pool</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Match No</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Time</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Court</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Score</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatches.map((match, idx) => {
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
                        <tr
                          key={match.id}
                          className={
                            `${isEditing ? 'bg-yellow-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ` +
                            'hover:bg-blue-50 transition-colors duration-100'
                          }
                          style={{ borderRadius: isEditing ? '0.5rem' : undefined }}
                        >
                          <td className="px-3 py-2 whitespace-nowrap align-middle">
                            <div className="text-sm font-medium text-gray-900">
                              <div className="font-semibold">{participant1}</div>
                              <div className="text-gray-500 text-xs">vs</div>
                              <div className="font-semibold">{participant2}</div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">{poolName}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editMatchNo}
                                onChange={e => setEditMatchNo(e.target.value)}
                                className="px-2 py-1 border rounded text-sm w-full"
                                placeholder="Match No"
                              />
                            ) : (
                              match.match_no || '-'
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
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
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
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
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
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
                          <td className="px-3 py-2 whitespace-nowrap align-middle">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status || 'scheduled')}`}>{getStatusIcon(match.status || 'scheduled')}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600">{match.team1_score ?? '-'}</span>
                              <span className="text-gray-400">-</span>
                              <span className="font-bold text-red-600">{match.team2_score ?? '-'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium align-middle">
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
                                  {matchType === 'team' && (
                                    <a 
                                      href={`/admin/matches/${match.id}/manage`} 
                                      className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 text-center"
                                      style={{ textDecoration: 'none' }}
                                    >
                                      Lineup
                                    </a>
                                  )}
                                  <a 
                                    href={`/admin/matches/${match.id}`} 
                                    className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs hover:bg-purple-300 text-center"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    Details
                                  </a>
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
            </>
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