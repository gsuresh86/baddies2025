'use client';

import Image from "next/image";
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Check if current page is the livescore page
  const isLivescorePage = pathname.includes('/matches/') && pathname.includes('/livescore');
  
  const menu = [
    { href: '/fixtures', label: '🏸 Fixtures' },
    { href: '/standings', label: '🏆 Standings' },
    { href: '/teams', label: '👥 Teams' },
    { href: '/players', label: '🧑‍🎾 Players' },
    { href: '/formats', label: '📊 Formats' },
    { href: '/rules', label: '📋 Rules' },
  ];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Enhanced Badminton Background with multiple layers */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/badminton3.png"
          alt="Badminton Background"
          fill
          style={{ objectFit: 'cover', position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          draggable={false}
          priority
        />
        {/* Solid dark overlay for clarity */}
        <div className="absolute inset-0 bg-black/85 pointer-events-none" style={{zIndex:1}} />
        {/* Subtle badminton court pattern */}
        <div className="absolute inset-0 badminton-court opacity-20 pointer-events-none" style={{zIndex:2}} />
        {/* Animated floating elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-white/10 rounded-full animate-float pointer-events-none" style={{zIndex:3}}></div>
        <div className="absolute top-40 right-32 w-12 h-12 bg-blue-400/20 rounded-full animate-float pointer-events-none" style={{zIndex:3, animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-32 w-20 h-20 bg-green-400/20 rounded-full animate-float pointer-events-none" style={{zIndex:3, animationDelay: '2s'}}></div>
      </div>
      
      {/* Topbar with logo and navigation - Hidden for livescore page */}
      {!isLivescorePage && (
        <div className="w-full flex flex-row items-center justify-between px-4 md:px-10 py-2 z-20 relative bg-black/80 border-b border-gray-800 shadow-lg animate-fade-in-scale">
        {/* Logo - Always on the left */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 md:w-20 md:h-20 relative animate-float">
            <Image
              src="/pcbt.png"
              alt="PBEL City Badminton Tournament Logo"
              fill
              sizes="(max-width: 767px) 56px, 80px"
              style={{ objectFit: 'contain' }}
              draggable={false}
              priority
            />
          </div>
        </Link>
        {/* Hamburger menu for mobile */}
        <button
          className="sm:hidden ml-auto p-2 rounded-lg bg-black/70 border border-gray-700"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Navigation - Desktop only */}
        <nav className="hidden sm:flex flex-wrap justify-end gap-2 md:gap-4 ml-auto">
          {menu.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 sm:px-6 py-2 rounded-full font-bold text-sm sm:text-lg transition-all duration-200 focus:outline-none
                  ${isActive
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg scale-105 border-2 border-white'
                    : 'bg-black/60 text-white/80 hover:bg-white/10 hover:text-green-300 border border-transparent'}
                `}
                style={{ minWidth: 110 }}
              >
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {/* Mobile Side Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 h-full w-64 bg-black/95 z-50 flex flex-col p-6 gap-4 animate-slide-in-left shadow-2xl">
              <button
                className="self-end mb-4 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {menu.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-full text-lg font-bold transition-all duration-200 focus:outline-none mb-1
                      ${isActive
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg scale-105 border-2 border-white'
                        : 'bg-black/70 text-white/80 hover:bg-white/10 hover:text-green-300 border border-transparent'}
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
      )}
  
      
      <main className="flex-1 relative z-10 w-full flex flex-col items-center justify-center animate-fade-in-scale pb-28" style={{animationDelay: '0.6s'}}>
        {children}
      </main>
      
      {/* Additional decorative shuttlecock */}
      <div className="absolute top-1/4 left-8 w-16 h-16 opacity-60 -rotate-12 pointer-events-none select-none animate-float" style={{ zIndex: 1, animationDelay: '1.5s' }}>
        <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 rounded-full border-2 border-white/30 backdrop-blur-sm"></div>
      </div>
      
      {/* Footer with tournament info - sticky at bottom, never overlaps content */}
      <footer className="w-full z-20 text-center sticky bottom-0 left-0 flex flex-col items-center justify-center mt-auto pt-8 pb-3 bg-black/90 border-t border-gray-800">
        <div className="rounded-2xl px-6 py-2">
          <p className="text-white font-semibold text-sm">🏸 PBEL City Badminton Tournament 2025</p>
          <p className="text-gray-300 text-xs mt-1">#PBELCityBT2025 • Badminton Baddies</p>
        </div>
      </footer>
    </div>
  );
} 