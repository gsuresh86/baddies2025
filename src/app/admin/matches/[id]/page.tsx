'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { tournamentStore, supabase } from '@/lib/store';
import { Match, MatchMedia, MatchHistory, MatchHighlight } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import Image from 'next/image';

export default function AdminMatchDetailsPage() {
  const { showSuccess, showError } = useToast();
  const { matches: cachedMatches, teams, pools, players, refreshData } = useData();
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [media, setMedia] = useState<MatchMedia[]>([]);
  const [history, setHistory] = useState<MatchHistory[]>([]);
  const [highlights, setHighlights] = useState<MatchHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MatchMedia | null>(null);
  const [, setShowUploadForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({});
  const [, setShowScoreForm] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    team1_score: 0,
    team2_score: 0,
    match_duration: 0,
    winner: '',
    match_notes: '',
    match_referee: '',
    status: ''
  });
  const [updatingScore, setUpdatingScore] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return;
      setLoading(true);
      
      try {
        // Get match from cached data first, then from database if not found
        let matchData = cachedMatches.find(m => m.id === matchId);
        if (!matchData) {
          console.log('Match not found in cache, fetching from database...');
          try {
            const { data: dbMatch, error } = await supabase
              .from('matches')
              .select('*')
              .eq('id', matchId)
              .single();
            
            if (error || !dbMatch) {
              console.error('Match not found in database:', error);
              showError('Match not found');
              return;
            }
            matchData = dbMatch;
          } catch (error) {
            console.error('Error fetching match from database:', error);
            showError('Error loading match');
            return;
          }
        }
        if (matchData) {
          setMatch(matchData);
        }

        // Fetch media, history, and highlights
        try {
          const [mediaData, historyData, highlightsData] = await Promise.all([
            tournamentStore.getMatchMedia(matchId).catch(err => {
              console.error('Error fetching media:', err);
              return [];
            }),
            tournamentStore.getMatchHistory(matchId).catch(err => {
              console.error('Error fetching history:', err);
              return [];
            }),
            tournamentStore.getMatchHighlights(matchId).catch(err => {
              console.error('Error fetching highlights:', err);
              return [];
            })
          ]);

          setMedia(mediaData);
          setHistory(historyData);
          setHighlights(highlightsData);
        } catch (error) {
          console.error('Error fetching match data:', error);
          // Continue with empty arrays instead of failing completely
          setMedia([]);
          setHistory([]);
          setHighlights([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [matchId, cachedMatches, showError]);

  useEffect(() => {
    if (match) {
      setScoreForm({
        team1_score: match.team1_score ?? 0,
        team2_score: match.team2_score ?? 0,
        match_duration: match.match_duration ?? 0,
        winner: match.winner ?? '',
        match_notes: match.match_notes ?? '',
        match_referee: match.match_referee ?? '',
        status: match.status ?? 'scheduled',
      });
    }
  }, [match]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
        
        if (!isImage && !isVideo) {
          showError(`${file.name} is not a valid image or video file`);
          return false;
        }
        
        if (!isValidSize) {
          showError(`${file.name} is too large. Maximum size is 50MB`);
          return false;
        }
        
        return true;
      });

      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setDescriptions(prev => {
      const newDescriptions = { ...prev };
      delete newDescriptions[index];
      return newDescriptions;
    });
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      showError('Please select files to upload');
      return;
    }

    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const mediaType = file.type.startsWith('image/') ? 'photo' : 'video';
        const description = descriptions[i] || '';
        
        await tournamentStore.uploadMatchMedia(matchId, file, mediaType, description);
      }
      
      showSuccess('Media uploaded successfully!');
      setSelectedFiles([]);
      setDescriptions({});
      setShowUploadForm(false);
      
      // Refresh media list
      const mediaData = await tournamentStore.getMatchMedia(matchId);
      setMedia(mediaData);
    } catch (error) {
      console.error('Error uploading media:', error);
      showError('Error uploading media');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    
    try {
      await tournamentStore.deleteMatchMedia(mediaId);
      showSuccess('Media deleted successfully');
      
      // Refresh media list
      const mediaData = await tournamentStore.getMatchMedia(matchId);
      setMedia(mediaData);
    } catch (error) {
      console.error('Error deleting media:', error);
      showError('Error deleting media');
    }
  };



  const handleUpdateScore = async () => {
    if (scoreForm.team1_score < 0 || scoreForm.team2_score < 0) {
      showError('Scores cannot be negative');
      return;
    }

    setUpdatingScore(true);
    try {
      const updateData: any = {
        team1_score: scoreForm.team1_score,
        team2_score: scoreForm.team2_score,
        match_duration: scoreForm.match_duration || null,
        match_notes: scoreForm.match_notes || null,
        match_referee: scoreForm.match_referee || null,
        status: scoreForm.status
      };



      // Determine winner if scores are different and no manual winner is set
      if (!scoreForm.winner || scoreForm.winner === '') {
        if (scoreForm.team1_score > scoreForm.team2_score) {
          // Check if it's a team match or player match
          if (match?.team1_id && match?.team2_id) {
            updateData.winner = 'team1';
          } else if (match?.player1_id && match?.player2_id) {
            updateData.winner = 'player1';
          }
        } else if (scoreForm.team2_score > scoreForm.team1_score) {
          // Check if it's a team match or player match
          if (match?.team1_id && match?.team2_id) {
            updateData.winner = 'team2';
          } else if (match?.player1_id && match?.player2_id) {
            updateData.winner = 'player2';
          }
        } else {
          updateData.winner = null; // Draw
        }
      } else {
        updateData.winner = scoreForm.winner === 'draw' ? null : scoreForm.winner;
      }

      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId);
      
      if (error) throw error;
      
      showSuccess('Score updated successfully!');
      setShowScoreForm(false);
      // Refresh global data after updating score, but do not navigate away
      await refreshData();
      // router.push('/admin/matches'); // Remove navigation
      return;
      
      // Refresh match data
      const { data: updatedMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (updatedMatch) {
        setMatch(updatedMatch);
      }
    } catch (error) {
      console.error('Error updating score:', error);
      showError('Error updating score');
    } finally {
      setUpdatingScore(false);
    }
  };



  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'Unknown';
    const team = teams.find(t => t.id === teamId);
    return team?.brand_name || team?.name || 'Unknown';
  };

  const getPlayerName = (playerId?: string) => {
    if (!playerId) return 'Unknown';
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  const getPoolName = (poolId?: string) => {
    if (!poolId) return 'Unknown';
    const pool = pools.find(p => p.id === poolId);
    return pool?.name || 'Unknown';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'cancelled': return '❌';
      default: return '⏰';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Loading match details...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Match not found</p>
        <Link href="/admin/matches" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Matches
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin/matches" className="text-blue-700 hover:underline mb-6 inline-block text-base font-medium">
          ← Back to Matches
        </Link>
        
        {/* Match Header */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow-lg border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {match.side1_label && match.side2_label ? `${match.side1_label} vs ${match.side2_label}` :
               match.team1_id ? `${getTeamName(match.team1_id)} vs ${getTeamName(match.team2_id)}` : 
               match.player1_id ? `${getPlayerName(match.player1_id)} vs ${getPlayerName(match.player2_id)}` : 
               'Match Details'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-600">
              <span className="text-lg">{getPoolName(match.pool_id)}</span>
              <span>•</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                {getStatusIcon(match.status)} {match.status?.replace('_', ' ').toUpperCase() || 'SCHEDULED'}
              </span>
            </div>
          </div>

          {/* Match Details */}
          <div className="grid md:grid-cols-3 gap-6 text-gray-700">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Score</h3>
              <p className="text-2xl font-bold">
                {match.team1_score || 0} - {match.team2_score || 0}
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Duration</h3>
              <p>{formatDuration(match.match_duration)}</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Winner</h3>
              <p className="font-bold text-green-600">
                {(() => {
                  if (!match.winner) return 'TBD';
                  
                  // Check for side labels first
                  if (match.side1_label && match.side2_label) {
                    if (match.winner === 'team1' || match.winner === 'player1') {
                      return match.side1_label;
                    } else if (match.winner === 'team2' || match.winner === 'player2') {
                      return match.side2_label;
                    }
                  }
                  
                  // Get the winner name based on the winner field
                  if (match.winner === 'team1' && match.team1_id) {
                    return getTeamName(match.team1_id);
                  } else if (match.winner === 'team2' && match.team2_id) {
                    return getTeamName(match.team2_id);
                  } else if (match.winner === 'player1' && match.player1_id) {
                    return getPlayerName(match.player1_id);
                  } else if (match.winner === 'player2' && match.player2_id) {
                    return getPlayerName(match.player2_id);
                  }
                  
                  return 'Unknown';
                })()}
              </p>
            </div>
          </div>

          {match.match_notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Match Notes</h3>
              <p className="text-gray-700">{match.match_notes}</p>
            </div>
          )}
        </div>

        {/* Admin Actions, Score Update, and Upload Media - Merged Single Form */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Actions</h2>
          {/* Status Dropdown */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Status
                </label>
                <select
                  value={match.status || 'scheduled'}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      const { error } = await supabase
                        .from('matches')
                        .update({ status: newStatus })
                        .eq('id', match.id);
                      if (error) {
                        showError('Failed to update match status');
                        return;
                      }
                      setMatch(prev => prev ? { ...prev, status: newStatus as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' } : null);
                      showSuccess('Match status updated successfully');
                    } catch (error) {
                      console.error('Error updating match status:', error);
                      showError('Failed to update match status');
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {match.status === 'in_progress' && (
                <Link
                  href={`/admin/matches/${match.id}/livescore`}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition mt-6"
                >
                  Live Score
                </Link>
              )}
              <div className="text-sm text-gray-500 ml-auto">
                Current: <span className={`font-medium ${getStatusColor(match.status)}`}>
                  {getStatusIcon(match.status)} {match.status?.replace('_', ' ').toUpperCase() || 'SCHEDULED'}
                </span>
              </div>
            </div>
          </div>

          {/* Score Update Form - Always Shown */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Match Score</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {match.team1_id ? getTeamName(match.team1_id) : getPlayerName(match.player1_id)} Score
                </label>
                <input
                  type="text"
                  value={scoreForm.team1_score}
                  onChange={(e) => setScoreForm(prev => ({ ...prev, team1_score: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter score"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {match.team2_id ? getTeamName(match.team2_id) : getPlayerName(match.player2_id)} Score
                </label>
                <input
                  type="text"
                  value={scoreForm.team2_score}
                  onChange={(e) => setScoreForm(prev => ({ ...prev, team2_score: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter score"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Duration (minutes)
                </label>
                <input
                  type="text"
                  value={scoreForm.match_duration}
                  onChange={(e) => setScoreForm(prev => ({ ...prev, match_duration: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter duration"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Referee
                </label>
                <select
                  value={scoreForm.match_referee}
                  onChange={(e) => setScoreForm(prev => ({ ...prev, match_referee: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select referee</option>
                  <option value="Surya">Surya</option>
                  <option value="Kshitij">Kshitij</option>
                  <option value="Sraveen">Sraveen</option>
                  <option value="Kambe Gowda">Kambe Gowda</option>
                  <option value="Shreya">Shreya</option>
                  <option value="Vamsi">Vamsi</option>
                  <option value="Rahul">Rahul</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Winner
                </label>
                <select
                  value={scoreForm.winner}
                  onChange={(e) => setScoreForm(prev => ({ ...prev, winner: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Auto-determine from score</option>
                  {match.team1_id && match.team2_id ? (
                    // Team match options
                    <>
                      <option value="team1">{getTeamName(match.team1_id)}</option>
                      <option value="team2">{getTeamName(match.team2_id)}</option>
                    </>
                  ) : match.player1_id && match.player2_id ? (
                    // Player match options
                    <>
                      <option value="player1">{getPlayerName(match.player1_id)}</option>
                      <option value="player2">{getPlayerName(match.player2_id)}</option>
                    </>
                  ) : null}
                  <option value="draw">Draw</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Status
                </label>
                <select
                  value={scoreForm.status}
                  onChange={(e) => setScoreForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Notes
              </label>
              <textarea
                value={scoreForm.match_notes}
                onChange={(e) => setScoreForm(prev => ({ ...prev, match_notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes about the match..."
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleUpdateScore}
                disabled={updatingScore}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {updatingScore ? 'Updating...' : 'Update Score'}
              </button>
            </div>
          </div>

          {/* Upload Media Form - Always Shown */}
          <div className="bg-white rounded-xl p-6 mb-8 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Media</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-lg text-gray-600 mb-2">Select files to upload</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Browse Files
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPG, PNG, GIF, MP4, MOV (Max 50MB per file)
              </p>
            </div>
            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Selected Files</h3>
                <div className="space-y-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {file.type.startsWith('image/') ? '📷' : '🎥'}
                        </span>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={descriptions[index] || ''}
                          onChange={(e) => setDescriptions(prev => ({ ...prev, [index]: e.target.value }))}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </button>
              </div>
            )}
          </div>
          {/* Live Score Button - always show for both team and player matches */}
          <div className="mt-4 flex gap-4">
            <Link
              href={`/admin/matches/${match.id}/livescore`}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Live Score
            </Link>
          </div>
        </div>

        {/* Match History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Match History</h2>
            <div className="space-y-4">
              {history.map((game) => (
                <div key={game.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Game {game.game_number}</h3>
                    <span className="text-lg font-bold text-gray-800">
                      {game.team1_score} - {game.team2_score}
                    </span>
                  </div>
                  {game.winner && game.winner !== 'draw' && (
                    <p className="text-green-600 text-sm mt-1">
                      Winner: {match.team1_id ? getTeamName(match[`${game.winner}_id`]) : getPlayerName(match[`${game.winner}_id`])}
                    </p>
                  )}
                  {game.game_notes && (
                    <p className="text-gray-600 text-sm mt-2">{game.game_notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Highlights */}
        {highlights.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Match Highlights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500">⭐</span>
                    <h3 className="font-semibold text-gray-800">{highlight.highlight_type}</h3>
                  </div>
                  {highlight.description && (
                    <p className="text-gray-600 text-sm">{highlight.description}</p>
                  )}
                  {highlight.media && (
                    <div className="mt-3">
                      {highlight.media.media_type === 'photo' ? (
                        <Image
                          src={highlight.media.file_url}
                          alt={highlight.media.description || highlight.media.file_name}
                          width={600}
                          height={300}
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <video
                          src={highlight.media.file_url}
                          controls
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Gallery */}
        {media.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Match Media ({media.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {item.media_type === 'photo' ? (
                    <Image
                      src={item.file_url}
                      alt={item.description || item.file_name}
                      width={600}
                      height={300}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => setSelectedMedia(item)}
                    />
                  ) : (
                    <video
                      src={item.file_url}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => setSelectedMedia(item)}
                    />
                  )}
                  <div className="p-3">
                    {item.description && (
                      <p className="font-medium text-sm">{item.description}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Uploaded on {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Modal */}
        {selectedMedia && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{selectedMedia.description || selectedMedia.file_name}</h3>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                {selectedMedia.media_type === 'photo' ? (
                  <Image
                    src={selectedMedia.file_url}
                    alt={selectedMedia.description || selectedMedia.file_name}
                    width={600}
                    height={300}
                    className="w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.file_url}
                    controls
                    className="w-full max-h-[70vh]"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
} 