"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/store";
import { Registration } from "@/types";
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/contexts/ToastContext';

const categoryLabels: Record<string, string> = {
  "Men's Singles & Doubles (Team Event)": "Men's Team",
  "Women's Singles": "Women Singles",
  "Boys under 13 (Born on/after July 1st 2012)": "Boys U13",
  "Girls under 13 (Born on/after July 1st 2012)": "Girls U13",
  "Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)": "Family Mixed",
  "Girls under 18 (Born on/after July 1st 2007)": "Girls U18",
  "Boys under 18 (Born on/after July 1st 2007)": "Boys U18",
  "Mixed Doubles": "Mixed Doubles",
};

export default function AdminRegistrationsPage() {
  const { showSuccess, showError } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        showError('Error fetching registrations');
      } else {
        setRegistrations(data as Registration[]);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error fetching registrations');
    }
    setLoading(false);
  }, [showError]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleTogglePayment = async (id: string, current: boolean | null) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("registrations")
      .update({ payment_status: !current })
      .eq("id", id);
    if (!error) {
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === id ? { ...reg, payment_status: !current } : reg
        )
      );
      showSuccess('Payment status updated successfully');
    } else {
      showError('Failed to update payment status');
    }
    setUpdatingId(null);
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.name && reg.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <AuthGuard>
      <div className="mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Registrations
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and manage all player registrations and payment status
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                All Registrations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {registrations.length} registrations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ minWidth: 180 }}
              />
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">Loading registrations...</p>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl sm:text-6xl mb-4">📋</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">
                  No registrations found
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  No players have registered yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-semibold text-gray-800 text-xs sm:text-sm">Name</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-800 text-xs sm:text-sm hidden sm:table-cell">Email</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-800 text-xs sm:text-sm hidden sm:table-cell">Phone</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-800 text-xs sm:text-sm hidden sm:table-cell">Category</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-800 text-xs sm:text-sm">Paid To</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-800 text-xs sm:text-sm">Amount</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-800 text-xs sm:text-sm">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2 text-sm text-gray-800 font-medium">{reg.name}</td>
                        <td className="py-2 px-2 text-sm text-gray-600 hidden sm:table-cell">{reg.email || "-"}</td>
                        <td className="py-2 px-2 text-sm text-gray-600 hidden sm:table-cell">{reg.phone || "-"}</td>
                        <td className="py-2 px-2 text-sm text-gray-600 hidden sm:table-cell">{categoryLabels[reg.category || ""] || reg.category || "-"}</td>
                        <td className="py-2 px-2 text-sm text-gray-600">{
                          reg.paid_to
                            ? reg.paid_to.includes("Surya")
                              ? "Surya"
                              : reg.paid_to.includes("Vasu")
                                ? "Vasu"
                                : reg.paid_to
                            : "-"
                        }</td>
                        <td className="py-2 px-2 text-sm text-gray-600">{reg.paid_amt || "-"}</td>
                        <td className="py-2 px-2">
                          <select
                            value={reg.payment_status ? "paid" : "unpaid"}
                            onChange={(e) => handleTogglePayment(reg.id, e.target.value === "paid")}
                            className={`text-xs sm:text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${updatingId === reg.id ? "opacity-50" : ""}`}
                            disabled={updatingId === reg.id}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 