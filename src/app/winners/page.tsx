 'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Match, Category, Team, Player } from '@/types';

interface WinnerResult {
  id: string;
  category: Category;
  gold: { name: string; type: 'team' | 'player'; data?: Team | Player | undefined };
  silver: { name: string; type: 'team' | 'player'; data?: Team | Player | undefined };
  bronze?: { name: string; type: 'team' | 'player'; data?: Team | Player | undefined };
  matchDetails: Match;
}

const categoryLabels: Record<string, string> = {
  "MT": "Men's Team",
  "WS": "Women's Singles",
  "WD": "Women's Doubles",
  "XD": "Mixed Doubles",
  "BU18": "Boys U18",
  "BU13": "Boys U13",
  "GU18": "Girls U18",
  "GU13": "Girls U13",
  "FM": "Family Mixed",
};

// Helper function to get display name for pair games
const getPlayerDisplayName = (player: Player | undefined, isPairGame: boolean) => {
  if (!player) return '';
  
  if (isPairGame && player.partner_name) {
    const firstName = player.name.split(' ')[0];
    const partnerFirstName = player.partner_name.split(' ')[0];
    return `${firstName} / ${partnerFirstName}`;
  }
  
  return player.name;
};

export default function WinnersPage() {
  const { matches, teams, players, categories, pools } = useData();
  const [winners, setWinners] = useState<WinnerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (matches.length === 0 || categories.length === 0) return;

    const processWinners = () => {
      const results: WinnerResult[] = [];
      
      // Group matches by category
      const matchesByCategory: { [categoryId: string]: Match[] } = {};
      
      matches.forEach(match => {
        // Get category for this match
        let categoryId = '';
        if (match.pool_id) {
          const pool = pools.find(p => p.id === match.pool_id);
          if (pool) {
            categoryId = pool.category_id || '';
          }
        } else if (match.category_id) {
          categoryId = match.category_id;
        }
        
        if (categoryId) {
          if (!matchesByCategory[categoryId]) {
            matchesByCategory[categoryId] = [];
          }
          matchesByCategory[categoryId].push(match);
        }
      });

      // Process each category
      Object.entries(matchesByCategory).forEach(([categoryId, categoryMatches]) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        // Find Final (F) matches
        const finalMatches = categoryMatches.filter(match => 
          match.stage === 'F' && match.status === 'completed'
        );

        // Find TPM (Third Place Match) matches
        const tpmMatches = categoryMatches.filter(match => 
          match.stage === 'TPM' && match.status === 'completed'
        );

        if (finalMatches.length > 0) {
          const finalMatch = finalMatches[0]; // Take the first final match
          
          // Determine winner and runner-up
          let goldWinner = { name: '', type: 'team' as 'team' | 'player', data: undefined as Team | Player | undefined };
          let silverRunner = { name: '', type: 'team' as 'team' | 'player', data: undefined as Team | Player | undefined };
          let bronzeWinner = { name: '', type: 'team' as 'team' | 'player', data: undefined as Team | Player | undefined };

          if (category.code === 'MT') {
            // Team matches
            const team1 = teams.find(t => t.id === finalMatch.team1_id);
            const team2 = teams.find(t => t.id === finalMatch.team2_id);
            
            if (finalMatch.winner === 'team1') {
              goldWinner = { 
                name: team1?.brand_name || team1?.name || 'Team 1', 
                type: 'team', 
                data: team1 
              };
              silverRunner = { 
                name: team2?.brand_name || team2?.name || 'Team 2', 
                type: 'team', 
                data: team2 
              };
            } else if (finalMatch.winner === 'team2') {
              goldWinner = { 
                name: team2?.brand_name || team2?.name || 'Team 2', 
                type: 'team', 
                data: team2 
              };
              silverRunner = { 
                name: team1?.brand_name || team1?.name || 'Team 1', 
                type: 'team', 
                data: team1 
              };
            }
          } else {
            // Individual matches
            const player1 = players.find(p => p.id === finalMatch.player1_id);
            const player2 = players.find(p => p.id === finalMatch.player2_id);
            
            // Check if this is a pair game
            const isPairGame = ['WD', 'XD', 'FM'].includes(category.code);
            
            if (finalMatch.winner === 'player1') {
              goldWinner = { 
                name: getPlayerDisplayName(player1, isPairGame) || 'Player 1', 
                type: 'player', 
                data: player1 
              };
              silverRunner = { 
                name: getPlayerDisplayName(player2, isPairGame) || 'Player 2', 
                type: 'player', 
                data: player2 
              };
            } else if (finalMatch.winner === 'player2') {
              goldWinner = { 
                name: getPlayerDisplayName(player2, isPairGame) || 'Player 2', 
                type: 'player', 
                data: player2 
              };
              silverRunner = { 
                name: getPlayerDisplayName(player1, isPairGame) || 'Player 1', 
                type: 'player', 
                data: player1 
              };
            }
          }

          // Find bronze winner from TPM match
          if (tpmMatches.length > 0) {
            const tpmMatch = tpmMatches[0];
            
            if (category.code === 'MT') {
              const team1 = teams.find(t => t.id === tpmMatch.team1_id);
              const team2 = teams.find(t => t.id === tpmMatch.team2_id);
              
              if (tpmMatch.winner === 'team1') {
                bronzeWinner = { 
                  name: team1?.brand_name || team1?.name || 'Team 1', 
                  type: 'team', 
                  data: team1 
                };
              } else if (tpmMatch.winner === 'team2') {
                bronzeWinner = { 
                  name: team2?.brand_name || team2?.name || 'Team 2', 
                  type: 'team', 
                  data: team2 
                };
              }
            } else {
              const player1 = players.find(p => p.id === tpmMatch.player1_id);
              const player2 = players.find(p => p.id === tpmMatch.player2_id);
              
              // Check if this is a pair game
              const isPairGame = ['WD', 'XD', 'FM'].includes(category.code);
              
              if (tpmMatch.winner === 'player1') {
                bronzeWinner = { 
                  name: getPlayerDisplayName(player1, isPairGame) || 'Player 1', 
                  type: 'player', 
                  data: player1 
                };
              } else if (tpmMatch.winner === 'player2') {
                bronzeWinner = { 
                  name: getPlayerDisplayName(player2, isPairGame) || 'Player 2', 
                  type: 'player', 
                  data: player2 
                };
              }
            }
          }

          if (goldWinner.name && silverRunner.name) {
            results.push({
              id: `${category.code}-${finalMatch.id}`,
              category,
              gold: goldWinner,
              silver: silverRunner,
              bronze: bronzeWinner.name ? bronzeWinner : undefined,
              matchDetails: finalMatch
            });
          }
        }
      });

      setWinners(results);
      setLoading(false);
    };

    processWinners();
  }, [matches, teams, players, categories, pools]);

  const filteredWinners = selectedCategory === 'all' 
    ? winners 
    : winners.filter(w => w.category.code === selectedCategory);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-white text-xl font-semibold">Loading tournament winners...</p>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in-scale">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-5xl animate-float">🏆</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-glow-white">
            Tournament Winners
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
          Celebrating the champions of PBEL City Badminton Tournament 2025
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto mt-6 rounded-full"></div>
      </div>

      {/* Category Filter */}
      <div className="flex justify-center mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm
              ${selectedCategory === 'all' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-white/10 text-white/80 hover:bg-yellow-500/60'}`}
            style={{ minWidth: 120 }}
          >
            🏆 All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.code)}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm
                ${selectedCategory === cat.code ? 'bg-yellow-500 text-black shadow-lg' : 'bg-white/10 text-white/80 hover:bg-yellow-500/60'}`}
              style={{ minWidth: 120 }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Winners Display */}
      {filteredWinners.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-medium text-white mb-2">No winners found</h3>
          <p className="text-white/60 mb-4">
            Final matches haven&apos;t been completed yet for {categoryLabels[selectedCategory] || selectedCategory}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWinners.map((winner) => (
            <div
              key={winner.id}
              className="group relative animate-fade-in-scale bg-gradient-to-br from-black/50 to-gray-900/50 backdrop-blur-sm rounded-3xl border border-white/20 hover:border-yellow-400/50 transition-all duration-500 hover-lift shadow-2xl hover:shadow-3xl overflow-hidden"
            >
              {/* Category Header */}
              <div className="p-6 text-center border-b border-white/10">
                <h3 className="text-2xl font-bold text-white mb-2">{winner.category.label}</h3>
                <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full w-16 mx-auto"></div>
              </div>

              {/* Podium Display */}
              <div className="p-6 space-y-6">
                {/* Gold Medal - 1st Place */}
                <div className="relative">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                      <span className="text-3xl">🥇</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-yellow-300 mb-1">GOLD</h4>
                    <p className="text-white font-semibold text-lg">{winner.gold.name}</p>
                    {winner.gold.data && (
                      <p className="text-gray-400 text-sm mt-1">
                        {winner.gold.type === 'team' ? 'Team' : 'Player'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Silver Medal - 2nd Place */}
                <div className="relative">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-xl">
                      <span className="text-2xl">🥈</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-gray-300 mb-1">SILVER</h4>
                    <p className="text-white font-semibold">{winner.silver.name}</p>
                    {winner.silver.data && (
                      <p className="text-gray-400 text-sm mt-1">
                        {winner.silver.type === 'team' ? 'Team' : 'Player'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bronze Medal - 3rd Place */}
                {winner.bronze && (
                  <div className="relative">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-xl">🥉</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-base font-bold text-orange-300 mb-1">BRONZE</h4>
                      <p className="text-white font-semibold text-sm">{winner.bronze.name}</p>
                      {winner.bronze.data && (
                        <p className="text-gray-400 text-xs mt-1">
                          {winner.bronze.type === 'team' ? 'Team' : 'Player'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Match Details */}
              <div className="p-4 bg-black/20 border-t border-white/10">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Final Match</p>
                  {winner.matchDetails.team1_score !== null && winner.matchDetails.team2_score !== null && (
                    <p className="text-white font-bold text-lg mt-1">
                      {winner.matchDetails.team1_score} - {winner.matchDetails.team2_score}
                    </p>
                  )}
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Section */}
      {filteredWinners.length > 0 && (
        <div className="mt-16 w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover-lift">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">{filteredWinners.length}</div>
              <div className="text-white font-medium">Categories</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover-lift">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">{filteredWinners.length}</div>
              <div className="text-white font-medium">Gold Winners</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover-lift">
              <div className="text-3xl md:text-4xl font-bold text-gray-400 mb-2">{filteredWinners.length}</div>
              <div className="text-white font-medium">Silver Runners</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover-lift">
              <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">
                {filteredWinners.filter(w => w.bronze).length}
              </div>
              <div className="text-white font-medium">Bronze Winners</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Decorative Elements */}
      <div className="fixed top-20 left-10 w-8 h-8 bg-yellow-500/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-40 right-20 w-6 h-6 bg-orange-500/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="fixed bottom-40 left-20 w-10 h-10 bg-yellow-400/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '3s' }}></div>
    </div>
  );
} 