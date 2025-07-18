'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/store';
import { Match, Game as GameBase } from '@/types';
import { useData } from '@/contexts/DataContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { RealtimeChannel } from '@supabase/supabase-js';

// GameCard component for displaying a single game's live score
function GameCard({ game, getPlayerName, scores, showCongrats1, showCongrats2, sidesSwitched }: any) {
  if (!game) return null;

  // Helper to get the correct player names based on sidesSwitched
  const getCardName = (side: 'team1' | 'team2') => {
    if (game.type === 'singles') {
      if (side === 'team1') {
        return getPlayerName(game['player1_id'] || game['player1Id']);
      } else {
        return getPlayerName(game['player3_id'] || game['player3Id'] || game['player2_id'] || game['player2Id']);
      }
    } else {
      if (side === 'team1') {
        return `${getPlayerName(game['player1_id'] || game['player1Id'])} & ${getPlayerName(game['player2_id'] || game['player2Id'])}`;
      } else {
        return `${getPlayerName(game['player3_id'] || game['player3Id'])} & ${getPlayerName(game['player4_id'] || game['player4Id'])}`;
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between h-auto md:h-[60vh] gap-4">
      {/* PCBT Logo on Left - Inside layout (hide on mobile) */}
      <div className="hidden md:flex flex-shrink-0 items-center h-full">
        <Image src="/pcbt.png" alt="PCBT" width={200} height={100} className="object-contain w-[120px] h-[60px] md:w-[200px] md:h-[100px]" />
      </div>
      {/* Score Cards Grid */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8 flex-1 w-full">
        {/* Team 1/Player 1 Score */}
        <div className="text-center flex flex-col justify-center">
          <div className="bg-blue-500 rounded-3xl p-4 md:p-8 shadow-2xl hover-lift h-full flex flex-col justify-center relative">
            {showCongrats1 && (
              <div className="mb-2 flex flex-col items-center">
                <span className="block text-2xl md:text-4xl font-bold text-yellow-300 drop-shadow-lg animate-bounce">Congratulations!</span>
              </div>
            )}
            {showCongrats2 && (
              <div className="mb-2 flex flex-col items-center">
                <span className="block text-2xl md:text-4xl font-semibold text-white/80 animate-fade-in">Good effort!</span>
              </div>
            )}
            <div className="text-2xl md:text-4xl font-bold text-blue-100 mb-2 md:mb-4">
              {sidesSwitched ? getCardName('team2') : getCardName('team1')}
            </div>
            {showCongrats1 && (
              <span className="absolute left-1/2 top-24 md:top-40 -translate-x-1/2 z-10 text-5xl md:text-8xl animate-bounce pointer-events-none select-none">🏆</span>
            )}
            <div className="text-[7rem] md:text-[20rem] font-bold text-white mb-2 animate-scale-in">
              {scores.team1_score}
            </div>
          </div>
        </div>
        {/* Team 2/Player 2 Score */}
        <div className="text-center flex flex-col justify-center">
          <div className="bg-green-500 rounded-3xl p-4 md:p-8 shadow-2xl hover-lift h-full flex flex-col justify-center relative">
            {showCongrats2 && (
              <div className="mb-2 flex flex-col items-center">
                <span className="block text-2xl md:text-4xl font-bold text-yellow-300 drop-shadow-lg animate-bounce">Congratulations!</span>
              </div>
            )}
            {showCongrats1 && (
              <div className="mb-2 flex flex-col items-center">
                <span className="block text-2xl md:text-4xl font-semibold text-white/80 animate-fade-in">Good effort!</span>
              </div>
            )}
            <div className="text-2xl md:text-4xl font-bold text-green-100 mb-2 md:mb-4">
              {sidesSwitched ? getCardName('team1') : getCardName('team2')}
            </div>
            {showCongrats2 && (
              <span className="absolute left-1/2 top-24 md:top-40 -translate-x-1/2 z-10 text-5xl md:text-8xl animate-bounce pointer-events-none select-none">🏆</span>
            )}
            <div className="text-[7rem] md:text-[20rem] font-bold text-white mb-2 animate-scale-in">
              {scores.team2_score}
            </div>
          </div>
        </div>
      </div>
      {/* PCBT Logo on Right - Inside layout (hide on mobile) */}
      <div className="hidden md:flex flex-shrink-0 items-center h-full">
        <Image src="/pcbt.png" alt="PCBT" width={200} height={100} className="object-contain w-[120px] h-[60px] md:w-[200px] md:h-[100px]" />
      </div>
    </div>
  );
}

export default function PublicLiveScorePage() {
  const { matches: cachedMatches, teams, players, pools, categories } = useData();
  const params = useParams();
  const matchId = params?.id as string;
  const searchParams = useSearchParams();
  const gameIdParam = searchParams.get('game');

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({
    team1_score: 0,
    team2_score: 0
  });
  const [sidesSwitched, setSidesSwitched] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [games, setGames] = useState<GameBase[]>([]);
  const [, setGamesLoading] = useState(true);
  // Celebration audio logic hooks (must be before any return)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Move helper functions above showCongrats logic
  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'Unknown Team';
    const team = teams.find(t => t.id === teamId);
    return team?.brand_name || team?.name || 'Unknown Team';
  };

  const getPlayerName = (playerId?: string) => {
    if (!playerId) return 'Unknown Player';
    const player = players.find(p => p.id === playerId);
    if (!player) return 'Unknown Player';
    
    // For pair categories, include partner name
    if (player.partner_name) {
      return `${player.name} / ${player.partner_name}`;
    }
    
    return player.name || 'Unknown Player';
  };

  // These must be above the useEffect that uses them
  const showCongrats1 = scores.team1_score === 30;
  const showCongrats2 = scores.team2_score === 30;
  const showCongrats = showCongrats1 || showCongrats2;
  
  // Find the game by ?game=GAME_ID if present, else in_progress, else first
  let currentGame = undefined;
  if (gameIdParam) {
    currentGame = games.find(g => g.id === gameIdParam);
  }
  if (!currentGame) {
    currentGame = games.find(g => (g as any)['status'] === 'in_progress') || games[0];
  }

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
              .select('*, pool:pools(*, category:categories(*))')
              .eq('id', matchId)
              .single();
            
            if (error || !dbMatch) {
              console.error('Match not found in database:', error);
              return;
            }
            matchData = dbMatch;
          } catch (error) {
            console.error('Error fetching match from database:', error);
            return;
          }
        }
        
        // Enrich match data with pool and category information
        if (matchData) {
          const pool = pools.find(p => p.id === matchData.pool_id);
          if (pool) {
            matchData.pool = pool;
            const category = categories.find(c => c.id === pool.category_id);
            if (category) {
              matchData.pool.category = category;
            }
          }
        }
        
        if (matchData) {
          setMatch(matchData);
          setScores({
            team1_score: matchData.team1_score || 0,
            team2_score: matchData.team2_score || 0
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [matchId, cachedMatches, pools, categories]);

  // WebSocket listener for live score updates
  useEffect(() => {
    if (!matchId) return;

    const channelRef = { current: null as RealtimeChannel | null };
    const timeout = setTimeout(() => {
      const channelName = `live-score-${matchId}`;
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      channel
        .on(
          'broadcast',
          { event: 'score-update' },
          (payload) => {
            console.log('📨 Public: Received broadcast:', payload);
            try {
              const { scores: newScores, sidesSwitched: newSidesSwitched } = payload.payload;
              setScores(newScores);
              setSidesSwitched(newSidesSwitched);
              console.log('✅ Public: Scores updated from broadcast:', newScores);
            } catch (error) {
              console.error('❌ Public: Error processing broadcast:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📊 Public: Channel status changed to: ${status}`);
          setConnectionStatus(status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Public: Successfully connected to WebSocket!');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Public: Channel connection error');
          } else if (status === 'TIMED_OUT') {
            console.warn('⏰ Public: Channel subscription timed out');
          } else if (status === 'CLOSED') {
            console.log('🔒 Public: Channel closed');
          }
        });
    }, 1500);

    return () => {
      console.log('🧹 Public: Cleaning up WebSocket connection');
      clearTimeout(timeout);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [matchId]);

  // Fetch games for the match
  useEffect(() => {
    if (!matchId) return;
    setGamesLoading(true);
    supabase
      .from('games')
      .select('*')
      .eq('match_id', matchId)
      .then(({ data, error }) => {
        if (!error && data) setGames(data);
        setGamesLoading(false);
      });
  }, [matchId]);

  // Subscribe to game live score updates
  

  useEffect(() => {
    if (showCongrats && !hasPlayed) {
      audioRef.current?.play();
      setHasPlayed(true);
    } else if (!showCongrats && hasPlayed) {
      setHasPlayed(false);
    }
  }, [showCongrats, hasPlayed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Match Not Found</h2>
          <Link 
            href="/matches"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  // Determine if this is a men's team category match
  const matchPool = pools.find(p => p.id === match?.pool_id);
  const categoryCode = matchPool ? categories.find(c => c.id === matchPool.category_id)?.code : undefined;
  const isMensTeamCategory = categoryCode === 'MT';

  return (
    <div className="min-h-screen bg-black relative">
      {/* Celebration audio */}
      <audio ref={audioRef} src="/clap.wav" preload="auto" />
      {/* Header */}
      <div className="bg-black shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/fixtures"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Fixtures
              </Link>
              <div className="h-6 w-px bg-gray-700"></div>
              <h1 className="text-xl font-semibold text-white">Live Score</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'SUBSCRIBED' ? 'bg-green-500' : 
                connectionStatus === 'CHANNEL_ERROR' ? 'bg-red-500' : 
                'bg-yellow-500'
              }`}></div>
              <span className="text-xs text-gray-400">
                {connectionStatus === 'SUBSCRIBED' ? 'Live' : 
                 connectionStatus === 'CHANNEL_ERROR' ? 'Error' : 
                 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Sponsor Logos - Animated Marquee */}
        <div className="relative w-full overflow-x-hidden mb-4">
          <div className="flex items-center animate-marquee whitespace-nowrap gap-12 py-2">
            {/* First set of logos */}
            <Image src="/baddies.png" alt="Baddies" width={120} height={60} className="object-contain w-[70px] h-[35px] md:w-[200px] md:h-[100px]" />
            <Image src="/planet-green-logo.png" alt="Planet Green" width={156} height={78} className="object-contain w-[90px] h-[45px] md:w-[260px] md:h-[130px]" />
            <Image src="/gamepoint-logo.png" alt="Gamepoint" width={156} height={78} className="object-contain w-[90px] h-[45px] md:w-[260px] md:h-[130px]" />
            <Image src="/trice-logo.png" alt="Trice" width={108} height={54} className="object-contain w-[60px] h-[30px] md:w-[180px] md:h-[90px]" />
            <Image src="/creekside-logo.png" alt="Creekside" width={156} height={78} className="object-contain w-[90px] h-[45px] md:w-[260px] md:h-[130px]" />
            {/* Repeat logos for seamless loop */}
            <Image src="/baddies.png" alt="Baddies" width={120} height={60} className="object-contain w-[70px] h-[35px] md:w-[200px] md:h-[100px]" />
            <Image src="/planet-green-logo.png" alt="Planet Green" width={156} height={78} className="object-contain w-[90px] h-[45px] md:w-[260px] md:h-[130px]" />
            <Image src="/gamepoint-logo.png" alt="Gamepoint" width={156} height={78} className="object-contain w-[90px] h-[45px] md:w-[260px] md:h-[130px]" />
            <Image src="/trice-logo.png" alt="Trice" width={108} height={54} className="object-contain w-[60px] h-[30px] md:w-[180px] md:h-[90px]" />
            <Image src="/creekside-logo.png" alt="Creekside" width={156} height={78} className="object-contain w-[90px] h-[45px] md:w-[260px] md:h-[130px]" />
          </div>
        </div>

        {/* Score Card */}
        {isMensTeamCategory ? (
          <GameCard
            game={currentGame}
            getPlayerName={getPlayerName}
            getTeamName={getTeamName}
            scores={scores}
            showCongrats1={showCongrats1}
            showCongrats2={showCongrats2}
            sidesSwitched={sidesSwitched}
          />
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between h-auto md:h-[60vh] gap-4">
            <div className="hidden md:flex flex-shrink-0 items-center h-full">
              <Image src="/pcbt.png" alt="PCBT" width={200} height={100} className="object-contain w-[120px] h-[60px] md:w-[200px] md:h-[100px]" />
            </div>
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8 flex-1 w-full">
              {/* Team 1 */}
              <div className="text-center flex flex-col justify-center">
                <div className="bg-blue-500 rounded-3xl p-4 md:p-8 shadow-2xl hover-lift h-full flex flex-col justify-center relative">
                  <div className="text-2xl md:text-4xl font-bold text-blue-100 mb-2 md:mb-4">
                    {sidesSwitched
                      ? (match?.player2_id ? getPlayerName(match.player2_id) : getTeamName(match?.team2_id))
                      : (match?.player1_id ? getPlayerName(match.player1_id) : getTeamName(match?.team1_id))}
                  </div>
                  <div className="text-[7rem] md:text-[20rem] font-bold text-white mb-2 animate-scale-in">
                    {scores.team1_score ?? 0}
                  </div>
                </div>
              </div>
              {/* Team 2 */}
              <div className="text-center flex flex-col justify-center">
                <div className="bg-green-500 rounded-3xl p-4 md:p-8 shadow-2xl hover-lift h-full flex flex-col justify-center relative">
                  <div className="text-2xl md:text-4xl font-bold text-green-100 mb-2 md:mb-4">
                    {sidesSwitched
                      ? (match?.player1_id ? getPlayerName(match.player1_id) : getTeamName(match?.team1_id))
                      : (match?.player2_id ? getPlayerName(match.player2_id) : getTeamName(match?.team2_id))}
                  </div>
                  <div className="text-[7rem] md:text-[20rem] font-bold text-white mb-2 animate-scale-in">
                    {scores.team2_score ?? 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex flex-shrink-0 items-center h-full">
              <Image src="/pcbt.png" alt="PCBT" width={200} height={100} className="object-contain w-[120px] h-[60px] md:w-[200px] md:h-[100px]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}