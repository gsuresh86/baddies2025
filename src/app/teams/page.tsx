'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { Team, Pool } from '@/types';
import { PlayerCategory, categoryTypes, categoryLabels } from '@/lib/utils';

function getPlayerCategoryFromCategory(cat: any): PlayerCategory | undefined {
  if (!cat) return undefined;
  // Try to match by code
  const entry = Object.entries(categoryLabels).find(([, info]) => info.code === cat.code);
  return entry ? (entry[0] as PlayerCategory) : undefined;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [mensTeams, setMensTeams] = useState<any[]>([]);
  const [otherPoolsWithPlayers, setOtherPoolsWithPlayers] = useState<any[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);

  // Fetch all categories on mount
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [{ data: teamData }, { data: poolData }, { data: categoryData }] = await Promise.all([
        supabase.from('teams').select('*, pool:pools(*), team_players:team_players(player:t_players(*))'),
        supabase.from('pools').select('*, category:categories(*)'),
        supabase.from('categories').select('*').order('label'),
      ]);
      setTeams(teamData || []);
      setPools(poolData || []);
      setCategories(categoryData || []);
      setLoading(false);

      // Men's Team logic
      // Show all teams that have at least one player (team_players), regardless of pool or category
      const mensTeams = (teamData || [])
        .map((team: any) => ({
          ...team,
          players: team.team_players?.map((tp: any) => tp.player) || [],
          pool: team.pool,
        }))
        .filter((team: any) => team.players.length > 0);
      setMensTeams(mensTeams);
    }
    fetchAll();
  }, []);

  // Fetch pools with players for non-team categories
  useEffect(() => {
    async function fetchPoolsWithPlayers() {
      if (!selectedCategory) {
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
  }, [selectedCategory]);

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
        <div className="text-5xl mb-4 animate-float">👥</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white text-glow-white mb-4">
          Tournament Teams
        </h1>
        <p className="text-white/80 text-xl max-w-2xl mx-auto">
          Meet the competing teams and their players across all divisions
        </p>
      </div>

      {/* Teams Overview */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 animate-fade-in-scale mb-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white text-glow-white mb-2">📊 Teams Overview</h2>
          <p className="text-white/80">Complete list of registered teams</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-200/30">
            <div className="text-3xl font-bold text-blue-300 mb-2">{teams.length}</div>
            <div className="text-white/80 text-sm">Total Teams</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-200/30">
            <div className="text-3xl font-bold text-green-300 mb-2">{pools.length}</div>
            <div className="text-white/80 text-sm">Active Pools</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-200/30">
            <div className="text-3xl font-bold text-purple-300 mb-2">
              {Math.round(teams.length / Math.max(pools.length, 1))}
            </div>
            <div className="text-white/80 text-sm">Avg per Pool</div>
          </div>
        </div>
      </div>

      {/* Men's Team Section */}
      {mensTeams.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white text-glow-white mb-6">Mens Team</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {mensTeams.map((team: any) => (
              <div key={team.id} className="bg-gradient-to-br from-blue-100/60 to-green-100/60 rounded-2xl p-6 border border-blue-200/40 shadow-lg hover-lift transition-all duration-200">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">👥</span>
                  <span className="font-bold text-gray-900 text-base text-glow">{team.name}</span>
                </div>
                <div className="text-xs text-gray-600 font-medium bg-white/60 rounded px-2 py-1 mb-2 shadow-sm">
                  Pool: {team.pool?.name || 'Unassigned'}
                </div>
                <div className="w-full">
                  {team.players.length === 0 ? (
                    <span className="text-xs text-gray-400">No players assigned yet</span>
                  ) : (
                    <ul className="list-disc pl-4">
                      {team.players.map((player: any, pIdx: number) => (
                        <li key={player.id || pIdx} className="text-sm text-gray-800 font-medium truncate">
                          {player.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pools with Players for Other Categories */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale mb-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🏸</div>
          <h2 className="text-3xl font-bold text-white text-glow-white mb-2">Pools with Players</h2>
          <p className="text-white/80 text-lg">View players assigned to pools by category</p>
        </div>
        {/* Category Filter */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-white/80 mb-2">Select Category:</label>
          <select
            className="w-full px-4 py-3 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white/90 backdrop-blur-sm"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">-- Choose a category --</option>
            {categories.filter((cat: any) => {
              const playerCat = getPlayerCategoryFromCategory(cat);
              return cat.type !== 'team' && (!playerCat || categoryTypes[playerCat] !== 'team');
            }).map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.label || cat.code}
              </option>
            ))}
          </select>
        </div>
        {/* Pools Display */}
        {!selectedCategory ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-float">🏸</div>
            <h3 className="text-xl font-medium text-white mb-2">Select a category</h3>
            <p className="text-white/80">Choose a category to view pools and assigned players</p>
          </div>
        ) : poolsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Loading pools...</p>
          </div>
        ) : otherPoolsWithPlayers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-float">🏊</div>
            <h3 className="text-xl font-medium text-white mb-2">No pools found</h3>
            <p className="text-white/80">No pools have been created for this category yet</p>
          </div>
        ) : (
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
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white text-glow-white">{pool.name}</h3>
                  </div>
                  {pool.players.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2">📝</div>
                      <p className="text-white/80">No {participantLabel} assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pool.players.map((player: any, playerIndex: number) => {
                        const displayName = isPairCategory && player.partner_name
                          ? `${player.name} / ${player.partner_name}`
                          : player.name;
                        return (
                          <div
                            key={player.id}
                            className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/10 hover-lift transition-all duration-200"
                            style={{ animationDelay: `${(poolIndex * 0.1) + (playerIndex * 0.05)}s` }}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 text-white font-bold text-sm">
                                {player.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-medium">{displayName}</div>
                                {player.level && (
                                  <div className="text-white/60 text-xs mt-1">
                                    Level: {player.level}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 