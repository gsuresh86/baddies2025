'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { Pool, Team, Match, Player, Game as GameBase } from '@/types';
import StandingsTab from './pool/StandingsTab';
import { categoryLabels } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { useSearchParams } from 'next/navigation';
import { calculateStandings } from '@/lib/standingsUtils';
import { TournamentStandings } from '@/types';

export default function StandingsPage() {
  const { teams, pools, matches: cachedMatches } = useData();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [teamsByPool, setTeamsByPool] = useState<{ [poolId: string]: Team[] }>({});
  const [playersByPool, setPlayersByPool] = useState<{ [poolId: string]: Player[] }>({});
  const [matchesByPool, setMatchesByPool] = useState<{ [poolId: string]: Match[] }>({});
  const [gamesByPool, setGamesByPool] = useState<{ [poolId: string]: GameBase[] }>({});
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [qualifiedPlayerIds, setQualifiedPlayerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        // Use cached data for pools, teams, and matches
        const poolData = pools;
        const teamData = teams;
        const matchData = cachedMatches;
        
        // Group teams and matches by pool
        const teamsByPool: { [poolId: string]: Team[] } = {};
        const playersByPool: { [poolId: string]: Player[] } = {};
        const matchesByPool: { [poolId: string]: Match[] } = {};
        const gamesByPool: { [poolId: string]: GameBase[] } = {};
        
        for (const pool of poolData as Pool[]) {
          teamsByPool[pool.id] = (teamData || []).filter((t: Team) => t.pool_id === pool.id);
          matchesByPool[pool.id] = (matchData || []).filter((m: Match) => m.pool_id === pool.id);
          playersByPool[pool.id] = [];
          // For Men's Team, fetch all games for matches in this pool
          if (pool.category?.code === 'MT') {
            const matchIds = matchesByPool[pool.id].map(m => m.id);
            if (matchIds.length > 0) {
              const { data: gamesData } = await supabase
                .from('games')
                .select('*')
                .in('match_id', matchIds);
              gamesByPool[pool.id] = gamesData || [];
            } else {
              gamesByPool[pool.id] = [];
            }
          }
        }
        
        // Fetch pool players for player-based categories (this still needs to be an API call)
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

        // Fetch team players for Men's Team category (this still needs to be an API call)
        const mensTeamPools = (poolData as Pool[]).filter(pool => pool.category?.code === 'MT');
        if (mensTeamPools.length > 0) {
          const { data: teamPlayersData } = await supabase
            .from('team_players')
            .select('*, player:t_players(*)')
            .in('team_id', (teamData || []).map((t: Team) => t.id));
          
          if (teamPlayersData) {
            teamPlayersData.forEach((tp: any) => {
              if (tp.player) {
                const team = (teamData || []).find((t: Team) => t.id === tp.team_id);
                if (team) {
                  if (!team.players) team.players = [];
                  team.players.push(tp.player);
                }
              }
            });
          }
        }
        
        setTeamsByPool(teamsByPool);
        setPlayersByPool(playersByPool);
        setMatchesByPool(matchesByPool);
        setGamesByPool(gamesByPool);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    fetchAll();
  }, [pools, teams, cachedMatches]);

  // When category changes, update the query parameter
  useEffect(() => {
    if (selectedCategory) {
      const params = new URLSearchParams(window.location.search);
      params.set('category', selectedCategory);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (loading || selectedCategory !== 'BU13') {
      setQualifiedPlayerIds(new Set());
      return;
    }
    const bu13Pools = pools.filter(pool => pool.category?.code === 'BU13');
    if (bu13Pools.length === 0) return;

    const allQualifiedIds = new Set<string>();
    const thirdPlacePlayers: TournamentStandings[] = [];

    bu13Pools.forEach(pool => {
      const poolStandings = calculateStandings(
        teamsByPool[pool.id] || [],
        playersByPool[pool.id] || [],
        matchesByPool[pool.id] || [],
        pool.category?.code
      );

      if (poolStandings.length > 0) {
        allQualifiedIds.add(poolStandings[0].teamId);
        if (poolStandings.length > 1) {
          allQualifiedIds.add(poolStandings[1].teamId);
        }
        if (poolStandings.length > 2) {
          thirdPlacePlayers.push(poolStandings[2]);
        }
      }
    });
    thirdPlacePlayers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      const aGames = a.gamesWon + a.gamesLost;
      const bGames = b.gamesWon + b.gamesLost;
      const aPct = aGames > 0 ? a.gamesWon / aGames : 0;
      const bPct = bGames > 0 ? b.gamesWon / bGames : 0;
      if (bPct !== aPct) return bPct - aPct;
      return b.gamesWon - a.gamesWon;
    });

    if (thirdPlacePlayers.length > 0) {
      allQualifiedIds.add(thirdPlacePlayers[0].teamId);
    }
    if (thirdPlacePlayers.length > 1) {
      allQualifiedIds.add(thirdPlacePlayers[1].teamId);
    }

    setQualifiedPlayerIds(allQualifiedIds);
  }, [loading, selectedCategory, pools, teamsByPool, playersByPool, matchesByPool]);

  // Filter pools by selected category
  const filteredPools = pools.filter(pool => {
    if (selectedCategory === 'all') return true;
    return pool.category?.code === selectedCategory;
  });

  // Sort pools: Men's Team first, then alphabetically by pool name
  const sortedPools = [...filteredPools].sort((a, b) => {
    // Men's Team pools always come first
    const aIsMensTeam = a.category?.code === 'MT';
    const bIsMensTeam = b.category?.code === 'MT';
    
    if (aIsMensTeam && !bIsMensTeam) return -1;
    if (!aIsMensTeam && bIsMensTeam) return 1;
    
    // Then sort by pool name
    return a.name.localeCompare(b.name);
  });

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

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

  // Flatten all pools to show one table per category (or all in one if 'all')
  const tables: React.ReactNode[] = [];
  if (filteredPools.length === 0) {
    tables.push(
      <div className="text-center py-12" key="no-pools">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-white text-lg">
          {selectedCategory === 'all' 
            ? 'No pools found. Tournament standings will appear here once pools are created.' 
            : `No pools found for ${categoryLabels[selectedCategory as keyof typeof categoryLabels]?.label || selectedCategory}.`}
        </p>
      </div>
    );
  } else {
    // If 'all', show all pools in one table; otherwise, show only the selected category
    const poolsToShow = selectedCategory === 'all' ? sortedPools : sortedPools;
    // For each pool, show its standings directly (no cards)
    poolsToShow.forEach((pool) => {
      const standings = calculateStandings(
        teamsByPool[pool.id] || [],
        playersByPool[pool.id] || [],
        matchesByPool[pool.id] || [],
        pool.category?.code,
        pool.category?.code === 'MT' && gamesByPool[pool.id]
          ? gamesByPool[pool.id]
              .filter(g => (g as any)['status'] === 'completed')
              .map(g => {
                const game = g as any;
                let winner = game['winner'];
                if (!winner) {
                  if (game['team1_score'] > game['team2_score']) winner = 'team1';
                  else if (game['team2_score'] > game['team1_score']) winner = 'team2';
                  // If equal, skip winner (do not use 'draw')
                }
                return {
                  id: game['id'],
                  match_id: game['match_id'],
                  game_number: 0,
                  team1_score: game['team1_score'],
                  team2_score: game['team2_score'],
                  winner,
                  created_at: '',
                  updated_at: '',
                };
              })
          : undefined
      );
      tables.push(
        <div key={pool.id} className="mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 shadow">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-white/90">{pool.name}</h3>
            </div>
            <StandingsTab 
              standings={standings} 
              teams={teamsByPool[pool.id] || []}
              isMensTeam={pool.category?.code === 'MT'}
              expandedTeams={expandedTeams}
              onToggleTeamExpansion={toggleTeamExpansion}
              categoryCode={pool.category?.code}
              poolName={pool.name}
              qualifiedPlayerIds={pool.category?.code === 'BU13' ? qualifiedPlayerIds : undefined}
            />
          </div>
        </div>
      );
    });
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Enhanced Standings Header */}
      <div className="text-center mb-12 animate-slide-in-up">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-5xl animate-float">🏆</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white" style={{textShadow: '0 0 20px rgba(255,255,255,0.8)'}}>Standings</h1>
        </div>
      </div>
      {/* Category Dropdown Top Right */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2">
          <label className="text-white/90 text-sm font-medium whitespace-nowrap" htmlFor="category-select">Category:</label>
          <select
            id="category-select"
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
      {/* Standings Tables */}
      <div>{tables}</div>

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