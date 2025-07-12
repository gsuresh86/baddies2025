'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/store';
import { Match } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { ArrowLeft, Plus, Minus, RotateCcw } from 'lucide-react';
import Image from 'next/image';

export default function LiveScorePage() {
  const { showSuccess, showError } = useToast();
  const { matches: cachedMatches, teams, players } = useData();
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({
    team1_score: 0,
    team2_score: 0
  });
  const [sidesSwitched, setSidesSwitched] = useState(false);

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
          setScores({
            team1_score: matchData.team1_score || 0,
            team2_score: matchData.team2_score || 0
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showError('Error loading match data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [matchId, cachedMatches, showError]);

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
    setScores(prev => ({
      ...prev,
      [`${team}_score`]: Math.max(0, prev[`${team}_score`] + (action === 'increase' ? 1 : -1))
    }));
  };

  const handleResetScores = () => {
    if (confirm('Are you sure you want to reset the scores to 0?')) {
      setScores({
        team1_score: 0,
        team2_score: 0
      });
    }
  };

  // Add a handler to swap the scores
  const handleSwitchSides = () => {
    console.log('Before switch:', scores);
    setScores(prev => {
      const newScores = {
        team1_score: prev.team2_score,
        team2_score: prev.team1_score
      };
      console.log('After switch:', newScores);
      return newScores;
    });
    setSidesSwitched(prev => !prev);
    showSuccess('Scores switched successfully!');
  };

  if (loading) {
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

  if (!match) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Match Not Found</h2>
            <Link 
              href="/admin/matches"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Matches
            </Link>
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
                <div className="h-6 w-px bg-gray-700"></div>
                <h1 className="text-xl font-semibold text-white">Live Score Management</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Sponsor Logos - Animated Marquee */}
          <div className="relative w-full overflow-x-hidden mb-4">
            <div className="flex items-center animate-marquee whitespace-nowrap gap-12 py-2">
              {/* First set of logos */}
              <Image src="/planet-green-logo.png" alt="Planet Green" width={260} height={130} className="object-contain" />
              <Image src="/gamepoint-logo.png" alt="Gamepoint" width={260} height={130} className="object-contain" />
              <Image src="/trice-logo.png" alt="Trice" width={180} height={90} className="object-contain" />
              <Image src="/creekside-logo.png" alt="Creekside" width={260} height={130} className="object-contain" />
              {/* Repeat logos for seamless loop */}
              <Image src="/planet-green-logo.png" alt="Planet Green" width={260} height={130} className="object-contain" />
              <Image src="/gamepoint-logo.png" alt="Gamepoint" width={260} height={130} className="object-contain" />
              <Image src="/trice-logo.png" alt="Trice" width={180} height={90} className="object-contain" />
              <Image src="/creekside-logo.png" alt="Creekside" width={260} height={130} className="object-contain" />
            </div>
          </div>

          {/* Player Names - REMOVE this section */}
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
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handleScoreChange('team1', 'decrease')}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200 hover-lift"
                      disabled={scores.team1_score <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleScoreChange('team1', 'increase')}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors duration-200 hover-lift"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
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
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handleScoreChange('team2', 'decrease')}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200 hover-lift"
                      disabled={scores.team2_score <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleScoreChange('team2', 'increase')}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors duration-200 hover-lift"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* PCBT Logo on Right - Inside layout */}
            <div className="flex-shrink-0 flex items-center h-full">
              <Image src="/pcbt.png" alt="PCBT" width={200} height={100} className="object-contain" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 bg-gray-900 rounded-xl shadow-lg p-6 animate-fade-in-scale">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleResetScores}
                className="flex items-center justify-center px-8 py-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200 hover-lift"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset Scores
              </button>

              {/* Switch Sides Button */}
              <button
                onClick={handleSwitchSides}
                className={`flex items-center justify-center px-8 py-4 text-white rounded-lg font-semibold transition-colors duration-200 hover-lift ${
                  sidesSwitched ? 'bg-orange-600 hover:bg-orange-700' : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {sidesSwitched ? 'Sides Switched' : 'Switch Sides'}
              </button>

              <Link
                href={`/admin/matches/${matchId}`}
                className="flex items-center justify-center px-8 py-4 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200 hover-lift"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Match
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}