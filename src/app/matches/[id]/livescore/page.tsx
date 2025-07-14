'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/store';
import { Match } from '@/types';
import { useData } from '@/contexts/DataContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function PublicLiveScorePage() {
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
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');

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

    console.log('🚀 Public: Initializing WebSocket listener for match:', matchId);
    
    // Wait a bit for the page to fully load
    const timeout = setTimeout(() => {
      console.log('⏰ Public: Starting WebSocket connection after delay');
      
      const channelName = `live-score-${matchId}`;
      console.log('📡 Public: Creating channel:', channelName);
      
      const channel = supabase.channel(channelName);

      console.log('🔧 Public: Channel created, setting up listener...');
      
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
    }, 1500); // Slightly longer delay for public page

    return () => {
      console.log('🧹 Public: Cleaning up WebSocket connection');
      clearTimeout(timeout);
    };
  }, [matchId]);

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'Unknown Team';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
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

  return (
    <div className="min-h-screen bg-black">
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
            <Image src="/baddies.png" alt="Baddies" width={200} height={100} className="object-contain" />
            <Image src="/planet-green-logo.png" alt="Planet Green" width={260} height={130} className="object-contain" />
            <Image src="/gamepoint-logo.png" alt="Gamepoint" width={260} height={130} className="object-contain" />
            <Image src="/trice-logo.png" alt="Trice" width={180} height={90} className="object-contain" />
            <Image src="/creekside-logo.png" alt="Creekside" width={260} height={130} className="object-contain" />
            {/* Repeat logos for seamless loop */}
            <Image src="/baddies.png" alt="Baddies" width={200} height={100} className="object-contain" />
            <Image src="/planet-green-logo.png" alt="Planet Green" width={260} height={130} className="object-contain" />
            <Image src="/gamepoint-logo.png" alt="Gamepoint" width={260} height={130} className="object-contain" />
            <Image src="/trice-logo.png" alt="Trice" width={180} height={90} className="object-contain" />
            <Image src="/creekside-logo.png" alt="Creekside" width={260} height={130} className="object-contain" />
          </div>
        </div>

        {/* Full Screen Score Cards with PCBT logos inside layout */}
        <div className="flex items-center justify-between h-[60vh] gap-4">
          {/* PCBT Logo on Left - Inside layout */}
          <div className="flex-shrink-0 flex items-center h-full">
            <Image src="/pcbt.png" alt="PCBT" width={200} height={100} className="object-contain" />
          </div>
          {/* Score Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 h-full">
            {/* Team 1/Player 1 Score */}
            <div className="text-center flex flex-col justify-center">
              <div className="bg-blue-500 rounded-3xl p-8 shadow-2xl hover-lift h-full flex flex-col justify-center">
                <div className="text-4xl font-bold text-blue-100 mb-4">
                  {sidesSwitched 
                    ? (match.player2_id ? getPlayerName(match.player2_id) : getTeamName(match.team2_id))
                    : (match.player1_id ? getPlayerName(match.player1_id) : getTeamName(match.team1_id))
                  }
                </div>
                <div className="text-[20rem] font-bold text-white mb-2 animate-scale-in">
                  {scores.team1_score}
                </div>
              </div>
            </div>
            {/* Team 2/Player 2 Score */}
            <div className="text-center flex flex-col justify-center">
              <div className="bg-green-500 rounded-3xl p-8 shadow-2xl hover-lift h-full flex flex-col justify-center">
                <div className="text-4xl font-bold text-green-100 mb-4">
                  {sidesSwitched 
                    ? (match.player1_id ? getPlayerName(match.player1_id) : getTeamName(match.team1_id))
                    : (match.player2_id ? getPlayerName(match.player2_id) : getTeamName(match.team2_id))
                  }
                </div>
                <div className="text-[20rem] font-bold text-white mb-2 animate-scale-in">
                  {scores.team2_score}
                </div>
              </div>
            </div>
          </div>
          {/* PCBT Logo on Right - Inside layout */}
          <div className="flex-shrink-0 flex items-center h-full">
            <Image src="/pcbt.png" alt="PCBT" width={200} height={100} className="object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}