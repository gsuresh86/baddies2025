'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Team } from '@/types';
import { tournamentStore } from '@/lib/store';

export default function TeamDetailsPage() {
  const params = useParams();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamDetails() {
      if (!teamId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const teamData = await tournamentStore.getTeamById(teamId);
        if (!teamData) {
          setError('Team not found');
          setLoading(false);
          return;
        }
        
        setTeam(teamData);
      } catch (err) {
        console.error('Error fetching team details:', err);
        setError('Failed to load team details');
      }
      
      setLoading(false);
    }
    
    fetchTeamDetails();
  }, [teamId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-white text-xl font-semibold">Loading team details...</p>
            <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-3xl p-8 backdrop-blur-md border border-red-200/30">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
            <p className="text-white/80 mb-6">{error || 'The team you are looking for does not exist.'}</p>
            <Link 
              href="/teams"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              ← Back to Teams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/teams"
          className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Teams
        </Link>
        
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👥</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-glow-white mb-4">
            {team.brand_name || team.name}
          </h1>
          <p className="text-white/80 text-xl">
            Team Details & Player Roster
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Team Information Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-3xl">
                {team.brand_name || team.name}.charAt(0).toUpperCase()
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{team.brand_name || team.name}</h2>
              <p className="text-white/60 text-sm">Team #{team.id.slice(0, 8)}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white/70">Pool Assignment:</span>
                <span className="text-white font-medium">
                  {team.pool ? team.pool.name : 'Unassigned'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white/70">Players:</span>
                <span className="text-white font-medium">
                  {team.players?.length || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white/70">Status:</span>
                <span className="text-green-300 font-medium">Active</span>
              </div>
              
              {team.created_at && (
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Created:</span>
                  <span className="text-white/60 text-sm">
                    {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Players Roster */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20">
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">🏸</div>
              <h2 className="text-2xl font-bold text-white text-glow-white">Player Roster</h2>
              <div className="ml-auto bg-gradient-to-r from-blue-600/50 to-purple-600/50 rounded-full px-4 py-2">
                <span className="text-white font-bold">{team.players?.length || 0} Players</span>
              </div>
            </div>

            {!team.players || team.players.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">👤</div>
                <p className="text-white/80 text-lg mb-4">No players assigned to this team yet.</p>
                <p className="text-white/60 text-sm">Players will appear here once they are added to the team.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {team.players.map((player, index) => (
                  <div 
                    key={player.id}
                    className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover-lift transition-all duration-300"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="flex items-start mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-4 text-white font-bold text-lg">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-1">{player.name}</h3>
                        {player.level && (
                          <div className="inline-block bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full px-3 py-1 mb-2">
                            <span className="text-white text-sm font-medium">{player.level}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {player.level && (
                        <div className="flex items-center text-sm">
                          <span className="text-white/60 mr-2">🏆</span>
                          <span className="text-white/80">Level: {player.level}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Statistics */}
      {team.players && team.players.length > 0 && (
        <div className="mt-8">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20">
            <h2 className="text-2xl font-bold text-white text-glow-white mb-6 text-center">Team Statistics</h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-200/30">
                <div className="text-3xl font-bold text-blue-300 mb-2">{team.players.length}</div>
                <div className="text-white/80 text-sm">Total Players</div>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-200/30">
                <div className="text-3xl font-bold text-green-300 mb-2">
                  {team.players.filter(p => p.level === 'Beginner').length}
                </div>
                <div className="text-white/80 text-sm">Beginners</div>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-200/30">
                <div className="text-3xl font-bold text-yellow-300 mb-2">
                  {team.players.filter(p => p.level === 'Intermediate').length}
                </div>
                <div className="text-white/80 text-sm">Intermediate</div>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-200/30">
                <div className="text-3xl font-bold text-red-300 mb-2">
                  {team.players.filter(p => p.level === 'Advanced').length}
                </div>
                <div className="text-white/80 text-sm">Advanced</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 