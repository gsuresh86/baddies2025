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
      
      {/* Enhanced Logo and Title */}
      <div className="z-10 relative flex flex-col items-center mt-8 mb-6 animate-slide-in-up">
        <div className="relative mb-4">
          <div className="w-24 h-24 md:w-32 md:h-32 relative animate-float">
            <Image
              src="/baddies.png"
              alt="Badminton Baddies Logo"
              fill
              style={{ objectFit: 'contain' }}
              draggable={false}
              priority
            />
          </div>
        </div>
        <h1 className="text-3xl md:text-3xl font-extrabold text-white text-glow-white tracking-tight text-center mb-2">
          PBEL Badminton Tournament 2025
        </h1>

        {/* Tournament Branding */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full px-6 py-2 mb-3 inline-block">
            <span className="text-white font-bold text-lg">#PBELCityBT2025</span>
          </div>
          
          {/* Tournament Dates */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-200/30">
              <div className="text-white/80 text-sm mb-1">Tournament Dates</div>
              <div className="text-white font-bold">12th Jul - 10th Aug 2025</div>
            </div>
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-200/30">
              <div className="text-white/80 text-sm mb-1">Registration Deadline</div>
              <div className="text-white font-bold">30 June 2025</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced navigation buttons for public pages */}
      <div className="flex flex-wrap justify-center gap-6 mt-8 z-10 relative animate-slide-in-up" style={{animationDelay: '0.3s'}}>
        <Link
          href="/standings"
          className="px-12 py-5 bg-black text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-gray-900 transition-all duration-300 border-2 border-gray-800 hover-lift relative overflow-hidden"
        >
          <span className="relative">🏆 View Standings</span>
        </Link>
        <Link
          href="/tournaments"
          className="px-12 py-5 bg-black text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-gray-900 transition-all duration-300 border-2 border-gray-800 hover-lift relative overflow-hidden"
        >
          <span className="relative">📅 View Tournaments</span>
        </Link>
        <Link
          href="/teams"
          className="px-12 py-5 bg-black text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-gray-900 transition-all duration-300 border-2 border-gray-800 hover-lift relative overflow-hidden"
        >
          <span className="relative">👥 View Teams</span>
        </Link>
        <Link
          href="/rules"
          className="px-12 py-5 bg-black text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-gray-900 transition-all duration-300 border-2 border-gray-800 hover-lift relative overflow-hidden"
        >
          <span className="relative">📋 View Rules</span>
        </Link>
        <Link
          href="/admin-login"
          className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-2xl font-bold shadow-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 border-2 border-blue-500 hover-lift relative overflow-hidden"
        >
          <span className="relative">🔐 Admin Login</span>
        </Link>
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
          <p className="text-white font-semibold text-sm">🏸 PBEL Badminton 2025</p>
          <p className="text-gray-300 text-xs mt-1">#PBELCityBT2025 • Badminton Baddies</p>
        </div>
      </div>
    </div>
  );
} 