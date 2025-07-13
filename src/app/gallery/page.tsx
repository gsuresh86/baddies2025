'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { MatchMedia } from '@/types';
import Image from 'next/image';

export default function PublicGalleryPage() {
  const [media, setMedia] = useState<MatchMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MatchMedia | null>(null);

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
          {media.map((item) => (
            <div
              key={item.id}
              className="bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition relative group"
              onClick={() => setSelectedMedia(item)}
            >
              {item.media_type === 'photo' ? (
                <Image
                  src={item.file_url}
                  alt={item.description || item.file_name}
                  width={600}
                  height={300}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
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
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {item.media_type === 'photo' ? 'Photo' : 'Video'}
              </div>
            </div>
          ))}
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
                <Image
                  src={selectedMedia.file_url}
                  alt={selectedMedia.description || selectedMedia.file_name}
                  width={900}
                  height={600}
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