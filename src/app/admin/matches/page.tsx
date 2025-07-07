'use client';

import { useState } from 'react';
import { Match } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useMatches } from './hooks/useMatches';
import { exportMatchesToExcel, exportMatchesToPDF } from './utils/matchUtils';
import MatchFilters from './components/MatchFilters';
import MatchList from './components/MatchList';
import CreateMatchModal from './components/CreateMatchModal';
import UpdateScoreModal from './components/UpdateScoreModal';
import jsPDF from 'jspdf';
import { useCallback } from 'react';

export default function AdminMatchesPage() {
  const { players, teams, pools, categories, poolPlayers } = useData();
  const {
    matches,
    loading,
    selectedPool,
    activeCategoryId,
    setSelectedPool,
    setActiveCategoryId,
    createMatch,
    updateMatchScore,
    refetch,
    getCategoryForMatch
  } = useMatches();

  // Modal states
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showUpdateScore, setShowUpdateScore] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Add state for score sheet modal
  const [showScoreSheetModal, setShowScoreSheetModal] = useState(false);
  const [scoreSheetDate, setScoreSheetDate] = useState('');

  // Generate Matches modal state and logic (restored)
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCategory, setGenerateCategory] = useState('');
  const [generateDate, setGenerateDate] = useState('');
  const [generateTime, setGenerateTime] = useState('');
  const [generateDuration, setGenerateDuration] = useState(30);
  const [generatePreview, setGeneratePreview] = useState<any[]>([]);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatePools, setGeneratePools] = useState<string[]>([]);

  const handleCreateMatch = async (matchData: any) => {
    try {
      await createMatch(matchData);
      setShowCreateMatch(false);
    } catch {
      // Error handling is done in the hook
    }
  };

  const handleUpdateScore = async (scoreData: any) => {
    if (!selectedMatch) return;
    
    try {
      await updateMatchScore(selectedMatch.id, scoreData);
      setShowUpdateScore(false);
      setSelectedMatch(null);
    } catch {
      // Error handling is done in the hook
    }
  };

  const openUpdateScoreModal = (match: Match) => {
    setSelectedMatch(match);
    setShowUpdateScore(true);
  };

  const handleExportExcel = () => {
    exportMatchesToExcel(matches, players, 'tournament-matches.xlsx');
  };

  // Helper to filter matches by selected date
  const getMatchesForScoreSheet = () => {
    if (!scoreSheetDate) return matches;
    return matches.filter(m => {
      if (!m.scheduled_date) return false;
      const matchDate = new Date(m.scheduled_date);
      const matchDateStr = matchDate.toISOString().split('T')[0];
      return matchDateStr === scoreSheetDate;
    });
  };

  // --- PDF Score Sheet Generation (restored old format) ---
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
    // Try to use the same logic as the table for merged player names
    const getName = (side: 'team1' | 'team2') => {
      if (side === 'team1') {
        if (match.team1) return match.team1.name;
        if (match.player1) {
          return match.player1.partner_name
            ? `${match.player1.name} / ${match.player1.partner_name}`
            : match.player1.name;
        }
        // Fallback: look up player by id
        if ((match as any).player1_id) {
          const player = players.find(p => p.id === (match as any).player1_id);
          return player ? (player.partner_name ? `${player.name} / ${player.partner_name}` : player.name) : '-';
        }
      } else {
        if (match.team2) return match.team2.name;
        if (match.player2) {
          return match.player2.partner_name
            ? `${match.player2.name} / ${match.player2.partner_name}`
            : match.player2.name;
        }
        // Fallback: look up player by id
        if ((match as any).player2_id) {
          const player = players.find(p => p.id === (match as any).player2_id);
          return player ? (player.partner_name ? `${player.name} / ${player.partner_name}` : player.name) : '-';
        }
      }
      return '-';
    };
    return [getName('team1'), getName('team2')];
  }

  function formatISTDateTime(dateString: string | undefined | null) {
    if (!dateString) return { date: '-', time: '-' };
    try {
      const dt = new Date(dateString);
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
    } catch {
      return { date: '-', time: '-' };
    }
  }

  function generateScoreSheetPDFForDate() {
    const matchesToPrint = getMatchesForScoreSheet();
    const grouped = groupMatchesByCourt(matchesToPrint);
    const doc = new jsPDF();
    let firstPage = true;
    Object.entries(grouped).forEach(([court, matches]) => {
      const matchChunks = chunkArray(matches, 5);
      matchChunks.forEach((chunk) => {
        if (!firstPage) doc.addPage();
        firstPage = false;
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
          // Color map for category code
          const categoryColorMap: Record<string, { bg: [number, number, number], text: [number, number, number] }> = {
            'MT': { bg: [41, 128, 185], text: [255,255,255] },
            'WS': { bg: [39, 174, 96], text: [255,255,255] },
            'WD': { bg: [142, 68, 173], text: [255,255,255] },
            'XD': { bg: [243, 156, 18], text: [255,255,255] },
            'BU18': { bg: [52, 152, 219], text: [255,255,255] },
            'BU13': { bg: [22, 160, 133], text: [255,255,255] },
            'GU18': { bg: [231, 76, 60], text: [255,255,255] },
            'GU13': { bg: [241, 196, 15], text: [0,0,0] },
            'FM': { bg: [127, 140, 141], text: [255,255,255] },
            'default': { bg: [155, 89, 182], text: [255,255,255] }
          };
          const matchCategory = getCategoryForMatch(match);
          const catCode = matchCategory?.code || 'default';
          const catColor = categoryColorMap[catCode] || categoryColorMap['default'];
          // Colored match label
          doc.setFillColor(...(catColor.bg as [number, number, number]));
          doc.setTextColor(...(catColor.text as [number, number, number]));
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

  const openGenerateModal = () => {
    setShowGenerateModal(true);
    setGenerateCategory('');
    setGenerateDate('');
    setGenerateTime('');
    setGenerateDuration(30);
    setGeneratePreview([]);
    setGenerateError(null);
  };

  const getPoolsForCategory = useCallback((categoryId: string) => {
    return pools.filter(pool => pool.category_id === categoryId);
  }, [pools]);

  const getAllPossibleMatchesForCategory = useCallback(async (categoryId: string, poolId?: string) => {
    let categoryPools = getPoolsForCategory(categoryId);
    if (poolId) {
      categoryPools = categoryPools.filter(pool => pool.id === poolId);
    }
    if (!categoryPools.length) return [];
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];
    const allMatches: any[] = [];
    const maxMatchesPerPool = 50;
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
        const poolPlayerIds = poolPlayers.filter(pp => pp.pool_id === pool.id).map(pp => pp.player_id);
        if (!poolPlayerIds || poolPlayerIds.length < 2) continue;
        let matchCount = 0;
        for (let i = 0; i < poolPlayerIds.length && matchCount < maxMatchesPerPool; i++) {
          for (let j = i + 1; j < poolPlayerIds.length && matchCount < maxMatchesPerPool; j++) {
            allMatches.push({
              player1_id: poolPlayerIds[i],
              player2_id: poolPlayerIds[j],
              pool_id: pool.id
            });
            matchCount++;
          }
        }
      }
    }
    return allMatches;
  }, [categories, teams, getPoolsForCategory, poolPlayers]);

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
      const limitedMatches = matches.slice(0, 100);
      const shuffledMatches = limitedMatches.sort(() => Math.random() - 0.5);
      const preview = [];
      let currentTime = new Date(`${generateDate}T${generateTime}:00+05:30`);
      const participantTimes: Record<string, Date[]> = {};
      const minGapMs = 30 * 60 * 1000;
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
        currentTime = new Date(currentTime.getTime() + generateDuration * 60000);
      }
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

  const handleConfirmGenerate = async () => {
    setGenerateLoading(true);
    setGenerateError(null);
    try {
      if (!generatePreview.length) return;
      const matchesToInsert = generatePreview.map(m => ({ ...m, status: 'scheduled' }));
      const { error } = await (await import('@/lib/store')).supabase.from('matches').insert(matchesToInsert);
      if (error) throw error;
      setShowGenerateModal(false);
      setGeneratePreview([]);
      setGenerateCategory('');
      setGeneratePools([]);
      setGenerateDate('');
      setGenerateTime('');
      setGenerateDuration(30);
      setGenerateError(null);
      setGenerateLoading(false);
      refetch();
    } catch (err: any) {
      setGenerateError(err.message || 'Error generating matches');
      setGenerateLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Match Management</h1>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-1/2 max-w-md">
            <button
              onClick={handleExportExcel}
              className="w-full sm:w-auto flex flex-nowrap items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 font-medium whitespace-nowrap"
            >
              <span>📊 + Excel</span>
            </button>
            <button
              onClick={openGenerateModal}
              className="w-full sm:w-auto flex flex-nowrap items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 font-medium whitespace-nowrap"
            >
              <span>🎲 + Gen</span>
            </button>
            <button
              onClick={() => setShowScoreSheetModal(true)}
              className="w-full sm:w-auto flex flex-nowrap items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 font-medium whitespace-nowrap"
            >
              <span>📝 + PDF</span>
            </button>
            <button
              onClick={() => setShowCreateMatch(true)}
              className="w-full sm:w-auto flex flex-nowrap items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 font-medium whitespace-nowrap"
            >
              <span>➕ + Match</span>
            </button>
          </div>
          <div className="w-full">
            <MatchFilters
              pools={pools}
              categories={categories}
              selectedPool={selectedPool}
              activeCategoryId={activeCategoryId}
              onPoolChange={setSelectedPool}
              onCategoryChange={setActiveCategoryId}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Matches ({matches.length})
          </h2>
        </div>
        <div className="p-6">
          <MatchList
            matches={matches}
            loading={loading}
            onScoreUpdate={openUpdateScoreModal}
            onRefresh={refetch}
            getCategoryForMatch={getCategoryForMatch}
          />
        </div>
      </div>

      <CreateMatchModal
        isOpen={showCreateMatch}
        pools={pools}
        teams={teams}
        players={players}
        poolPlayers={poolPlayers}
        onClose={() => setShowCreateMatch(false)}
        onCreate={handleCreateMatch}
      />

      <UpdateScoreModal
        isOpen={showUpdateScore}
        match={selectedMatch}
        onClose={() => {
          setShowUpdateScore(false);
          setSelectedMatch(null);
        }}
        onUpdate={handleUpdateScore}
      />

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
                            {teams.find(t => t.id === m.team1_id)?.name || '-'} vs {teams.find(t => t.id === m.team2_id)?.name || '-'}
                          </>
                        )}
                        {m.player1_id && m.player2_id && (
                          <>
                            {players.find(p => p.id === m.player1_id)?.name || '-'} vs {players.find(p => p.id === m.player2_id)?.name || '-'}
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
    </div>
  );
}