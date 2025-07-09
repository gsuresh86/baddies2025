'use client';

import { useState } from 'react';
import { signInWithEmail } from '@/lib/store';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Force reload to update layout user state and redirect to admin dashboard
      window.location.href = '/admin';
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-white to-green-200">
      <form onSubmit={handleSubmit} className="bg-white/80 rounded-2xl shadow-2xl p-10 w-full max-w-md border border-blue-100 backdrop-blur-md glass animate-fade-in-scale">
        <h2 className="text-3xl font-extrabold mb-8 text-blue-800 tracking-tight">Admin Sign In</h2>
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white/90 text-base transition-all"
            required
            autoFocus
          />
        </div>
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white/90 text-base transition-all"
            required
          />
        </div>
        {error && <div className="mb-4 text-red-600 text-sm font-medium">{error}</div>}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-[1.03] disabled:opacity-50"
          disabled={loading}
          style={{ transition: 'all 0.18s cubic-bezier(.4,2,.6,1)' }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
} 