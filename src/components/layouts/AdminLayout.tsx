'use client';

import Image from "next/image";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from "@supabase/supabase-js";
import { signOut } from '@/lib/store';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navigationItems = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/registrations', icon: '📝', label: 'Registrations' },
    { href: '/admin/players', icon: '🏸', label: 'Players' },
    { href: '/admin/pools', icon: '🏊‍♂️', label: 'Tournament' },
    { href: '/admin/teams', icon: '👥', label: 'Teams' },
    { href: '/admin/matches', icon: '🏸', label: 'Matches' },
    { href: '/admin/spin-wheel', icon: '🎰', label: 'Spin Wheel' },
    { href: '/admin/tshirts', icon: '👕', label: 'T-Shirts' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-300/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* Enhanced Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg 
          flex flex-col py-6 px-4 min-h-screen transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:flex-shrink-0
        `}>
          {/* Header */}
          <div className={`mb-8 p-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl text-white transition-all duration-300 ${
            sidebarCollapsed ? 'px-2' : 'px-4'
          }`}>
            {sidebarCollapsed ? (
              <div className="flex justify-center">
                <span className="text-2xl">🏸</span>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold mb-1">🏸 Baddies 2025</h1>
                <p className="text-xs opacity-90">Admin Panel</p>
              </div>
            )}
          </div>
          
          {/* User Info */}
          {!sidebarCollapsed && (
            <div className="mb-6 p-3 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Logged in as:</div>
              <div className="text-sm font-medium text-gray-800 truncate">{user.email}</div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'}
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => { if (mobileMenuOpen) setMobileMenuOpen(false); }}
                >
                  <span className={`${sidebarCollapsed ? 'text-lg' : 'mr-3'}`}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className={`
                w-full px-3 py-3 rounded-lg bg-red-50 text-red-700 font-medium 
                transition-all duration-200 hover:bg-red-100 hover:shadow-md
                ${sidebarCollapsed ? 'px-2' : 'px-3'}
              `}
              title={sidebarCollapsed ? 'Sign Out' : undefined}
            >
              {sidebarCollapsed ? '🚪' : '🚪 Sign Out'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="w-full flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 pt-3 pb-2 z-10 relative bg-white shadow-sm">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Desktop Toggle Button */}
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="w-14 h-14 md:w-20 md:h-20 relative">
                <Image
                  src="/pcbt.png"
                  alt="PBEL City Badminton Tournament Logo"
                  fill
                  style={{ objectFit: 'contain' }}
                  draggable={false}
                  priority
                />
              </div>
            </div>
            {/* Quick Navigation Buttons moved here */}
            <div className="flex flex-wrap gap-3 mt-3 md:mt-0 justify-end w-full md:w-auto">
              <Link
                href="/"
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
          </header>

          <main className="flex-1 px-4 sm:px-6 py-6 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 