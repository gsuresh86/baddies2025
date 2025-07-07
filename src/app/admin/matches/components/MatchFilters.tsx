'use client';

import { Pool, Category } from '@/types';

interface MatchFiltersProps {
  pools: Pool[];
  categories: Category[];
  selectedPool: string;
  activeCategoryId: string;
  onPoolChange: (poolId: string) => void;
  onCategoryChange: (categoryId: string) => void;
}

export default function MatchFilters({
  pools,
  categories,
  selectedPool,
  activeCategoryId,
  onPoolChange,
  onCategoryChange
}: MatchFiltersProps) {
  return (
    <div className="mb-6 space-y-4 w-full md:w-1/2 max-w-md">
      <div className="flex flex-col gap-4 w-full">
        {/* Category Filter */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <select
            value={activeCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pool Filter */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Pool
          </label>
          <select
            value={selectedPool}
            onChange={(e) => onPoolChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Pools</option>
            {pools
              .filter(pool => activeCategoryId === 'all' || pool.category_id === activeCategoryId)
              .map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}