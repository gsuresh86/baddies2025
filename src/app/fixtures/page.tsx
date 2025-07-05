'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/store';
import { Match, Category } from '@/types';

interface FixtureData {
  category: string;
  matches: Match[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in_progress': return 'bg-yellow-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'cancelled': return 'Cancelled';
    default: return 'Scheduled';
  }
};

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

export default function FixturesPage() {
  const [selectedCategory, setSelectedCategory] = useState('WS');
  const [fixtures, setFixtures] = useState<FixtureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('label');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchFixtures = useCallback(async (categoryCode: string) => {
    setLoading(true);
    try {
      console.log('Fetching fixtures for category:', categoryCode);
      
      // Get category info
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('code', categoryCode)
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        setFixtures(null);
        setLoading(false);
        return;
      }

      console.log('Category data:', categoryData);

      if (!categoryData) {
        console.log('No category found for code:', categoryCode);
        setFixtures(null);
        setLoading(false);
        return;
      }

      // Get pools for this category
      const { data: poolsData, error: poolsError } = await supabase
        .from('pools')
        .select('*')
        .eq('category_id', categoryData.id)
        .order('name');

      if (poolsError) {
        console.error('Error fetching pools:', poolsError);
        setFixtures(null);
        setLoading(false);
        return;
      }

      console.log('Pools data:', poolsData);

      let matchesData: any[] = [];

      if (!poolsData || poolsData.length === 0) {
        console.log('No pools found for category:', categoryCode);
        // Try to get all matches if no pools found
        const { data: allMatchesData, error: allMatchesError } = await supabase
          .from('matches')
          .select('*')
          .order('created_at');

        if (allMatchesError) {
          console.error('Error fetching all matches:', allMatchesError);
          setFixtures(null);
          setLoading(false);
          return;
        }

        matchesData = allMatchesData || [];
        console.log('Using all matches as fallback:', matchesData.length);
      } else {
        // Get all matches for these pools
        const { data: poolMatchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .in('pool_id', poolsData.map(p => p.id))
          .order('created_at');

        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
          setFixtures(null);
          setLoading(false);
          return;
        }

        matchesData = poolMatchesData || [];
        console.log('Matches data for pools:', matchesData);
      }

      if (!matchesData || matchesData.length === 0) {
        console.log('No matches found at all');
        setFixtures(null);
        setLoading(false);
        return;
      }

      // Enrich matches with player/team data based on category type
      const enrichedMatches = await enrichMatchesWithDetails(matchesData, categoryData);

      setFixtures({
        category: categoryData.label,
        matches: enrichedMatches
      });

      console.log('Fixtures set successfully:', {
        category: categoryData.label,
        matchCount: enrichedMatches.length
      });

    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setFixtures(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchFixtures(selectedCategory);
    }
  }, [selectedCategory, fetchFixtures]);

  const enrichMatchesWithDetails = async (matches: any[], category: Category) => {
    const enrichedMatches = [];

    for (const match of matches) {
      const enrichedMatch = { ...match };

      if (category.code === 'MT') {
        // For Men's Team, get team details
        if (match.team1_id) {
          const { data: team1Data } = await supabase
            .from('teams')
            .select('*')
            .eq('id', match.team1_id)
            .single();
          enrichedMatch.team1 = team1Data;
        }
        if (match.team2_id) {
          const { data: team2Data } = await supabase
            .from('teams')
            .select('*')
            .eq('id', match.team2_id)
            .single();
          enrichedMatch.team2 = team2Data;
        }
      } else {
        // For other categories, get player details
        if (match.player1_id) {
          console.log(`Fetching player1 data for ID: ${match.player1_id}`);
          const { data: player1Data, error: player1Error } = await supabase
            .from('t_players')
            .select('*')
            .eq('id', match.player1_id)
            .single();
          
          if (player1Error) {
            console.error(`Error fetching player1 (${match.player1_id}):`, player1Error);
          } else {
            console.log(`Player1 data:`, player1Data);
          }
          enrichedMatch.player1 = player1Data;
        }
        if (match.player2_id) {
          console.log(`Fetching player2 data for ID: ${match.player2_id}`);
          const { data: player2Data, error: player2Error } = await supabase
            .from('t_players')
            .select('*')
            .eq('id', match.player2_id)
            .single();
          
          if (player2Error) {
            console.error(`Error fetching player2 (${match.player2_id}):`, player2Error);
          } else {
            console.log(`Player2 data:`, player2Data);
          }
          enrichedMatch.player2 = player2Data;
        }
      }

      // Get pool details
      if (match.pool_id) {
        const { data: poolData } = await supabase
          .from('pools')
          .select('*')
          .eq('id', match.pool_id)
          .single();
        enrichedMatch.pool = poolData;
      }

      enrichedMatches.push(enrichedMatch);
    }

    return enrichedMatches;
  };

  const getPlayerDisplayName = (match: Match, isFirst: boolean) => {
    if (selectedCategory === 'MT') {
      // For Men's Team, use team names
      const team = isFirst ? match.team1 : match.team2;
      return team?.name || `Team ${isFirst ? match.team1_id?.slice(0, 8) : match.team2_id?.slice(0, 8)}`;
    } else {
      // For other categories, use player names
      const player = isFirst ? match.player1 : match.player2;
      if (player) {
        // For pair categories, show both names if partner exists
        if (player.partner_name) {
          return `${player.name}\n${player.partner_name}`;
        }
        return player.name;
      }
      
      // Better fallback - try to get player name from database if not already loaded
      const playerId = isFirst ? match.player1_id : match.player2_id;
      if (playerId) {
        // Return a more descriptive fallback
        return `Player ${playerId.slice(0, 6)}...`;
      }
      
      return `Unknown Player`;
    }
  };

  const groupMatchesByPool = (matches: Match[]) => {
    const grouped: { [poolName: string]: Match[] } = {};
    
    matches.forEach(match => {
      const poolName = match.pool?.name || 'Unknown Pool';
      if (!grouped[poolName]) {
        grouped[poolName] = [];
      }
      grouped[poolName].push(match);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="text-4xl mb-4">🏸</div>
          <p className="text-white text-xl font-semibold">Loading tournament fixtures...</p>
          <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-5xl">🏸</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white" style={{textShadow: '0 0 20px rgba(255,255,255,0.8)'}}>
            Tournament Fixtures
          </h1>
        </div>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          Follow the complete tournament journey from Round 1 to the Finals
        </p>
      </div>

      {/* Category Selector */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          <label className="text-white/90 text-sm font-medium whitespace-nowrap" htmlFor="category-select">Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.code} className="text-gray-800">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fixtures Display */}
      {!fixtures ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-medium text-white mb-2">No fixtures found</h3>
          <p className="text-white/60 mb-4">
            No matches have been scheduled for {categoryLabels[selectedCategory] || selectedCategory} yet.
          </p>
          <div className="space-y-2">
            <button 
              onClick={async () => {
                console.log('Debug: Checking database...');
                const { data: allMatches } = await supabase.from('matches').select('*');
                const { data: allPools } = await supabase.from('pools').select('*');
                const { data: allCategories } = await supabase.from('categories').select('*');
                console.log('Debug - All matches:', allMatches?.length);
                console.log('Debug - All pools:', allPools?.length);
                console.log('Debug - All categories:', allCategories);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
            >
              Debug Database
            </button>
            <button 
              onClick={() => {
                console.log('Debug: Current fixtures data:', fixtures);
                if (fixtures) {
                  const fixtureData = fixtures as FixtureData;
                  console.log('Debug: Sample match structure:', fixtureData.matches[0]);
                  fixtureData.matches.forEach((match: Match, index: number) => {
                    console.log(`Match ${index}:`, {
                      id: match.id,
                      player1_id: match.player1_id,
                      player2_id: match.player2_id,
                      team1_id: match.team1_id,
                      team2_id: match.team2_id,
                      player1: match.player1,
                      player2: match.player2,
                      team1: match.team1,
                      team2: match.team2
                    });
                  });
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Debug Match Data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupMatchesByPool(fixtures.matches)).map(([poolName, matches]) => (
            <div key={poolName} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              {/* Pool Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{poolName}</h2>
                <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full w-24"></div>
              </div>

              {/* Matches Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {matches.map((match) => (
                  <div key={match.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200">
                    {/* Match Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-white/70 bg-white/10 px-2 py-1 rounded">
                        Match {match.id.slice(0, 8)}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(match.status || 'scheduled')}`}></div>
                    </div>

                    {/* Schedule Date and Court */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/70">
                        {match.scheduled_date ? new Date(match.scheduled_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="text-xs font-medium text-white/80 bg-white/10 px-2 py-1 rounded">
                        Court {match.court || ['C', 'G', 'K'][Math.floor(Math.random() * 3)]}
                      </span>
                    </div>

                    {/* Players/Teams in Single Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="text-sm font-medium text-white">
                          {getPlayerDisplayName(match, true).split('\n').map((line, index) => (
                            <div key={index} className={index > 0 ? 'text-xs text-white/80' : ''}>
                              {line}
                            </div>
                          ))}
                        </div>
                        {match.winner === (selectedCategory === 'MT' ? 'team1' : 'player1') && (
                          <span className="text-green-400 text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-xs text-white/50 mx-2">vs</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        {match.winner === (selectedCategory === 'MT' ? 'team2' : 'player2') && (
                          <span className="text-green-400 text-xs">✓</span>
                        )}
                        <div className="text-sm font-medium text-white text-right">
                          {getPlayerDisplayName(match, false).split('\n').map((line, index) => (
                            <div key={index} className={index > 0 ? 'text-xs text-white/80' : ''}>
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">
                        {getStatusText(match.status || 'scheduled')}
                      </span>
                      <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tournament Progress */}
      {fixtures && (
        <div className="mt-12 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Tournament Progress</h3>
            <p className="text-white/80">Track the completion status of matches</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-200/30">
              <div className="text-3xl font-bold text-blue-300 mb-2">{fixtures.matches.length}</div>
              <div className="text-white/80 text-sm">Total Matches</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-200/30">
              <div className="text-3xl font-bold text-green-300 mb-2">
                {fixtures.matches.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-white/80 text-sm">Completed</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-200/30">
              <div className="text-3xl font-bold text-yellow-300 mb-2">
                {fixtures.matches.filter(m => m.status === 'in_progress').length}
              </div>
              <div className="text-white/80 text-sm">In Progress</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-200/30">
              <div className="text-3xl font-bold text-gray-300 mb-2">
                {fixtures.matches.filter(m => m.status === 'scheduled').length}
              </div>
              <div className="text-white/80 text-sm">Scheduled</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
