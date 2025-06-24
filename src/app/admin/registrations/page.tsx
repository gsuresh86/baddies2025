"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/store";
import { Registration } from "@/types";

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
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setRegistrations(data as Registration[]);
    }
    setLoading(false);
  };

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
    } else {
      alert("Failed to update payment status");
    }
    setUpdatingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Registrations
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          View and manage all player registrations and payment status
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            All Registrations
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {registrations.length} registrations
          </p>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading registrations...</p>
            </div>
          ) : registrations.length === 0 ? (
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
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 text-sm text-gray-800 font-medium">{reg.name}</td>
                      <td className="py-2 px-2 text-sm text-gray-600 hidden sm:table-cell">{reg.email || "-"}</td>
                      <td className="py-2 px-2 text-sm text-gray-600 hidden sm:table-cell">{reg.phone || "-"}</td>
                      <td className="py-2 px-2 text-sm text-gray-600 hidden sm:table-cell">{categoryLabels[reg.category || ""] || reg.category || "-"}</td>
                      <td className="py-2 px-2 text-sm text-gray-600">{reg.paid_to || "-"}</td>
                      <td className="py-2 px-2 text-sm text-gray-600">{reg.paid_amt || "-"}</td>
                      <td className="py-2 px-2">
                        <button
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none ${
                            reg.payment_status
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-red-100 text-red-800 border border-red-300"
                          } ${updatingId === reg.id ? "opacity-50" : ""}`}
                          disabled={updatingId === reg.id}
                          onClick={() => handleTogglePayment(reg.id, reg.payment_status ?? false)}
                          title="Toggle payment status"
                        >
                          {reg.payment_status ? "Paid" : "Unpaid"}
                          <span className="ml-2">
                            <span className="inline-block w-4 h-4 align-middle">
                              {reg.payment_status ? (
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              )}
                            </span>
                          </span>
                        </button>
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
  );
} 