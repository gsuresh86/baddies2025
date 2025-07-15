'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/store';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import ActivityLogSection from './ActivityLogSection';
import { useData } from '@/contexts/DataContext';
import { getUniquePlayersByName } from '@/lib/utils';
import { Match } from '@/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { format } from 'date-fns';

// Helper to group matches by scheduled_date
function getMatchesByDate(matches: Match[]): [string, number][] {
  const dateMap = new Map<string, number>();
  matches.forEach((m: Match) => {
    if (m.scheduled_date) {
      const date = new Date(m.scheduled_date).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    }
  });
  return Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pools: 0, teams: 0, players: 0, categories: 0 });
  const [loading, setLoading] = useState(true);
  const { matches, players } = useData();
  
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const [{ count: pools }, { count: teams }, { count: players }, { count: categories }] = await Promise.all([
        supabase.from('pools').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('t_players').select('*', { count: 'exact', head: true }),
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

  // Referee stats
  const refereeStats = matches
    .filter(m => m.match_referee && m.match_referee.trim() !== '')
    .reduce((acc, m) => {
      const name = m.match_referee!;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const allReferees = Object.entries(refereeStats)
    .sort((a, b) => b[1] - a[1]);

  // Prepare data for matches by date graph
  const matchesByDate = useMemo(() => getMatchesByDate(matches), [matches]);
  // Prepare data for recharts
  const matchesByDateData = matchesByDate.map(([date, count]) => ({ date, count, label: format(new Date(date), 'MMM dd') }));

  return (
    <AuthGuard>
      <div className="mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your badminton tournament from here</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Pools</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">
                  {loading ? '...' : stats.pools}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <span className="text-lg sm:text-2xl">🏊‍♂️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-xl sm:text-3xl font-bold text-green-600">
                  {loading ? '...' : stats.teams}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <span className="text-lg sm:text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-xl sm:text-3xl font-bold text-purple-600">
                  {loading ? '...' : getUniquePlayersByName(players).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <span className="text-lg sm:text-2xl">🏸</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Categories</p>
                <p className="text-xl sm:text-3xl font-bold text-orange-600">
                  {loading ? '...' : stats.categories}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <span className="text-lg sm:text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>
        {(allReferees.length > 0 || matchesByDateData.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 sm:mb-8">
            {/* Matches by Referee Card */}
            {allReferees.length > 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <span>🧑‍⚖️</span> Matches by Referee
                  </h3>
                </div>
                <ul className="divide-y divide-gray-100 flex-1 overflow-y-auto">
                  {allReferees.map(([name, count]) => (
                    <li key={name} className="flex items-center justify-between py-2">
                      <span className="font-medium text-gray-700 truncate">{name}</span>
                      <span className="font-bold text-cyan-700">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Matches Scheduled by Date Line Graph Card */}
            {matchesByDateData.length > 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <span>📅</span> Matches Scheduled by Date
                  </h3>
                </div>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[320px]" style={{ width: '100%', maxWidth: 500 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={matchesByDateData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} label={({ x, y, value }) => (
                          <text x={x} y={y - 10} textAnchor="middle" fontSize={12} fill="#3b82f6" fontWeight="bold">{value}</text>
                        )} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/admin/pools" className="group">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Tournament Management</h3>
                <span className="text-xl sm:text-2xl">🏊‍♂️</span>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Create and manage tournament pools and fixtures</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700 text-sm sm:text-base">
                Manage Tournament →
              </div>
            </div>
          </Link>

          <Link href="/admin/players" className="group">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Manage Players</h3>
                <span className="text-xl sm:text-2xl">👥</span>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Add and manage tournament players</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700 text-sm sm:text-base">
                Manage Players →
              </div>
            </div>
          </Link>

          <Link href="/tournaments" className="group">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Public View</h3>
                <span className="text-xl sm:text-2xl">👁️</span>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">View tournament as public users see it</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700 text-sm sm:text-base">
                View Public Page →
              </div>
            </div>
          </Link>

          <Link href="/standings" className="group">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">View Standings</h3>
                <span className="text-xl sm:text-2xl">🏆</span>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Check current tournament standings</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700 text-sm sm:text-base">
                View Standings →
              </div>
            </div>
          </Link>

          <Link href="/teams" className="group">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">View Teams</h3>
                <span className="text-xl sm:text-2xl">👥</span>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">See all registered teams and players</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700 text-sm sm:text-base">
                View Teams →
              </div>
            </div>
          </Link>

          <Link href="/rules" className="group">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Tournament Rules</h3>
                <span className="text-xl sm:text-2xl">📋</span>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">View and edit tournament rules</p>
              <div className="text-blue-600 font-medium group-hover:text-blue-700 text-sm sm:text-base">
                View Rules →
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <ActivityLogSection />
      </div>
    </AuthGuard>
  );
} 