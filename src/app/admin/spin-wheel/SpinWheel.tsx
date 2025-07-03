'use client';
import { useState, useRef } from 'react';

function SpinWheel({ items, onSpin, disabled, playersPerPool, categoryType }: { 
  items: any[], 
  onSpin: (winner: any) => void,
  disabled: boolean,
  playersPerPool: number,
  categoryType: 'team' | 'player' | 'pair'
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resultAudioRef = useRef<HTMLAudioElement | null>(null);

  // Debug: Log the first few items to see their structure
  // console.log('SpinWheel items:', items.slice(0, 3));
  // console.log('Category type:', categoryType);
  // if (items.length > 0) {
  //   console.log('First item structure:', items[0]);
  //   console.log('First item partner_name:', items[0].partner_name);
  // }

  const handleSpin = () => {
    if (items.length === 0 || disabled || isSpinning) return;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    setIsSpinning(true);
    const spins = 8 + Math.random() * 4; // 8-12 full rotations for a dramatic effect
    const finalRotation = rotation + (spins * 360);
    setRotation(finalRotation);
    // Spin for 2 seconds, then show result dialog and play cheering sound
    setTimeout(() => {
      const winner = items[Math.floor(Math.random() * items.length)];
      setIsSpinning(false);
      onSpin(winner); // Show result dialog immediately
      if (resultAudioRef.current) {
        resultAudioRef.current.currentTime = 0;
        resultAudioRef.current.play();
      }
    }, 2000);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-4xl mb-4">🎡</div>
        <div className="mb-4 text-gray-700 font-bold">No players available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="text-3xl mb-3">🎡</div>
      {/* Wheel visualization */}
      <div 
        className="w-80 h-80 rounded-full border-8 border-white shadow-lg mb-4 flex items-center justify-center relative overflow-hidden"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
        }}
      >
        {items.length === 0 ? (
          <div className="text-white font-bold text-lg text-center">
            <div>No</div>
            <div className="text-sm">Players</div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-bold text-center w-full h-full flex flex-wrap items-center justify-center">
              {items.map((item, index) => {
                // Always use first name(s) for word cloud
                const playerName = item?.name || item?.player_name || 'Unknown';
                let displayName = playerName.split(' ')[0];
                if (categoryType === 'pair' && item?.partner_name) {
                  const partnerFirst = item.partner_name.split(' ')[0];
                  displayName = `${displayName} / ${partnerFirst}`;
                }
                // Randomize style for word cloud effect
                const fontSizes = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
                const fontWeights = ['font-normal', 'font-semibold', 'font-bold'];
                const rotations = ['rotate-0', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'];
                const colorPalette = [
                  'text-red-500',
                  'text-blue-500',
                  'text-green-500',
                  'text-yellow-500',
                  'text-purple-500',
                  'text-pink-500',
                  'text-orange-500',
                  'text-teal-500',
                  'text-indigo-500',
                  'text-emerald-500',
                  'text-fuchsia-500',
                  'text-cyan-500',
                ];
                const size = fontSizes[index % fontSizes.length];
                const weight = fontWeights[index % fontWeights.length];
                const rotation = rotations[index % rotations.length];
                const color = colorPalette[index % colorPalette.length];
                return (
                  <span
                    key={index}
                    className={`inline-block mx-2 my-1 ${size} ${weight} ${rotation} ${color}`}
                    style={{lineHeight: 1.1}}
                  >
                    {displayName}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <button
        className={`px-6 py-3 font-bold rounded-full shadow-lg transition ${
          disabled || isSpinning || items.length === 0
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-white text-purple-700 hover:bg-yellow-200'
        }`}
        onClick={handleSpin}
        disabled={disabled || isSpinning || items.length === 0}
      >
        {isSpinning ? 'Spinning...' : 'Spin'}
      </button>
      <audio ref={audioRef} src="/spin.mp3" preload="auto" />
      <audio ref={resultAudioRef} src="/cheering.mp3" preload="auto" />
      <div className="mt-3 text-gray-700 text-sm text-center">
        {items.length} players remaining • {playersPerPool} per pool
      </div>
    </div>
  );
}

export default SpinWheel; 