'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentStore } from '@/lib/store';
import { Pool } from '@/types';

export default function HomePage() {
  const [newPoolName, setNewPoolName] = useState('');
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPools() {
      setLoading(true);
      try {
        const data = await tournamentStore.getPools();
        setPools(data);
      } catch (err) {
        setPools([]);
      }
      setLoading(false);
    }
    fetchPools();
  }, []);

  const handleCreatePool = async () => {
    if (newPoolName.trim()) {
      await tournamentStore.createPool(newPoolName.trim());
      const data = await tournamentStore.getPools();
      setPools(data);
      setNewPoolName('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          PBEL Badminton Tournament 2025 Scheduler
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Manage your badminton tournament with pools, teams, and automatic match scheduling.
          Each match consists of 2 singles and 3 doubles games.
        </p>
      </div>

      {/* Create New Pool */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create New Pool</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newPoolName}
            onChange={(e) => setNewPoolName(e.target.value)}
            placeholder="Enter pool name (e.g., Pool A, Pool B)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            onKeyPress={(e) => e.key === 'Enter' && handleCreatePool()}
          />
          <button
            onClick={handleCreatePool}
            disabled={!newPoolName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Pool
          </button>
        </div>
      </div>

      {/* Existing Pools */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Tournament Pools</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading pools...</p>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No pools created yet. Create your first pool above!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pools.map((pool) => (
                <Link
                  key={pool.id}
                  href={`/pool/${pool.id}`}
                  className="block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{pool.name}</h3>
                    <span className="text-sm text-gray-500">
                      {(pool.teams?.length ?? 0)}/{pool.max_teams} teams
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Teams:</span>
                      <span className="font-medium">{pool.teams?.length ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Matches:</span>
                      <span className="font-medium">{pool.matches?.length ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium">
                        {pool.matches?.filter(m => m.completed).length ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-blue-600 text-sm font-medium">View Details →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pools</p>
              <p className="text-2xl font-semibold text-gray-900">{pools.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pools.reduce((acc, pool) => acc + (pool.teams?.length ?? 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pools.reduce((acc, pool) => acc + (pool.matches?.length ?? 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
