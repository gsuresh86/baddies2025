'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function LandingPage() {
  const [stats, setStats] = useState({ pools: 0, teams: 0, players: 0, categories: 0 });
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState({
    totalRegistrations: 0,
    uniqueParticipants: 0,
    playersByCategory: {} as Record<string, number>,
  });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const [poolsRes, teamsRes, playersRes, categoriesRes] = await Promise.all([
        supabase.from('pools').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('t_players').select('id,name,email,category'),
        supabase.from('categories').select('*', { count: 'exact', head: true })
      ]);
      const pools = poolsRes.count;
      const teams = teamsRes.count;
      const players = Array.isArray(playersRes.data) ? playersRes.data.length : 0;
      const categories = categoriesRes.count;
      setStats({
        pools: typeof pools === 'number' ? pools : 0,
        teams: typeof teams === 'number' ? teams : 0,
        players,
        categories: typeof categories === 'number' ? categories : 0,
      });

      // Calculate player stats
      const allPlayers = Array.isArray(playersRes.data) ? playersRes.data : [];
      // Unique by name or email
      const uniqueSet = new Set();
      allPlayers.forEach((p: any) => {
        if (p.email) {
          uniqueSet.add(p.email.toLowerCase());
        } else if (p.name) {
          uniqueSet.add(p.name.trim().toLowerCase());
        }
      });
      // Players by category
      const byCategory: Record<string, number> = {};
      allPlayers.forEach((p: any) => {
        if (p.category) {
          byCategory[p.category] = (byCategory[p.category] || 0) + 1;
        } else {
          byCategory['Unspecified'] = (byCategory['Unspecified'] || 0) + 1;
        }
      });
      setPlayerStats({
        totalRegistrations: allPlayers.length,
        uniqueParticipants: uniqueSet.size,
        playersByCategory: byCategory,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  // Short category label mapping
  const categoryLabels: Record<string, string> = {
    "Men's Singles & Doubles (Team Event)": "Men's Team",
    "Women's Singles": "Women Singles",
    "Boys under 13 (Born on/after July 1st 2012)": "Boys U13",
    "Girls under 13 (Born on/after July 1st 2012)": "Girls U13",
    "Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)": "Family Mixed",
    "Girls under 18 (Born on/after July 1st 2007)": "Girls U18",
    "Mixed Doubles": "Mixed Doubles",
  };
  const orderedCategories = [
    "Men's Singles & Doubles (Team Event)",
    "Women's Singles",
    "Boys under 13 (Born on/after July 1st 2012)",
    "Girls under 13 (Born on/after July 1st 2012)",
    "Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)",
    "Girls under 18 (Born on/after July 1st 2007)",
    "Mixed Doubles",
  ];

  return (
    <div className="w-full max-w-6xl mt-8 px-2 sm:px-4 mx-auto">
      {/* Stats Section: Registrants and Unique */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Total Registrations */}
        <div className="bg-gradient-to-br from-indigo-100 to-purple-200 rounded-3xl p-8 flex flex-col items-center animate-fade-in-scale">
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500 text-center mb-2">
              {loading ? '...' : playerStats.totalRegistrations}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900 text-center tracking-tight">Total Registrations</div>
          </div>
        </div>
        {/* Unique Participants */}
        <div className="bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl p-8 flex flex-col items-center animate-fade-in-scale">
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500 text-center mb-2">
              {loading ? '...' : playerStats.uniqueParticipants}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900 text-center tracking-tight">Total Unique Players</div>
          </div>
        </div>
      </div>
      {/* Individual Category Stats Cards - 2 rows, 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {orderedCategories.map((cat) => (
          <div key={cat} className="bg-white rounded-3xl p-6 flex flex-col items-center shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 animate-fade-in-scale">
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="text-xs text-gray-700 font-semibold text-center mb-1 tracking-tight leading-tight">
                {categoryLabels[cat]}
              </div>
              <div className="text-4xl font-black text-gray-900 text-center mb-0">
                {loading ? '...' : (playerStats.playersByCategory[cat] || 0)}
              </div>
            </div>
          </div>
        ))}
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
       <SpeedInsights />
    </div>
  );
}
