'use client';

import { useState, useEffect } from 'react';
import { tournamentStore } from '@/lib/store';
import { Organizer } from '@/types';
import Link from 'next/link';


export default function OrganizersPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load organizers from database
  useEffect(() => {
    async function loadOrganizers() {
      try {
        setLoading(true);
        const dbOrganizers = await tournamentStore.getOrganizers();
        // Sort organizers by name alphabetically
        const sortedOrganizers = (dbOrganizers || []).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setOrganizers(sortedOrganizers);
      } catch (error) {
        console.error('Error loading organizers:', error);
        setOrganizers([]);
      } finally {
        setLoading(false);
      }
    }
    loadOrganizers();
  }, []);

  // Auto-advance to next organizer
  useEffect(() => {
    if (!isAutoPlaying || organizers.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % organizers.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, organizers.length]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % organizers.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + organizers.length) % organizers.length);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const currentOrganizer = organizers[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organizers...</p>
        </div>
      </div>
    );
  }

  if (organizers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No organizers found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header Section */}
      <div className="text-center mb-12 animate-fade-in-scale">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-glow-white">
          🏸 Tournament Organizers
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
          Meet the dedicated team behind the PBEL City Badminton Tournament 2025
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-6 rounded-full"></div>
        
        {/* Grid View Button */}
        <div className="mt-8">
          <Link 
            href="/organizers/list"
            className="inline-flex items-center px-6 py-3 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 hover:border-green-400/50 transition-all duration-300 hover-lift text-white font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid View
          </Link>
        </div>
      </div>

      {/* Single Organizer Card */}
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="relative w-full max-w-2xl animate-fade-in-scale">
          <div 
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-black/50 to-gray-900/50 backdrop-blur-sm border border-white/20 hover:border-green-400/50 transition-all duration-500 hover-lift shadow-2xl hover:shadow-3xl"
          >
            {/* Profile Image - Full Card */}
            <div className="relative h-80 md:h-96 w-full overflow-hidden rounded-2xl p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 rounded-2xl"></div>
              {currentOrganizer.image_url ? (
                <div className="flex items-center justify-center h-full pt-8">
                  <img
                    src={currentOrganizer.image_url}
                    alt={currentOrganizer.name}
                    className="w-[400px] h-[400px] object-cover rounded-xl"
                    style={{ borderRadius: '12px' }}
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center rounded-xl">
                  <div className="text-center">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-2xl">
                      <span className="text-4xl md:text-5xl font-bold text-white">
                        {currentOrganizer.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Organizer Info */}
            <div className="p-8 text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-green-300 transition-all duration-300 group-hover:drop-shadow-lg">
                {currentOrganizer.name}
              </h3>
              {currentOrganizer.role && (
                <p className="text-green-400 text-xl md:text-2xl font-medium mb-4">
                  {currentOrganizer.role}
                </p>
              )}
              
              {/* Progress indicator */}
              <div className="flex justify-center space-x-2 mt-6">
                {organizers.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToIndex(index);
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'bg-green-500 scale-125' 
                        : 'bg-gray-500 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              




              {/* Decorative Elements */}
              <div className="absolute top-6 right-6 w-4 h-4 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              <div className="absolute bottom-6 left-6 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center space-x-6 mt-8">
          <button
            onClick={goToPrevious}
            className="p-4 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 hover:border-green-400/50 transition-all duration-300 hover-lift"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={toggleAutoPlay}
            className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
              isAutoPlaying 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {isAutoPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>

          <button
            onClick={goToNext}
            className="p-4 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 hover:border-green-400/50 transition-all duration-300 hover-lift"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Organizer Counter */}
        <div className="mt-6 text-center">
          <p className="text-white text-lg font-medium">
            {currentIndex + 1} of {organizers.length}
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-16 w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover-lift">
            <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">{organizers.length}</div>
            <div className="text-white font-medium">Total Organizers</div>
          </div>
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover-lift">
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">2025</div>
            <div className="text-white font-medium">Tournament Year</div>
          </div>
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover-lift">
            <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">🏆</div>
            <div className="text-white font-medium">Excellence</div>
          </div>
        </div>
      </div>



      {/* Floating Decorative Elements */}
      <div className="fixed top-20 left-10 w-8 h-8 bg-green-500/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-40 right-20 w-6 h-6 bg-blue-500/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="fixed bottom-40 left-20 w-10 h-10 bg-purple-500/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '3s' }}></div>
    </div>
  );
} 