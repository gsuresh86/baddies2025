'use client';

import Image from "next/image";
import Link from 'next/link';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
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
      
      {/* Topbar with logo and navigation */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 md:px-10 py-2 z-20 relative bg-black/80 border-b border-gray-800 shadow-lg animate-fade-in-scale">
        {/* Logo and Title - First Row on Mobile */}
        <Link href="/" className="flex items-center justify-center sm:justify-start gap-3 mb-2 sm:mb-0 hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 md:w-20 md:h-20 relative animate-float">
            <Image
              src="/pcbt.png"
              alt="PBEL City Badminton Tournament Logo"
              fill
              style={{ objectFit: 'contain' }}
              draggable={false}
              priority
            />
          </div>
        </Link>
        
        {/* Navigation - Second Row on Mobile */}
        <nav className="flex flex-wrap justify-center sm:justify-end gap-2 md:gap-4">
          {/*
          <Link
            href="/standings"
            className="px-3 sm:px-5 py-2 bg-black text-white rounded-xl text-sm sm:text-lg font-bold shadow hover:bg-gray-900 transition border-2 border-gray-700 hover-lift relative overflow-hidden"
          >
            <span className="relative">🏆 Standings</span>
          </Link>
          <Link
            href="/tournaments"
            className="px-3 sm:px-5 py-2 bg-black text-white rounded-xl text-sm sm:text-lg font-bold shadow hover:bg-gray-900 transition border-2 border-gray-700 hover-lift relative overflow-hidden"
          >
            <span className="relative">📅 Fixtures</span>
          </Link>
          <Link
            href="/teams"
            className="px-3 sm:px-5 py-2 bg-black text-white rounded-xl text-sm sm:text-lg font-bold shadow hover:bg-gray-900 transition border-2 border-gray-700 hover-lift relative overflow-hidden"
          >
            <span className="relative">👥 Teams</span>
          </Link>
          */}
          <Link
            href="/rules"
            className="px-3 sm:px-5 py-2 bg-black text-white rounded-xl text-sm sm:text-lg font-bold shadow hover:bg-gray-900 transition border-2 border-gray-700 hover-lift relative overflow-hidden"
          >
            <span className="relative">📋 Rules</span>
          </Link>
        </nav>
      </div>
      
      <main className="flex-1 relative z-10 w-full flex flex-col items-center justify-center animate-fade-in-scale" style={{animationDelay: '0.6s'}}>
        {children}
      </main>
      
      {/* Additional decorative shuttlecock */}
      <div className="absolute top-1/4 left-8 w-16 h-16 opacity-60 -rotate-12 pointer-events-none select-none animate-float" style={{ zIndex: 1, animationDelay: '1.5s' }}>
        <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 rounded-full border-2 border-white/30 backdrop-blur-sm"></div>
      </div>
      
      {/* Footer with tournament info */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 text-center">
        <div className="bg-black/90 rounded-2xl px-6 py-2 border border-gray-800">
          <p className="text-white font-semibold text-sm">🏸 PBEL City Badminton Tournament 2025</p>
          <p className="text-gray-300 text-xs mt-1">#PBELCityBT2025 • Badminton Baddies</p>
        </div>
      </div>
    </div>
  );
} 