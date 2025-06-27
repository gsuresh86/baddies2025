'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { Pool, Team, Match, TournamentStandings, Player } from '@/types';
import StandingsTab from '../pool/[id]/StandingsTab';
import { categoryLabels } from '@/lib/utils';

function calculateStandings(teams: Team[], players: Player[], matches: Match[]): TournamentStandings[] {
  const standings: { [id: string]: TournamentStandings } = {};
  
  // Initialize standings for teams
  teams.forEach(team => {
    standings[team.id] = {
      teamId: team.id,
      teamName: team.name,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    };
  });

  // Initialize standings for players (for player-based categories)
  players.forEach(player => {
    // For pair-based categories, include partner name in the display
    const displayName = player.partner_name ? `${player.name} / ${player.partner_name}` : player.name;
    
    standings[player.id] = {
      teamId: player.id,
      teamName: displayName,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    };
  });

  matches.forEach(match => {
    if (match.status !== 'completed') return;
    
    // Handle team-based matches
    if (match.team1_id && match.team2_id) {
      const team1 = standings[match.team1_id];
      const team2 = standings[match.team2_id];
      if (!team1 || !team2) return;
      
      team1.matchesPlayed++;
      team2.matchesPlayed++;
      
      if ((match.team1_score ?? 0) > (match.team2_score ?? 0)) {
        team1.matchesWon++;
        team2.matchesLost++;
      } else if ((match.team2_score ?? 0) > (match.team1_score ?? 0)) {
        team2.matchesWon++;
        team1.matchesLost++;
      }
      
      // Count games
      team1.gamesWon += match.team1_score || 0;
      team1.gamesLost += match.team2_score || 0;
      team2.gamesWon += match.team2_score || 0;
      team2.gamesLost += match.team1_score || 0;
    }
    
    // Handle player-based matches (for categories like Boys U13)
    if ((match as any).player1_id && (match as any).player2_id) {
      const player1 = standings[(match as any).player1_id];
      const player2 = standings[(match as any).player2_id];
      if (!player1 || !player2) return;
      
      player1.matchesPlayed++;
      player2.matchesPlayed++;
      
      if ((match.team1_score ?? 0) > (match.team2_score ?? 0)) {
        player1.matchesWon++;
        player2.matchesLost++;
      } else if ((match.team2_score ?? 0) > (match.team1_score ?? 0)) {
        player2.matchesWon++;
        player1.matchesLost++;
      }
      
      // Count games
      player1.gamesWon += match.team1_score || 0;
      player1.gamesLost += match.team2_score || 0;
      player2.gamesWon += match.team2_score || 0;
      player2.gamesLost += match.team1_score || 0;
    }
  });
  
  // Calculate points
  Object.values(standings).forEach(standing => {
    standing.points = (standing.matchesWon * 2);
  });
  
  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
    // Game win percentage as tiebreaker
    const aGames = a.gamesWon + a.gamesLost;
    const bGames = b.gamesWon + b.gamesLost;
    const aPct = aGames > 0 ? a.gamesWon / aGames : 0;
    const bPct = bGames > 0 ? b.gamesWon / bGames : 0;
    if (bPct !== aPct) return bPct - aPct;
    return b.gamesWon - a.gamesWon;
  });
}

