'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { Team, Pool } from '@/types';
import Image from 'next/image';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [mensTeams] = useState<any[]>([]);
  const [otherPoolsWithPlayers, setOtherPoolsWithPlayers] = useState<any[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);

  // Fetch all categories on mount
  useEffect(() => {
    async function fetchCategoriesAndPools() {
      setLoading(true);
      const [{ data: poolData }, { data: categoryData }] = await Promise.all([
        supabase.from('pools').select('*, category:categories(*)'),
        supabase.from('categories').select('*').order('label'),
      ]);
      setPools(poolData || []);
      setCategories(categoryData || []);
      setLoading(false);
      // Set default selected category to first team category (Men's Team)
      if (categoryData && categoryData.length > 0) {
        const mensTeamCat = categoryData.find((cat: any) => cat.type === 'team' && (cat.label?.toLowerCase().includes('men') || cat.code?.toLowerCase().includes('men')));
        if (mensTeamCat) {
          setSelectedCategory(mensTeamCat.id);
        } else {
          // fallback: first team category
          const firstTeamCat = categoryData.find((cat: any) => cat.type === 'team');
          if (firstTeamCat) setSelectedCategory(firstTeamCat.id);
        }
      }
    }
    fetchCategoriesAndPools();
  }, []);

  // Fetch teams (with players from team_players) for team categories
  useEffect(() => {
    async function fetchTeamsForCategory() {
      // If no category selected, fetch all teams
      if (!selectedCategory) {
        setLoading(true);
        const { data: teamData } = await supabase
          .from('teams')
          .select('*, pool:pools(*), team_players:team_players(player:t_players(*))');
        setTeams(teamData || []);
        setLoading(false);
        return;
      }
      // Check if selected category is a team type
      const selectedCat = categories.find((cat: any) => cat.id === selectedCategory);
      if (selectedCat && selectedCat.type === 'team') {
        setLoading(true);
        // Fetch teams for this category
        const { data: teamData } = await supabase
          .from('teams')
          .select('*, pool:pools(*), team_players:team_players(player:t_players(*))')
          .in('pool.category_id', [selectedCategory]);
        setTeams(teamData || []);
        setLoading(false);
      }
    }
    fetchTeamsForCategory();
  }, [selectedCategory, categories]);

  // Fetch pools with players for non-team categories
  useEffect(() => {
    async function fetchPoolsWithPlayers() {
      if (!selectedCategory) {
        setOtherPoolsWithPlayers([]);
        return;
      }
      const selectedCat = categories.find((cat: any) => cat.id === selectedCategory);
      if (!selectedCat || selectedCat.type === 'team') {
        setOtherPoolsWithPlayers([]);
        return;
      }
      setPoolsLoading(true);
      // Get pools for the selected category
      const { data: poolsData, error: poolsError } = await supabase
        .from('pools')
        .select('*, category:categories(*)')
        .eq('category_id', selectedCategory);
      if (poolsError) {
        setOtherPoolsWithPlayers([]);
        setPoolsLoading(false);
        return;
      }
      // Get pool players for each pool
      const poolsWithPlayersData = await Promise.all(
        (poolsData || []).map(async (pool: any) => {
          const { data: poolPlayersData } = await supabase
            .from('pool_players')
            .select('*, player:t_players(*)')
            .eq('pool_id', pool.id);
          return {
            ...pool,
            players: poolPlayersData?.map((pp: any) => pp.player).filter(Boolean) || [],
          };
        })
      );
      setOtherPoolsWithPlayers(poolsWithPlayersData);
      setPoolsLoading(false);
    }
    fetchPoolsWithPlayers();
  }, [selectedCategory, categories]);

  useEffect(() => {
    console.log('mensTeams:', mensTeams, 'count:', mensTeams.length);
  }, [mensTeams]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-white text-xl font-semibold">Loading teams...</p>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Enhanced Header */}
      <div className="text-center mb-12 animate-slide-in-up">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-5xl animate-float">👥</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white" style={{textShadow: '0 0 20px rgba(255,255,255,0.8)'}}>Teams</h1>
        </div>
        <p className="text-white/80 text-xl max-w-2xl mx-auto">
          Meet the competing teams and their players across all divisions
        </p>
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
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.label || cat.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Teams or Pools with Players */}
      {selectedCategory ? (
        // If selected category is team-based, show teams; else show pools with players
        (() => {
          const selectedCat = categories.find((cat: any) => cat.id === selectedCategory);
          const isTeamCategory = selectedCat && selectedCat.type === 'team';
          if (isTeamCategory) {
            // Show teams for this category
            const filteredTeams = teams
              .filter((team: any) => team.pool?.category_id === selectedCategory)
              .sort((a: any, b: any) => {
                // Extract numbers from team names for natural sort
                const numA = parseInt((a.name || '').replace(/\D/g, ''));
                const numB = parseInt((b.name || '').replace(/\D/g, ''));
                if (!isNaN(numA) && !isNaN(numB)) {
                  return numA - numB;
                }
                return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
              });
            if (filteredTeams.length === 0) {
              return <div className="text-center py-12 text-white/80">No teams found for this category.</div>;
            }
            return (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredTeams.map((team: any) => (
                  <div key={team.id} className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover-lift transition-all duration-300">
                    <div className="flex items-center mb-4">
                      {(() => {
                        // Try to extract team number from team name
                        const match = team.name.match(/(\d+)/);
                        const teamNum = match ? match[1] : null;
                        const logoSrc = teamNum ? `/teams/team_logo_${teamNum}.png` : null;
                        return logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt={team.name}
                            width={40}
                            height={40}
                            className="w-12 h-12 rounded-full mr-3 border-2 shadow bg-white"
                          />
                        ) : (
                          <Image
                            src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(team.name)}`}
                            alt={team.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-10 h-10 rounded-full mr-3 border-2 border-blue-400 shadow"
                          />
                        );
                      })()}
                      <h3 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow">
                        {team.name}
                      </h3>
                    </div>
                    {!team.team_players || team.team_players.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-2xl mb-2">📝</div>
                        <p className="text-white/80">No players assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {team.team_players.map((tp: any, idx: number) => (
                          <div key={tp.player?.id || idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {tp.player?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{tp.player?.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          } else {
            // Show pools with players for this category (already handled by otherPoolsWithPlayers)
            if (poolsLoading) {
              return <div className="text-center py-12 text-white/80">Loading pools...</div>;
            }
            if (otherPoolsWithPlayers.length === 0) {
              return <div className="text-center py-12 text-white/80">No pools found for this category.</div>;
            }
            return (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {otherPoolsWithPlayers.map((pool: any, poolIndex: number) => {
                  const isPairCategory = pool.category?.type === 'pair';
                  const participantLabel = isPairCategory ? 'pairs' : 'players';
                  return (
                    <div
                      key={pool.id}
                      className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover-lift transition-all duration-300"
                      style={{ animationDelay: `${poolIndex * 0.1}s` }}
                    >
                      <div className="flex items-center mb-4">
                        <h3 className="text-xl font-bold text-white text-glow-white">{pool.name}</h3>
                      </div>
                      {!pool.players || pool.players.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-2xl mb-2">📝</div>
                          <p className="text-white/80">No {participantLabel} assigned</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pool.players.map((player: any, playerIndex: number) => {
                            const displayName = isPairCategory && player.partner_name
                              ? `${player.name} / ${player.partner_name}`
                              : player.name;
                            return (
                              <div
                                key={player.id || playerIndex}
                                className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white font-medium">{displayName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }
        })()
      ) : (
        // No category selected: show all teams (default)
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <div key={team.id} className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover-lift transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 text-white font-bold text-lg">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-white text-glow-white">{team.name}</h3>
              </div>
              {!team.players || team.players.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-white/80">No players assigned</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {team.players.map((player: any, idx: number) => (
                    <div key={player.id || idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 