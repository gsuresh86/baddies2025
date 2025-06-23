'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { Pool, Team, Match, TournamentStandings } from '@/types';
import StandingsTab from '../pool/[id]/StandingsTab';

function calculateStandings(teams: Team[], matches: Match[]): TournamentStandings[] {
  const standings: { [teamId: string]: TournamentStandings } = {};
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

  matches.forEach(match => {
    if (match.status !== 'completed') return;
    const team1 = standings[match.team1_id ?? match.team1_id ?? ''];
    const team2 = standings[match.team2_id ?? match.team2_id ?? ''];
    if (!team1 || !team2) return;
    team1.matchesPlayed++;
    team2.matchesPlayed++;
    if ((match.team1_score ?? match.team1_score ?? 0) > (match.team2_score ?? match.team2_score ?? 0)) {
      team1.matchesWon++;
      team2.matchesLost++;
    } else if ((match.team2_score ?? match.team2_score ?? 0) > (match.team1_score ?? match.team1_score ?? 0)) {
      team2.matchesWon++;
      team1.matchesLost++;
    }
    // If you have games, count them here
    if (Array.isArray(match.games)) {
      match.games.forEach(game => {
        if (game.completed) {
          if (game.winner === 'team1') {
            team1.gamesWon++;
            team2.gamesLost++;
          } else if (game.winner === 'team2') {
            team2.gamesWon++;
            team1.gamesLost++;
          }
        }
      });
    } else {
      // If no games, use match scores as games won/lost
      team1.gamesWon += match.team1_score || match.team1_score || 0;
      team1.gamesLost += match.team2_score || match.team2_score || 0;
      team2.gamesWon += match.team2_score || match.team2_score || 0;
      team2.gamesLost += match.team1_score || match.team1_score || 0;
    }
  });
  Object.values(standings).forEach(standing => {
    standing.points = (standing.matchesWon * 2)
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
  const [matchesByPool, setMatchesByPool] = useState<{ [poolId: string]: Match[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      // Fetch all pools
      const { data: poolData } = await supabase.from('pools').select('*');
      if (!poolData) return setLoading(false);
      setPools(poolData as Pool[]);
      // Fetch all teams
      const { data: teamData } = await supabase.from('teams').select('*');
      // Fetch all matches
      const { data: matchData } = await supabase.from('matches').select('*');
      // Group teams and matches by pool
      const teamsByPool: { [poolId: string]: Team[] } = {};
      const matchesByPool: { [poolId: string]: Match[] } = {};
      (poolData as Pool[]).forEach(pool => {
        teamsByPool[pool.id] = (teamData || []).filter((t: Team) => t.pool_id === pool.id);
        matchesByPool[pool.id] = (matchData || []).filter((m: Match) => m.pool_id === pool.id);
      });
      setTeamsByPool(teamsByPool);
      setMatchesByPool(matchesByPool);
      setLoading(false);
    }
    fetchAll();
  }, []);

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
          Track the performance and rankings of all teams across different pools
        </p>
      </div>

      {pools.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-white text-lg">No pools found. Tournament standings will appear here once pools are created.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {pools.map((pool, index) => (
            <div key={pool.id} className="animate-fade-in-scale" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl hover-lift">
                <div className="flex items-center mb-6">
                  <div className="text-3xl mr-4">🏊‍♂️</div>
                  <h2 className="text-2xl font-bold text-white text-glow-white">{pool.name}</h2>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                  <StandingsTab standings={calculateStandings(teamsByPool[pool.id] || [], matchesByPool[pool.id] || [])} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tournament Stats Summary */}
      <div className="mt-12 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 animate-fade-in-scale" style={{animationDelay: '0.5s'}}>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white text-glow-white mb-2">📈 Tournament Overview</h3>
          <p className="text-white/80">Complete standings across all divisions</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-200/30">
            <div className="text-3xl font-bold text-blue-300 mb-2">{pools.length}</div>
            <div className="text-white/80 text-sm">Active Pools</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-200/30">
            <div className="text-3xl font-bold text-green-300 mb-2">
              {Object.values(teamsByPool).reduce((acc, teams) => acc + teams.length, 0)}
            </div>
            <div className="text-white/80 text-sm">Total Teams</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-200/30">
            <div className="text-3xl font-bold text-purple-300 mb-2">
              {Object.values(matchesByPool).reduce((acc, matches) => acc + matches.length, 0)}
            </div>
            <div className="text-white/80 text-sm">Total Matches</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-200/30">
            <div className="text-3xl font-bold text-yellow-300 mb-2">
              {Object.values(matchesByPool).reduce((acc, matches) => acc + matches.filter(m => m.completed).length, 0)}
            </div>
            <div className="text-white/80 text-sm">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
} 