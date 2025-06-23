'use client';

export default function TournamentsPage() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col justify-center items-center px-4">
      <div className="bg-gradient-to-r from-blue-700/80 to-green-600/80 rounded-3xl shadow-2xl p-10 mt-24 text-center border border-white/20 animate-fade-in-scale">
        <div className="text-6xl mb-6 animate-float">📅</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white text-glow-white mb-4 drop-shadow-lg">
          Fixtures will be shown once the registration is closed.
        </h1>
        <p className="text-white/80 text-lg max-w-xl mx-auto mt-2">
          Thank you for your interest! Please check back after the registration deadline to see the tournament fixtures and match schedule.
        </p>
      </div>
    </div>
  );
} 