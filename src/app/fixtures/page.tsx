'use client';

import { useState, useEffect, useCallback } from 'react';
import { Match, Category } from '@/types';
import { useData } from '@/contexts/DataContext';
import FixtureMatchCard from './FixtureMatchCard';

interface FixtureData {
  category: string;
  matches: Match[];
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

export default function FixturesPage() {
  const { players, teams, pools, categories, matches: cachedMatches } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>('MT');
  const [fixtures, setFixtures] = useState<FixtureData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    // Categories are now provided by DataContext, no need to fetch separately
    setLoading(false);
  };

  const enrichMatchesWithDetails = useCallback((matches: any[], category: Category) => {
    const enrichedMatches = [];

    for (const match of matches) {
      const enrichedMatch = { ...match };

      if (category.code === 'MT') {
        // For Men's Team, use cached team data
        if (match.team1_id) {
          const team1Data = teams.find(t => t.id === match.team1_id);
          enrichedMatch.team1 = team1Data;
        }
        if (match.team2_id) {
          const team2Data = teams.find(t => t.id === match.team2_id);
          enrichedMatch.team2 = team2Data;
        }
      } else {
        // For other categories, use cached player data
        if (match.player1_id) {
          const player1Data = players.find(p => p.id === match.player1_id);
          enrichedMatch.player1 = player1Data;
        }
        if (match.player2_id) {
          const player2Data = players.find(p => p.id === match.player2_id);
          enrichedMatch.player2 = player2Data;
        }
      }

      // Get pool details from cached data
      if (match.pool_id) {
        const poolData = pools.find(p => p.id === match.pool_id);
        enrichedMatch.pool = poolData;
      }

      enrichedMatches.push(enrichedMatch);
    }

    return enrichedMatches;
  }, [teams, players, pools]);

  const fetchFixtures = useCallback(async (categoryCode: string) => {
    setLoading(true);
    try {
      console.log('Fetching fixtures for category:', categoryCode);
      
      // Get category data from cached data
      const categoryData = categories.find(c => c.code === categoryCode);
      if (!categoryData) {
        console.error('Category not found:', categoryCode);
        setFixtures(null);
        setLoading(false);
        return;
      }

      // Get pools for this category from cached data
      const poolsData = pools.filter(p => p.category_id === categoryData.id);
      let matchesData: any[] = [];

      if (!poolsData || poolsData.length === 0) {
        console.log('No pools found for category:', categoryCode);
        // Use all cached matches if no pools found
        matchesData = cachedMatches;
        console.log('Using all cached matches as fallback:', matchesData.length);
      } else {
        // Get matches for these pools from cached data
        matchesData = cachedMatches.filter(match => 
          poolsData.some(pool => pool.id === match.pool_id)
        );
        console.log('Matches data for pools:', matchesData);
      }

      if (!matchesData || matchesData.length === 0) {
        console.log('No matches found at all');
        setFixtures(null);
        setLoading(false);
        return;
      }

      // Enrich matches with player/team data based on category type
      const enrichedMatches = enrichMatchesWithDetails(matchesData, categoryData);

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
  }, [categories, pools, cachedMatches, enrichMatchesWithDetails]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchFixtures(selectedCategory);
    }
  }, [selectedCategory, fetchFixtures]);

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

      {/* Category Selector as Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.code)}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm
                ${selectedCategory === cat.code ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-blue-500/60'}`}
              style={{ minWidth: 120 }}
            >
              {cat.label}
            </button>
          ))}
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

              {/* Matches List */}
              <div className="space-y-2">
                {matches.map((match) => (
                  <FixtureMatchCard key={match.id} match={match} category={categories.find(c => c.code === selectedCategory)!} />
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
