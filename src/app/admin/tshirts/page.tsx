"use client";
import { useEffect, useState, useRef } from "react";
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
  old_tshirt_size?: string;
  old_partner_tshirt_size?: string;
}


export default function AdminTShirtsPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSizes, setEditSizes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      const { data, error } = await supabase
        .from("t_players")
        .select("id, name, phone, partner_name, partner_phone, tshirt_size, partner_tshirt_size, old_tshirt_size, old_partner_tshirt_size")
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

  // CSV Export function
  const exportToCSV = () => {
    const headers = ['#', 'Name', 'Phone', 'T-Shirt Size'];
    const csvContent = [
      headers.join(','),
      ...allRows.map((row, idx) => [
        idx + 1,
        `"${row.name}"`,
        `"${row.phone || ''}"`,
        `"${row.tshirt_size || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tshirt-sizes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSizeChange = (row: any, nameKey: string, value: string) => {
    setEditSizes((prev) => ({ ...prev, [nameKey]: value }));
    if (debounceTimers.current[nameKey]) {
      clearTimeout(debounceTimers.current[nameKey]);
    }
    debounceTimers.current[nameKey] = setTimeout(async () => {
      setSaving((prev) => ({ ...prev, [nameKey]: true }));
      // Find the player object (main or partner)
      const player = players.find(
        (p) =>
          (row.isPartner
            ? p.partner_name?.replace(/\s+/g, '').toLowerCase() === nameKey
            : p.name.replace(/\s+/g, '').toLowerCase() === nameKey)
      );
      if (!player) {
        setSaving((prev) => ({ ...prev, [nameKey]: false }));
        return;
      }
      // Determine if updating main or partner size
      const updates: any = {};
      if (row.isPartner) {
        updates.partner_tshirt_size = value;
      } else {
        updates.tshirt_size = value;
      }
      try {
        await supabase.from('t_players').update(updates).eq('id', player.id);
        // Only update the edited row in local state
        setPlayers((prevPlayers) =>
          prevPlayers.map((p) =>
            p.id === player.id
              ? row.isPartner
                ? { ...p, partner_tshirt_size: value }
                : { ...p, tshirt_size: value }
              : p
          )
        );
      } catch (e) {
        // Optionally show error
        console.error(e);
      }
      setSaving((prev) => ({ ...prev, [nameKey]: false }));
    }, 600); // 600ms debounce
  };

  // Helper to get old_tshirt_size for a row
  function getOldTshirtSize(row: any, players: any[]) {
    if (row.isPartner) {
      // Find the player whose partner_name matches this row
      const player = players.find(
        (p) => p.partner_name && p.partner_name.replace(/\s+/g, '').toLowerCase() === row.name.replace(/\s+/g, '').toLowerCase()
      );
      return player?.old_partner_tshirt_size || '';
    } else {
      const player = players.find(
        (p) => p.name.replace(/\s+/g, '').toLowerCase() === row.name.replace(/\s+/g, '').toLowerCase()
      );
      return player?.old_tshirt_size || '';
    }
  }

  // Before rendering the table, filter allRows by search
  const filteredRows = allRows.filter(row =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );

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

        {/* Total Count and Export Button */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-gray-700 font-semibold text-lg">
            Total Unique Players: {allRows.length}
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
          >
            📊 Export CSV
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4 flex justify-end">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-xs text-gray-900"
          />
        </div>

        {/* Players Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Old T-Shirt Size</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">T-Shirt Size</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-6">Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6">No players found.</td></tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const nameKey = row.name.replace(/\s+/g, '').toLowerCase();
                  const oldTshirtSize = getOldTshirtSize(row, players);
                  return (
                    <tr key={row.name + (row.phone || '') + idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-4 text-gray-700">{idx + 1}</td>
                      <td className="py-2 px-4 text-gray-900">{row.name}</td>
                      <td className="py-2 px-4 text-gray-700">{row.phone || "-"}</td>
                      <td className="py-2 px-4 text-gray-700">{oldTshirtSize || "-"}</td>
                      <td className="py-2 px-4 text-gray-700">
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-24"
                          value={editSizes[nameKey] !== undefined ? editSizes[nameKey] : row.tshirt_size || ''}
                          onChange={e => handleSizeChange(row, nameKey, e.target.value)}
                          disabled={saving[nameKey]}
                        />
                        {saving[nameKey] && (
                          <span className="ml-2 text-blue-600 text-xs">Saving...</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  );
} 