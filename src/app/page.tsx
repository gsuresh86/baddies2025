'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Image from 'next/image';

export default function LandingPage() {
  const [, setStats] = useState({ pools: 0, teams: 0, players: 0, categories: 0 });
  // Timer state for registration deadline
  const [timeLeft, setTimeLeft] = useState<{days:number, hours:number, minutes:number, seconds:number}>({days:0, hours:0, minutes:0, seconds:0});

  useEffect(() => {
    async function fetchStats() {
      const [poolsRes, teamsRes, playersRes, categoriesRes] = await Promise.all([
        supabase.from('pools').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('t_players').select('id,name,email,category'),
        supabase.from('categories').select('*', { count: 'exact', head: true })
      ]);
      const pools = poolsRes.count;
      const teams = teamsRes.count;
      const players = Array.isArray(playersRes.data) ? playersRes.data.length : 0;
      const categories = categoriesRes.count;
      setStats({
        pools: typeof pools === 'number' ? pools : 0,
        teams: typeof teams === 'number' ? teams : 0,
        players,
        categories: typeof categories === 'number' ? categories : 0,
      });
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const deadline = new Date('2025-06-30T23:59:59');
    const interval = setInterval(() => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="w-full max-w-6xl mt-8 px-2 sm:px-4 mx-auto font-body">
        {/* Tournament Info Section */}
        <div className="bg-gradient-to-r from-blue-900/40 to-green-900/40 rounded-3xl p-8 mb-10 border border-white/20 shadow-2xl animate-fade-in-scale">
          <div className="text-center mb-6">
            <div className="flex flex-col items-center justify-center mb-4">
              <Image
                src="/planet-green-logo.png"
                alt="Planet Green Title Sponsor Logo"
                width={260}
                height={90}
                className="h-24 w-auto mb-2"
                style={{ maxWidth: '260px' }}
                priority
              />
              <span className="text-green-200 text-xs uppercase tracking-widest">Presents</span>
            </div>
            <div className="flex flex-col items-center justify-center mb-1">
              <div className="flex flex-col items-center justify-center mb-4 relative">
                <Image
                  src="/pcbt.png"
                  alt="PBEL City Badminton Tournament Title Image"
                  width={320}
                  height={100}
                  className="w-full max-w-xs h-auto mb-2 rounded-xl shadow-lg"
                  priority
                />
              </div>
            </div>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-4 font-body">
              Join us for an exciting, fun-filled badminton tournament open to all skill levels! Compete, connect, and celebrate the spirit of sportsmanship in our vibrant community event.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-white/90">
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="text-2xl mb-2">📍</div>
              <div className="font-bold mb-1 font-heading">Location</div>
              <div>Badminton Club, PBEL City Clubhouse</div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="font-bold mb-1 font-heading">Tournament Dates</div>
              <div>12th Jul - 10th Aug 2025<br/><span className='text-white/60 text-sm'>(Weekend matches)</span></div>
            </div>
          </div>
        </div>

        {/* Registration Deadline Section with Timer */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-200/30 text-center">
            <div className="text-3xl mb-3">⏰</div>
            <h3 className="text-lg font-bold text-white mb-2 font-heading">Registration Deadline</h3>
            <p className="text-white/80 font-semibold mb-2">30 June 2025, 11:59 PM</p>
            <div className="flex justify-center gap-6 mb-4">
              <div className="px-6 py-4 flex gap-6 items-center">
                <div className="flex flex-col items-center">
                  <span className="font-extrabold text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-lg animate-pulse">{timeLeft.days}</span>
                  <span className="text-xs sm:text-sm text-white/80 mt-1 tracking-wide">days</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-extrabold text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-lg animate-pulse">{timeLeft.hours}</span>
                  <span className="text-xs sm:text-sm text-white/80 mt-1 tracking-wide">hrs</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-extrabold text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-lg animate-pulse">{timeLeft.minutes}</span>
                  <span className="text-xs sm:text-sm text-white/80 mt-1 tracking-wide">min</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-extrabold text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-lg animate-pulse">{timeLeft.seconds}</span>
                  <span className="text-xs sm:text-sm text-white/80 mt-1 tracking-wide">sec</span>
                </div>
              </div>
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSc8U4-KqWzDRl-n_afvn14LpMhdM5_qr3d-xVF9IxOhCBRh8Q/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg mb-3 transition-all duration-200"
            >
              Register Now
            </a>
            <p className="text-white/60 text-sm mt-1">Don&apos;t miss out!</p>
          </div>
        </div>

        {/* Important Format & Highlights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-200/30 hover-lift">
            <div className="text-4xl mb-3">🎮</div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">Format</h3>
            <p className="text-white/80">Women&apos;s, Mixed, and Junior events<br/>Team & Individual categories</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-200/30 hover-lift">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">Highlights</h3>
            <p className="text-white/80">Medals, food stalls, and lots of fun!</p>
          </div>
        </div>

        {/* Enhanced Tournament Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-200/30 hover-lift">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">Fast-Paced Action</h3>
            <p className="text-white/80">Witness intense rallies and strategic gameplay</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-200/30 hover-lift">
            <div className="text-4xl mb-3">🏅</div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">Championship Glory</h3>
            <p className="text-white/80">Compete for prestigious titles and recognition</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-200/30 hover-lift">
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">Sportsmanship</h3>
            <p className="text-white/80">Celebrate fair play and camaraderie</p>
          </div>
        </div>

        {/* Sponsors Section */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🌟</div>
              <h2 className="text-3xl font-bold text-white text-glow-white mb-2 font-heading">Our Sponsors</h2>
              <p className="text-white/80 text-lg">Proudly supported by leading organizations</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Planet Green */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl p-6 border border-green-200/30 hover-lift transition-all duration-300">
                <div className="text-center flex flex-col items-center">
                  <Image
                    src="/planet-green-logo.png"
                    alt="Planet Green Logo"
                    width={180}
                    height={64}
                    className="h-16 mb-4 w-auto"
                    style={{ maxWidth: '180px' }}
                  />
                  <a 
                    href="https://www.planetgreen.co.in/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                  >
                    Visit Website
                  </a>
                </div>
              </div>

              {/* Badminton Association */}
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl p-6 border border-blue-200/30 hover-lift transition-all duration-300">
                <div className="text-center">
                  <div className="text-4xl mb-4">🏸</div>
                  <h3 className="text-xl font-bold text-white mb-2">Badminton Association</h3>
                  <p className="text-white/80 text-sm mb-4">Promoting Sports Excellence</p>
                  <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Official Partner
                  </div>
                </div>
              </div>

              {/* Sports Equipment */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl p-6 border border-purple-200/30 hover-lift transition-all duration-300">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎾</div>
                  <h3 className="text-xl font-bold text-white mb-2">Sports Equipment</h3>
                  <p className="text-white/80 text-sm mb-4">Premium Gear Provider</p>
                  <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Equipment Partner
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8 pt-6 border-t border-white/10">
              <p className="text-white/60 text-sm">
                Interested in becoming a sponsor? Contact us for partnership opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-8 mb-24 bg-black/80 rounded-2xl p-4 sm:p-6 border border-gray-800 animate-fade-in-scale" style={{animationDelay: '0.6s'}}>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 text-white">
            <div className="text-center min-w-[80px] flex-1">
              <div className="text-xl sm:text-2xl font-bold">🎯</div>
              <div className="text-xs sm:text-sm opacity-80">Precision</div>
            </div>
            <div className="text-center min-w-[80px] flex-1">
              <div className="text-xl sm:text-2xl font-bold">💪</div>
              <div className="text-xs sm:text-sm opacity-80">Strength</div>
            </div>
            <div className="text-center min-w-[80px] flex-1">
              <div className="text-xl sm:text-2xl font-bold">🧠</div>
              <div className="text-xs sm:text-sm opacity-80">Strategy</div>
            </div>
            <div className="text-center min-w-[80px] flex-1">
              <div className="text-xl sm:text-2xl font-bold">⚡</div>
              <div className="text-xs sm:text-sm opacity-80">Speed</div>
            </div>
            <div className="text-center min-w-[80px] flex-1">
              <div className="text-xl sm:text-2xl font-bold">🏆</div>
              <div className="text-xs sm:text-sm opacity-80">Victory</div>
            </div>
          </div>
        </div>
         <SpeedInsights />
      </div>
    </>
  );
}
