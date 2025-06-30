"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/store";
import AuthGuard from "@/components/AuthGuard";

interface PlayerRow {
  id: string;
  name: string;
  phone?: string;
  partner_name?: string;
  partner_phone?: string;
  tshirt_size?: string;
  partner_tshirt_size?: string;
}

export default function AdminTShirtsPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      const { data, error } = await supabase
        .from("t_players")
        .select("id, name, phone, partner_name, partner_phone, tshirt_size, partner_tshirt_size")
        .order("name");
      if (!error && data) {
        setPlayers(data);
      }
      setLoading(false);
    }
    fetchPlayers();
  }, []);

  // Use a Map to ensure uniqueness by name only (spaces removed, lowercased)
  const uniqueMap = new Map<string, { name: string; phone?: string; tshirt_size?: string; isPartner?: boolean }>();
  players.forEach((player) => {
    // Main player
    const nameKey = player.name.replace(/\s+/g, '').toLowerCase();
    if (!uniqueMap.has(nameKey)) {
      uniqueMap.set(nameKey, { name: player.name, phone: player.phone, tshirt_size: player.tshirt_size, isPartner: false });
    }
    // Partner
    if (player.partner_name) {
      const partnerNameKey = player.partner_name.replace(/\s+/g, '').toLowerCase();
      if (!uniqueMap.has(partnerNameKey)) {
        uniqueMap.set(partnerNameKey, { name: player.partner_name, phone: player.partner_phone, tshirt_size: player.partner_tshirt_size, isPartner: true });
      }
    }
  });
  const allRows = Array.from(uniqueMap.values());
  // Sort by name (case-insensitive)
  allRows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  // Calculate T-shirt size stats from unique players data
  const tshirtStats: Record<string, number> = {};
  allRows.forEach((row) => {
    if (row.tshirt_size) {
      tshirtStats[row.tshirt_size] = (tshirtStats[row.tshirt_size] || 0) + 1;
    }
  });

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">T-Shirt Sizes</h1>
          <p className="text-gray-600 text-sm sm:text-base">All player T-shirt sizes and summary stats</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(tshirtStats || {}).map(([size, count]) => (
            <div key={size} className="bg-white rounded-xl p-4 shadow border border-gray-200 flex flex-col items-center">
              <span className="text-lg font-bold text-blue-700">{size}</span>
              <span className="text-2xl font-bold text-gray-800">{count}</span>
              <span className="text-xs text-gray-500 mt-1">T-Shirts</span>
            </div>
          ))}
        </div>

        {/* Total Count */}
        <div className="mb-4 text-right text-gray-700 font-semibold text-lg">
          Total Unique Players: {allRows.length}
        </div>

        {/* Players Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">T-Shirt Size</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-6">Loading...</td></tr>
              ) : allRows.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6">No players found.</td></tr>
              ) : (
                allRows.map((row, idx) => (
                  <tr key={row.name + (row.phone || '') + idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-700">{idx + 1}</td>
                    <td className="py-2 px-4 text-gray-900">{row.name}</td>
                    <td className="py-2 px-4 text-gray-700">{row.phone || "-"}</td>
                    <td className="py-2 px-4 text-gray-700">{row.tshirt_size || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  );
} 