'use client';

import { useEffect } from 'react';
import { useMatchManagement } from './hooks/useMatchManagement';
import { CreateMatchModal } from './components/CreateMatchModal';
import { MatchTable } from './components/MatchTable';
import { MobileMatchCards } from './components/MobileMatchCards';
import { StatsCards } from './components/StatsCards';
import { useState } from 'react';
import { MatchFilters } from './components/MatchFilters';
import { GenerateMatchesModal } from './components/GenerateMatchesModal';
import { CrossPoolMatchModal } from './components/CrossPoolMatchModal';
import { AssignDialogModal } from './components/AssignDialogModal';
import { exportMatchesToExcel } from './utils/excelUtils';
import { generateScoreSheetPDFForDate, generateMensTeamScoreSheets } from './utils/pdfUtils';
import { getCategoryForMatch, getNextMatchNumber, formatISTDateTime } from './utils/matchUtils';
import { tournamentStore, supabase } from '@/lib/store';

export default function AdminMatchesPage() {
  const {
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
    assignSide1,
    assignSide2,
    assignLoading,
    assignPool1,
    assignPool2,
    scoreSheetDate,
    participantsInSelectedModalPool,
    isTeamCategory,
    poolsForCategory,
    filteredMatches,
    filteredMobileMatches,
    
    // Setters
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
    getOptionsForPoolHelper,
    
    // Data
    players,
    teams,
    pools,
    categories,
    poolPlayers,
    refreshData
  } = useMatchManagement();

  const [gamesCount, setGamesCount] = useState(0);

  useEffect(() => {
    async function fetchGamesCount() {
      const { count } = await supabase.from('games').select('*', { count: 'exact', head: true });
      setGamesCount(count || 0);
    }
    fetchGamesCount();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler functions
  const handleExportExcel = () => {
    exportMatchesToExcel(filteredMatches, categories, pools, teams, players);
  };

  const handleGenerateScoreSheets = () => {
    setShowScoreSheetModal(true);
  };

  const handleGenerateScoreSheetPDF = () => {
    const matchesToPrint = filteredMatches.filter(match => {
      if (scoreSheetDate) {
        if (!match.scheduled_date) return false;
        const matchDate = new Date(match.scheduled_date);
        const matchDateStr = matchDate.toISOString().split('T')[0];
        return matchDateStr === scoreSheetDate;
      }
      return true;
    }).filter(match => {
      const matchCategory = match.category_id
        ? categories.find(c => c.id === match.category_id)
        : getCategoryForMatch(match, pools, categories);
      return matchCategory?.code !== 'MT';
    });

    generateScoreSheetPDFForDate(matchesToPrint, categories, pools, teams, players);
    setShowScoreSheetModal(false);
  };

  const handleGenerateMensTeamSheets = () => {
    try {
      const count = generateMensTeamScoreSheets(filteredMatches, categories, pools, teams, players);
      console.log(`Generated ${count} Men's team score sheet(s)`);
    } catch (error) {
      console.error('Error generating Men\'s team score sheets:', error);
    }
  };

  const handleAssignMatch = (match: any) => {
    console.log('Assigning match:', match);
    console.log('Current assignments:', {
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      pool_id: match.pool_id
    });

    // Find pool IDs from player assignments
    let pool1Id = match.pool_id || '';
    let pool2Id = match.pool_id || '';

    if (match.player1_id) {
      const player1Pool = poolPlayers.find(pp => pp.player_id === match.player1_id);
      if (player1Pool) {
        pool1Id = player1Pool.pool_id;
      }
    }

    if (match.player2_id) {
      const player2Pool = poolPlayers.find(pp => pp.player_id === match.player2_id);
      if (player2Pool) {
        pool2Id = player2Pool.pool_id;
      }
    }

    // For team categories, find pool from team assignment
    if (match.team1_id) {
      const team1 = teams.find(t => t.id === match.team1_id);
      if (team1) {
        pool1Id = team1.pool_id;
      }
    }

    if (match.team2_id) {
      const team2 = teams.find(t => t.id === match.team2_id);
      if (team2) {
        pool2Id = team2.pool_id;
      }
    }

    console.log('Found pool IDs:', { pool1Id, pool2Id });

    setAssignMatch(match);
    setAssignPool1(pool1Id);
    setAssignPool2(pool2Id);
    setAssignSide1(match.team1_id || match.player1_id || '');
    setAssignSide2(match.team2_id || match.player2_id || '');
    setShowAssignDialog(true);
  };

  // Generate matches handlers
  const handleAnalyzeGenerate = async () => {
    if (!generateCategory || generatePools.length === 0) {
      setGenerateError('Please select a category and at least one pool.');
      return;
    }
    setGenerateLoading(true);
    setGenerateError(null);
    setGeneratePreview([]);

    try {
      const generatedMatches: any[] = [];
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
        const nextMatchNumber = getNextMatchNumber(category.id, poolId, categories, matches, pools);

        const matchData: any = {
          pool_id: poolId,
          scheduled_date: startDateTime.toISOString(),
          court: 'C', // Default court
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

        generatedMatches.push(matchData);
        startDateTime.setTime(startDateTime.getTime() + duration);
      }

      setGeneratePreview(generatedMatches);
      setShowGenerateModal(false);
      console.log('Matches generated successfully!');
      await refreshData();
    } catch (error) {
      console.error('Error generating matches:', error);
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
      console.log('Matches generated and saved successfully!');
      await refreshData();
      setGeneratePreview([]);
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error saving generated matches:', error);
    }
  };

  // Cross-pool match handlers
  const handleCreateCrossPoolMatch = async () => {
    setCreating(true);
    try {
      if (usePool) {
        const selectedCategoryObj = categories.find(cat => cat.code === crossCategory);
        const isTeamCategory = selectedCategoryObj?.type === 'team';
        const { error } = await supabase.from('matches').insert([
          {
            category_id: selectedCategoryObj?.id,
            ...(isTeamCategory
              ? { team1_id: side1Player, team2_id: side2Player }
              : { player1_id: side1Player, player2_id: side2Player }),
            scheduled_date: scheduleDate || null,
            court: court || null,
            stage: stage || null,
            status: 'scheduled',
          }
        ]);
        if (error) throw error;
      } else {
        if (!manualSide1 || !manualSide2 || !manualMatchCode || !crossCategory || !scheduleDate || !court || !stage) {
          alert('Please fill all fields');
          setCreating(false);
          return;
        }
        const selectedCategoryObj = categories.find(cat => cat.code === crossCategory);
        const payload = {
          category_id: selectedCategoryObj?.id,
          match_no: manualMatchCode,
          scheduled_date: scheduleDate || null,
          court: court || null,
          stage: stage || null,
          status: 'scheduled',
          side1_label: manualSide1,
          side2_label: manualSide2,
        };
        const { error } = await supabase.from('matches').insert([payload]);
        if (error) throw error;
      }
      setShowCrossPoolModal(false);
      setCrossCategory('');
      setSide1Pool('');
      setSide2Pool('');
      setSide1Player('');
      setSide2Player('');
      setScheduleDate('');
      setCourt('');
      setStage('');
      setManualSide1('');
      setManualSide2('');
      setManualMatchCode('');
      await refreshData();
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err) {
        alert('Error creating match: ' + (err as any).message);
      } else {
        alert('Error creating match.');
      }
    } finally {
      setCreating(false);
    }
  };

  // Assign dialog handlers
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      if (!assignMatch) return;

      const matchCategory = assignMatch.category_id
        ? categories.find(c => c.id === assignMatch.category_id)
        : getCategoryForMatch(assignMatch, pools, categories);
      const isTeamCategory = matchCategory?.type === 'team';
      const isPlayerCategory = matchCategory?.type === 'player' || matchCategory?.type === 'pair';

      const update: any = {};
      if (isTeamCategory) {
        update.team1_id = assignSide1 || null;
        update.team2_id = assignSide2 || null;
        // Preserve side labels - don't remove them
      } else if (isPlayerCategory) {
        update.player1_id = assignSide1 || null;
        update.player2_id = assignSide2 || null;
        // Preserve side labels - don't remove them
      }

      const { error } = await supabase
        .from('matches')
        .update(update)
        .eq('id', assignMatch.id);
      if (error) throw error;
      
      setShowAssignDialog(false);
      setAssignMatch(null);
      setAssignPool1('');
      setAssignPool2('');
      setAssignSide1('');
      setAssignSide2('');
      await refreshData();
      console.log('Assignment updated!');
    } catch (err) {
      console.error('Error updating assignment', err);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <StatsCards matches={matches} gamesCount={gamesCount} categories={categories} />

        {/* Filters and Actions */}
        <MatchFilters
          categories={categories}
          pools={pools}
          activeCategoryIds={activeCategoryIds}
          selectedPool={selectedPool}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          stageFilter={stage}
          onCategoryChange={setActiveCategoryIds}
          onPoolChange={setSelectedPool}
          onStatusChange={setStatusFilter}
          onDateChange={setDateFilter}
          onClearDate={() => setDateFilter('')}
          onCreateMatch={() => setShowCreateMatch(true)}
          onGenerateMatches={() => setShowGenerateModal(true)}
          onExportExcel={handleExportExcel}
          onGenerateScoreSheets={handleGenerateScoreSheets}
          onGenerateMensTeamSheets={handleGenerateMensTeamSheets}
          onCreateCrossPoolMatch={() => setShowCrossPoolModal(true)}
          onStageChange={setStage}
        />

        {/* Matches List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tournament Matches</h2>
                <p className="text-gray-600 mt-1">
                  {selectedPool === 'all' 
                    ? 'All matches' 
                    : `Matches in ${pools.find(p => p.id === selectedPool)?.name || 'Unknown Pool'}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {filteredMatches.length}
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-medium">matches</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {/* Mobile search box */}
            <div className="mb-6 sm:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={mobileSearch}
                  onChange={e => setMobileSearch(e.target.value)}
                  placeholder="Search by player name..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-600 shadow rounded-md">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading matches...
                </div>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🏸</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {selectedPool === 'all' 
                    ? 'Create your first match to get started' 
                    : 'Generate matches for this pool or create individual matches'
                  }
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowCreateMatch(true)}
                    className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Create Match
                  </button>
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Generate Matches
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile: Cards */}
                <MobileMatchCards
                  matches={filteredMobileMatches}
                  players={players}
                  teams={teams}
                  pools={pools}
                  categories={categories}
                  editingMatchId={editingMatchId}
                  editDate={editDate}
                  editTime={editTime}
                  editCourt={editCourt}
                  editMatchNo={editMatchNo}
                  onStartEdit={startEditMatch}
                  onSaveEdit={saveEditMatch}
                  onCancelEdit={cancelEditMatch}
                  onDateChange={setEditDate}
                  onTimeChange={setEditTime}
                  onCourtChange={setEditCourt}
                  onMatchNoChange={setEditMatchNo}
                  onAssignMatch={handleAssignMatch}
                />
                
                {/* Desktop: Table */}
                <MatchTable
                  matches={filteredMatches}
                  players={players}
                  teams={teams}
                  pools={pools}
                  categories={categories}
                  editingMatchId={editingMatchId}
                  editDate={editDate}
                  editTime={editTime}
                  editCourt={editCourt}
                  editMatchNo={editMatchNo}
                  onStartEdit={startEditMatch}
                  onSaveEdit={saveEditMatch}
                  onCancelEdit={cancelEditMatch}
                  onDateChange={setEditDate}
                  onTimeChange={setEditTime}
                  onCourtChange={setEditCourt}
                  onMatchNoChange={setEditMatchNo}
                  onAssignMatch={handleAssignMatch}
                />
              </>
            )}
          </div>
        </div>

        {/* Create Match Modal */}
        <CreateMatchModal
          isOpen={showCreateMatch}
          onClose={() => setShowCreateMatch(false)}
          onSubmit={handleCreateMatch}
          pools={pools}
          participantsInSelectedModalPool={participantsInSelectedModalPool}
          isTeamCategory={isTeamCategory}
          newMatchPool={newMatchPool}
          newMatchTeam1={newMatchTeam1}
          newMatchTeam2={newMatchTeam2}
          newMatchDate={newMatchDate}
          newMatchTime={newMatchTime}
          newMatchCourt={newMatchCourt}
          onPoolChange={setNewMatchPool}
          onTeam1Change={setNewMatchTeam1}
          onTeam2Change={setNewMatchTeam2}
          onDateChange={setNewMatchDate}
          onTimeChange={setNewMatchTime}
          onCourtChange={setNewMatchCourt}
          canSubmit={!!(newMatchTeam1 && newMatchTeam2 && newMatchPool)}
        />

        {/* Score Sheet Modal */}
        {showScoreSheetModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-auto shadow-lg border border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Score Sheet</h3>
                <p className="text-gray-600">Select a date to generate score sheets for all matches</p>
              </div>
              <input
                type="date"
                value={scoreSheetDate}
                onChange={e => setScoreSheetDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateScoreSheetPDF}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Generate
                </button>
                <button
                  onClick={() => setShowScoreSheetModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Matches Modal */}
        <GenerateMatchesModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onAnalyze={handleAnalyzeGenerate}
          onConfirm={handleConfirmGenerate}
          onEdit={() => setGeneratePreview([])}
          categories={categories}
          pools={pools}
          generateCategory={generateCategory}
          generatePools={generatePools}
          generateDate={generateDate}
          generateTime={generateTime}
          generateDuration={generateDuration}
          generatePreview={generatePreview}
          generateLoading={generateLoading}
          generateError={generateError}
          onCategoryChange={setGenerateCategory}
          onPoolsChange={setGeneratePools}
          onDateChange={setGenerateDate}
          onTimeChange={setGenerateTime}
          onDurationChange={setGenerateDuration}
          getTeamName={getTeamName}
          getPlayerName={getPlayerName}
          formatISTDateTime={formatISTDateTime}
        />

        {/* Cross-Pool Match Modal */}
        <CrossPoolMatchModal
          isOpen={showCrossPoolModal}
          onClose={() => setShowCrossPoolModal(false)}
          onSubmit={handleCreateCrossPoolMatch}
          categories={categories}
          pools={pools}
          teams={teams}
          players={players}
          poolPlayers={poolPlayers}
          crossCategory={crossCategory}
          side1Pool={side1Pool}
          side2Pool={side2Pool}
          side1Player={side1Player}
          side2Player={side2Player}
          creating={creating}
          scheduleDate={scheduleDate}
          court={court}
          stage={stage}
          usePool={usePool}
          manualSide1={manualSide1}
          manualSide2={manualSide2}
          manualMatchCode={manualMatchCode}
          poolsForCategory={poolsForCategory}
          onCategoryChange={setCrossCategory}
          onSide1PoolChange={setSide1Pool}
          onSide2PoolChange={setSide2Pool}
          onSide1PlayerChange={setSide1Player}
          onSide2PlayerChange={setSide2Player}
          onDateChange={setScheduleDate}
          onCourtChange={setCourt}
          onStageChange={setStage}
          onUsePoolChange={setUsePool}
          onManualSide1Change={setManualSide1}
          onManualSide2Change={setManualSide2}
          onManualMatchCodeChange={setManualMatchCode}
          getOptionsForPoolHelper={getOptionsForPoolHelper}
        />

        {/* Assign Dialog Modal */}
        <AssignDialogModal
          isOpen={showAssignDialog}
          onClose={() => {
            setShowAssignDialog(false);
            setAssignMatch(null);
            setAssignPool1('');
            setAssignPool2('');
            setAssignSide1('');
            setAssignSide2('');
          }}
          onSubmit={handleAssignSubmit}
          assignMatch={assignMatch}
          assignPool1={assignPool1}
          assignPool2={assignPool2}
          assignSide1={assignSide1}
          assignSide2={assignSide2}
          assignLoading={assignLoading}
          categories={categories}
          pools={pools}
          teams={teams}
          players={players}
          poolPlayers={poolPlayers}
          onPool1Change={setAssignPool1}
          onPool2Change={setAssignPool2}
          onSide1Change={setAssignSide1}
          onSide2Change={setAssignSide2}
          getCategoryForMatchHelper={(match) => getCategoryForMatch(match, pools, categories)}
        />
      </div>
    </>
  );
} 