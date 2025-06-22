'use client';

import { useEffect, useState } from 'react';
import { supabase, signOut } from '@/lib/store';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pools: 0, teams: 0, players: 0, categories: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const [{ count: pools }, { count: teams }, { count: players }, { count: categories }] = await Promise.all([
        supabase.from('pools').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true })
      ]);
      setStats({
        pools: typeof pools === 'number' ? pools : 0,
        teams: typeof teams === 'number' ? teams : 0,
        players: typeof players === 'number' ? players : 0,
        categories: typeof categories === 'number' ? categories : 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your badminton tournament from here</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pools</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : stats.pools}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🏊‍♂️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-3xl font-bold text-green-600">
                  {loading ? '...' : stats.teams}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-3xl font-bold text-purple-600">
                  {loading ? '...' : stats.players}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">🏸</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-orange-600">
                  {loading ? '...' : stats.categories}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/pools" className="group">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Tournament Management</h3>
                <span className="text-2xl">🏊‍♂️</span>
              </div>
              <p className="text-gray-600 mb-4">Create and manage tournament pools and fixtures</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">
                Manage Tournament →
              </div>
            </div>
          </Link>

          <Link href="/admin/players" className="group">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Manage Players</h3>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-gray-600 mb-4">Add and manage tournament players</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">
                Manage Players →
              </div>
            </div>
          </Link>

          <Link href="/tournaments" className="group">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Public View</h3>
                <span className="text-2xl">👁️</span>
              </div>
              <p className="text-gray-600 mb-4">View tournament as public users see it</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">
                View Public Page →
              </div>
            </div>
          </Link>

          <Link href="/standings" className="group">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">View Standings</h3>
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-gray-600 mb-4">Check current tournament standings</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">
                View Standings →
              </div>
            </div>
          </Link>

          <Link href="/teams" className="group">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">View Teams</h3>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-gray-600 mb-4">See all registered teams and players</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">
                View Teams →
              </div>
            </div>
          </Link>

          <Link href="/rules" className="group">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Tournament Rules</h3>
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-gray-600 mb-4">View and edit tournament rules</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700">
                View Rules →
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-lg mr-3">📊</span>
              <div>
                <p className="font-medium text-gray-800">Tournament Statistics Updated</p>
                <p className="text-sm text-gray-600">Latest standings and match results</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-lg mr-3">🏸</span>
              <div>
                <p className="font-medium text-gray-800">Match Schedule Generated</p>
                <p className="text-sm text-gray-600">New fixtures created for all pools</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-lg mr-3">👥</span>
              <div>
                <p className="font-medium text-gray-800">Team Registration</p>
                <p className="text-sm text-gray-600">New teams added to the tournament</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 