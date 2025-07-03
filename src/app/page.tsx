'use client';

import { useEffect, useState } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Image from 'next/image';

// Countdown component for tournament start
function CountdownToTournament() {
  const tournamentDate = new Date('2025-07-12T00:00:00');
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = new Date();
    const diff = tournamentDate.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  });

  return (
    <div className="mb-8 flex flex-col items-center justify-center">
      <div className="bg-gradient-to-r from-blue-700/80 to-green-600/80 rounded-3xl shadow-2xl p-10 text-center border border-white/20 animate-fade-in-scale max-w-2xl w-full">
        <div className="text-5xl mb-4 animate-float">⏳</div>
        <h2 className="text-3xl font-extrabold text-white text-glow-white mb-2 font-heading">Tournament Countdown</h2>
        <p className="text-lg text-white/80 mb-6">The tournament begins soon! Get ready for the action.</p>
        <div className="flex justify-center gap-6 text-white text-2xl font-bold mb-2">
          <div className="flex flex-col items-center">
            <span className="text-4xl">{timeLeft.days}</span>
            <span className="text-base font-medium text-white/70">Days</span>
          </div>
          <span className="text-4xl font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl">{timeLeft.hours}</span>
            <span className="text-base font-medium text-white/70">Hours</span>
          </div>
          <span className="text-4xl font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl">{timeLeft.minutes}</span>
            <span className="text-base font-medium text-white/70">Minutes</span>
          </div>
          <span className="text-4xl font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl">{timeLeft.seconds}</span>
            <span className="text-base font-medium text-white/70">Seconds</span>
          </div>
        </div>
        <div className="mt-4 text-white/80 text-lg">Starts on <span className="font-bold">July 12, 2025</span></div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <div className="w-full max-w-6xl mt-8 px-2 sm:px-4 mx-auto font-body">
        {/* Top Navigation for Hash Links */}
        <nav className="flex flex-wrap justify-center gap-4 mb-8 sticky top-0 z-30 bg-black/70 rounded-xl py-2 px-4 border border-white/10 shadow-lg backdrop-blur-md">
          <a href="#tournament-info" className="text-white font-bold hover:text-green-300 transition">Info</a>
          <a href="#countdown" className="text-white font-bold hover:text-green-300 transition">Countdown</a>
          <a href="#format" className="text-white font-bold hover:text-green-300 transition">Format</a>
          <a href="#enhanced-info" className="text-white font-bold hover:text-green-300 transition">Highlights</a>
          <a href="#sponsors" className="text-white font-bold hover:text-green-300 transition">Sponsors</a>
          <a href="#quick-stats" className="text-white font-bold hover:text-green-300 transition">Stats</a>
        </nav>
        {/* Tournament Info Section */}
        <div id="tournament-info" className="bg-gradient-to-r from-blue-900/40 to-green-900/40 rounded-3xl p-8 mb-10 border border-white/20 shadow-2xl animate-fade-in-scale scroll-mt-24">
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

        {/* Countdown to Tournament Start Section */}
        <div id="countdown" className="scroll-mt-24">
          <CountdownToTournament />
        </div>

        {/* Important Format & Highlights Section */}
        <div id="format" className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 scroll-mt-24">
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
        <div id="enhanced-info" className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 scroll-mt-24">
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

        {/* Media & Gallery Section */}
        <div id="media-gallery" className="mb-12 scroll-mt-24">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎥</div>
            <h2 className="text-3xl font-bold text-white text-glow-white mb-2 font-heading">Media & Gallery</h2>
            <p className="text-white/80 text-lg">Watch highlights and relive the best moments!</p>
          </div>
          <div className="flex flex-row gap-x-8 py-2 flex-wrap justify-center items-stretch">
            {/* YouTube Video Thumbnail 1 */}
            <a
              href="https://www.youtube.com/watch?si=PcwbnejYIJLkC-aP&v=OUvr1BIXMvE&feature=youtu.be&themeRefresh=1"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black/60 hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center"
              style={{ aspectRatio: '16/9', maxWidth: '320px', height: '180px', minWidth: '220px' }}
            >
              <Image
                src="https://img.youtube.com/vi/OUvr1BIXMvE/hqdefault.jpg"
                alt="PBEL City Badminton Tournament 2025 Video"
                className="w-full h-full object-cover group-hover:brightness-75 transition duration-300"
                width={320}
                height={180}
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 rounded-full p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="48" height="48">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-2">
                <span className="text-white font-semibold text-base">PBEL City Badminton Tournament 2025</span>
              </div>
            </a>
            {/* YouTube Video Thumbnail 2 */}
            <a
              href="https://www.youtube.com/watch?v=m5vLAxRWocc"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black/60 hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center"
              style={{ aspectRatio: '16/9', maxWidth: '320px', height: '180px', minWidth: '220px' }}
            >
              <Image
                src="https://img.youtube.com/vi/m5vLAxRWocc/hqdefault.jpg"
                alt="PBEL City Badminton Tournament 2025 - Gallery Video 2"
                className="w-full h-full object-cover group-hover:brightness-75 transition duration-300"
                width={320}
                height={180}
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 rounded-full p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="48" height="48">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-2">
                <span className="text-white font-semibold text-base">PBEL City Badminton Tournament - Gallery Video</span>
              </div>
            </a>
            {/* YouTube Video Thumbnail 3 */}
            <a
              href="https://www.youtube.com/watch?v=afOWQWRT0aM"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black/60 hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center"
              style={{ aspectRatio: '16/9', maxWidth: '320px', height: '180px', minWidth: '220px' }}
            >
              <Image
                src="https://img.youtube.com/vi/afOWQWRT0aM/hqdefault.jpg"
                alt="PBEL City Badminton Tournament 2025 - Gallery Video 3"
                className="w-full h-full object-cover group-hover:brightness-75 transition duration-300"
                width={320}
                height={180}
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 rounded-full p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="48" height="48">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-2">
                <span className="text-white font-semibold text-base">PBEL City Badminton Tournament - Gallery Video 2</span>
              </div>
            </a>
            {/* Dummy Thumbnail */}
            <div
              className="group relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black/40 flex flex-col items-center justify-center cursor-not-allowed opacity-60"
              style={{ aspectRatio: '16/9', maxWidth: '320px', height: '180px', minWidth: '220px' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl text-white/30">📸</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 rounded-full p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="48" height="48">
                    <circle cx="12" cy="12" r="10" fill="#fff" fillOpacity="0.1" />
                    <rect x="8" y="8" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.2" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-2">
                <span className="text-white font-semibold text-base">More coming soon...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsors Section */}
        <div id="sponsors" className="mt-8 scroll-mt-24">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-scale">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🌟</div>
              <h2 className="text-3xl font-bold text-white text-glow-white mb-2 font-heading">Our Sponsors</h2>
              <p className="text-white/80 text-lg">Proudly supported by leading organizations</p>
            </div>

            {/* Sponsors Layout: Planet Green on first row, others on second row */}
            <div className="flex flex-col gap-8 mb-12">
              {/* First row: Presenting Sponsor */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                <div className="bg-gradient-to-br from-green-700/30 to-emerald-900/30 rounded-2xl p-8 border-2 border-green-300/30 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 flex flex-col items-center min-w-[260px]">
                  <span className="text-xs uppercase tracking-widest text-green-100 mb-3 font-bold drop-shadow">Presenting Sponsor</span>
                  <Image
                    src="/planet-green-logo.png"
                    alt="Planet Green Logo"
                    width={220}
                    height={90}
                    className="h-24 mb-2 w-auto drop-shadow-lg"
                    style={{ maxWidth: '220px' }}
                  />
                </div>
              </div>
              {/* Second row: Co-Powered By and Game Zone Partner */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                {/* Co-Powered By (bigger logos) */}
                <div className="bg-gradient-to-br from-blue-700/30 to-blue-900/30 rounded-2xl p-8 border-2 border-blue-300/30 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 flex flex-col items-center min-w-[260px]">
                  <span className="text-xs uppercase tracking-widest text-blue-100 mb-3 font-bold drop-shadow">Co-Powered By</span>
                  <div className="flex flex-row items-center justify-center gap-12 mb-2">
                    <Image
                      src="/creekside-logo.png"
                      alt="Creekside Resort Logo"
                      width={200}
                      height={90}
                      className="h-24 w-auto drop-shadow-lg bg-white rounded-xl p-2"
                      style={{ maxWidth: '200px' }}
                    />
                    <Image
                      src="/trice-logo.png"
                      alt="Ask Trice Logo"
                      width={170}
                      height={90}
                      className="h-24 w-auto drop-shadow-lg bg-white rounded-xl p-2"
                      style={{ maxWidth: '170px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Conducted by Baddies Committee */}
            <div className="flex flex-col items-center justify-center mt-10 pt-8 border-t border-white/10">
              <span className="text-xs uppercase tracking-widest text-white/80 mb-2 font-bold drop-shadow">Organised by</span>
              <div className="flex flex-col items-center">
                <Image
                  src="/baddies.png"
                  alt="Baddies Committee Logo"
                  width={320}
                  height={160}
                  className="h-40 w-auto mb-2 drop-shadow-lg"
                  style={{ maxWidth: '320px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div id="quick-stats" className="mt-8 mb-24 bg-black/80 rounded-2xl p-4 sm:p-6 border border-gray-800 animate-fade-in-scale scroll-mt-24" style={{animationDelay: '0.6s'}}>
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
