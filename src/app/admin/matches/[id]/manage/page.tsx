"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, tournamentStore } from "@/lib/store";
import { Match, Game as GameBase, Team } from "@/types";
import Link from "next/link";

type Game = GameBase & {
  player1_id?: string;
  player2_id?: string;
  player3_id?: string;
  player4_id?: string;
  team1_score?: number | null;
  team2_score?: number | null;
};

interface GameSelection {
  player1Id: string;
  player2Id: string;
  player3Id: string;
  player4Id: string;
  [key: string]: string;
}

interface GameResult {
  team1_score: string;
  team2_score: string;
  winner: string;
  [key: string]: string;
}

const GAME_STRUCTURE = [
  { type: "singles" },
  { type: "singles" },
  { type: "doubles" },
  { type: "doubles" },
  { type: "doubles" },
];

// Helper to merge DB games with default structure
function mergeGamesWithStructure(dbGames: Game[]): Game[] {
  const mergedGames: Game[] = [];
  let singlesCount = 0;
  let doublesCount = 0;
  GAME_STRUCTURE.forEach((g, idx) => {
    let matchGame: Game | undefined;
    if (g.type === "singles") {
      const singlesGames = dbGames.filter(dbG => dbG.type === "singles");
      matchGame = singlesGames[singlesCount];
      singlesCount++;
    } else {
      const doublesGames = dbGames.filter(dbG => dbG.type === "doubles");
      matchGame = doublesGames[doublesCount];
      doublesCount++;
    }
    if (matchGame) {
      mergedGames.push(matchGame);
    } else {
      mergedGames.push({
        id: `new-${idx}`,
        type: g.type as 'singles' | 'doubles',
        team1_score: null,
        team2_score: null,
        team1Score: 0,
        team2Score: 0,
        winner: '' as any,
        completed: false,
        player1_id: '',
        player2_id: '',
        player3_id: '',
        player4_id: '',
      });
    }
  });
  return mergedGames;
}

