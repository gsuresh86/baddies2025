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

  // Calculate payment statistics
  const paymentStats = registrations.reduce((stats, reg) => {
    const amount = parseFloat(reg.paid_amt || '0') || 0;
    const paidTo = reg.paid_to || '';
    
    stats.totalAmount += amount;
    
    if (paidTo.toLowerCase().includes('surya')) {
      stats.paidToSurya += amount;
    } else if (paidTo.toLowerCase().includes('vasu')) {
      stats.paidToVasu += amount;
    }
    
    // Count registrations with empty payment data
    if (!reg.paid_amt || reg.paid_amt === '' || !reg.paid_to || reg.paid_to === '') {
      stats.emptyPaymentCount += 1;
    }
    
    return stats;
  }, { totalAmount: 0, paidToSurya: 0, paidToVasu: 0, emptyPaymentCount: 0 });

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

        {/* Payment Summary Card */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Payment Summary
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-800">
                    ₹{paymentStats.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-blue-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Paid to Surya</p>
                  <p className="text-2xl font-bold text-green-800">
                    ₹{paymentStats.paidToSurya.toLocaleString()}
                  </p>
                </div>
                <div className="text-green-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Paid to Vasu</p>
                  <p className="text-2xl font-bold text-purple-800">
                    ₹{paymentStats.paidToVasu.toLocaleString()}
                  </p>
                </div>
                <div className="text-purple-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Empty Payment</p>
                  <p className="text-2xl font-bold text-red-800">
                    {paymentStats.emptyPaymentCount}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Missing payment info
                  </p>
                </div>
                <div className="text-red-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
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
                    {filteredRegistrations.map((reg) => {
                      const hasEmptyPayment = !reg.paid_amt || reg.paid_amt === '' || !reg.paid_to || reg.paid_to === '';
                      
                      return (
                        <tr 
                          key={reg.id} 
                          className={`border-b border-gray-100 hover:bg-gray-50 ${
                            hasEmptyPayment ? 'bg-red-50 hover:bg-red-100' : ''
                          }`}
                        >
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
                      );
                    })}
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