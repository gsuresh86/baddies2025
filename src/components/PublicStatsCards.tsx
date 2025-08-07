'use client';

import React, { useEffect, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { getUniquePlayersByName } from '@/lib/utils';
import { supabase } from '@/lib/store';

export const PublicStatsCards: React.FC = () => {
  const { matches, players, teams, pools, categories, loading } = useData();
  const [gamesCount, setGamesCount] = useState(0);

  // Fetch games count
  useEffect(() => {
    async function fetchGamesCount() {
      const { count: games } = await supabase.from('games').select('*', { count: 'exact', head: true });
      setGamesCount(typeof games === 'number' ? games : 0);
    }
    fetchGamesCount();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Registration Stats Loading */}
        <div>
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-white mb-2 font-heading">Registration Statistics</h4>
            <p className="text-white/70 text-sm">Tournament participation overview</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white/10 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl"></div>
                  <div className="text-right">
                    <div className="h-8 w-12 bg-white/20 rounded"></div>
                  </div>
                </div>
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Match Stats Loading */}
        <div>
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-white mb-2 font-heading">Match Statistics</h4>
            <p className="text-white/70 text-sm">Tournament progress and game details</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white/10 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl"></div>
                  <div className="text-right">
                    <div className="h-8 w-12 bg-white/20 rounded"></div>
                  </div>
                </div>
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const totalPlayers = getUniquePlayersByName(players).length;
  const totalTeams = teams.length;
  const totalPools = pools.length;
  const totalCategories = categories.length;
  
  // Calculate additional statistics
  const completionPercentage = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  
  // Get total games directly from games table
  const mensTeamMatches = matches.filter(m => {
    const cat = categories.find(c => c.id === m.category_id);
    return cat?.code === 'MT';
  }).length;

  const totalGames = gamesCount + (matches.length - mensTeamMatches);

  // Registration Stats
  const registrationStats = [
    {
      label: 'Total Players',
      value: totalPlayers,
      icon: '👥',
      gradient: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/20',
      borderColor: 'border-indigo-300/30',
      suffix: ''
    },
    {
      label: 'Total Teams',
      value: totalTeams,
      icon: '🏆',
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-300/30',
      suffix: ''
    },
    {
      label: 'Tournament Pools',
      value: totalPools,
      icon: '🏊‍♂️',
      gradient: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-300/30',
      suffix: ''
    },
    {
      label: 'Categories',
      value: totalCategories,
      icon: '🎯',
      gradient: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-300/30',
      suffix: ''
    }
  ];

  // Match Stats
  const matchStats = [
    {
      label: 'Total Matches',
      value: totalMatches,
      icon: '🏸',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-300/30',
      suffix: ''
    },
    {
      label: 'Total Games',
      value: totalGames,
      icon: '🎮',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-300/30',
      suffix: ''
    },
    {
      label: 'Completed',
      value: completedMatches,
      icon: '✅',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-300/30',
      suffix: ''
    },
    {
      label: 'Completion %',
      value: completionPercentage,
      icon: '📈',
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-300/30',
      suffix: '%'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Registration Stats Section */}
      <div>
        <div className="text-center mb-6">
          <h4 className="text-xl font-bold text-white mb-2 font-heading">Registration Statistics</h4>
          <p className="text-white/70 text-sm">Tournament participation overview</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {registrationStats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {stat.value}{stat.suffix || ''}
                  </div>
                </div>
              </div>
              <div className="text-sm sm:text-base font-semibold text-white/90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Match Stats Section */}
      <div>
        <div className="text-center mb-6">
          <h4 className="text-xl font-bold text-white mb-2 font-heading">Match Statistics</h4>
          <p className="text-white/70 text-sm">Tournament progress and game details</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {matchStats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {stat.value}{stat.suffix || ''}
                  </div>
                </div>
              </div>
              <div className="text-sm sm:text-base font-semibold text-white/90">
                {stat.label}
              </div>
              {stat.label !== 'Total Matches' && stat.label !== 'Total Games' && stat.label !== 'Completion %' && (
                <div className="mt-3">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className={`h-2 bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-500`}
                      style={{ 
                        width: `${totalMatches > 0 ? (stat.value / totalMatches) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 