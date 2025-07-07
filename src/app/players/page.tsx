"use client";
import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Player, Match } from "@/types";
import { categoryLabels, PlayerCategory, categoryTypes } from "@/lib/utils";

function getUniquePlayersWithCategories(players: Player[]) {
  const uniqueMap = new Map<string, { name: string; level: string; tshirt_size?: string; categories: Set<string>; id: string }>();
  players.forEach((player: any) => {
    const nameKey = player.name.replace(/\s+/g, '').toLowerCase();
    if (!uniqueMap.has(nameKey)) {
      uniqueMap.set(nameKey, {
        id: player.id,
        name: player.name,
        level: player.level || "Common",
        tshirt_size: player.tshirt_size || "-",
        categories: new Set<string>(),
      });
    }
    if (player.category) {
      uniqueMap.get(nameKey)?.categories.add(player.category);
    }
    // Partner: add main player's category to partner's entry
    if (player.partner_name) {
      const partnerNameKey = player.partner_name.replace(/\s+/g, '').toLowerCase();
      if (!uniqueMap.has(partnerNameKey)) {
        uniqueMap.set(partnerNameKey, {
          id: player.id, // fallback, may not be correct for partner
          name: player.partner_name,
          level: "Common",
          tshirt_size: player.partner_tshirt_size || "-",
          categories: new Set<string>(),
        });
      }
      if (player.category) {
        uniqueMap.get(partnerNameKey)?.categories.add(player.category);
      }
    }
  });
  return Array.from(uniqueMap.values()).map((p) => ({
    ...p,
    categories: Array.from(p.categories),
  }));
}

function getPlayerMatches(playerId: string, matches: Match[]): Match[] {
  return matches.filter(
    (m) => m.player1_id === playerId || m.player2_id === playerId
  );
}

