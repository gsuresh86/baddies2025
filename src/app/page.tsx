'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    <div className="w-full max-w-6xl mt-8 px-2 sm:px-4 mx-auto">
      {/* Enhanced Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="group bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-3xl p-8 flex flex-col items-center shadow-2xl border border-blue-200/50 backdrop-blur-md hover-lift relative overflow-hidden animate-fade-in-scale" style={{animationDelay: '0.1s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="text-6xl font-black text-blue-700 drop-shadow-lg mb-3 animate-pulse-glow">
              {loading ? '...' : stats.pools}
            </div>
            <div className="text-xl text-white font-bold text-center">🏊‍♂️ Pools</div>
            <div className="text-sm text-white/80 text-center mt-1">Active Groups</div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-3xl p-8 flex flex-col items-center shadow-2xl border border-green-200/50 backdrop-blur-md hover-lift relative overflow-hidden animate-fade-in-scale" style={{animationDelay: '0.2s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="text-6xl font-black text-green-700 drop-shadow-lg mb-3 animate-pulse-glow">
              {loading ? '...' : stats.teams}
            </div>
            <div className="text-xl text-white font-bold text-center">👥 Teams</div>
            <div className="text-sm text-white/80 text-center mt-1">Registered</div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-3xl p-8 flex flex-col items-center shadow-2xl border border-purple-200/50 backdrop-blur-md hover-lift relative overflow-hidden animate-fade-in-scale" style={{animationDelay: '0.3s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="text-6xl font-black text-purple-700 drop-shadow-lg mb-3 animate-pulse-glow">
              {loading ? '...' : stats.players}
            </div>
            <div className="text-xl text-white font-bold text-center">🏸 Players</div>
            <div className="text-sm text-white/80 text-center mt-1">Competing</div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-yellow-500/20 to-orange-500/30 rounded-3xl p-8 flex flex-col items-center shadow-2xl border border-yellow-200/50 backdrop-blur-md hover-lift relative overflow-hidden animate-fade-in-scale" style={{animationDelay: '0.4s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="text-6xl font-black text-yellow-700 drop-shadow-lg mb-3 animate-pulse-glow">
              {loading ? '...' : stats.categories}
            </div>
            <div className="text-xl text-white font-bold text-center">🏆 Categories</div>
            <div className="text-sm text-white/80 text-center mt-1">Divisions</div>
          </div>
        </div>
      </div>

      {/* Enhanced Tournament Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-200/30 hover-lift">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="text-xl font-bold text-white mb-2">Fast-Paced Action</h3>
          <p className="text-white/80">Witness intense rallies and strategic gameplay</p>
        </div>
        
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-200/30 hover-lift">
          <div className="text-4xl mb-3">🏅</div>
          <h3 className="text-xl font-bold text-white mb-2">Championship Glory</h3>
          <p className="text-white/80">Compete for prestigious titles and recognition</p>
        </div>
        
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-200/30 hover-lift">
          <div className="text-4xl mb-3">🤝</div>
          <h3 className="text-xl font-bold text-white mb-2">Sportsmanship</h3>
          <p className="text-white/80">Celebrate fair play and camaraderie</p>
        </div>
      </div>

      {/* Important Dates */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-200/30 text-center">
          <div className="text-3xl mb-3">📅</div>
          <h3 className="text-lg font-bold text-white mb-2">Tournament Dates</h3>
          <p className="text-white/80 font-semibold">12th Jul - 10th Aug 2025</p>
          <p className="text-white/60 text-sm mt-1">Weekend matches</p>
        </div>
        <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-200/30 text-center">
          <div className="text-3xl mb-3">⏰</div>
          <h3 className="text-lg font-bold text-white mb-2">Registration Deadline</h3>
          <p className="text-white/80 font-semibold">30 June 2025</p>
          <p className="text-white/60 text-sm mt-1">Dont miss out!</p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-8 mb-24 bg-black/80 rounded-2xl p-4 sm:p-6 border border-gray-800 animate-fade-in-scale" style={{animationDelay: '0.6s'}}>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 text-white">
          <div className="text-center min-w-[80px] flex-1">
            <div className="text-xl sm:text-2xl font-bold text-glow-white">🎯</div>
            <div className="text-xs sm:text-sm opacity-80">Precision</div>
          </div>
          <div className="text-center min-w-[80px] flex-1">
            <div className="text-xl sm:text-2xl font-bold text-glow-white">💪</div>
            <div className="text-xs sm:text-sm opacity-80">Strength</div>
          </div>
          <div className="text-center min-w-[80px] flex-1">
            <div className="text-xl sm:text-2xl font-bold text-glow-white">🧠</div>
            <div className="text-xs sm:text-sm opacity-80">Strategy</div>
          </div>
          <div className="text-center min-w-[80px] flex-1">
            <div className="text-xl sm:text-2xl font-bold text-glow-white">⚡</div>
            <div className="text-xs sm:text-sm opacity-80">Speed</div>
          </div>
          <div className="text-center min-w-[80px] flex-1">
            <div className="text-xl sm:text-2xl font-bold text-glow-white">🏆</div>
            <div className="text-xs sm:text-sm opacity-80">Victory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
