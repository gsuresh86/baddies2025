'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentStore } from '@/lib/store';
import AuthGuard from '@/components/AuthGuard';
import { Organizer } from '@/types';

// Fallback organizers data (in case database is not set up yet)
const fallbackOrganizers = [
  { id: '1', name: 'Amit Saxena', role: 'Tournament Director' },
  { id: '2', name: 'Ram Dheeraj', role: 'Event Coordinator' },
  { id: '3', name: 'Sumit Khatavkar', role: 'Technical Director' },
  { id: '4', name: 'Kshitij Bhargava', role: 'Operations Manager' },
  { id: '5', name: 'Surya Kiran Reddy', role: 'Venue Coordinator' },
  { id: '6', name: 'Kambe R Gowda', role: 'Match Relations' },
  { id: '7', name: 'Kishore Babu', role: 'Media Coordinator' },
  { id: '8', name: 'Saravanan M', role: 'Technical Support' },
  { id: '9', name: 'Suresh', role: 'Logistics Manager' },
  { id: '10', name: 'Sarada Reddy', role: 'Administrative Head' },
  { id: '11', name: 'Sraveen Kuchipudi', role: 'Event Manager' },
  { id: '12', name: 'Sudheer Reddy', role: 'Tournament Coordinator' },
  { id: '13', name: 'Vasu Chepuru', role: 'Technical Manager' },
  { id: '14', name: 'Saravanan', role: 'Operations Coordinator' },
  { id: '15', name: 'Girish', role: 'Player Coordinator' },
];

export default function EditOrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrganizers() {
      try {
        setLoading(true);
        // Try to get organizers from database first
        const dbOrganizers = await tournamentStore.getOrganizers();
        if (dbOrganizers && dbOrganizers.length > 0) {
          setOrganizers(dbOrganizers);
        } else {
          // Fallback to static data
          const fallbackData = fallbackOrganizers.map(org => ({
            id: org.id,
            name: org.name,
            role: org.role,
            is_active: true,
            display_order: parseInt(org.id),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setOrganizers(fallbackData);
        }
      } catch (error) {
        console.error('Error loading organizers:', error);
        // Fallback to static data
        const fallbackData = fallbackOrganizers.map(org => ({
          id: org.id,
          name: org.name,
          role: org.role,
          is_active: true,
          display_order: parseInt(org.id),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setOrganizers(fallbackData);
      } finally {
        setLoading(false);
      }
    }
    loadOrganizers();
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading organizers...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              👨‍💼 Edit Organizers
            </h1>
            <p className="text-xl text-gray-300">
              Manage tournament organizers and their information
            </p>
          </div>

          {/* Navigation */}
          <div className="mb-8 flex justify-center">
            <Link
              href="/organizers"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              ← Back to Organizers
            </Link>
          </div>

          {/* Organizers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizers.map((organizer) => (
              <div
                key={organizer.id}
                className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-green-400/50 transition-all duration-300 hover-lift"
              >
                {/* Organizer Image */}
                <div className="text-center mb-4">
                  {organizer.image_url ? (
                    <img
                      src={organizer.image_url}
                      alt={organizer.name}
                      className="w-24 h-24 object-cover rounded-full mx-auto border-4 border-green-400"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-white">
                        {organizer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Organizer Info */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {organizer.name}
                  </h3>
                  {organizer.role && (
                    <p className="text-green-400 font-medium">
                      {organizer.role}
                    </p>
                  )}
                </div>

                {/* Edit Button */}
                <div className="text-center">
                  <Link
                    href={`/organizers/${organizer.id}`}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Organizer
                  </Link>
                </div>

                {/* Status Indicator */}
                <div className="mt-4 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    organizer.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {organizer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {organizers.length}
                </div>
                <div className="text-white font-medium">Total Organizers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {organizers.filter(o => o.is_active).length}
                </div>
                <div className="text-white font-medium">Active Organizers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {organizers.filter(o => o.image_url).length}
                </div>
                <div className="text-white font-medium">With Images</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">📋 Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-green-400 mb-2">Image Requirements:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Supported formats: PNG, JPG, JPEG</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Recommended size: 400x400 pixels</li>
                  <li>• Square aspect ratio preferred</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-2">Role Guidelines:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Keep roles concise and clear</li>
                  <li>• Examples: Tournament Director, Event Coordinator</li>
                  <li>• Avoid special characters</li>
                  <li>• Maximum 50 characters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 