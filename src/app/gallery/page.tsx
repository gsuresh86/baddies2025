'use client';

import { useEffect, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/store';
import { MatchMedia } from '@/types';

export default function PublicGalleryPage() {
  const [media, setMedia] = useState<MatchMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MatchMedia | null>(null);
  const [search, setSearch] = useState('');
  const { matches, teams, players } = useData();

  useEffect(() => {
    async function fetchMedia() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('match_media')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setMedia(data || []);
      } catch (err) {
        console.error('Error fetching media:', err);
        setMedia([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12 animate-slide-in-up">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-5xl animate-float">🖼️</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white" style={{textShadow: '0 0 20px rgba(255,255,255,0.8)'}}>Gallery</h1>
        </div>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">Browse all public photos and videos from the tournament. Click any item to view it larger.</p>
      </div>
      {/* Player Search Box */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by player name..."
          className="w-full max-w-md px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse">
            <div className="text-4xl mb-4">🖼️</div>
            <p className="text-white text-xl font-semibold">Loading gallery...</p>
            <div className="mt-4 w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-2">📭</div>
          <h3 className="text-lg font-medium text-white mb-2">No media found</h3>
          <p className="text-white/60 mb-4">No public photos or videos have been uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {media
            .filter(item => {
              if (!search.trim()) return true;
              let match = undefined;
              if (item.match_id) {
                match = matches.find(m => m.id === item.match_id);
              }
              if (!match) return false;
              const player1Name = match?.player1_id ? (players.find(p => p.id === match.player1_id)?.name || '') : '';
              const player2Name = match?.player2_id ? (players.find(p => p.id === match.player2_id)?.name || '') : '';
              const searchLower = search.toLowerCase();
              return (
                player1Name.toLowerCase().includes(searchLower) ||
                player2Name.toLowerCase().includes(searchLower)
              );
            })
            .map((item) => {
            // Find match details if match_id is present
            let match = undefined;
            if (item.match_id) {
              match = matches.find(m => m.id === item.match_id);
            }
            const team1Obj = match?.team1_id ? teams.find(t => t.id === match.team1_id) : undefined;
            const team2Obj = match?.team2_id ? teams.find(t => t.id === match.team2_id) : undefined;
            const team1Name = match?.side1_label || (team1Obj ? (team1Obj.brand_name || team1Obj.name || 'Team 1') : '');
            const team2Name = match?.side2_label || (team2Obj ? (team2Obj.brand_name || team2Obj.name || 'Team 2') : '');
            const player1Name = match?.side1_label || (match?.player1_id ? (players.find(p => p.id === match.player1_id)?.name || 'Player 1') : '');
            const player2Name = match?.side2_label || (match?.player2_id ? (players.find(p => p.id === match.player2_id)?.name || 'Player 2') : '');
            let winnerLabel = '';
            if (match?.winner) {
              if (match.winner === 'team1') winnerLabel = team1Name;
              else if (match.winner === 'team2') winnerLabel = team2Name;
              else if (match.winner === 'player1') winnerLabel = player1Name;
              else if (match.winner === 'player2') winnerLabel = player2Name;
            }
            const matchStatus = match?.status ? match.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
            return (
              <div
                key={item.id}
                className="bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition relative group"
                onClick={() => setSelectedMedia(item)}
              >
                {item.media_type === 'photo' ? (
                  <img
                    src={item.file_url}
                    alt={item.description || item.file_name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={item.file_url}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    controls={false}
                    muted
                    preload="metadata"
                  />
                )}
                <div className="p-3">
                  {item.description && (
                    <p className="text-white font-medium text-sm truncate">{item.description}</p>
                  )}
                  <p className="text-white/60 text-xs mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  {/* Match Details */}
                  {match && (
                    <div className="mt-2 bg-black/60 rounded-lg p-2 text-xs text-white/90">
                      {/* Match Code and Pool Name */}
                      <div className="mb-1">
                        {match.match_no && (
                          <span className="font-semibold text-cyan-300">Match Code: {match.match_no}</span>
                        )}
                        {match.pool?.name && (
                          <span className="ml-2 font-semibold text-green-300">Pool: {match.pool.name}</span>
                        )}
                      </div>
                      <div className="mb-1 font-semibold">
                        Match: {team1Name || player1Name} <span className="text-white/60">vs</span> {team2Name || player2Name}
                      </div>
                      <div>Status: <span className={`font-bold ${match.status === 'completed' ? 'text-green-400' : match.status === 'in_progress' ? 'text-yellow-300' : 'text-white/80'}`}>{matchStatus}</span></div>
                      {winnerLabel && <div>Winner: <span className="font-bold text-cyan-300">{winnerLabel}</span></div>}
                      {typeof match.team1_score === 'number' && typeof match.team2_score === 'number' && (
                        <div>Score: <span className="font-bold text-blue-200">{match.team1_score}</span> - <span className="font-bold text-green-200">{match.team2_score}</span></div>
                      )}
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {item.media_type === 'photo' ? 'Photo' : 'Video'}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-2 right-2 text-gray-700 hover:text-gray-900 bg-white rounded-full p-2 shadow"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="p-4">
              {selectedMedia.media_type === 'photo' ? (
                <img
                  src={selectedMedia.file_url}
                  alt={selectedMedia.description || selectedMedia.file_name}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <video
                  src={selectedMedia.file_url}
                  controls
                  className="w-full max-h-[70vh]"
                  autoPlay
                />
              )}
              <div className="mt-4">
                {selectedMedia.description && (
                  <p className="text-gray-800 font-medium text-lg mb-2">{selectedMedia.description}</p>
                )}
                <p className="text-gray-600 text-xs">
                  Uploaded on {new Date(selectedMedia.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 