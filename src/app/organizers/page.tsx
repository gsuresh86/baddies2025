'use client';

import { useState, useEffect } from 'react';

interface Organizer {
  id: number;
  name: string;
  image: string;
  role?: string;
}

const organizers: Organizer[] = [
  { id: 1, name: 'Amit Saxena', image: '/organizers/placeholder.jpg', role: 'Tournament Director' },
  { id: 2, name: 'Ram Dheeraj', image: '/organizers/placeholder.jpg', role: 'Event Coordinator' },
  { id: 3, name: 'Sumit Khatavkar', image: '/organizers/placeholder.jpg', role: 'Technical Director' },
  { id: 4, name: 'Kshitij Bhargava', image: '/organizers/placeholder.jpg', role: 'Operations Manager' },
  { id: 5, name: 'Surya Kiran Reddy', image: '/organizers/placeholder.jpg', role: 'Venue Coordinator' },
  { id: 6, name: 'Kambe R Gowda', image: '/organizers/placeholder.jpg', role: 'Player Relations' },
  { id: 7, name: 'Kishore Babu', image: '/organizers/placeholder.jpg', role: 'Media Coordinator' },
  { id: 8, name: 'Saravanan M', image: '/organizers/placeholder.jpg', role: 'Technical Support' },
  { id: 9, name: 'Suresh', image: '/organizers/placeholder.jpg', role: 'Logistics Manager' },
  { id: 10, name: 'Sarada Reddy', image: '/organizers/placeholder.jpg', role: 'Administrative Head' },
  { id: 11, name: 'Sraveen Kuchipudi', image: '/organizers/placeholder.jpg', role: 'Event Manager' },
  { id: 12, name: 'Sudheer Reddy', image: '/organizers/placeholder.jpg', role: 'Tournament Coordinator' },
  { id: 13, name: 'Vasu Chepuru', image: '/organizers/placeholder.jpg', role: 'Technical Manager' },
  { id: 14, name: 'Saravanan', image: '/organizers/placeholder.jpg', role: 'Operations Coordinator' },
  { id: 15, name: 'Girish', image: '/organizers/placeholder.jpg', role: 'Player Coordinator' },
];

export default function OrganizersPage() {
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance to next organizer
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % organizers.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

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
      </div>

      {/* Single Organizer Card */}
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="relative w-full max-w-2xl animate-fade-in-scale">
          <div 
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-black/50 to-gray-900/50 backdrop-blur-sm border border-white/20 hover:border-green-400/50 transition-all duration-500 hover-lift cursor-pointer shadow-2xl hover:shadow-3xl"
            onClick={() => setSelectedOrganizer(currentOrganizer)}
          >
            {/* Profile Image */}
            <div className="relative h-80 md:h-96 w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      {currentOrganizer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-300 text-lg font-medium">Profile Image</p>
                    <p className="text-gray-500 text-sm">Coming Soon</p>
                  </div>
                </div>
              </div>
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
              
              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-white text-lg font-medium">Click to view details</p>
                </div>
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

      {/* Modal for Organizer Details */}
      {selectedOrganizer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-black/90 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20 animate-scale-in">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <span className="text-4xl font-bold text-white">
                  {selectedOrganizer.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedOrganizer.name}</h2>
              {selectedOrganizer.role && (
                <p className="text-green-400 font-medium mb-6">{selectedOrganizer.role}</p>
              )}
              <p className="text-gray-300 mb-6">
                Dedicated organizer contributing to the success of PBEL City Badminton Tournament 2025.
              </p>
              <button
                onClick={() => setSelectedOrganizer(null)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-full hover:scale-105 transition-transform duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Decorative Elements */}
      <div className="fixed top-20 left-10 w-8 h-8 bg-green-500/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-40 right-20 w-6 h-6 bg-blue-500/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="fixed bottom-40 left-20 w-10 h-10 bg-purple-500/30 rounded-full animate-float pointer-events-none" style={{ animationDelay: '3s' }}></div>
    </div>
  );
} 