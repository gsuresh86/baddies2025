'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { Team, Pool } from '@/types';
import Link from 'next/link';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  // Pools with players section
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [poolsWithPlayers, setPoolsWithPlayers] = useState<any[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: teamData }, { data: poolData }] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('pools').select('*')
      ]);
      
      setTeams(teamData || []);
      setPools(poolData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Fetch categories for pools with players section
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('label');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch pools with players for selected category
  const fetchPoolsWithPlayers = async (categoryId: string) => {
    if (!categoryId) return;
    
    setPoolsLoading(true);
    try {
      // Get pools for the selected category
      const { data: poolsData, error: poolsError } = await supabase
        .from('pools')
        .select('*, category:categories(*)')
        .eq('category_id', categoryId);
      
      if (poolsError) throw poolsError;
      
      // Get pool players for each pool
      const poolsWithPlayersData = await Promise.all(
        (poolsData || []).map(async (pool) => {
          const { data: poolPlayersData, error: poolPlayersError } = await supabase
            .from('pool_players')
            .select('*, player:t_players(*)')
            .eq('pool_id', pool.id);
          
          if (poolPlayersError) throw poolPlayersError;
          
          return {
            ...pool,
            players: poolPlayersData?.map(pp => pp.player).filter(Boolean) || []
          };
        })
      );
      
      setPoolsWithPlayers(poolsWithPlayersData);
    } catch (err) {
      console.error('Error fetching pools with players:', err);
    } finally {
      setPoolsLoading(false);
    }
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch pools with players when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchPoolsWithPlayers(selectedCategory);
    } else {
      setPoolsWithPlayers([]);
    }
  }, [selectedCategory]);

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

      {teams.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20">
            <div className="text-4xl mb-4">🏸</div>
            <p className="text-white text-lg">No teams registered yet. Teams will appear here once they&apos;re added to the tournament.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Teams Overview */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 animate-fade-in-scale">
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

          {/* Teams by Pool */}
          {pools.map((pool, poolIndex) => {
            const poolTeams = teams.filter(team => 
              team.pool_id === pool.id
            );
            
            return (
              <div key={pool.id} className="animate-fade-in-scale" style={{animationDelay: `${poolIndex * 0.1}s`}}>
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl hover-lift">
                  <div className="flex items-center mb-6">
                    <div className="text-3xl mr-4">🏊‍♂️</div>
                    <h3 className="text-2xl font-bold text-white text-glow-white">{pool.name}</h3>
                    <div className="ml-auto bg-gradient-to-r from-blue-600/50 to-purple-600/50 rounded-full px-4 py-2">
                      <span className="text-white font-bold">{poolTeams.length} Teams</span>
                    </div>
                  </div>
                  
                  {poolTeams.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2">📝</div>
                      <p className="text-white/80">No teams assigned to this pool yet.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {poolTeams.map((team, teamIndex) => (
                        <Link 
                          key={team.id}
                          href={`/teams/${team.id}`}
                          className="block"
                        >
                          <div 
                            className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover-lift transition-all duration-300 cursor-pointer"
                            style={{animationDelay: `${(poolIndex * 0.1) + (teamIndex * 0.05)}s`}}
                          >
                            <div className="flex items-center mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 text-white font-bold text-lg">
                                {team.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-white font-bold text-lg">{team.name}</h4>
                                <p className="text-white/60 text-sm">Team #{team.id.slice(0, 8)}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-white/70">Pool:</span>
                                <span className="text-white font-medium">{pool.name}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-white/70">Status:</span>
                                <span className="text-green-300 font-medium">Active</span>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <div className="flex justify-center">
                                <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg px-3 py-1">
                                  <span className="text-white text-sm font-medium">View Details</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pools with Players Section */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale" style={{animationDelay: '0.8s'}}>
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
            {categories.map(cat => (
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
        ) : poolsWithPlayers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-float">🏊</div>
            <h3 className="text-xl font-medium text-white mb-2">No pools found</h3>
            <p className="text-white/80">No pools have been created for this category yet</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {poolsWithPlayers.map((pool, poolIndex) => {
              const isPairCategory = pool.category?.type === 'pair';
              const participantLabel = isPairCategory ? 'pairs' : 'players';
              
              return (
                <div 
                  key={pool.id} 
                  className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover-lift transition-all duration-300"
                  style={{animationDelay: `${poolIndex * 0.1}s`}}
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
                            style={{animationDelay: `${(poolIndex * 0.1) + (playerIndex * 0.05)}s`}}
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