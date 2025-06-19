'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import Image from 'next/image';

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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Static Badminton Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/badminton1.jpg"
          alt="Badminton Background"
          fill
          priority
          quality={70}
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          draggable={false}
        />
        {/* Animated overlay for more attraction */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-white/40 to-green-400/60 pointer-events-none" style={{zIndex:1}} />
      </div>
      
      {/* Stats Full View with glassmorphism and hover effect */}
      <div className="relative z-10 w-full max-w-5xl mt-16 px-4">
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
        <div className="flex justify-center mt-10">
          <Link
            href="/tournaments"
            className="px-10 py-4 bg-gradient-to-r from-blue-700 to-green-500 text-white rounded-xl text-2xl font-bold shadow-xl hover:from-blue-800 hover:to-green-600 transition-all border-2 border-white/40 backdrop-blur-md"
          >
            Explore Tournaments
          </Link>
        </div>
      </div>
      {/* Decorative Shuttlecock */}
      <div className="absolute bottom-8 right-8 w-24 h-24 opacity-60 rotate-12 pointer-events-none select-none rounded-full overflow-hidden border-4 border-white shadow-lg" style={{ zIndex: 1 }}>
        <Image
          src="/badminton1.jpg"
          alt="Shuttlecock"
          fill
          sizes="96px"
          style={{ objectFit: 'cover' }}
          draggable={false}
        />
      </div>
    </div>
  );
}