export default function PlayersPage() {
  const { players, matches, loading, categories, pools } = useData();
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showMatches, setShowMatches] = useState(false);

  const uniquePlayers = getUniquePlayersWithCategories(players || []);

  const filteredPlayers = uniquePlayers.filter((player) => {
    const searchLower = search.toLowerCase();
    const nameMatch = player.name.toLowerCase().includes(searchLower);
    const codeMatch = player.categories.some((cat) =>
      (categoryLabels[cat as PlayerCategory]?.code || cat).toLowerCase().includes(searchLower)
    );
    return nameMatch || codeMatch;
  });

  const handleShowMatches = (player: any) => {
    setSelectedPlayer(player);
    setShowMatches(true);
  };

  const handleCloseMatches = () => {
    setShowMatches(false);
    setSelectedPlayer(null);
  };

  // Helper to get category for a match
  function getCategoryForMatch(match: Match) {
    const pool = pools.find((p) => p.id === match.pool_id);
    if (!pool) return undefined;
    return categories.find((c) => c.id === pool.category_id);
  }

  // Helper to get formatted IST date and time
  function formatISTDateTime(dateString: string | undefined | null) {
    if (!dateString) return { date: '-', time: '-' };
    try {
      const dt = new Date(dateString);
      const istDate = dt.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const istTime = dt.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { date: istDate, time: istTime };
    } catch {
      return { date: '-', time: '-' };
    }
  }

  return (
    <div className="bg-black min-h-screen py-8 px-2 md:px-8">
      <h1 className="text-white text-3xl md:text-4xl font-bold text-center mb-8 tracking-wide text-glow-white">Players</h1>
      {/* Search Box */}
      <div className="flex justify-center mb-10 animate-fade-in-scale">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or category..."
          className="w-full max-w-md px-5 py-3 rounded-2xl bg-[#181818] text-white placeholder-gray-400 border border-white/10 shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/30 text-lg font-semibold text-center"
          style={{ boxShadow: '0 6px 32px 0 rgba(0,0,0,0.45), 0 1.5px 6px 0 rgba(255,255,255,0.04)' }}
        />
      </div>
      {loading ? (
        <div className="text-white text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {filteredPlayers.map((player, idx) => (
            <div key={player.name + idx} className="relative w-80 rounded-2xl bg-gradient-to-br from-[#232323] to-[#111] border border-white/10 overflow-hidden flex flex-col items-center glass-dark hover-lift animate-fade-in-scale shadow-2xl" style={{ boxShadow: '0 10px 40px 0 rgba(0,0,0,0.7), 0 2px 8px 0 rgba(255,255,255,0.06)' }}>
              {/* Top bar with badge and flag */}
              <div className="w-full flex items-center justify-between px-4 py-2 bg-gradient-to-r from-black/80 to-gray-900/80 border-b border-white/10">
                <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full tracking-widest shadow text-glow-white">{player.level.toUpperCase()}</span>
                {/* Placeholder flag */}
                <span className="text-2xl ml-2">🇮🇳</span>
              </div>
              {/* Player image placeholder */}
              <div className="w-28 h-28 rounded-xl bg-[#181818] flex items-center justify-center mt-4 mb-2 border-4 border-white/20 text-5xl font-extrabold text-white shadow-inner animate-float">
                {player.name.charAt(0)}
              </div>
              {/* Name */}
              <div className="text-white text-xl font-bold tracking-wide mb-1 text-center px-2 text-glow-white animate-shimmer" style={{letterSpacing: '0.04em'}}>{player.name}</div>
              {/* Skill Level and T-shirt size */}
              <div className="flex flex-col items-center mb-2">
                <span className="text-xs text-gray-300 font-semibold mb-1">Skill: <span className="text-white font-bold">{player.level}</span></span>
                <span className="text-xs text-gray-300 font-semibold">T-shirt Size: <span className="text-white font-bold">{player.tshirt_size || '-'}</span></span>
              </div>
              {/* Badge row (category short label) */}
              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                {player.categories.map((cat: string) => (
                  <span key={cat} className="text-slate-300 text-xs font-semibold bg-gray-800/80 px-2 py-1 rounded-full border border-white/10 shadow text-glow" style={{letterSpacing: '0.03em'}}>
                    {categoryLabels[cat as PlayerCategory]?.code || cat}
                  </span>
                ))}
              </div>
              {/* Divider */}
              <div className="w-3/4 h-0.5 bg-gradient-to-r from-white/10 via-white/30 to-white/10 my-2 rounded-full" />
              {/* Matches link */}
              <button
                className="mt-2 mb-4 px-4 py-2 rounded-lg bg-black/70 text-white text-xs font-bold border border-white/10 shadow hover:bg-white/10 transition-all"
                onClick={() => handleShowMatches(player)}
              >
                View Matches
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Matches Dialog */}
      {showMatches && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#181818] rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-lg animate-fade-in-scale relative">
            <button
              className="absolute top-3 right-3 text-white text-2xl font-bold hover:text-gray-300"
              onClick={handleCloseMatches}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-white text-xl font-bold mb-4 text-center">Matches for {selectedPlayer.name}</h2>
            <div className="max-h-96 overflow-y-auto">
              {getPlayerMatches(selectedPlayer.id, matches).length === 0 ? (
                <div className="text-gray-400 text-center py-8">No matches found for this player.</div>
              ) : (
                <ul className="space-y-4">
                  {getPlayerMatches(selectedPlayer.id, matches).map((match) => {
                    const matchCategory = getCategoryForMatch(match);
                    const matchType = matchCategory ? categoryTypes[matchCategory.label as PlayerCategory] : undefined;
                    const { date, time } = formatISTDateTime(match.scheduled_date);
                    // Determine opponent and partner
                    let opponentName = '-';
                    let partnerName = '';
                    if (matchType === 'pair') {
                      // For pair games, show partner name by always looking up both players
                      let player: Player | undefined, partner: Player | undefined, opp: Player | undefined;
                      if (match.player1_id === selectedPlayer.id) {
                        player = players.find(p => p.id === match.player1_id);
                        partner = player && player.partner_name
                          ? players.find(p => p.name === player?.partner_name)
                          : undefined;
                        opp = players.find(p => p.id === match.player2_id);
                        opponentName = opp ? (opp.partner_name ? `${opp.name} / ${opp.partner_name}` : opp.name) : '-';
                      } else {
                        player = players.find(p => p.id === match.player2_id);
                        partner = player && player.partner_name
                          ? players.find(p => p.name === player?.partner_name)
                          : undefined;
                        opp = players.find(p => p.id === match.player1_id);
                        opponentName = opp ? (opp.partner_name ? `${opp.name} / ${opp.partner_name}` : opp.name) : '-';
                      }
                      // Show partner name if found, else fallback to player.partner_name string
                      if (partner && partner.name) {
                        partnerName = partner.name;
                      } else if (player && player.partner_name) {
                        partnerName = player.partner_name;
                      } else {
                        partnerName = '';
                      }
                    } else {
                      // Singles: just show opponent
                      if (match.player1_id === selectedPlayer.id) {
                        opponentName = players.find(p => p.id === match.player2_id)?.name || '-';
                      } else {
                        opponentName = players.find(p => p.id === match.player1_id)?.name || '-';
                      }
                    }
                    return (
                      <li key={match.id} className="bg-black/60 rounded-lg p-4 border border-white/10 shadow">
                        <div className="flex flex-col gap-1">
                          <div className="text-white text-sm font-bold">Match No: <span className="text-gray-300">{match.match_no || '-'}</span></div>
                          <div className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-blue-300 bg-blue-900/40 px-2 py-1 rounded mr-2">{date}</span>
                            <span className="text-xs font-bold text-pink-200 bg-pink-900/40 px-2 py-1 rounded">{time}</span>
                          </div>
                          <div className="text-gray-300 text-xs">Status: {match.status || '-'}</div>
                          <div className="text-gray-300 text-xs">Opponent: {opponentName}</div>
                          {matchType === 'pair' && partnerName && (
                            <div className="text-xs text-amber-300 font-semibold">Partner: {partnerName}</div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 