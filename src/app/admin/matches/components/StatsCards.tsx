import React from 'react';
import { Match } from '@/types';

interface StatsCardsProps {
  matches: Match[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ matches }) => {
  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const inProgressMatches = matches.filter(m => m.status === 'in_progress').length;
  const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;
  const cancelledMatches = matches.filter(m => m.status === 'cancelled').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Matches</p>
            <p className="text-xl sm:text-3xl font-bold text-blue-600">{totalMatches}</p>
          </div>
          <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
            <span className="text-lg sm:text-2xl">🏸</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600">{completedMatches}</p>
          </div>
          <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
            <span className="text-lg sm:text-2xl">✅</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
            <p className="text-xl sm:text-3xl font-bold text-purple-600">{inProgressMatches}</p>
          </div>
          <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
            <span className="text-lg sm:text-2xl">🔄</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Scheduled</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-600">{scheduledMatches}</p>
          </div>
          <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
            <span className="text-lg sm:text-2xl">⏰</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Cancelled</p>
            <p className="text-xl sm:text-3xl font-bold text-red-600">{cancelledMatches}</p>
          </div>
          <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
            <span className="text-lg sm:text-2xl">❌</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 