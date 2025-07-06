import React from 'react';
import Image from 'next/image';
import { Category } from '@/types';

// Helper to get first name
const getFirstName = (name: string) => name?.split(' ')[0] || '';

// Helper to get avatar URL based on category and match type
const getAvatarUrl = (side: 'left' | 'right', category: Category, match: any) => {
  const code = category?.code || 'MT';
  
  // Get the name for avatar generation
  let name = '';
  if (code === 'MT') {
    name = side === 'left' ? (match.team1?.name || 'Team1') : (match.team2?.name || 'Team2');
  } else {
    name = side === 'left' ? (match.player1?.name || 'Player1') : (match.player2?.name || 'Player2');
  }
  
  // Generate initials for the avatar
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Use UI Avatars service for simple, reliable avatars
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const colorIndex = (name.length + side.length) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff&size=48&bold=true&font-size=0.4`;
};

export interface FixtureMatchCardProps {
  match: any;
  category: Category;
}

export const FixtureMatchCard: React.FC<FixtureMatchCardProps> = ({ match, category }) => {
  let leftName = '', rightName = '', leftAvatar = '', rightAvatar = '';
  const categoryCode = category?.code || 'MT'; // Fallback to MT if category is undefined
  
  if (categoryCode === 'MT') {
    leftName = match.team1?.name || 'Team 1';
    rightName = match.team2?.name || 'Team 2';
    leftAvatar = getAvatarUrl('left', category, match);
    rightAvatar = getAvatarUrl('right', category, match);
  } else {
    if (match.player1) {
      leftName = getFirstName(match.player1.name);
      if (match.player1.partner_name) {
        leftName += `\n${getFirstName(match.player1.partner_name)}`;
      }
    } else {
      leftName = 'Player 1';
    }
    if (match.player2) {
      rightName = getFirstName(match.player2.name);
      if (match.player2.partner_name) {
        rightName += `\n${getFirstName(match.player2.partner_name)}`;
      }
    } else {
      rightName = 'Player 2';
    }
    leftAvatar = getAvatarUrl('left', category || { code: 'MT' }, match);
    rightAvatar = getAvatarUrl('right', category || { code: 'MT' }, match);
  }
  const dateObj = match.scheduled_date ? new Date(match.scheduled_date) : null;
  const isValidDate = dateObj && !isNaN(dateObj.getTime());
  const dateStr = isValidDate ? dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBD';
  const timeStr = isValidDate ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
  const court = match.court ? `Court ${match.court}` : 'Court TBD';
  const status = match.status || 'scheduled';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'live': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl px-3 py-2 flex items-center mb-3">
      {/* Left Side - Category-Pool Vertical Text */}
      <div className="flex flex-col items-center justify-center min-w-[30px] mr-2">
        <div 
          className="text-center"
          style={{ 
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="text-sm font-bold text-purple-300 transform rotate-180">
            {match.match_no || 'TBD'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-yellow-300">{dateStr}</span>
            {timeStr && (
              <span className="text-lg font-bold text-cyan-300">{timeStr}</span>
            )}
          </div>
          <span className="font-semibold text-white/90 text-xs">{court}</span>
        </div>
        <div className="flex items-center justify-between w-full gap-2 py-1">
          <div className="flex flex-col items-center flex-1">
            <Image 
              src={leftAvatar} 
              alt={leftName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full mb-1 border-2 border-white/20"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-bold text-white text-sm truncate max-w-[80px] text-center whitespace-pre-line">{leftName}</span>
          </div>
          <div className="flex flex-col items-center min-w-[60px]">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-blue-400">{match.team1_score ?? '-'}</span>
              <span className="text-xs text-white/60">vs</span>
              <span className="text-lg font-bold text-red-400">{match.team2_score ?? '-'}</span>
            </div>
            <span className="text-xs text-white/60 mt-1">{categoryCode === 'MT' ? 'Teams' : 'Players'}</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <Image 
              src={rightAvatar} 
              alt={rightName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full mb-1 border-2 border-white/20"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-bold text-white text-sm truncate max-w-[80px] text-center whitespace-pre-line">{rightName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixtureMatchCard; 