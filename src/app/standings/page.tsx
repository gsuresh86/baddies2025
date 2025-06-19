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
    if (!match.completed) return;
    const team1 = standings[match.team1_id ?? match.team1Id ?? ''];
    const team2 = standings[match.team2_id ?? match.team2Id ?? ''];
    if (!team1 || !team2) return;
    team1.matchesPlayed++;
    team2.matchesPlayed++;
    if ((match.team1_score ?? match.team1Score ?? 0) > (match.team2_score ?? match.team2Score ?? 0)) {
      team1.matchesWon++;
      team2.matchesLost++;
    } else if ((match.team2_score ?? match.team2Score ?? 0) > (match.team1_score ?? match.team1Score ?? 0)) {
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
      team1.gamesWon += match.team1_score || match.team1Score || 0;
      team1.gamesLost += match.team2_score || match.team2Score || 0;
      team2.gamesWon += match.team2_score || match.team2Score || 0;
      team2.gamesLost += match.team1_score || match.team1Score || 0;
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
        teamsByPool[pool.id] = (teamData || []).filter((t: any) => t.pool_id === pool.id);
        matchesByPool[pool.id] = (matchData || []).filter((m: any) => m.pool_id === pool.id);
      });
      setTeamsByPool(teamsByPool);
      setMatchesByPool(matchesByPool);
      setLoading(false);
    }
    fetchAll();
  }, []);

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-500 text-lg">Loading standings...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tournament Standings</h1>
      {pools.length === 0 ? (
        <div className="text-gray-500 text-lg">No pools found.</div>
      ) : (
        pools.map(pool => (
          <div key={pool.id} className="mb-12">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">{pool.name}</h2>
            <StandingsTab standings={calculateStandings(teamsByPool[pool.id] || [], matchesByPool[pool.id] || [])} />
          </div>
        ))
      )}
    </div>
  );
} 