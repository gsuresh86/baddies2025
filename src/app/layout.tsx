import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Badminton Tournament Scheduler",
  description: "Manage badminton tournaments with pools, teams, and match scheduling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
            </nav>
          </aside>
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-screen">
            <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10 h-16 flex items-center px-6">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">🏸 PBEL Badminton 2025</h1>
            </header>
            <main className="flex-1 px-6 py-6 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
