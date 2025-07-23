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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-gray-200 shadow-lg
        flex flex-col py-6 px-2 min-h-screen transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex-shrink-0
      `}>
        {/* Logo/Header */}
        <div className={`mb-8 flex items-center gap-3 px-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 relative bg-gray-100 rounded-lg p-1 shadow-sm">
            <Image src="/pcbt.png" alt="Logo" fill style={{ objectFit: 'contain' }} draggable={false} priority />
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                Baddies 2025
              </span>
              <div className="text-xs text-gray-500 font-medium">Admin Panel</div>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <div className="text-xs font-bold text-gray-400 px-4 mb-3 uppercase tracking-widest">Overview</div>
          {navigationItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive ? 'bg-gray-900 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
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
          
          <div className="text-xs font-bold text-gray-400 px-4 mt-6 mb-3 uppercase tracking-widest">Management</div>
          {navigationItems.slice(2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive ? 'bg-gray-900 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
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
        
        {/* Collapse/Expand Button */}
        <div className="mt-auto flex flex-col items-center gap-3 pb-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm transition-all duration-200 hover:shadow-md"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H8m0 0l4-4m-4 4l4 4" />
              </svg>
            )}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 hover:shadow-md transition-all duration-200 border border-gray-200"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            {sidebarCollapsed ? '🚪' : '🚪 Sign Out'}
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 mr-3 transition-all duration-200 hover:shadow-md"
            aria-label="Open sidebar menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3 text-left w-full">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {pageTitle.charAt(0)}
                </span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight block text-left">
                  {pageTitle}
                </span>
              </div>
            </div>
          </div>
          
          {/* User Info Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium shadow-sm transition-all duration-200 hover:shadow-md border border-gray-200"
            >
              <span className="inline-block w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user.email?.[0]?.toUpperCase() || 'A'}
              </span>
              <span className="hidden sm:block text-sm font-medium">{user.email}</span>
              <svg className="w-4 h-4 ml-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
                  Signed in as<br />
                  <span className="font-semibold text-gray-900">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg transition-colors duration-200 font-medium"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </header>
        
        {/* Content Area */}
        <main className="flex-1 px-2 sm:px-4 py-4 bg-gray-50 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 min-h-[60vh]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 