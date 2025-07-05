import React from 'react';
import { Category } from '@/types';

// Helper to get first name
const getFirstName = (name: string) => name?.split(' ')[0] || '';

// Helper to pick an avatar based on category and match type
const getAvatar = (side: 'left' | 'right', category: Category, match: any) => {
  const isPair = !!(side === 'left' ? match.player1?.partner_name : match.player2?.partner_name);
  const code = category.code;
  const men = ['👨', '🧑‍🦱', '👦', '🧔', '👱‍♂️', '👨‍🦰', '👨‍🦳', '👨‍🦲'];
  const women = ['👩', '🧑‍🦰', '👧', '👩‍🦱', '👱‍♀️', '👩‍🦳', '👩‍🦲'];
  const mixed = ['👩‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👨', '👫', '👭', '👬'];
  const family = ['👨‍👩‍👧', '👨‍👩‍👦', '👩‍👩‍👦', '👨‍👨‍👧', '👨‍👩‍👧‍👦'];
  const all = [...men, ...women, ...mixed, ...family];
  const pick = (arr: string[], name: string) => arr[Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % arr.length];
  if (code === 'FM') {
    if (isPair) {
      return Math.abs((side === 'left' ? match.player1?.name : match.player2?.name || '').length) % 2 === 0 ? '👩‍❤️‍👨' : '👫';
    } else {
      return side === 'left' ? '👩' : '👨';
    }
  }
  if (code === 'MT' || code === 'BU18' || code === 'BU13') {
    return isPair ? '👬' : pick(men, side === 'left' ? match.team1?.name || '' : match.team2?.name || '');
  }
  if (code === 'WS' || code === 'WD' || code === 'GU18' || code === 'GU13') {
    return isPair ? '👭' : pick(women, side === 'left' ? match.player1?.name || '' : match.player2?.name || '');
  }
  if (code === 'XD') {
    return isPair ? pick(mixed, (side === 'left' ? match.player1?.name : match.player2?.name) || '') : (side === 'left' ? '👩' : '👨');
  }
  return pick(all, side === 'left' ? (match.player1?.name || match.team1?.name || '') : (match.player2?.name || match.team2?.name || ''));
};

export interface FixtureMatchCardProps {
  match: any;
  category: Category;
}

export const FixtureMatchCard: React.FC<FixtureMatchCardProps> = ({ match, category }) => {
  let leftName = '', rightName = '', leftAvatar = '', rightAvatar = '';
  if (category.code === 'MT') {
    leftName = match.team1?.name || 'Team 1';
    rightName = match.team2?.name || 'Team 2';
    leftAvatar = getAvatar('left', category, match);
    rightAvatar = getAvatar('right', category, match);
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
    leftAvatar = getAvatar('left', category, match);
    rightAvatar = getAvatar('right', category, match);
  }
  const dateObj = match.scheduled_date ? new Date(match.scheduled_date) : null;
  const dateStr = dateObj ? dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBD';
  const timeStr = dateObj ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
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
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'cancelled': return 'Cancelled';
      case 'live': return 'LIVE';
      default: return 'Scheduled';
    }
  };
  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl px-4 py-3 flex flex-col items-center mb-4">
      <div className="flex items-center justify-between w-full text-xs text-white/80 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></span>
          <span className={status === 'live' ? 'text-red-400 font-bold' : ''}>{getStatusText(status)}</span>
        </div>
        <span>{dateStr} {timeStr && <span className="ml-1">{timeStr}</span>}</span>
        <span className="ml-2 font-semibold text-white/90">{court}</span>
      </div>
      <div className="flex items-center justify-between w-full gap-4 py-2">
        <div className="flex flex-col items-center flex-1">
          <span className="text-3xl mb-1">{leftAvatar}</span>
          <span className="font-bold text-white text-base truncate max-w-[90px] text-center whitespace-pre-line">{leftName}</span>
        </div>
        <div className="flex flex-col items-center min-w-[80px]">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-400">{match.team1_score ?? '-'}</span>
            <span className="text-xs text-white/60">vs</span>
            <span className="text-xl font-bold text-red-400">{match.team2_score ?? '-'}</span>
          </div>
          <span className="text-xs text-white/60 mt-1">{category.code === 'MT' ? 'Teams' : 'Players'}</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-3xl mb-1">{rightAvatar}</span>
          <span className="font-bold text-white text-base truncate max-w-[90px] text-center whitespace-pre-line">{rightName}</span>
        </div>
      </div>
    </div>
  );
};

export default FixtureMatchCard; 