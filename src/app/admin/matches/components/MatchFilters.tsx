import React from 'react';
import { Category, Pool } from '@/types';

interface MatchFiltersProps {
  categories: Category[];
  pools: Pool[];
  activeCategoryIds: string[];
  selectedPool: string;
  statusFilter: string;
  dateFilter: string;
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
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({
  categories,
  pools,
  activeCategoryIds,
  selectedPool,
  statusFilter,
  dateFilter,
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
  onCreateCrossPoolMatch
}) => {
  return (
    <div className="mb-6 flex flex-col gap-2 w-full max-w-2xl">
      <div className="flex flex-row gap-2 w-full flex-wrap">
        <div className="w-[180px] min-w-[180px]">
          <label htmlFor="category-select" className="text-sm font-medium text-gray-700">Category:</label>
          <select
            id="category-select"
            multiple
            value={activeCategoryIds}
            onChange={e => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              onCategoryChange(selectedOptions.length > 0 ? selectedOptions : ['all']);
            }}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
            style={{ height: '100px' }}
          >
            <option value="all">All</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="w-[180px] min-w-[180px]">
          <label htmlFor="pool-select" className="text-sm font-medium text-gray-700">Pool:</label>
          <select
            id="pool-select"
            value={selectedPool}
            onChange={e => onPoolChange(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          >
            <option value="all">All</option>
            {pools
              .filter(pool => activeCategoryIds.includes('all') || activeCategoryIds.includes(pool.category_id!))
              .map(pool => (
                <option key={pool.id} value={pool.id}>{pool.name}</option>
              ))}
          </select>
        </div>
        <div className="w-[180px] min-w-[180px]">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={e => onStatusChange(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
          >
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="w-[180px] min-w-[180px]">
          <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">Date:</label>
          <div className="flex items-center gap-1">
            <input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={e => onDateChange(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={onClearDate}
                className="ml-1 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold border border-gray-300"
                title="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mt-1">
        <button
          onClick={onCreateMatch}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
        >
          Match
        </button>
        <button
          onClick={onGenerateMatches}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
        >
          Matches
        </button>
        <button
          onClick={onExportExcel}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
        >
          Excel
        </button>
        <button
          onClick={onGenerateScoreSheets}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
        >
          Sheets
        </button>
        <button
          onClick={onGenerateMensTeamSheets}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
        >
          Men&apos;s Team
        </button>
        <button
          onClick={onCreateCrossPoolMatch}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-all text-base group"
        >
          Create Cross-Pool Match
        </button>
      </div>
    </div>
  );
}; 