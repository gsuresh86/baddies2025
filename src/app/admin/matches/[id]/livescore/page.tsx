'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/store';
import { Match, Game as GameBase } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { ArrowLeft, Plus, Minus, RotateCcw } from 'lucide-react';
import Image from 'next/image';

export default function LiveScorePage() {
  const { showSuccess, showError } = useToast();
  const { matches: cachedMatches, teams, players, pools, categories } = useData();
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({
    team1_score: 0,
    team2_score: 0
  });
  const [sidesSwitched, setSidesSwitched] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<any>(null);
  const [games, setGames] = useState<GameBase[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return;
      setLoading(true);
      try {
        const matchData = cachedMatches.find(m => m.id === matchId);
        if (!matchData) {
          return;
        }
        setMatch(matchData);
        setScores({
          team1_score: matchData.team1_score || 0,
          team2_score: matchData.team2_score || 0
        });
        // Resolve pool and category code from cache
        const matchPool = pools.find(p => p.id === matchData.pool_id);
        const categoryCode = matchPool ? categories.find(c => c.id === matchPool.category_id)?.code : undefined;
        // If men's team category, fetch games for the match
        if (categoryCode === 'MT') {
          const { data: gamesData } = await supabase
            .from('games')
            .select('*')
            .eq('match_id', matchId);
          setGames(gamesData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showError('Error loading match data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [matchId, cachedMatches, pools, categories, showError]);

  // WebSocket broadcast channel setup with detailed debugging
  useEffect(() => {
    if (!matchId) return;

    console.log('🚀 Admin: Initializing WebSocket for match:', matchId);
    
    // Wait a bit for the page to fully load
    const timeout = setTimeout(() => {
      console.log('⏰ Admin: Starting WebSocket connection after delay');
      
      const channelName = `live-score-${matchId}`;
      console.log('📡 Admin: Creating channel:', channelName);
      
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: true }
        }
      });

      console.log('🔧 Admin: Channel created, subscribing...');
      
      channel.subscribe((status) => {
        console.log(`📊 Admin: Channel status changed to: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Admin: Successfully connected to WebSocket!');
          setBroadcastChannel(channel);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Admin: Channel connection error');
          console.error('🔍 Channel state:', channel);
        } else if (status === 'TIMED_OUT') {
          console.warn('⏰ Admin: Channel subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('🔒 Admin: Channel closed');
        }
      });
    }, 1000);

    return () => {
      console.log('🧹 Admin: Cleaning up WebSocket connection');
      clearTimeout(timeout);
      if (broadcastChannel) {
        supabase.removeChannel(broadcastChannel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);


  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'Unknown Team';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const getPlayerName = (playerId?: string) => {
    if (!playerId) return 'Unknown Player';
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown Player';
  };

  const handleScoreChange = (team: 'team1' | 'team2', action: 'increase' | 'decrease') => {
    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    const newScores = {
      ...scores,
      [`${team}_score`]: Math.max(0, scores[`${team}_score`] + (action === 'increase' ? 1 : -1))
    };
    
    // Update local state immediately
    setScores(newScores);
    
    // Broadcast the score update via WebSocket
    if (broadcastChannel) {
      console.log('📤 Admin: Broadcasting score update:', newScores);
      broadcastChannel.send({
        type: 'broadcast',
        event: 'score-update',
        payload: {
          scores: newScores,
          sidesSwitched,
          matchId,
          timestamp: new Date().toISOString()
        }
      });
      console.log('✅ Admin: Score broadcast sent');
    } else {
      console.warn('⚠️ Admin: No broadcast channel available');
    }
    // Refetch games after score change for men's team category
    // refetchGames();
  };

  const handleResetScores = () => {
    if (confirm('Are you sure you want to reset the scores to 0?')) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 10, 20]);
      }
      
      const newScores = {
        team1_score: 0,
        team2_score: 0
      };
      setScores(newScores);
      
      // Broadcast the reset
      if (broadcastChannel) {
        console.log('📤 Admin: Broadcasting score reset');
        broadcastChannel.send({
          type: 'broadcast',
          event: 'score-update',
          payload: {
            scores: newScores,
            sidesSwitched,
            matchId,
            timestamp: new Date().toISOString()
          }
        });
        console.log('✅ Admin: Reset broadcast sent');
      }
      
      showSuccess('Scores reset successfully!');
    }
  };

  // Add a handler to swap the scores
  const handleSwitchSides = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
    
    const newScores = {
      team1_score: scores.team2_score,
      team2_score: scores.team1_score
    };
    const newSidesSwitched = !sidesSwitched;
    
    // Update local state
    setScores(newScores);
    setSidesSwitched(newSidesSwitched);
    
    // Broadcast the switch
    if (broadcastChannel) {
      console.log('📤 Admin: Broadcasting side switch');
      broadcastChannel.send({
        type: 'broadcast',
        event: 'score-update',
        payload: {
          scores: newScores,
          sidesSwitched: newSidesSwitched,
          matchId,
          timestamp: new Date().toISOString()
        }
      });
      console.log('✅ Admin: Side switch broadcast sent');
    }
    
    showSuccess('Scores switched successfully!');
  };

  // Determine if this is a men's team category match
  const matchPool = pools.find(p => p.id === match?.pool_id);
  const categoryCode = matchPool ? categories.find(c => c.id === matchPool.category_id)?.code : undefined;
  const isMensTeamCategory = categoryCode === 'MT';

  // For men's team category, use the in-progress game (or first game) for player names
  let currentGame: GameBase | undefined = undefined;
  if (isMensTeamCategory) {
    currentGame = games.find(g => (g as any)['status'] === 'in_progress') || games[0];
  }

  // Only show main content once player name data is resolved
  const playerNameDataReady = isMensTeamCategory ? !!currentGame : !!match;

  // Define getCardName at the top level of the component, outside of any event handler
  const getCardName = (side: 'team1' | 'team2') => {
    if (isMensTeamCategory && currentGame) {
      if (currentGame.type === 'singles') {
        if (side === 'team1') {
          const p1 = (currentGame as any)['player1_id'] || (currentGame as any)['player1Id'];
          return getPlayerName(p1);
        } else {
          const p2 = (currentGame as any)['player3_id'] || (currentGame as any)['player3Id'] || (currentGame as any)['player2_id'] || (currentGame as any)['player2Id'];
          return getPlayerName(p2);
        }
      } else {
        if (side === 'team1') {
          const p1 = (currentGame as any)['player1_id'] || (currentGame as any)['player1Id'];
          const p2 = (currentGame as any)['player2_id'] || (currentGame as any)['player2Id'];
          return `${getPlayerName(p1)} & ${getPlayerName(p2)}`;
        } else {
          const p3 = (currentGame as any)['player3_id'] || (currentGame as any)['player3Id'];
          const p4 = (currentGame as any)['player4_id'] || (currentGame as any)['player4Id'];
          return `${getPlayerName(p3)} & ${getPlayerName(p4)}`;
        }
      }
    } else {
      return side === 'team1'
        ? (match?.player1_id ? getPlayerName(match.player1_id) : getTeamName(match?.team1_id))
        : (match?.player2_id ? getPlayerName(match.player2_id) : getTeamName(match?.team2_id));
    }
  };

  if (loading || !playerNameDataReady) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading match data...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="bg-black shadow-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/admin/matches/${matchId}`}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Match
                </Link>
                {isMensTeamCategory && (
                  <Link
                    href={`/admin/matches/${matchId}/manage`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Manage Lineup
                  </Link>
                )}
                <div className="h-6 w-px bg-gray-700"></div>
                <h1 className="text-xl font-semibold text-white">Live Score Management</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Optimized for mobile */}
        <div className="mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4">

          {/* Mobile-optimized Score Cards */}
          <div className="flex flex-col h-auto sm:h-[60vh]">
            {/* PCBT Logo - Hidden on mobile, shown on desktop */}
            <div className="hidden sm:flex justify-center mb-4">
              <Image src="/pcbt.png" alt="PCBT" width={150} height={75} className="object-contain" />
            </div>
            
            {/* Score Cards - Stacked on mobile, side by side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 flex-1">
              {/* Team 1/Player 1 Score */}
              <div className="text-center">
                <div className="bg-blue-500 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl">
                  <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-blue-100 mb-2 sm:mb-4 truncate px-2">
                    {sidesSwitched ? getCardName('team2') : getCardName('team1')}
                  </div>
                  <div className="text-7xl sm:text-8xl lg:text-[12rem] font-bold text-white mb-4 sm:mb-6">
                    {scores.team1_score}
                  </div>
                  <div className="flex justify-center gap-4 sm:gap-6">
                    <button
                      onClick={() => handleScoreChange('team1', 'decrease')}
                      className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full p-4 sm:p-3 transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={scores.team1_score <= 0}
                    >
                      <Minus className="w-8 h-8 sm:w-6 sm:h-6" />
                    </button>
                    <button
                      onClick={() => handleScoreChange('team1', 'increase')}
                      className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full p-4 sm:p-3 transition-all duration-200 transform active:scale-95"
                    >
                      <Plus className="w-8 h-8 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Team 2/Player 2 Score */}
              <div className="text-center">
                <div className="bg-green-500 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl">
                  <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-green-100 mb-2 sm:mb-4 truncate px-2">
                    {sidesSwitched ? getCardName('team1') : getCardName('team2')}
                  </div>
                  <div className="text-7xl sm:text-8xl lg:text-[12rem] font-bold text-white mb-4 sm:mb-6">
                    {scores.team2_score}
                  </div>
                  <div className="flex justify-center gap-4 sm:gap-6">
                    <button
                      onClick={() => handleScoreChange('team2', 'decrease')}
                      className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full p-4 sm:p-3 transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={scores.team2_score <= 0}
                    >
                      <Minus className="w-8 h-8 sm:w-6 sm:h-6" />
                    </button>
                    <button
                      onClick={() => handleScoreChange('team2', 'increase')}
                      className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full p-4 sm:p-3 transition-all duration-200 transform active:scale-95"
                    >
                      <Plus className="w-8 h-8 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-optimized Action Buttons */}
          <div className="mt-4 sm:mt-8 bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 fixed bottom-0 left-0 right-0 sm:relative">
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 sm:justify-center">
              <button
                onClick={handleResetScores}
                className="flex items-center justify-center px-4 sm:px-8 py-3 sm:py-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 active:bg-gray-800 transition-all duration-200 transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Reset</span>
              </button>

              {/* Switch Sides Button */}
              <button
                onClick={handleSwitchSides}
                className={`flex items-center justify-center px-4 sm:px-8 py-3 sm:py-4 text-white rounded-lg font-semibold transition-all duration-200 transform active:scale-95 ${
                  sidesSwitched ? 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800' : 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800'
                }`}
              >
                <span className="text-sm sm:text-base">{sidesSwitched ? 'Switched' : 'Switch'}</span>
              </button>

              <Link
                href={`/admin/matches/${matchId}`}
                className="col-span-2 sm:col-span-1 flex items-center justify-center px-4 sm:px-8 py-3 sm:py-4 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 active:bg-gray-800 transition-all duration-200 transform active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Back</span>
              </Link>
              {isMensTeamCategory && (
                <Link
                  href={`/admin/matches/${matchId}/manage`}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center px-4 sm:px-8 py-3 sm:py-4 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 active:bg-gray-800 transition-all duration-200 transform active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">Manage Lineup</span>
                </Link>
              )}
            </div>
          </div>
          
          {/* Add padding at bottom for mobile to account for fixed buttons */}
          <div className="h-20 sm:h-0"></div>
        </div>
      </div>
    </AuthGuard>
  );
}