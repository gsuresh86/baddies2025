'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';

export default function LandingPage() {
  const [stats, setStats] = useState({ pools: 0, teams: 0, players: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="w-full max-w-5xl mt-16 px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="bg-blue-50/60 rounded-2xl p-10 flex flex-col items-center shadow-xl border border-blue-100 backdrop-blur-md hover:scale-105 transition-transform cursor-pointer">
          <span className="text-5xl font-extrabold text-blue-700 drop-shadow">{loading ? '...' : stats.pools}</span>
          <span className="text-lg text-gray-700 mt-2 font-semibold">Pools</span>
        </div>
        <div className="bg-green-50/60 rounded-2xl p-10 flex flex-col items-center shadow-xl border border-green-100 backdrop-blur-md hover:scale-105 transition-transform cursor-pointer">
          <span className="text-5xl font-extrabold text-green-700 drop-shadow">{loading ? '...' : stats.teams}</span>
          <span className="text-lg text-gray-700 mt-2 font-semibold">Teams</span>
        </div>
        <div className="bg-purple-50/60 rounded-2xl p-10 flex flex-col items-center shadow-xl border border-purple-100 backdrop-blur-md hover:scale-105 transition-transform cursor-pointer">
          <span className="text-5xl font-extrabold text-purple-700 drop-shadow">{loading ? '...' : stats.players}</span>
          <span className="text-lg text-gray-700 mt-2 font-semibold">Players</span>
        </div>
        <div className="bg-yellow-50/60 rounded-2xl p-10 flex flex-col items-center shadow-xl border border-yellow-100 backdrop-blur-md hover:scale-105 transition-transform cursor-pointer">
          <span className="text-5xl font-extrabold text-yellow-700 drop-shadow">{loading ? '...' : stats.categories}</span>
          <span className="text-lg text-gray-700 mt-2 font-semibold">Categories</span>
        </div>
      </div>
    </div>
  );
}
