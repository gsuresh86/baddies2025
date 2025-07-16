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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  // Get page title from route
  const routeTitleMap: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/registrations': 'Registrations',
    '/admin/players': 'Players',
    '/admin/pools': 'Tournament',
    '/admin/teams': 'Teams',
    '/admin/matches': 'Matches',
    '/admin/spin-wheel': 'Spin Wheel',
    '/admin/tshirts': 'T-Shirts',
  };
  const pageTitle = routeTitleMap[pathname] || 'Admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-300/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-gray-200 shadow-md
        flex flex-col py-6 px-2 min-h-screen transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex-shrink-0
      `}>
        {/* Logo/Header */}
        <div className={`mb-8 flex items-center gap-2 px-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 relative">
            <Image src="/pcbt.png" alt="Logo" fill style={{ objectFit: 'contain' }} draggable={false} priority />
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-blue-700 tracking-tight">Baddies 2025</span>
          )}
        </div>
        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <div className="text-xs font-bold text-gray-400 px-4 mb-2 uppercase tracking-widest">Main</div>
          {navigationItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all
                  ${isActive ? 'bg-blue-600 text-white shadow scale-[1.03]' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}
                  ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'}
                `}
                style={{ transition: 'all 0.18s cubic-bezier(.4,2,.6,1)' }}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => { if (mobileMenuOpen) setMobileMenuOpen(false); }}
              >
                <span className={`${sidebarCollapsed ? 'text-lg' : 'mr-3'}`}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          <div className="text-xs font-bold text-gray-400 px-4 mt-6 mb-2 uppercase tracking-widest">Management</div>
          {navigationItems.slice(2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all
                  ${isActive ? 'bg-green-600 text-white shadow scale-[1.03]' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'}
                  ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'}
                `}
                style={{ transition: 'all 0.18s cubic-bezier(.4,2,.6,1)' }}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => { if (mobileMenuOpen) setMobileMenuOpen(false); }}
              >
                <span className={`${sidebarCollapsed ? 'text-lg' : 'mr-3'}`}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        {/* Collapse/Expand Button */}
        <div className="mt-auto flex flex-col items-center gap-2 pb-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 shadow transition"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H8m0 0l4-4m-4 4l4 4" /></svg>
            )}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 hover:shadow-lg transition"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            {sidebarCollapsed ? '🚪' : '🚪 Sign Out'}
          </button>
        </div>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="w-full flex items-center justify-between px-6 py-3 bg-white/90 shadow sticky top-0 z-30 border-b border-gray-200">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 mr-2"
            aria-label="Open sidebar menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gray-800 tracking-tight">{pageTitle}</span>
          </div>
          {/* User Info Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium shadow"
            >
              <span className="inline-block w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                {user.email?.[0]?.toUpperCase() || 'A'}
              </span>
              <span className="hidden sm:block">{user.email}</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in">
                <div className="px-4 py-3 text-sm text-gray-700 border-b">Signed in as<br /><span className="font-semibold">{user.email}</span></div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                >Sign Out</button>
              </div>
            )}
          </div>
        </header>
        {/* Content Area */}
        <main className="flex-1 px-1 sm:px-3 py-4 bg-gradient-to-br from-gray-50/80 to-gray-100/80 overflow-y-auto rounded-2xl mt-4 shadow-xl">
          <div className="max-w-9xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-3 md:p-5 min-h-[60vh]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 