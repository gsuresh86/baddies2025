'use client';

import { useState } from 'react';

interface StaticImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  draggable?: boolean;
  onClick?: () => void;
}

export default function StaticImage({
  src,
  alt,
  className = '',
  style = {},
  width,
  height,
  draggable = false,
  onClick
}: StaticImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div 
        className={`bg-gray-300 flex items-center justify-center ${className}`}
        style={style}
      >
        <span className="text-gray-500 text-sm">Image not found</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          width: width || '100%',
          height: height || '100%',
          objectFit: 'cover'
        }}
        draggable={draggable}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
} 