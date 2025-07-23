import React from 'react';
import { Match } from '@/types';
import { Category } from '@/types';

interface StatsCardsProps {
  matches: Match[];
  gamesCount: number;
  categories: Category[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ matches, gamesCount, categories }) => {
  // Count men's team matches (category code 'MT')
  const mensTeamMatches = matches.filter(m => {
    const cat = categories.find(c => c.id === m.category_id);
    return cat?.code === 'MT';
  }).length;
  const totalGames = gamesCount + (matches.length - mensTeamMatches);
  const stats = [
    {
      label: 'Total Matches',
      value: matches.length,
      icon: '🏸',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-900'
    },
    {
      label: 'Completed',
      value: matches.filter(m => m.status === 'completed').length,
      icon: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    {
      label: 'In Progress',
      value: matches.filter(m => m.status === 'in_progress').length,
      icon: '🔄',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700'
    },
    {
      label: 'Scheduled',
      value: matches.filter(m => m.status === 'scheduled').length,
      icon: '⏰',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      label: 'Cancelled',
      value: matches.filter(m => m.status === 'cancelled').length,
      icon: '❌',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    },
    {
      label: 'Total Games',
      value: totalGames,
      icon: '🎮',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} border ${stat.borderColor} rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className="text-right">
              <div className={`text-2xl sm:text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </div>
            </div>
          </div>
          <div className="text-sm sm:text-base font-semibold text-gray-700">
            {stat.label}
          </div>
          {stat.label !== 'Total Games' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 ${stat.textColor.replace('text-', 'bg-')} rounded-full transition-all duration-500`}
                  style={{ 
                    width: `${matches.length > 0 ? (stat.value / matches.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 