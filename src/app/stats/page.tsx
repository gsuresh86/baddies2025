'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState({
    totalRegistrations: 0,
    uniqueParticipants: 0,
    playersByCategory: {} as Record<string, number>,
  });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const playersRes = await supabase.from('t_players').select('id,name,email,phone,partner_name,partner_phone,category');
      // Calculate player stats
      const allPlayers = Array.isArray(playersRes.data) ? playersRes.data : [];
      // Unique by name (spaces removed, lowercased)
      const uniqueMap = new Map();
      allPlayers.forEach((p) => {
        // Main player
        const nameKey = (p.name || '').replace(/\s+/g, '').toLowerCase();
        if (p.name && !uniqueMap.has(nameKey)) {
          uniqueMap.set(nameKey, true);
        }
        // Partner
        if (p.partner_name) {
          const partnerNameKey = p.partner_name.replace(/\s+/g, '').toLowerCase();
          if (!uniqueMap.has(partnerNameKey)) {
            uniqueMap.set(partnerNameKey, true);
          }
        }
      });
      // Players by category (main player only, as before)
      const byCategory: Record<string, number> = {};
      allPlayers.forEach((p) => {
        if (p.category) {
          byCategory[p.category] = (byCategory[p.category] || 0) + 1;
        } else {
          byCategory['Unspecified'] = (byCategory['Unspecified'] || 0) + 1;
        }
      });
      setPlayerStats({
        totalRegistrations: allPlayers.length,
        uniqueParticipants: uniqueMap.size,
        playersByCategory: byCategory,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const categoryLabels: Record<string, { code: string; label: string }> = {
    "Men's Singles & Doubles (Team Event)": { code: "MT", label: "Men's Team" },
    "Women's Singles": { code: "WS", label: "Women Singles" },
    "Women's Doubles": { code: "WD", label: "Women Doubles" },
    "Boys under 13 (Born on/after July 1st 2012)": { code: "BU13", label: "Boys U13" },
    "Girls under 13 (Born on/after July 1st 2012)": { code: "GU13", label: "Girls U13" },
    "Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)": { code: "FM", label: "Family Mixed" },
    "Girls under 18 (Born on/after July 1st 2007)": { code: "GU18", label: "Girls U18" },
    "Boys under 18 (Born on/after July 1st 2007)": { code: "BU18", label: "Boys U18" },
    "Mixed Doubles": { code: "XD", label: "Mixed Doubles" },
  };
  const orderedCategories = [
    "Men's Singles & Doubles (Team Event)",
    "Women's Singles",
    "Women's Doubles",
    "Boys under 13 (Born on/after July 1st 2012)",
    "Girls under 13 (Born on/after July 1st 2012)",
    "Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)",
    "Girls under 18 (Born on/after July 1st 2007)",
    "Boys under 18 (Born on/after July 1st 2007)",
    "Mixed Doubles",
  ];

  return (
    <div className="w-full max-w-6xl mt-8 px-2 sm:px-4 mx-auto">
      <div className="text-center mb-12 animate-slide-in-up">
        <div className="text-5xl mb-4 animate-float">📊</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white text-glow-white mb-4">
          Tournament Stats
        </h1>
        <p className="text-white/80 text-xl max-w-2xl mx-auto">
          Explore detailed statistics about registrations and participation for this tournament.
        </p>
      </div>
      {/* Stats Section: Registrants and Unique */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Total Registrations */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl hover-lift animate-fade-in-scale">
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-100 text-center mb-2">
              {loading ? '...' : playerStats.totalRegistrations}
            </div>
            <div className="text-lg sm:text-xl font-bold text-white text-center tracking-tight">Total Registrations</div>
          </div>
        </div>
        {/* Unique Participants */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl hover-lift animate-fade-in-scale">
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-green-100 text-center mb-2">
              {loading ? '...' : playerStats.uniqueParticipants}
            </div>
            <div className="text-lg sm:text-xl font-bold text-white text-center tracking-tight">Total Unique Players</div>
          </div>
        </div>
      </div>
      {/* Individual Category Stats Cards - 3 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {orderedCategories.map((cat, index) => (
          <div key={cat} className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/20 shadow-2xl hover-lift transition-all duration-300 animate-fade-in-scale" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="text-xs text-white/80 font-semibold text-center mb-1 tracking-tight leading-tight">
                {categoryLabels[cat]?.label || cat}
              </div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 text-center mb-0">
                {loading ? '...' : (playerStats.playersByCategory[cat] || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 