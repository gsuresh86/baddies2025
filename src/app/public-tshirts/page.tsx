"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/store";
import { categoryLabels, PlayerCategory } from "@/lib/utils";

interface PlayerRow {
  id: string;
  name: string;
  phone?: string;
  partner_name?: string;
  partner_phone?: string;
  tshirt_size?: string;
  partner_tshirt_size?: string;
  category?: string;
}

export default function PublicTShirtsPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      const { data, error } = await supabase
        .from("t_players")
        .select("id, name, phone, partner_name, partner_phone, tshirt_size, partner_tshirt_size, category")
        .order("name");
      if (!error && data) {
        setPlayers(data);
        console.log('Fetched players:', data);
      }
      setLoading(false);
    }
    fetchPlayers();
  }, []);

  // Use a Map to ensure uniqueness by name only (spaces removed, lowercased), and collect categories
  const uniqueMap = new Map<string, { name: string; tshirt_size?: string; categories: Set<string> }>();
  players.forEach((player) => {
    // Main player: always add their own category
    const nameKey = player.name.replace(/\s+/g, '').toLowerCase();
    if (!uniqueMap.has(nameKey)) {
      uniqueMap.set(nameKey, { name: player.name, tshirt_size: player.tshirt_size, categories: new Set() });
    }
    if (player.category) {
      uniqueMap.get(nameKey)?.categories.add(player.category);
    }
    // Partner: add main player's category to partner's entry
    if (player.partner_name) {
      const partnerNameKey = player.partner_name.replace(/\s+/g, '').toLowerCase();
      if (!uniqueMap.has(partnerNameKey)) {
        uniqueMap.set(partnerNameKey, { name: player.partner_name, tshirt_size: player.partner_tshirt_size, categories: new Set() });
      }
      if (player.category) {
        uniqueMap.get(partnerNameKey)?.categories.add(player.category);
      }
    }
  });
  console.log('Unique map:', Array.from(uniqueMap.entries()));
  const allRows = Array.from(uniqueMap.values());
  // Sort by name (case-insensitive)
  allRows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  // Filtered rows based on search
  const filteredRows = allRows.filter(row => {
    const searchLower = search.toLowerCase();
    return row.name.toLowerCase().includes(searchLower);
  });

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8 animate-slide-in-up">
        <div className="text-5xl mb-4 animate-float">👕</div>
        <h1 className="text-3xl md:text-4xl font-bold text-white text-glow-white mb-2">T-Shirt Sizes</h1>
        <p className="text-white/80 text-base max-w-2xl mx-auto">All player T-shirt sizes check list</p>
      </div>
      {/* Search Input */}
      <div className="mb-6 flex justify-end">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-xs"
        />
      </div>
      {/* Players Table */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl overflow-x-auto animate-fade-in-scale">
        <table className="w-full min-w-full">
          <thead className="bg-white/5">
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 font-semibold text-white/80 text-sm">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-white/80 text-sm">T-Shirt Size</th>
              <th className="text-left py-3 px-4 font-semibold text-white/80 text-sm">Categories</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-6 text-white/80">Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-6 text-white/80">No players found.</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={row.name + idx} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                  <td className="py-2 px-4 text-white font-medium">{row.name}</td>
                  <td className="py-2 px-4 text-white/80">{row.tshirt_size || "-"}</td>
                  <td className="py-2 px-4 text-white/80">{
                    Array.from(row.categories)
                      .map(cat => categoryLabels[cat as PlayerCategory]?.code || cat)
                      .join(", ") || "-"
                  }</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 