export default function StandingsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [teamsByPool, setTeamsByPool] = useState<{ [poolId: string]: Team[] }>({});
  const [playersByPool, setPlayersByPool] = useState<{ [poolId: string]: Player[] }>({});
  const [matchesByPool, setMatchesByPool] = useState<{ [poolId: string]: Match[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      // Fetch all pools with categories
      const { data: poolData } = await supabase.from('pools').select('*, category:categories(*)');
      if (!poolData) return setLoading(false);
      setPools(poolData as Pool[]);
      
      // Fetch all teams
      const { data: teamData } = await supabase.from('teams').select('*');
      
      // Fetch all matches
      const { data: matchData } = await supabase.from('matches').select('*');
      
      // Group teams and matches by pool
      const teamsByPool: { [poolId: string]: Team[] } = {};
      const playersByPool: { [poolId: string]: Player[] } = {};
      const matchesByPool: { [poolId: string]: Match[] } = {};
      
      (poolData as Pool[]).forEach(pool => {
        teamsByPool[pool.id] = (teamData || []).filter((t: Team) => t.pool_id === pool.id);
        matchesByPool[pool.id] = (matchData || []).filter((m: Match) => m.pool_id === pool.id);
        playersByPool[pool.id] = [];
      });
      
      // Fetch pool players for player-based categories
      const { data: poolPlayersData } = await supabase
        .from('pool_players')
        .select('*, player:t_players(*)')
        .in('pool_id', (poolData as Pool[]).map(p => p.id));
      
      if (poolPlayersData) {
        poolPlayersData.forEach((pp: any) => {
          if (pp.player && playersByPool[pp.pool_id]) {
            playersByPool[pp.pool_id].push(pp.player);
          }
        });
      }
      
      setTeamsByPool(teamsByPool);
      setPlayersByPool(playersByPool);
      setMatchesByPool(matchesByPool);
      setLoading(false);
    }
    fetchAll();
  }, []);

  // Filter pools by selected category
  const filteredPools = pools.filter(pool => {
    if (selectedCategory === 'all') return true;
    return pool.category?.code === selectedCategory;
  });

  // Group pools by category for standings
  const poolsByCategory: { [categoryCode: string]: Pool[] } = {};
  filteredPools.forEach(pool => {
    const categoryCode = pool.category?.code || 'unknown';
    if (!poolsByCategory[categoryCode]) {
      poolsByCategory[categoryCode] = [];
    }
    poolsByCategory[categoryCode].push(pool);
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-white text-xl font-semibold">Loading tournament standings...</p>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Enhanced Header */}
      <div className="text-center mb-12 animate-slide-in-up">
        <div className="text-5xl mb-4 animate-float">🏆</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white text-glow-white mb-4">
          Tournament Standings
        </h1>
        <p className="text-white/80 text-xl max-w-2xl mx-auto">
          Track the performance and rankings of all teams across different categories
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl mb-8 animate-fade-in-scale">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white text-glow-white mb-2">Category Filter</h2>
            <p className="text-white/80 text-sm">
              {selectedCategory === 'all' 
                ? 'Showing standings for all categories' 
                : `Showing standings for ${categoryLabels[selectedCategory as keyof typeof categoryLabels]?.label || selectedCategory}`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-white/90 text-sm font-medium whitespace-nowrap">Select Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
            >
              <option value="all" className="text-gray-800">All Categories</option>
              <option value="MT" className="text-gray-800">Men&apos;s Team</option>
              <option value="WS" className="text-gray-800">Women&apos;s Singles</option>
              <option value="WD" className="text-gray-800">Women&apos;s Doubles</option>
              <option value="XD" className="text-gray-800">Mixed Doubles</option>
              <option value="BU18" className="text-gray-800">Boys U18</option>
              <option value="BU13" className="text-gray-800">Boys U13</option>
              <option value="GU18" className="text-gray-800">Girls U18</option>
              <option value="GU13" className="text-gray-800">Girls U13</option>
              <option value="FM" className="text-gray-800">Family Mixed</option>
            </select>
          </div>
        </div>
      </div>

      {filteredPools.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-white text-lg">
              {selectedCategory === 'all' 
                ? 'No pools found. Tournament standings will appear here once pools are created.' 
                : `No pools found for ${categoryLabels[selectedCategory as keyof typeof categoryLabels]?.label || selectedCategory}.`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(poolsByCategory).map(([categoryCode, categoryPools], categoryIndex) => {
            const categoryLabel = categoryLabels[categoryCode as keyof typeof categoryLabels]?.label || categoryCode;
            const categoryIcon = categoryCode === 'MT' ? '👥' : 
                               categoryCode === 'WS' ? '🏸' : 
                               categoryCode === 'WD' ? '👯‍♀️' : 
                               categoryCode === 'XD' ? '💑' : 
                               categoryCode.startsWith('B') ? '👦' : 
                               categoryCode.startsWith('G') ? '👧' : 
                               categoryCode === 'FM' ? '👨‍👩‍👧‍👦' : '🏆';
            
            return (
              <div key={categoryCode} className="animate-fade-in-scale" style={{animationDelay: `${categoryIndex * 0.1}s`}}>
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl hover-lift">
                  <div className="flex items-center mb-6">
                    <div className="text-3xl mr-4">{categoryIcon}</div>
                    <h2 className="text-2xl font-bold text-white text-glow-white">{categoryLabel}</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {categoryPools.map((pool) => {
                      const isPlayerBased = pool.category?.type === 'player' || pool.category?.type === 'pair';
                      const participantCount = isPlayerBased 
                        ? playersByPool[pool.id]?.length || 0
                        : teamsByPool[pool.id]?.length || 0;
                      const participantLabel = isPlayerBased ? (pool.category?.type === 'pair' ? 'pairs' : 'players') : 'teams';
                      
                      return (
                        <div key={pool.id}>
                          {/* Mobile: Scrollable card */}
                          <div className="sm:hidden mb-8">
                            <div className="bg-white/5 rounded-2xl p-2 backdrop-blur-sm border border-white/10 shadow-2xl hover-lift">
                              <div className="flex items-center mb-2">
                                <h3 className="text-lg font-semibold text-white/90 mr-3">{pool.name}</h3>
                                <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                  {participantCount} {participantLabel}
                                </span>
                              </div>
                              <div className="overflow-x-auto w-full">
                                <StandingsTab 
                                  standings={calculateStandings(
                                    teamsByPool[pool.id] || [], 
                                    playersByPool[pool.id] || [], 
                                    matchesByPool[pool.id] || []
                                  )} 
                                />
                              </div>
                            </div>
                          </div>
                          {/* Desktop: Card as before */}
                          <div className="hidden sm:block mb-8">
                            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                              <div className="flex items-center mb-4">
                                <h3 className="text-lg font-semibold text-white/90">{pool.name}</h3>
                                <span className="ml-3 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                  {participantCount} {participantLabel}
                                </span>
                              </div>
                              <StandingsTab 
                                standings={calculateStandings(
                                  teamsByPool[pool.id] || [], 
                                  playersByPool[pool.id] || [], 
                                  matchesByPool[pool.id] || []
                                )} 
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tournament Stats Summary */}
      <div className="mt-12 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 animate-fade-in-scale" style={{animationDelay: '0.5s'}}>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white text-glow-white mb-2">📈 Tournament Overview</h3>
          <p className="text-white/80">
            {selectedCategory === 'all' ? 'Complete standings across all divisions' : `Standings for ${categoryLabels[selectedCategory as keyof typeof categoryLabels]?.label || selectedCategory}`}
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-200/30">
            <div className="text-3xl font-bold text-blue-300 mb-2">{filteredPools.length}</div>
            <div className="text-white/80 text-sm">Active Pools</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-200/30">
            <div className="text-3xl font-bold text-green-300 mb-2">
              {Object.values(teamsByPool).reduce((acc, teams) => acc + teams.length, 0) + 
               Object.values(playersByPool).reduce((acc, players) => acc + players.length, 0)}
            </div>
            <div className="text-white/80 text-sm">Total Participants</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-200/30">
            <div className="text-3xl font-bold text-purple-300 mb-2">
              {Object.values(matchesByPool).reduce((acc, matches) => acc + matches.length, 0)}
            </div>
            <div className="text-white/80 text-sm">Total Matches</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-200/30">
            <div className="text-3xl font-bold text-yellow-300 mb-2">
              {Object.values(matchesByPool).reduce((acc, matches) => acc + matches.filter(m => m.status === 'completed').length, 0)}
            </div>
            <div className="text-white/80 text-sm">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
} 