export default function AdminManageMatchPage() {
  const params = useParams();
  const matchId = params?.id as string;

  // Debug log for params and matchId
  console.log('AdminManageMatchPage params:', params, 'matchId:', matchId);

  const [match, setMatch] = useState<Match | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Local state for player selection
  const [gameSelections, setGameSelections] = useState<GameSelection[]>([]);
  const [resultInputs, setResultInputs] = useState<GameResult[]>([]);

  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<{ team1: number; team2: number }>({ team1: 0, team2: 0 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch match
        const matchData = await tournamentStore.getMatchById(matchId);
        if (!matchData) throw new Error("Match not found");
        setMatch(matchData);
        // Fetch teams with players
        const [team1Data, team2Data] = await Promise.all([
          tournamentStore.getTeamById(matchData.team1_id),
          tournamentStore.getTeamById(matchData.team2_id),
        ]);
        setTeam1(team1Data);
        setTeam2(team2Data);
        // Fetch games from DB
        const { data: gamesData } = await supabase.from("games").select("*").eq("match_id", matchId);
        const dbGames: Game[] = gamesData && gamesData.length > 0 ? gamesData : [];
        const mergedGames = mergeGamesWithStructure(dbGames);
        setGames(mergedGames);
        // Set up local selection state
        setGameSelections(
          mergedGames.map((game: Game) => ({
            player1Id: game.player1_id || "",
            player2Id: game.player2_id || "",
            player3Id: game.player3_id || "",
            player4Id: game.player4_id || "",
          }))
        );
        // Set up local result state
        setResultInputs(
          mergedGames.map((game: Game) => ({
            team1_score: game.team1_score?.toString() ?? "",
            team2_score: game.team2_score?.toString() ?? "",
            winner: game.winner ?? "",
          }))
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
      }
      setLoading(false);
    }
    if (matchId) fetchData();
  }, [matchId]);

  // Helper to count wins and update match score in DB
  useEffect(() => {
    if (!games || games.length === 0 || !match) return;
    const completedGames = games.filter(g => g.completed);
    if (completedGames.length !== 5) {
      setMatchWinner(null);
      setMatchScore({ team1: 0, team2: 0 });
      return;
    }
    let team1Wins = 0;
    let team2Wins = 0;
    completedGames.forEach(g => {
      const s1 = Number(g.team1_score);
      const s2 = Number(g.team2_score);
      if (!isNaN(s1) && !isNaN(s2) && s1 !== s2 && g.team1_score !== null && g.team2_score !== null) {
        if ((s1 === 30 && s2 !== 30) || (s1 > s2 && s1 !== 30 && s2 !== 30)) {
          team1Wins++;
        } else if ((s2 === 30 && s1 !== 30) || (s2 > s1 && s1 !== 30 && s2 !== 30)) {
          team2Wins++;
        }
      }
    });
    setMatchScore({ team1: team1Wins, team2: team2Wins });

    // Update match score and winner in DB if not already set
    let winner: 'team1' | 'team2' | null = null;
    if (team1Wins > team2Wins) winner = 'team1';
    else if (team2Wins > team1Wins) winner = 'team2';
    // Only update if something changed
    if (
      match.team1_score !== team1Wins ||
      match.team2_score !== team2Wins ||
      match.completed !== true ||
      match.winner !== winner
    ) {
      (async () => {
        await supabase
          .from("matches")
          .update({
            team1_score: team1Wins,
            team2_score: team2Wins,
            completed: true,
            winner: winner,
          })
          .eq("id", match.id);
      })();
    }
    // Set winner for UI
    if (team1Wins > team2Wins) setMatchWinner(team1!.name);
    else if (team2Wins > team1Wins) setMatchWinner(team2!.name);
    else setMatchWinner("Draw");
  }, [games, match, team1, team2]);

  const handleSelectionChange = (gameIdx: number, field: string, value: string) => {
    setGameSelections((prev) => {
      const updated = [...prev];
      updated[gameIdx] = { ...updated[gameIdx], [field]: value };
      return updated;
    });
  };

  const handleResultInputChange = (gameIdx: number, field: string, value: string) => {
    setResultInputs((prev) => {
      const updated = [...prev];
      updated[gameIdx] = { ...updated[gameIdx], [field]: value };
      return updated;
    });
  };

  const handleSaveGame = async (gameIdx: number) => {
    if (!match) return;
    setSaving(true);
    const game = games[gameIdx];
    const selection = gameSelections[gameIdx];
    const result = resultInputs[gameIdx];
    // Prepare upsert data
    const upsertData: {
      match_id: string;
      type: 'singles' | 'doubles';
      player1_id: string | null;
      player2_id: string | null;
      player3_id: string | null;
      player4_id: string | null;
      team1_score: number | null;
      team2_score: number | null;
      winner: string | null;
      id?: string;
    } = {
      match_id: match.id,
      type: game.type,
      player1_id: selection.player1Id || null,
      player2_id: selection.player2Id || null,
      player3_id: selection.player3Id || null,
      player4_id: selection.player4Id || null,
      team1_score: result.team1_score !== "" ? Number(result.team1_score) : null,
      team2_score: result.team2_score !== "" ? Number(result.team2_score) : null,
      winner: result.winner || null,
    };
    if (game.id && !game.id.toString().startsWith("new-")) {
      upsertData.id = game.id;
    }
    try {
      const { error } = await supabase.from("games").upsert([upsertData], { onConflict: "id" }).select();
      if (error) throw error;
      // Refresh games
      const { data: gamesData } = await supabase.from("games").select("*").eq("match_id", match.id);
      const mergedGames = mergeGamesWithStructure(gamesData || []);
      setGames(mergedGames);
      setGameSelections(
        mergedGames.map((game: Game) => ({
          player1Id: game.player1_id || "",
          player2Id: game.player2_id || "",
          player3Id: game.player3_id || "",
          player4Id: game.player4_id || "",
        }))
      );
      setResultInputs(
        mergedGames.map((game: Game) => ({
          team1_score: game.team1_score?.toString() ?? "",
          team2_score: game.team2_score?.toString() ?? "",
          winner: game.winner ?? "",
        }))
      );
      alert("Game saved!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert("Error saving game: " + errorMessage);
    }
    setSaving(false);
  };

  const handleMarkCompleted = async (gameIdx: number) => {
    if (!match) return;
    setSaving(true);
    const game = games[gameIdx];
    try {
      const { error } = await supabase.from("games").update({ completed: true }).eq("id", game.id);
      if (error) throw error;
      // Refresh games
      const { data: gamesData } = await supabase.from("games").select("*").eq("match_id", match.id);
      const mergedGames = mergeGamesWithStructure(gamesData || []);
      setGames(mergedGames);
      setGameSelections(
        mergedGames.map((game: Game) => ({
          player1Id: game.player1_id || "",
          player2Id: game.player2_id || "",
          player3Id: game.player3_id || "",
          player4Id: game.player4_id || "",
        }))
      );
      setResultInputs(
        mergedGames.map((game: Game) => ({
          team1_score: game.team1_score?.toString() ?? "",
          team2_score: game.team2_score?.toString() ?? "",
          winner: game.winner ?? "",
        }))
      );
      alert("Game marked as completed!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert("Error marking game as completed: " + errorMessage);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-500 text-lg">Loading match management...</p></div>;
  }
  if (error || !match || !team1 || !team2) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{error || "Match not found"}</p>
        <Link href={`/admin/matches`} className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Matches
        </Link>
      </div>
    );
  }

  // Defensive: If team1 or team2 is null, don't render the rest of the component
  if (!team1 || !team2) return null;

  return (
    <div className="mx-auto py-8 space-y-8">
      <Link href={`/admin/matches`} className="text-blue-700 hover:underline mb-4 inline-block text-base font-medium">
        ← Back to Matches
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Match Lineup</h1>
      {/* Winner Banner */}
      {games.filter(g => g.completed).length === 5 && matchWinner && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white text-center text-2xl font-bold shadow-lg">
          {matchWinner === "Draw"
            ? `Match Drawn! (${matchScore.team1} - ${matchScore.team2})`
            : `${matchWinner} wins the match! (${matchScore.team1} - ${matchScore.team2})`}
        </div>
      )}
      <div className="mb-8 text-gray-800">
        <div className="flex items-center gap-6 mb-2 text-xl font-semibold">
          <span>{team1!.name}</span>
          <span className="text-2xl font-bold text-gray-400">vs</span>
          <span>{team2!.name}</span>
        </div>
      </div>
      <div className="flex flex-col gap-8">
        {games.map((game, idx) => {
          return (
            <div key={idx} className="bg-white rounded-xl shadow p-3 border border-gray-200 flex flex-col justify-between min-h-[180px] w-full relative mb-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl font-bold text-gray-900">Game {idx + 1}:</span>
                  <span className="capitalize text-base text-gray-700">{game.type}</span>
                  {game.completed && (
                    <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800">Completed</span>
                  )}
                  {/* Game status badge */}
                  <span className="absolute top-6 right-6">
                    {(() => {
                      if (game.completed) {
                        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Completed</span>;
                      }
                      const isSaved = game.id && !game.id.toString().startsWith('new-');
                      const s1 = Number(resultInputs[idx]?.team1_score);
                      const s2 = Number(resultInputs[idx]?.team2_score);
                      if (isSaved && !isNaN(s1) && !isNaN(s2) && s1 !== s2 && resultInputs[idx]?.team1_score !== '' && resultInputs[idx]?.team2_score !== '') {
                        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">In Progress</span>;
                      }
                      if (isSaved) {
                        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Not Started</span>;
                      }
                      return null;
                    })()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* Team 1 */}
                  <div>
                    <div className="font-semibold text-gray-800 mb-2">{team1!.name} Players</div>
                    {game.type === "singles" ? (
                      game.completed ? (
                        <div className="py-2 text-lg text-gray-900 font-medium">{team1!.players?.find(p => p.id === game.player1_id)?.name || "-"}</div>
                      ) : (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          value={gameSelections[idx]?.player1Id || ""}
                          onChange={e => handleSelectionChange(idx, "player1Id", e.target.value)}
                          disabled={game.completed}
                        >
                          <option value="">Select Player</option>
                          {team1!.players?.map(player => (
                            <option key={player.id} value={player.id}>{player.name}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="flex flex-col gap-2">
                        {["player1Id", "player2Id"].map((field) => (
                          game.completed ? (
                            <div key={field} className="py-2 text-lg text-gray-900 font-medium">{team1!.players?.find(p => p.id === game[field === "player1Id" ? "player1_id" : "player2_id"])?.name || "-"}</div>
                          ) : (
                            <select
                              key={field}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                              value={gameSelections[idx]?.[field] || ""}
                              onChange={e => handleSelectionChange(idx, field, e.target.value)}
                              disabled={game.completed}
                            >
                              <option value="">Select Player</option>
                              {team1!.players?.map(player => (
                                <option key={player.id} value={player.id}>{player.name}</option>
                              ))}
                            </select>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Team 2 */}
                  <div>
                    <div className="font-semibold text-gray-800 mb-2">{team2!.name} Players</div>
                    {game.type === "singles" ? (
                      game.completed ? (
                        <div className="py-2 text-lg text-gray-900 font-medium">{team2!.players?.find(p => p.id === game.player2_id)?.name || "-"}</div>
                      ) : (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          value={gameSelections[idx]?.player2Id || ""}
                          onChange={e => handleSelectionChange(idx, "player2Id", e.target.value)}
                          disabled={game.completed}
                        >
                          <option value="">Select Player</option>
                          {team2!.players?.map(player => (
                            <option key={player.id} value={player.id}>{player.name}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="flex flex-col gap-2">
                        {["player3Id", "player4Id"].map((field) => (
                          game.completed ? (
                            <div key={field} className="py-2 text-lg text-gray-900 font-medium">{team2!.players?.find(p => p.id === game[field === "player3Id" ? "player3_id" : "player4_id"])?.name || "-"}</div>
                          ) : (
                            <select
                              key={field}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                              value={gameSelections[idx]?.[field] || ""}
                              onChange={e => handleSelectionChange(idx, field, e.target.value)}
                              disabled={game.completed}
                            >
                              <option value="">Select Player</option>
                              {team2!.players?.map(player => (
                                <option key={player.id} value={player.id}>{player.name}</option>
                              ))}
                            </select>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Score and Winner display for completed games */}
                {game.completed && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">{team1!.name}</div>
                        <div className="text-2xl font-bold text-gray-900">{game.team1_score}</div>
                      </div>
                      <div className="text-2xl font-light text-gray-400">-</div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">{team2!.name}</div>
                        <div className="text-2xl font-bold text-gray-900">{game.team2_score}</div>
                      </div>
                    </div>
                    {(() => {
                      const s1 = Number(game.team1_score);
                      const s2 = Number(game.team2_score);
                      if (!isNaN(s1) && !isNaN(s2) && s1 !== s2 && game.team1_score !== null && game.team2_score !== null) {
                        let winner = '';
                        if (s1 === 30 && s2 !== 30) winner = team1!.name;
                        else if (s2 === 30 && s1 !== 30) winner = team2!.name;
                        else if (s1 > s2) winner = team1!.name;
                        else if (s2 > s1) winner = team2!.name;

                        if (winner) {
                          return (
                            <div className="flex items-center gap-2 text-lg font-semibold text-green-700">
                              <span>🏆</span>
                              <span>{winner} wins</span>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                )}
                {/* Score and Winner Inputs */}
                {!game.completed && (
                  <div className="mt-3 flex flex-row items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-base text-center shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder={`${team1!.name} score`}
                      value={resultInputs[idx]?.team1_score ?? ""}
                      onChange={e => handleResultInputChange(idx, "team1_score", e.target.value)}
                    />
                    <span className="text-gray-500 font-bold text-xl">-</span>
                    <input
                      type="number"
                      min="0"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-base text-center shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder={`${team2!.name} score`}
                      value={resultInputs[idx]?.team2_score ?? ""}
                      onChange={e => handleResultInputChange(idx, "team2_score", e.target.value)}
                    />
                    {/* Winner/leading display */}
                    {(() => {
                      const s1 = Number(resultInputs[idx]?.team1_score);
                      const s2 = Number(resultInputs[idx]?.team2_score);
                      if (!isNaN(s1) && !isNaN(s2) && resultInputs[idx]?.team1_score !== '' && resultInputs[idx]?.team2_score !== '') {
                        if (s1 === 30 && s2 !== 30) {
                          return <span className="ml-2 text-green-700 text-sm font-semibold flex items-center">🏆 {team1!.name} wins</span>;
                        } else if (s2 === 30 && s1 !== 30) {
                          return <span className="ml-2 text-green-700 text-sm font-semibold flex items-center">🏆 {team2!.name} wins</span>;
                        } else if (s1 !== s2 && s1 !== 30 && s2 !== 30) {
                          const winner = s1 > s2 ? team1!.name : team2!.name;
                          return <span className="ml-2 text-green-700 text-sm font-semibold flex items-center">🏆 {winner} leading</span>;
                        }
                      }
                      return null;
                    })()}
                    {/* Button group: Save Game and Mark Completed */}
                    <div className="flex gap-2 ml-4">
                      <button
                        className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold shadow hover:bg-blue-800 disabled:opacity-50 transition"
                        onClick={() => handleSaveGame(idx)}
                        disabled={saving || !(
                          (game.type === 'singles' && gameSelections[idx]?.player1Id && gameSelections[idx]?.player2Id) ||
                          (game.type === 'doubles' && gameSelections[idx]?.player1Id && gameSelections[idx]?.player2Id && gameSelections[idx]?.player3Id && gameSelections[idx]?.player4Id)
                        )}
                      >
                        Save Game
                      </button>
                      {(() => {
                        const s1 = Number(resultInputs[idx]?.team1_score);
                        const s2 = Number(resultInputs[idx]?.team2_score);
                        if (
                          !game.completed &&
                          ((resultInputs[idx]?.team1_score !== '' && s1 === 30) || (resultInputs[idx]?.team2_score !== '' && s2 === 30))
                        ) {
                          return (
                            <button
                              className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm font-semibold shadow hover:bg-purple-800 disabled:opacity-50 transition"
                              onClick={() => handleMarkCompleted(idx)}
                              disabled={saving}
                            >
                              Mark Completed
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 