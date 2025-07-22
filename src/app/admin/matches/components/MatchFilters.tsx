import React from 'react';
import { Category, Pool } from '@/types';

interface MatchFiltersProps {
  categories: Category[];
  pools: Pool[];
  activeCategoryIds: string[];
  selectedPool: string;
  statusFilter: string;
  dateFilter: string;
  stageFilter: string;
  onCategoryChange: (categoryIds: string[]) => void;
  onPoolChange: (poolId: string) => void;
  onStatusChange: (status: string) => void;
  onDateChange: (date: string) => void;
  onClearDate: () => void;
  onCreateMatch: () => void;
  onGenerateMatches: () => void;
  onExportExcel: () => void;
  onGenerateScoreSheets: () => void;
  onGenerateMensTeamSheets: () => void;
  onCreateCrossPoolMatch: () => void;
  onStageChange: (stage: string) => void;
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({
  categories,
  pools,
  activeCategoryIds,
  selectedPool,
  statusFilter,
  dateFilter,
  stageFilter,
  onCategoryChange,
  onPoolChange,
  onStatusChange,
  onDateChange,
  onClearDate,
  onCreateMatch,
  onGenerateMatches,
  onExportExcel,
  onGenerateScoreSheets,
  onGenerateMensTeamSheets,
  onCreateCrossPoolMatch,
  onStageChange
}) => {
  const statusOptions = [
    { value: '', label: 'All Status', icon: '🏸' },
    { value: 'scheduled', label: 'Scheduled', icon: '⏰' },
    { value: 'in_progress', label: 'In Progress', icon: '🔄' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' }
  ];
  const stageOptions = [
    { value: '', label: 'All Stages' },
    { value: 'Round 1', label: 'Round 1' },
    { value: 'R16', label: 'R16' },
    { value: 'QF', label: 'QF' },
    { value: 'SF', label: 'SF' },
    { value: 'F', label: 'F' }
  ];

  const actionButtons = [
    {
      label: 'Create Match',
      onClick: onCreateMatch,
      bgColor: 'bg-gray-900',
      hoverColor: 'hover:bg-gray-800'
    },
    {
      label: 'Generate Matches',
      onClick: onGenerateMatches,
      bgColor: 'bg-gray-700',
      hoverColor: 'hover:bg-gray-600'
    },
    {
      label: 'Export Excel',
      onClick: onExportExcel,
      bgColor: 'bg-gray-700',
      hoverColor: 'hover:bg-gray-600'
    },
    {
      label: 'Score Sheets',
      onClick: onGenerateScoreSheets,
      bgColor: 'bg-gray-700',
      hoverColor: 'hover:bg-gray-600'
    },
    {
      label: "Men's Team",
      onClick: onGenerateMensTeamSheets,
      bgColor: 'bg-gray-700',
      hoverColor: 'hover:bg-gray-600'
    },
    {
      label: 'Cross-Pool',
      onClick: onCreateCrossPoolMatch,
      bgColor: 'bg-gray-700',
      hoverColor: 'hover:bg-gray-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Filters & Actions</h3>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-700 text-sm font-bold">⚙️</span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              multiple
              value={activeCategoryIds.length === categories.length ? ['all', ...categories.map(c => c.id)] : activeCategoryIds}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                if (options.includes('all')) {
                  onCategoryChange(categories.map(c => c.id));
                } else {
                  onCategoryChange(options);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
              size={4}
            >
              <option value="all">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label || category.code}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple
            </div>
          </div>

          {/* Pool Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pool</label>
            <select
              value={selectedPool}
              onChange={(e) => onPoolChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
            >
              <option value="all">All Pools</option>
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
          {/* Stage Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Stage</label>
            <select
              value={stageFilter}
              onChange={(e) => onStageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
            >
              {stageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => onDateChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
              />
              {dateFilter && (
                <button
                  onClick={onClearDate}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  title="Clear date filter"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actionButtons.map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            className={`px-4 py-3 ${button.bgColor} ${button.hoverColor} text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md`}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}; 