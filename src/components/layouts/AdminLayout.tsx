'use client';

import Image from "next/image";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User } from "@supabase/supabase-js";
import { signOut } from '@/lib/store';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && pathname !== '/admin-login') {
      router.replace('/admin-login');
    }
  }, [user, pathname, router]);

  // If not authenticated, show nothing (will redirect)
  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Enhanced Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg flex flex-col py-6 px-4 min-h-screen z-20">
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl text-white">
          <h1 className="text-xl font-bold mb-1">🏸 Baddies 2025</h1>
          <p className="text-xs opacity-90">Admin Panel</p>
        </div>
        
        {/* User Info */}
        <div className="mb-6 p-3 bg-gray-100 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Logged in as:</div>
          <div className="text-sm font-medium text-gray-800">{user.email}</div>
        </div>

        <nav className="space-y-2">
          <Link
            href="/admin"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === '/admin' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">📊</span>
            Dashboard
          </Link>
          
          <Link
            href="/admin/pools"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === '/admin/pools' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">🏊‍♂️</span>
            Tournament Management
          </Link>
          
          <Link
            href="/admin/teams"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === '/admin/teams' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">👥</span>
            Team Management
          </Link>
          
          <Link
            href="/admin/matches"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === '/admin/matches' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">🏸</span>
            Match Management
          </Link>
          
          <Link
            href="/admin/players"
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === '/admin/players' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">🏸</span>
            Player Management
          </Link>
        </nav>

        {/* Sign Out Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-3 rounded-lg bg-red-50 text-red-700 font-medium transition-all duration-200 hover:bg-red-100 hover:shadow-md"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="w-full flex flex-col md:flex-row items-center justify-between px-6 pt-6 pb-4 z-10 relative bg-white shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 md:w-16 md:h-16 relative">
              <Image
                src="/baddies.png"
                alt="Badminton Baddies Logo"
                fill
                style={{ objectFit: 'contain' }}
                draggable={false}
                priority
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                PBEL Badminton Tournament 2025
              </h1>
              <p className="text-sm text-gray-600">Administration Panel</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-col items-end mt-4 md:mt-0 w-full md:w-auto">
            <div className="flex flex-col md:items-end">
              <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl px-4 py-2 border border-green-200/30 mb-2">
                <span className="text-gray-700 text-sm">Tournament: <span className="font-bold">12th Jul - 10th Aug 2025</span></span>
              </div>
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl px-4 py-2 border border-blue-200/30">
                <span className="text-gray-700 text-sm">Admin: <span className="font-bold">{user.email}</span></span>
              </div>
            </div>
          </div>
        </header>

        {/* Quick Navigation */}
        <nav className="w-full bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tournaments"
              className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-all duration-200 border border-gray-200"
            >
              👁️ Public View
            </Link>
            <Link
              href="/standings"
              className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-all duration-200 border border-gray-200"
            >
              🏆 View Standings
            </Link>
            <Link
              href="/teams"
              className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-all duration-200 border border-gray-200"
            >
              👥 View Teams
            </Link>
            <Link
              href="/rules"
              className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-all duration-200 border border-gray-200"
            >
              📋 View Rules
            </Link>
          </div>
        </nav>

        <main className="flex-1 px-6 py-6 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 