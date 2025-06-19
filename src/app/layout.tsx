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
}

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
        {/* Static Badminton Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Image
            src="/badminton1.jpg"
            alt="Badminton Background"
            fill
            style={{ objectFit: 'cover', position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
            draggable={false}
            priority
          />
          {/* Animated overlay for more attraction */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-white/40 to-green-400/60 pointer-events-none" style={{zIndex:1}} />
        </div>
        {/* Logo and Title */}
        <div className="z-10 relative flex flex-col items-center mt-8 mb-2">
          <span className="text-5xl mb-2">🏸</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight text-center">PBEL Badminton 2025</h1>
        </div>
        {/* Common navigation buttons for public pages */}
        <div className="flex flex-wrap justify-center gap-6 mt-8 z-10 relative">
          <a
            href="/standings"
            className="px-10 py-4 bg-gradient-to-r from-blue-700 to-green-500 text-white rounded-xl text-2xl font-bold shadow-xl hover:from-blue-800 hover:to-green-600 transition-all border-2 border-white/40 backdrop-blur-md"
          >
            View Standings
          </a>
          <a
            href="/tournaments"
            className="px-10 py-4 bg-gradient-to-r from-purple-700 to-pink-500 text-white rounded-xl text-2xl font-bold shadow-xl hover:from-purple-800 hover:to-pink-600 transition-all border-2 border-white/40 backdrop-blur-md"
          >
            View Fixtures
          </a>
          <a
            href="/teams"
            className="px-10 py-4 bg-gradient-to-r from-green-700 to-blue-500 text-white rounded-xl text-2xl font-bold shadow-xl hover:from-green-800 hover:to-blue-600 transition-all border-2 border-white/40 backdrop-blur-md"
          >
            View Teams
          </a>
          <a
            href="/rules"
            className="px-10 py-4 bg-gradient-to-r from-yellow-600 to-orange-400 text-white rounded-xl text-2xl font-bold shadow-xl hover:from-yellow-700 hover:to-orange-500 transition-all border-2 border-white/40 backdrop-blur-md"
          >
            View Rules
          </a>
        </div>
        <main className="flex-1 relative z-10 w-full flex flex-col items-center justify-center">
          {children}
        </main>
        {/* Decorative Shuttlecock */}
        <div className="absolute bottom-8 right-8 w-24 h-24 opacity-60 rotate-12 pointer-events-none select-none rounded-full overflow-hidden border-4 border-white shadow-lg" style={{ zIndex: 1 }}>
          <Image
            src="/badminton1.jpg"
            alt="Shuttlecock"
            fill
            style={{ objectFit: 'cover' }}
            draggable={false}
            className="w-full h-full object-cover"
            priority={false}
          />
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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 shadow-sm flex flex-col py-6 px-3 min-h-screen z-20">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">🏸 Baddies 2025</h1>
          <p className="text-xs text-gray-500">Tournament Scheduler</p>
        </div>
        <nav className="flex flex-col gap-1">
          <Link href="/" className="px-2 py-2 rounded hover:bg-blue-50 text-gray-900 font-medium transition">Home</Link>
          <Link href="/tournaments" className="px-2 py-2 rounded hover:bg-blue-50 text-gray-900 font-medium transition">Tournaments</Link>
          <Link href="/standings" className="px-2 py-2 rounded hover:bg-blue-50 text-gray-900 font-medium transition">Standings</Link>
        </nav>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10 h-16 flex items-center px-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">🏸 Baddies 2025 Admin</h1>
          <AdminAuthBar user={user} />
        </header>
        <main className="flex-1 px-6 py-6 bg-gray-100 overflow-y-auto">
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
