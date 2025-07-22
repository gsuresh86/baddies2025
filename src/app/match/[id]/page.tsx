'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { tournamentStore, supabase } from '@/lib/store';
import { Match, MatchMedia, MatchHistory, MatchHighlight, Game } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import Image from 'next/image';

export default function MatchDetailsPage() {
  const { matches: cachedMatches, teams, pools, players } = useData();
  const { showError } = useToast();
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [media, setMedia] = useState<MatchMedia[]>([]);
  const [history, setHistory] = useState<MatchHistory[]>([]);
  const [highlights, setHighlights] = useState<MatchHighlight[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MatchMedia | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return;
      setLoading(true);
      try {
        // Get match from cached data first, then from database if not found
        let matchData = cachedMatches.find(m => m.id === matchId);
        if (!matchData) {
          const { data: dbMatch, error } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();
          if (error || !dbMatch) {
            showError('Match not found');
            return;
          }
          matchData = dbMatch;
        }
        if (matchData) {
          setMatch(matchData);
        } else {
          setMatch(null);
        }

        // Fetch games for this match
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .eq('match_id', matchId);
        if (gamesError) {
          showError('Error loading games');
        } else {
          setGames(gamesData || []);
        }

        // Fetch media, history, and highlights
        const [mediaData, historyData, highlightsData] = await Promise.all([
          tournamentStore.getMatchMedia(matchId),
          tournamentStore.getMatchHistory(matchId),
          tournamentStore.getMatchHighlights(matchId)
        ]);
        setMedia(mediaData);
        setHistory(historyData);
        setHighlights(highlightsData);
      } catch (e) {
        console.log(e);
        showError('Error loading match');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [matchId, cachedMatches, showError]);

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

  const getGamePlayers = (game: any) => {
    if ((game.type || (game as any).type) === 'singles') {
      return {
        team1: [game.player1_id].filter(Boolean).map(getPlayerName),
        team2: [game.player2_id].filter(Boolean).map(getPlayerName),
      };
    } else {
      return {
        team1: [game.player1_id, game.player2_id].filter(Boolean).map(getPlayerName),
        team2: [game.player3_id, game.player4_id].filter(Boolean).map(getPlayerName),
      };
    }
  };

  // Get category code from pool
  let categoryCode: string | undefined = undefined;
  if (match && match.pool_id) {
    const pool = pools.find(p => p.id === match.pool_id);
    categoryCode = pool?.category?.code;
  }

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
        <Link href="/fixtures" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Fixtures
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/fixtures" className="text-white/80 hover:text-white mb-6 inline-block">
          ← Back to Fixtures
        </Link>

        {/* Match Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/20">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {match.side1_label && match.side2_label ? `${match.side1_label} vs ${match.side2_label}` :
               match.team1_id ? `${getTeamName(match.team1_id)} vs ${getTeamName(match.team2_id)}` : 
               match.player1_id ? `${getPlayerName(match.player1_id)} vs ${getPlayerName(match.player2_id)}` : 
               'Match Details'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/80">
              <span className="text-lg">{getPoolName(match.pool_id)}</span>
              <span>•</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                {getStatusIcon(match.status)} {match.status?.replace('_', ' ').toUpperCase() || 'SCHEDULED'}
              </span>
            </div>
          </div>

          {/* Match Details */}
          <div className="grid md:grid-cols-3 gap-6 text-white/90">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Score</h3>
              <p className="text-2xl font-bold">
                {match.team1_score || 0} - {match.team2_score || 0}
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Referee</h3>
              <p>{match.match_referee || 'N/A'}</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Winner</h3>
              <p className="font-bold text-green-400">
                {match.winner ? 
                  (match.side1_label && match.side2_label ? 
                   (match.winner === 'team1' || match.winner === 'player1' ? match.side1_label : match.side2_label) :
                   match.team1_id ? getTeamName(match[`${match.winner}_id`]) : 
                   getPlayerName(match[`${match.winner}_id`])) : 
                  'TBD'}
              </p>
            </div>
          </div>

          {match.match_notes && (
            <div className="mt-6 p-4 bg-white/5 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Match Notes</h3>
              <p className="text-white/80">{match.match_notes}</p>
            </div>
          )}
        </div>

        {/* Game Details for Men's Team matches */}
        {categoryCode === 'MT' && games.length > 0 && (() => {
          // Calculate games won by each team
          let team1GamesWon = 0;
          let team2GamesWon = 0;
          let team1TotalPoints = 0;
          let team2TotalPoints = 0;
          games.forEach(game => {
            if (game.winner === 'team1') team1GamesWon++;
            if (game.winner === 'team2') team2GamesWon++;
            team1TotalPoints += (game.team1_score ?? game.team1_score ?? 0);
            team2TotalPoints += (game.team2_score ?? game.team2_score ?? 0);
          });
          return (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Game Details</h2>
              {/* Team Score and Winner */}
              <div className="flex items-center justify-center gap-6 mb-6 text-2xl font-bold">
                <span className={
                  team1GamesWon > team2GamesWon ? 'text-green-400' : 'text-white'
                }>
                  {match.side1_label || getTeamName(match.team1_id)}
                  <span className="text-base text-white/70 ml-1">({team1TotalPoints})</span>
                  {team1GamesWon > team2GamesWon && <span title="Winner" className="ml-2">🏆</span>}
                </span>
                <span className="text-white">-</span>
                <span className={
                  team2GamesWon > team1GamesWon ? 'text-green-400' : 'text-white'
                }>
                  {match.side2_label || getTeamName(match.team2_id)}
                  <span className="text-base text-white/70 ml-1">({team2TotalPoints})</span>
                  {team2GamesWon > team1GamesWon && <span title="Winner" className="ml-2">🏆</span>}
                </span>
              </div>
              <div className="space-y-4">
                {games.map((game, idx) => {
                  const winner = game.winner === 'team1' ? getTeamName(match.team1_id) : game.winner === 'team2' ? getTeamName(match.team2_id) : null;
                  return (
                    <div key={game.id || idx} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">Game {idx + 1}</h3>
                        <span className="text-lg font-bold text-white">
                          {((game as any).team1_score ?? game.team1_score ?? 0)} - {((game as any).team2_score ?? game.team2_score ?? 0)}
                        </span>
                      </div>
                      <div className="mt-2 text-white/80 text-sm">
                        {game.type && (
                          <div><span className="font-semibold">Type:</span> {game.type}</div>
                        )}
                        <div className="flex gap-4 mt-1">
                          <div className={game.winner === 'team1' ? 'text-green-400 font-bold' : ''}>
                            <span className="font-semibold">{match.side1_label || getTeamName(match.team1_id)}:</span> {getGamePlayers(game).team1.join(', ') || 'N/A'}
                            {game.winner === 'team1' && <span title="Winner" className="ml-1">🏆</span>}
                          </div>
                          <div className={game.winner === 'team2' ? 'text-green-400 font-bold' : ''}>
                            <span className="font-semibold">{match.side2_label || getTeamName(match.team2_id)}:</span> {getGamePlayers(game).team2.join(', ') || 'N/A'}
                            {game.winner === 'team2' && <span title="Winner" className="ml-1">🏆</span>}
                          </div>
                        </div>
                      </div>
                      {winner && (
                        <p className="text-green-400 text-sm mt-1 font-bold flex items-center">
                          Winner: {winner} <span className="ml-1">🏆</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Match History */}
        {history.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Match History</h2>
            <div className="space-y-4">
              {history.map((game) => (
                <div key={game.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Game {game.game_number}</h3>
                    <span className="text-lg font-bold text-white">
                      {game.team1_score} - {game.team2_score}
                    </span>
                  </div>
                  {/* Show player details for Men's Team matches */}
                  {(() => {
                    // Try to get category code from match, fallback to pool
                    let categoryCode = (match as any).category_code;
                    if (!categoryCode && match.pool_id) {
                      const pool = pools.find(p => p.id === match.pool_id);
                      categoryCode = pool?.category?.code;
                    }
                    if (categoryCode === 'MT') {
                      return (
                        <div className="mt-2 text-white/80 text-sm">
                          {(game as any).type && (
                            <div><span className="font-semibold">Type:</span> {(game as any).type}</div>
                          )}
                          <div className="flex gap-4 mt-1">
                            <div>
                              <span className="font-semibold">{getTeamName(match.team1_id)}:</span> {getGamePlayers(game).team1.join(', ') || 'N/A'}
                            </div>
                            <div>
                              <span className="font-semibold">{getTeamName(match.team2_id)}:</span> {getGamePlayers(game).team2.join(', ') || 'N/A'}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {game.winner && game.winner !== 'draw' && (
                    <p className="text-green-400 text-sm mt-1">
                      Winner: {getTeamName(match[`${game.winner}_id`])}
                    </p>
                  )}
                  {game.game_notes && (
                    <p className="text-white/70 text-sm mt-2">{game.game_notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Highlights */}
        {highlights.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Match Highlights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">⭐</span>
                    <h3 className="font-semibold text-white">{highlight.highlight_type}</h3>
                  </div>
                  {highlight.description && (
                    <p className="text-white/80 text-sm">{highlight.description}</p>
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
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Match Media ({media.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition"
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.media_type === 'photo' ? (
                    <Image
                      src={item.file_url}
                      alt={item.description || item.file_name}
                      width={600}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <video
                      src={item.file_url}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-3">
                    {item.description && (
                      <p className="text-white font-medium text-sm">{item.description}</p>
                    )}
                    <p className="text-white/60 text-xs mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
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
    </div>
  );
} 