'use client';

// Removed export of metadata due to client component restriction
// import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from "@supabase/supabase-js";

const inter = Inter({ subsets: ["latin"] });

const PUBLIC_ROUTES = ['/', '/admin-login', '/standings', '/teams', '/rules'];

/*
function AdminAuthBar({ user }: { user: User | null }) {
  if (!user) return null;
  return (
    <div className="ml-auto flex items-center gap-4">
      <span className="text-sm text-gray-700">{user.email}</span>
      <button
        onClick={async () => { const m = await import('@/lib/store'); await m.signOut(); window.location.reload(); }}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 text-xs"
      >
        Sign Out
      </button>
    </div>
  );
}*/

function ClientAuthLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    import('@/lib/store').then(m => m.getUser().then(u => { setUser(u); setLoading(false); }));
  }, []);

  // Redirect if not authenticated and not on home, /admin-login, or /standings
  useEffect(() => {
    if (!user && !loading && !PUBLIC_ROUTES.includes(pathname)) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;

  // If not authenticated and on home, /admin-login, or /standings, show only the public content (with shared background)
  if (!user && PUBLIC_ROUTES.includes(pathname)) {
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
          <a
            href="/standings"
            className="px-12 py-5 bg-black text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-gray-900 transition-all duration-300 border-2 border-gray-800 hover-lift relative overflow-hidden"
          >
            <span className="relative">🏆 View Standings</span>
          </a>
          <a
            href="/tournaments"
            className="px-12 py-5 bg-black text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-gray-900 transition-all duration-300 border-2 border-gray-800 hover-lift relative overflow-hidden"
          >
            <span className="relative">📅 View Fixtures</span>
          </a>
          <a
            href="/teams"
            className="px-12 py-5 bg-black text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-gray-900 transition-all duration-300 border-2 border-gray-800 hover-lift relative overflow-hidden"
          >
            <span className="relative">👥 View Teams</span>
          </a>
          <a
            href="/rules"
            className="px-12 py-5 bg-black text-white rounded-2xl text-2xl font-bold shadow-2xl hover:bg-gray-900 transition-all duration-300 border-2 border-gray-800 hover-lift relative overflow-hidden"
          >
            <span className="relative">📋 View Rules</span>
          </a>
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

  // If not authenticated and not on home, /admin-login, or /standings, show nothing (redirecting)
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  // If authenticated, show full admin layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Enhanced Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg flex flex-col py-6 px-4 min-h-screen z-20">
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl text-white">
          <h1 className="text-xl font-bold mb-1">🏸 Baddies 2025</h1>
          <p className="text-xs opacity-90">Tournament Scheduler</p>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/" className="px-3 py-3 rounded-lg hover:bg-blue-50 text-gray-900 font-medium transition-all duration-200 hover:shadow-md hover-lift">
            🏠 Home
          </Link>
          <Link href="/tournaments" className="px-3 py-3 rounded-lg hover:bg-blue-50 text-gray-900 font-medium transition-all duration-200 hover:shadow-md hover-lift">
            📅 Tournaments
          </Link>
          <Link href="/standings" className="px-3 py-3 rounded-lg hover:bg-blue-50 text-gray-900 font-medium transition-all duration-200 hover:shadow-md hover-lift">
            🏆 Standings
          </Link>
        </nav>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="w-full flex flex-col md:flex-row items-center justify-between px-4 pt-6 pb-2 z-10 relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 md:w-20 md:h-20 relative">
              <Image
                src="/baddies.png"
                alt="Badminton Baddies Logo"
                fill
                style={{ objectFit: 'contain' }}
                draggable={false}
                priority
              />
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight m-0 p-0 whitespace-nowrap">
              PBEL Badminton Tournament 2025
            </h1>
          </div>
          {/* Dates/info right */}
          <div className="flex flex-col items-end mt-4 md:mt-0 w-full md:w-auto">
            <div className="flex flex-col md:items-end">
              <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl px-4 py-1 border border-green-200/30 mb-1">
                <span className="text-white/80 text-xs md:text-sm">Tournament Dates: <span className="font-bold text-white">12th Jul - 10th Aug 2025</span></span>
              </div>
              <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl px-4 py-1 border border-red-200/30">
                <span className="text-white/80 text-xs md:text-sm">Registration Deadline: <span className="font-bold text-white">30 June 2025</span></span>
              </div>
            </div>
          </div>
        </header>
        {/* Navigation buttons row at the top */}
        <nav className="w-full max-w-5xl mx-auto flex flex-wrap justify-center md:justify-start gap-3 md:gap-6 mt-4 mb-2 z-10 relative">
          <a
            href="/standings"
            className="px-6 py-2 bg-black text-white rounded-xl text-base md:text-lg font-bold shadow hover:bg-gray-900 transition-all duration-200 border border-gray-800 hover-lift"
          >
            🏆 View Standings
          </a>
          <a
            href="/tournaments"
            className="px-6 py-2 bg-black text-white rounded-xl text-base md:text-lg font-bold shadow hover:bg-gray-900 transition-all duration-200 border border-gray-800 hover-lift"
          >
            📅 View Fixtures
          </a>
          <a
            href="/teams"
            className="px-6 py-2 bg-black text-white rounded-xl text-base md:text-lg font-bold shadow hover:bg-gray-900 transition-all duration-200 border border-gray-800 hover-lift"
          >
            👥 View Teams
          </a>
          <a
            href="/rules"
            className="px-6 py-2 bg-black text-white rounded-xl text-base md:text-lg font-bold shadow hover:bg-gray-900 transition-all duration-200 border border-gray-800 hover-lift"
          >
            📋 View Rules
          </a>
        </nav>
        <main className="flex-1 px-6 py-6 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientAuthLayout>{children}</ClientAuthLayout>
      </body>
    </html>
  );
}
