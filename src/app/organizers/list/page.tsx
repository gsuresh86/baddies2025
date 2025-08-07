'use client';

import { useState, useEffect } from 'react';
import { tournamentStore } from '@/lib/store';
import { Organizer } from '@/types';
import Link from 'next/link';

export default function OrganizersListPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load organizers from database
  useEffect(() => {
    async function loadOrganizers() {
      try {
        setLoading(true);
        const dbOrganizers = await tournamentStore.getOrganizers();
        // Sort organizers by display_order, then by name alphabetically
        const sortedOrganizers = (dbOrganizers || []).sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          return a.name.localeCompare(b.name);
        });
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
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8">
      {/* Header Section */}
      <div className="text-center mb-12 animate-fade-in-scale">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-glow-white">
          🏸 Tournament Organizers
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
          Meet the dedicated team behind the PBEL City Badminton Tournament 2025
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-6 rounded-full"></div>
        
        {/* Back to Carousel View Button */}
        <div className="mt-8">
          <Link 
            href="/organizers"
            className="inline-flex items-center px-6 py-3 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 hover:border-green-400/50 transition-all duration-300 hover-lift text-white font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Carousel View
          </Link>
        </div>
      </div>

      {/* Organizers Grid - 2 rows × 6 columns */}
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {organizers.map((organizer) => (
            <div
              key={organizer.id}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/50 to-gray-900/50 backdrop-blur-sm border border-white/20 hover:border-green-400/50 transition-all duration-500 hover-lift shadow-2xl hover:shadow-3xl"
            >
              {/* Profile Image */}
              <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                {organizer.image_url ? (
                  <img
                    src={organizer.image_url}
                    alt={organizer.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-2xl">
                      <span className="text-xl font-bold text-white">
                        {organizer.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Organizer Info */}
              <div className="p-4 text-center">
                <h3 className="text-sm md:text-base font-bold text-white mb-2 group-hover:text-green-300 transition-all duration-300 group-hover:drop-shadow-lg line-clamp-2">
                  {organizer.name}
                </h3>
                {organizer.role && (
                  <p className="text-green-400 text-xs md:text-sm font-medium line-clamp-2">
                    {organizer.role}
                  </p>
                )}
              </div>

            </div>
          ))}
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