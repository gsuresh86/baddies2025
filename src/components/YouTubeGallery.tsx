'use client';

import { useState } from 'react';
import Image from 'next/image';
import { VideoItem, tournamentVideos } from '@/lib/videoData';

interface YouTubeGalleryProps {
  title?: string;
  maxVideos?: number;
}

export default function YouTubeGallery({ 
  title = "Tournament Videos & Highlights",
  maxVideos = 40
}: YouTubeGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Get videos up to maxVideos limit
  const videos = tournamentVideos.slice(0, maxVideos);

  const openVideo = (video: VideoItem) => {
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  if (videos.length === 0) {
    return (
      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-4">📺</div>
          <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
          <p className="text-white/60">No videos available yet</p>
          <p className="text-white/40 text-sm mt-2">
            Videos will be added here as the tournament progresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📺</div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-white/60">Latest tournament highlights and match coverage</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 cursor-pointer group"
              onClick={() => openVideo(video)}
            >
              {/* Thumbnail */}
              <div className="relative mb-4 rounded-xl overflow-hidden">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={320}
                  height={128}
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                
                {/* Duration */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
                
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-red-600 text-white p-3 rounded-full">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div>
                <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover:text-green-300 transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{video.viewCount}</span>
                  <span>{new Date(video.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center mt-8">
          <a
            href="https://www.youtube.com/@kadapaammayi/videos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            View All Videos on YouTube
          </a>
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="relative">
              {/* Close button */}
              <button
                onClick={closeVideo}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Video iframe */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title={selectedVideo.title}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              {/* Video info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedVideo.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{selectedVideo.viewCount}</span>
                  <span>{new Date(selectedVideo.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
                <p className="text-gray-700 text-sm line-clamp-3">{selectedVideo.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 