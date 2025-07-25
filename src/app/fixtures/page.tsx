'use client';

import { useState, useEffect, useCallback } from 'react';
import { Match, Category } from '@/types';
import { useData } from '@/contexts/DataContext';
import FixtureMatchCard from './FixtureMatchCard';
import { useSearchParams, useRouter } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [fixtures, setFixtures] = useState<FixtureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'pool' | 'schedule'>('schedule');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Initialize selectedCategory from URL query parameter
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  // Update URL when category changes
  const updateCategory = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    router.push(`/fixtures?${params.toString()}`);
  };

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
      } else {
        // For matches without pool_id, create a placeholder pool object
        enrichedMatch.pool = {
          id: 'cross-pool',
          name: 'Cross-Pool Matches',
          max_teams: 0,
          category_id: match.category_id || null
        };
      }

      enrichedMatches.push(enrichedMatch);
    }

    return enrichedMatches;
  }, [teams, players, pools]);

  const fetchFixtures = useCallback(async (categoryCode: string) => {
    setLoading(true);
    try {
      console.log('Fetching fixtures for category:', categoryCode);
      console.log('Available categories:', categories.map(c => `${c.code}: ${c.label} (${c.id})`));
      console.log('Available pools:', pools.map(p => `${p.name} (category_id: ${p.category_id})`));
      console.log('Total cached matches:', cachedMatches.length);
      
      let matchesData: any[] = [];
      let categoryLabel = '';

      if (categoryCode === 'all') {
        // Show all matches for "All Categories"
        matchesData = cachedMatches;
        categoryLabel = 'All Categories';
        console.log('Showing all matches:', matchesData.length);
        
        // Debug: Check if all matches have valid pools and categories
        const validMatches = matchesData.filter(match => {
          // Handle matches with null pool_id (cross-pool or knockout matches)
          if (!match.pool_id) {
            console.log(`✓ Match ${match.id} has no pool_id (cross-pool/knockout match)`);
            return true;
          }
          
          const matchPool = pools.find(pool => pool.id === match.pool_id);
          if (!matchPool) {
            console.log(`❌ Match ${match.id} has invalid pool_id: ${match.pool_id}`);
            return false;
          }
          const matchCategory = categories.find(c => c.id === matchPool.category_id);
          if (!matchCategory) {
            console.log(`❌ Match ${match.id} pool ${matchPool.name} has invalid category_id: ${matchPool.category_id}`);
            return false;
          }
          console.log(`✓ Match ${match.id} pool ${matchPool.name} category ${matchCategory.code}`);
          return true;
        });
        
        console.log(`Valid matches: ${validMatches.length}/${matchesData.length}`);
        matchesData = validMatches;
        
        // Debug: Log category distribution
        const categoryCounts: { [key: string]: number } = {};
        const categoryDetails: { [key: string]: any[] } = {};
        matchesData.forEach(match => {
          let categoryCode = 'Unknown';
          let categoryLabel = 'Unknown';
          let poolName = 'Cross-Pool';
          
          if (match.pool_id) {
            const matchPool = pools.find(pool => pool.id === match.pool_id);
            if (matchPool) {
              const category = categories.find(c => c.id === matchPool.category_id);
              categoryCode = category?.code || 'Unknown';
              categoryLabel = category?.label || 'Unknown';
              poolName = matchPool.name;
            }
          } else {
            // For matches without pool_id, try to get category directly
            if (match.category_id) {
              const category = categories.find(c => c.id === match.category_id);
              categoryCode = category?.code || 'Unknown';
              categoryLabel = category?.label || 'Unknown';
            }
          }
          
          categoryCounts[categoryCode] = (categoryCounts[categoryCode] || 0) + 1;
          
          if (!categoryDetails[categoryCode]) {
            categoryDetails[categoryCode] = [];
          }
          categoryDetails[categoryCode].push({
            matchId: match.id,
            poolName: poolName,
            categoryId: match.pool_id ? pools.find(p => p.id === match.pool_id)?.category_id : match.category_id,
            categoryCode: categoryCode,
            categoryLabel: categoryLabel
          });
        });
        console.log('Category distribution:', categoryCounts);
        console.log('Category details:', categoryDetails);
        
        // Specifically check for FM matches
        if (categoryDetails['FM']) {
          console.log('FM matches found:', categoryDetails['FM']);
        } else {
          console.log('No FM matches found in data');
        }
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
          // Handle matches with null pool_id (cross-pool or knockout matches)
          if (!match.pool_id) {
            // For matches without pool_id, check if they have a category_id directly
            if (match.category_id) {
              const matchCategory = categories.find(c => c.id === match.category_id);
              if (matchCategory && matchCategory.code === selectedCategory.code) {
                console.log(`✓ Match ${match.id} (no pool) matches category ${selectedCategory.code}`);
                return true;
              }
            }
            console.log(`Match ${match.id} has no pool_id and no matching category_id`);
            return false;
          }
          
          // Find the pool for this match from cached pools data
          const matchPool = pools.find(pool => pool.id === match.pool_id);
          if (!matchPool) {
            console.log(`Pool not found for match ${match.id} with pool_id ${match.pool_id}`);
            return false;
          }
          
          // Get the category for this pool
          const matchCategory = categories.find(c => c.id === matchPool.category_id);
          if (!matchCategory) {
            console.log(`Category not found for pool ${matchPool.name} with category_id ${matchPool.category_id}`);
            return false;
          }
          
          // Debug: Log category matching for all categories
          console.log(`Category filter: Match ${match.id} (pool: ${matchPool.name}) has category ${matchCategory.code} vs selected ${selectedCategory.code}`);
          
          // Check if the pool's category matches the selected category
          if (matchCategory.code === selectedCategory.code) {
            console.log(`✓ Match ${match.id} matches category ${selectedCategory.code}`);
            return true;
          }
          
          return false;
        });

        categoryLabel = selectedCategory.label;
        console.log(`Showing ${matchesData.length} matches for category ${categoryCode}:`, selectedCategory.label);
        console.log('Filtered matches:', matchesData.map(m => ({ id: m.id, pool_id: m.pool_id, scheduled_date: m.scheduled_date })));
      }

      if (!matchesData || matchesData.length === 0) {
        console.log('No matches found for category:', categoryCode);
        setFixtures(null);
        setLoading(false);
        return;
      }

      // Enrich matches with player/team data based on category type
      const selectedCategory = categoryCode === 'all' ? categories[0] : categories.find(cat => cat.code === categoryCode);
      console.log('Enriching matches with category:', selectedCategory?.code, selectedCategory?.label);
      
      const enrichedMatches = enrichMatchesWithDetails(matchesData, selectedCategory || { 
        id: 'default', 
        code: 'MT', 
        label: 'Men\'s Team', 
        type: 'team' 
      });

      console.log('Enrichment complete. Input matches:', matchesData.length, 'Output matches:', enrichedMatches.length);
      console.log('Enriched match IDs:', enrichedMatches.map(m => m.id));

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
    // Handle matches with null pool_id (cross-pool or knockout matches)
    if (!match.pool_id) {
      // Try to get category directly from match
      if (match.category_id) {
        const category = categories.find(c => c.id === match.category_id);
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
    }
    
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
    console.log('groupMatchesByPool called with:', matches.length, 'matches');
    const grouped: { [poolName: string]: Match[] } = {};
    
    matches.forEach(match => {
      let poolName = 'Unknown Pool';
      
      // Handle matches with null pool_id
      if (!match.pool_id) {
        poolName = 'Cross-Pool Matches';
      } else {
        poolName = match.pool?.name || 'Unknown Pool';
      }
      
      console.log('Processing match:', match.id, 'pool:', poolName);
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
    
    // Track matches without scheduled dates
    const unscheduledMatches: Match[] = [];
    
    matches.forEach(match => {
      // Only process matches that have a scheduled date
      if (!match.scheduled_date) {
        console.log('Skipping match without scheduled_date:', match.id, 'Category:', getMatchCategory(match)?.code);
        unscheduledMatches.push(match);
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
    
    // Add unscheduled matches as a separate group
    if (unscheduledMatches.length > 0) {
      sortedGroups['Unscheduled Matches'] = unscheduledMatches;
      console.log('Added unscheduled matches:', unscheduledMatches.length);
    }
    
    return sortedGroups;
  };

  // --- Compute filtered date groups and keys at top level ---
  const filteredDateGroups: { [dateKey: string]: Match[] } = {};
  let filteredDateKeys: string[] = [];
  let dateGroups: { [dateKey: string]: Match[] } = {};
  if (fixtures) {
    dateGroups = groupMatchesBySchedule(fixtures.matches);
    const dateKeys = Object.keys(dateGroups);
    for (const dateKey of dateKeys) {
      const matches = dateGroups[dateKey];
      filteredDateGroups[dateKey] = statusFilter === 'all' ? matches : matches.filter(m => m.status === statusFilter);
    }
    filteredDateKeys = Object.keys(filteredDateGroups)
      .filter(dateKey => filteredDateGroups[dateKey].length > 0)
      .filter(dateKey => {
        // Only allow valid dates (not 'Invalid Date')
        const [date] = dateKey.split(' - ');
        const [day, month, year] = date.split('/');
        const d = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
        return d instanceof Date && !isNaN(d.getTime());
      });

      filteredDateKeys = filteredDateKeys.slice(0, 7);
  }

  // --- useEffect to update selectedDate if not in filteredDateKeys ---
  // Helper: get next upcoming date key (today or future, with at least one match of selected status)
  const getNextUpcomingDateKey = (dateGroups: { [dateKey: string]: Match[] }, status: string) => {
    const now = new Date();
    const dateKeys = Object.keys(dateGroups);
    for (const dateKey of dateKeys) {
      const [date] = dateKey.split(' - ');
      const [day, month, year] = date.split('/');
      const dateObj = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
      if (dateObj >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        const matches = dateGroups[dateKey];
        const filtered = status === 'all' ? matches : matches.filter(m => m.status === status);
        if (filtered.length > 0) return dateKey;
      }
    }
    // fallback: first date with any matches for status
    for (const dateKey of dateKeys) {
      const matches = dateGroups[dateKey];
      const filtered = status === 'all' ? matches : matches.filter(m => m.status === status);
      if (filtered.length > 0) return dateKey;
    }
    return dateKeys[0] || '';
  };

  // Fix: useEffect at top level
  useEffect(() => {
    if (!fixtures) return;
    if (filteredDateKeys.length === 0) return;
    if (!filteredDateKeys.includes(selectedDate)) {
      const nextKey = getNextUpcomingDateKey(filteredDateGroups, statusFilter);
      setSelectedDate(nextKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fixtures, selectedCategory, viewMode]);

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

      {/* Match Status Dropdown (only for schedule view) */}
      {viewMode === 'schedule' && (
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
            <label htmlFor="status-filter" className="text-white/80 font-semibold text-sm">Match Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20 text-sm"
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}

      {/* Category Selector as Tabs */}
      {categories.length > 0 && (
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateCategory('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm
                ${selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-blue-500/60'}`}
              style={{ minWidth: 120 }}
            >
              🏆 All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => updateCategory(cat.code)}
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
              const currentSelectedDate = filteredDateKeys.includes(selectedDate) ? selectedDate : (filteredDateKeys.length > 0 ? filteredDateKeys[0] : '');
              const selectedMatches = currentSelectedDate ? filteredDateGroups[currentSelectedDate] : [];
              
              console.log('Schedule view - Total matches:', fixtures.matches.length);
              console.log('Schedule view - Date groups:', filteredDateKeys);
              console.log('Schedule view - Selected date:', selectedDate);
              
              // Use the first date if none is selected or if selected date doesn't exist
              const selectedDateFormatted = currentSelectedDate ? (() => {
                try {
                  const [dateKey] = currentSelectedDate.split(' - ');
                  const [day, month, year] = dateKey.split('/');
                  const dateObj = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
                  return dateObj.toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                } catch (error) {
                  console.error('Error formatting date:', error);
                  return currentSelectedDate;
                }
              })() : 'Select a date';
              
              return (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  
                  {/* Content with Vertical Tabs */}
                  <div className="flex gap-6">
                    {/* Vertical Date Tabs */}
                    <div className="flex flex-col gap-1 min-w-[40px]">
                      {filteredDateKeys.map((dateKey) => {
                        let shortDate = dateKey;
                        try {
                          const [date] = dateKey.split(' - ');
                          const [day, month, year] = date.split('/');
                          const dateObj = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
                          shortDate = dateObj.toLocaleDateString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          });
                        } catch (error) {
                          console.error('Error formatting short date:', error);
                        }
                        
                        return (
                          <button
                            key={dateKey}
                            onClick={() => setSelectedDate(dateKey)}
                            className={`px-1 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm writing-mode-vertical
                              ${currentSelectedDate === dateKey ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-blue-500/60'}`}
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
                    {currentSelectedDate && (
                      <div className="flex-1">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">{selectedDateFormatted}</h3>
                        </div>

                        {/* Matches List */}
                        <div className="space-y-2">
                          {selectedMatches && selectedMatches.length > 0 ? (
                            selectedMatches.map((match) => (
                              <FixtureMatchCard 
                                key={match.id} 
                                match={match} 
                                category={getMatchCategory(match)} 
                              />
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-white/60">No matches for this status on this date</p>
                            </div>
                          )}
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
