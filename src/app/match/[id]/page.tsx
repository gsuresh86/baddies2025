"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/store";
import Link from "next/link";
import { Match, Game, Team } from "@/types";

// Mocked games for display if no games exist
const MOCKED_GAMES: Game[] = [
  {
    id: "g1",
    type: "singles",
    player1Id: "p1",
    player2Id: "p2",
    team1Score: 21,
    team2Score: 18,
    winner: "team1",
    completed: true,
  },
  {
    id: "g2",
    type: "singles",
    player1Id: "p3",
    player2Id: "p4",
    team1Score: 17,
    team2Score: 21,
    winner: "team2",
    completed: true,
  },
  {
    id: "g3",
    type: "doubles",
    player1Id: "p5",
    player2Id: "p6",
    player3Id: "p7",
    player4Id: "p8",
    team1Score: 21,
    team2Score: 19,
    winner: "team1",
    completed: true,
  },
  {
    id: "g4",
    type: "doubles",
    player1Id: "p9",
    player2Id: "p10",
    player3Id: "p11",
    player4Id: "p12",
    team1Score: 15,
    team2Score: 21,
    winner: "team2",
    completed: true,
  },
  {
    id: "g5",
    type: "doubles",
    player1Id: "p13",
    player2Id: "p14",
    player3Id: "p15",
    player4Id: "p16",
    team1Score: 21,
    team2Score: 17,
    winner: "team1",
    completed: true,
  },
];

const MOCKED_PLAYERS: Record<string, string> = {
  p1: "Alice",
  p2: "Bob",
  p3: "Charlie",
  p4: "David",
  p5: "Eve",
  p6: "Frank",
  p7: "Grace",
  p8: "Heidi",
  p9: "Ivan",
  p10: "Judy",
  p11: "Mallory",
  p12: "Niaj",
  p13: "Olivia",
  p14: "Peggy",
  p15: "Sybil",
  p16: "Trent",
};

export default function MatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = React.use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatchDetails() {
      setLoading(true);
      setError(null);
      // Fetch match
      const { data: matchData, error: matchError } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (matchError || !matchData) {
        setError("Match not found");
        setLoading(false);
        return;
      }
      setMatch(matchData);
      // Fetch teams
      const [{ data: team1Data }, { data: team2Data }] = await Promise.all([
        supabase.from("teams").select("*").eq("id", matchData.team1_id).single(),
        supabase.from("teams").select("*").eq("id", matchData.team2_id).single(),
      ]);
      setTeam1(team1Data || null);
      setTeam2(team2Data || null);
      // Fetch games for this match
      const { data: gamesData } = await supabase.from("games").select("*").eq("match_id", matchId);
      setGames(gamesData && gamesData.length > 0 ? gamesData : []);
      setLoading(false);
    }
    fetchMatchDetails();
  }, [matchId]);

  const displayGames = games.length > 0 ? games : MOCKED_GAMES;

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-500 text-lg">Loading match details...</p></div>;
  }
  if (error || !match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{error || "Match not found"}</p>
        <Link href="/tournaments" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Use (match as any).pool_id for Supabase compatibility */}
      <Link
        href={(match && ((match as Match).pool_id)) ? `/pool/${(match as Match).pool_id}` : "/tournaments"}
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Pool
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Match Details</h1>
      <div className="mb-4 text-gray-700">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-semibold">{team1?.name || "Team 1"}</span>
          <span className="text-xl font-bold text-gray-400">vs</span>
          <span className="font-semibold">{team2?.name || "Team 2"}</span>
        </div>
        <div className="flex gap-6 text-sm text-gray-500 mb-2">
          <span>Match ID: {match.id}</span>
          {match.scheduled_date && <span>Scheduled: {new Date(match.scheduled_date).toLocaleString()}</span>}
          <span>Status: {match.completed ? "Completed" : "Pending"}</span>
        </div>
        <div className="flex gap-6 text-sm text-gray-500 mb-2">
          <span>Games Won: <span className="text-blue-700 font-bold">{match.team1_score ?? 0}</span> - <span className="text-red-700 font-bold">{match.team2_score ?? 0}</span></span>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Games</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Game #</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team 1 Players</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team 2 Players</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Team 1 Score</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Team 2 Score</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Winner</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayGames.map((game, idx) => (
              <tr key={game.id}>
                <td className="px-4 py-2 font-semibold">{idx + 1}</td>
                <td className="px-4 py-2 capitalize">{game.type}</td>
                <td className="px-4 py-2">
                  {game.type === 'singles'
                    ? MOCKED_PLAYERS[game.player1Id || '']
                    : [MOCKED_PLAYERS[game.player1Id || ''], MOCKED_PLAYERS[game.player2Id || '']].filter(Boolean).join(', ')
                  }
                </td>
                <td className="px-4 py-2">
                  {game.type === 'singles'
                    ? MOCKED_PLAYERS[game.player2Id || '']
                    : [MOCKED_PLAYERS[game.player3Id || ''], MOCKED_PLAYERS[game.player4Id || '']].filter(Boolean).join(', ')
                  }
                </td>
                <td className="px-4 py-2 text-center text-blue-700 font-bold">{game.team1Score}</td>
                <td className="px-4 py-2 text-center text-red-700 font-bold">{game.team2Score}</td>
                <td className="px-4 py-2 text-center font-semibold">
                  {game.winner === 'team1' ? team1?.name || 'Team 1' : team2?.name || 'Team 2'}
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${game.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {game.completed ? 'Completed' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 