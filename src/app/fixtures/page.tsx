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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [fixtures, setFixtures] = useState<FixtureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'pool' | 'schedule'>('schedule');
  const [selectedDate, setSelectedDate] = useState<string>('');

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
      
      let matchesData: any[] = [];
      let categoryLabel = '';

      if (categoryCode === 'all') {
        // Show all matches for "All Categories"
        matchesData = cachedMatches;
        categoryLabel = 'All Categories';
        console.log('Showing all matches:', matchesData.length);
      } else {
        // Filter matches by selected category
        const selectedCategory = categories.find(cat => cat.code === categoryCode);
        if (!selectedCategory) {
          console.log('Category not found:', categoryCode);
          setFixtures(null);
          setLoading(false);
          return;
        }

        // Filter matches that belong to the selected category
        matchesData = cachedMatches.filter(match => {
          // Find the pool for this match from cached pools data
          const matchPool = pools.find(pool => pool.id === match.pool_id);
          if (!matchPool) {
            console.log(`Pool not found for match ${match.id} with pool_id ${match.pool_id}`);
            return false;
          }
          
          // Check if the pool's category_id matches the selected category
          if (matchPool.category_id === selectedCategory.id) {
            return true;
          }
          
          return false;
        });

        categoryLabel = selectedCategory.label;
        console.log(`Showing ${matchesData.length} matches for category ${categoryCode}:`, selectedCategory.label);
        console.log('Filtered matches:', matchesData.map(m => ({ id: m.id, pool_id: m.pool_id })));
      }

      if (!matchesData || matchesData.length === 0) {
        console.log('No matches found for category:', categoryCode);
        setFixtures(null);
        setLoading(false);
        return;
      }

      // Enrich matches with player/team data based on category type
      const selectedCategory = categoryCode === 'all' ? categories[0] : categories.find(cat => cat.code === categoryCode);
      const enrichedMatches = enrichMatchesWithDetails(matchesData, selectedCategory || { 
        id: 'default', 
        code: 'MT', 
        label: 'Men\'s Team', 
        type: 'team' 
      });

      setFixtures({
        category: categoryLabel,
        matches: enrichedMatches
      });

      console.log('Fixtures set successfully:', {
        category: categoryLabel,
        matchCount: enrichedMatches.length
      });

    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setFixtures(null);
    }
    setLoading(false);
  }, [categories, cachedMatches, enrichMatchesWithDetails, pools]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Set "all" as the default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      fetchFixtures(selectedCategory);
    }
  }, [selectedCategory, fetchFixtures, categories]);

  // Function to get the correct category for a match
  const getMatchCategory = (match: Match) => {
    // Find the pool for this match from cached pools data
    const matchPool = pools.find(pool => pool.id === match.pool_id);
    if (!matchPool) {
      console.log(`Pool not found for match ${match.id} with pool_id ${match.pool_id}`);
      // Fallback to first category
      return categories[0] || { 
        id: 'default', 
        code: 'MT', 
        label: 'Men\'s Team', 
        type: 'team' 
      };
    }
    
    // Get category from pool's category_id
    if (matchPool.category_id) {
      const category = categories.find(c => c.id === matchPool.category_id);
      if (category) {
        return category;
      }
    }
    
    // Fallback to first category
    return categories[0] || { 
      id: 'default', 
      code: 'MT', 
      label: 'Men\'s Team', 
      type: 'team' 
    };
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
    
    // Sort matches within each pool by scheduled date (if available)
    Object.keys(grouped).forEach(poolName => {
      grouped[poolName].sort((a, b) => {
        if (!a.scheduled_date && !b.scheduled_date) return 0;
        if (!a.scheduled_date) return 1;
        if (!b.scheduled_date) return -1;
        return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
      });
    });
    
    return grouped;
  };

  const groupMatchesBySchedule = (matches: Match[]) => {
    console.log('Grouping matches by schedule:', matches.length);
    
    // Convert to IST and group matches by date
    const groupedByDate: { [dateKey: string]: (Match & { _istDate: Date })[] } = {};
    
    matches.forEach(match => {
      // Only process matches that have a scheduled date
      if (!match.scheduled_date) {
        console.log('Skipping match without scheduled_date:', match.id);
        return; // Skip matches without scheduled date
      }
      
      // Convert UTC to IST using proper timezone conversion
      const utcDate = new Date(match.scheduled_date);
      
      // Create date key directly in IST timezone
      const dateKey = utcDate.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      // Create IST date for sorting
      const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      
      console.log(`Match ${match.id}: UTC=${match.scheduled_date}, IST=${istDate.toISOString()}, DateKey=${dateKey}`);
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push({
        ...match,
        _istDate: istDate // Store IST date for sorting
      });
    });
    
    // Sort matches within each date by actual scheduled time
    Object.keys(groupedByDate).forEach(dateKey => {
      groupedByDate[dateKey].sort((a, b) => {
        // Use the stored IST date for sorting
        const timeA = a._istDate.getTime();
        const timeB = b._istDate.getTime();
        
        // Sort by actual scheduled time (earliest first)
        return timeA - timeB;
      });
    });
    
    // Sort the dates and create final sorted groups
    const sortedGroups: { [dateTime: string]: Match[] } = {};
    Object.keys(groupedByDate)
      .sort((a, b) => {
        // Sort by IST date
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime(); // Ascending order by date
      })
      .forEach(dateKey => {
        // Remove the _istDate property before returning
        sortedGroups[`${dateKey} - All Times`] = groupedByDate[dateKey].map((matchObj) => {
          const match = { ...matchObj };
          delete (match as any)._istDate;
          return match;
        });
      });
    
    console.log('Sorted matches by IST date and time:', Object.keys(sortedGroups).length, 'date groups');
    console.log('Date groups:', Object.keys(sortedGroups));
    
    return sortedGroups;
  };

  if (loading || categories.length === 0) {
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

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 flex">
          <button
            onClick={() => setViewMode('pool')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${viewMode === 'pool' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/80 hover:bg-blue-500/60'}`}
          >
            📊 By Pool
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${viewMode === 'schedule' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/80 hover:bg-blue-500/60'}`}
          >
            📅 By Schedule
          </button>
        </div>
      </div>

      {/* Category Selector as Tabs */}
      {categories.length > 0 && (
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm
                ${selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-blue-500/60'}`}
              style={{ minWidth: 120 }}
            >
              🏆 All Categories
            </button>
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
      )}

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
          {viewMode === 'pool' ? (
            // Pool View
            Object.entries(groupMatchesByPool(fixtures.matches))
              .sort(([poolNameA], [poolNameB]) => {
                // Custom sorting for pool names
                const a = poolNameA.toLowerCase();
                const b = poolNameB.toLowerCase();
                
                // If both contain "pool", sort naturally (Pool A, Pool B, Pool C, etc.)
                if (a.includes('pool') && b.includes('pool')) {
                  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                }
                
                // If only one contains "pool", prioritize it
                if (a.includes('pool') && !b.includes('pool')) return -1;
                if (!a.includes('pool') && b.includes('pool')) return 1;
                
                // Otherwise, sort alphabetically
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
              })
              .map(([poolName, matches]) => (
              <div key={poolName} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                {/* Pool Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{poolName}</h2>
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full w-24"></div>
                </div>

                {/* Matches List */}
                <div className="space-y-2">
                  {matches.map((match) => (
                    <FixtureMatchCard 
                      key={match.id} 
                      match={match} 
                      category={getMatchCategory(match)} 
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Schedule View with Vertical Date Tabs Inside Card
            (() => {
              const dateGroups = groupMatchesBySchedule(fixtures.matches);
              const dateKeys = Object.keys(dateGroups);
              
              // Set the first date as selected if none is selected
              if (dateKeys.length > 0 && !selectedDate) {
                setSelectedDate(dateKeys[0]);
              }
              
              const selectedMatches = selectedDate ? dateGroups[selectedDate] : [];
              const selectedDateFormatted = selectedDate ? (() => {
                const [dateKey] = selectedDate.split(' - ');
                const [day, month, year] = dateKey.split('/');
                // Create date in IST by adding IST offset
                const dateObj = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
                return dateObj.toLocaleDateString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              })() : '';
              
              return (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  
                  {/* Content with Vertical Tabs */}
                  <div className="flex gap-6">
                    {/* Vertical Date Tabs */}
                    <div className="flex flex-col gap-1 min-w-[40px]">
                      {dateKeys.map((dateKey) => {
                        const [date] = dateKey.split(' - ');
                        const [day, month, year] = date.split('/');
                        // Create date in IST by adding IST offset
                        const dateObj = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
                        const shortDate = dateObj.toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        });
                        
                        return (
                          <button
                            key={dateKey}
                            onClick={() => setSelectedDate(dateKey)}
                            className={`px-1 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm writing-mode-vertical
                              ${selectedDate === dateKey ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-blue-500/60'}`}
                            style={{ 
                              writingMode: 'vertical-rl',
                              textOrientation: 'mixed',
                              minHeight: '80px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <span className="text-sm font-bold transform rotate-180">{shortDate}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Date Matches */}
                    {selectedDate && (
                      <div className="flex-1">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">{selectedDateFormatted}</h3>

                        </div>

                        {/* Matches List */}
                        <div className="space-y-2">
                          {selectedMatches.map((match) => (
                            <FixtureMatchCard 
                              key={match.id} 
                              match={match} 
                              category={getMatchCategory(match)} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
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
