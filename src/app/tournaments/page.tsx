'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentStore, supabase } from '@/lib/store';
import { Pool } from '@/types';

export default function TournamentsPage() {
  const [pools, setPools] = useState<Pool[]>([]); // teamCount will be added
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPools() {
      setLoading(true);
      try {
        const data = await tournamentStore.getPools();
        // For each pool, fetch team count
        const poolsWithTeamCount = await Promise.all(
          data.map(async (pool) => {
            const { count } = await supabase
              .from('teams')
              .select('*', { count: 'exact', head: true })
              .eq('pool_id', pool.id);
            return { ...pool, teamCount: count || 0 };
          })
        );
        setPools(poolsWithTeamCount);
      } catch (err) {
        console.error(err);
        setPools([]);
      }
      setLoading(false);
    }
    fetchPools();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Tournament Pools
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          View the current tournament pools and team assignments.
        </p>
      </div>

      {/* Tournament Overview Stats */}
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
                {pools.reduce((acc, pool) => acc + (pool.teamCount ?? 0), 0)}
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
              <p className="text-sm font-medium text-gray-600">Active Pools</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pools.filter(pool => (pool.teamCount ?? 0) > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Pools */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Tournament Pools</h2>
          <p className="text-gray-600 mt-1">View all tournament pools and their current status</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading pools...</p>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏊‍♂️</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No pools available yet</h3>
              <p className="text-gray-600">Tournament pools will be displayed here once they are created.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pools.map((pool) => (
                <div
                  key={pool.id}
                  className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{pool.name}</h3>
                    <span className="text-sm text-gray-500">
                      {pool.teamCount}/{pool.max_teams} teams
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Teams:</span>
                      <span className="font-medium">{pool.teamCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${(pool.teamCount ?? 0) > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {(pool.teamCount ?? 0) > 0 ? 'Active' : 'Empty'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/pool/${pool.id}`}
                      className="text-blue-600 text-sm font-medium hover:text-blue-700"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tournament Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📅 Tournament Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <p><strong>Tournament Dates:</strong> 12th Jul - 10th Aug 2025</p>
            <p><strong>Registration Deadline:</strong> 30 June 2025</p>
          </div>
          <div>
            <p><strong>Total Pools:</strong> {pools.length}</p>
            <p><strong>Total Teams:</strong> {pools.reduce((acc, pool) => acc + (pool.teamCount ?? 0), 0)}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/standings" className="group">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">View Standings</h3>
                <p className="text-gray-600">Check current tournament rankings</p>
              </div>
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </Link>
        
        <Link href="/teams" className="group">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">View Teams</h3>
                <p className="text-gray-600">See all registered teams and players</p>
              </div>
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
} 