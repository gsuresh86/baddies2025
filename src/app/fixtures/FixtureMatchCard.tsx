import React from 'react';
import { Category } from '@/types';
import Link from 'next/link';
import { Tv } from 'lucide-react';

// Helper to get first name
const getFirstName = (name: string) => name?.split(' ')[0] || '';

export interface FixtureMatchCardProps {
  match: any;
  category: Category;
  showDetailsLink?: boolean;
}

export const FixtureMatchCard: React.FC<FixtureMatchCardProps> = ({ match, category }) => {
  let leftName = '', rightName = '';
  const categoryCode = category?.code || 'MT'; // Fallback to MT if category is undefined
  
  if (categoryCode === 'MT') {
    // Helper function to get team display name with number
    const getTeamDisplayName = (team: any) => {
      if (!team) return 'Team';
      
      const displayName = team.brand_name || team.name;
      
      // Extract team number from original name if it exists
      const teamNumberMatch = team.name.match(/(\d+)/);
      const teamNumber = teamNumberMatch ? teamNumberMatch[1] : null;
      
      // If we have a brand name and team number, append the number
      if (team.brand_name && teamNumber) {
        return `${team.brand_name} #${teamNumber}`;
      }
      
      return displayName;
    };
    
    // Prioritize team data over side labels
    leftName = getTeamDisplayName(match.team1) || match.side1_label || 'Team 1';
    rightName = getTeamDisplayName(match.team2) || match.side2_label || 'Team 2';
  } else {
    // Prioritize player data over side labels
    if (match.player1) {
      leftName = getFirstName(match.player1.name);
      if (match.player1.partner_name) {
        leftName += `\n${getFirstName(match.player1.partner_name)}`;
      }
    } else {
      leftName = match.side1_label || 'Player 1';
    }
    
    if (match.player2) {
      rightName = getFirstName(match.player2.name);
      if (match.player2.partner_name) {
        rightName += `\n${getFirstName(match.player2.partner_name)}`;
      }
    } else {
      rightName = match.side2_label || 'Player 2';
    }
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

  // Winner logic
  let winnerSide: 'left' | 'right' | null = null;
  if (status === 'completed' && match.winner) {
    if (categoryCode === 'MT') {
      if (match.winner === 'team1' || match.winner === match.team1_id) winnerSide = 'left';
      else if (match.winner === 'team2' || match.winner === match.team2_id) winnerSide = 'right';
    } else {
      if (match.winner === 'player1' || match.winner === match.player1_id) winnerSide = 'left';
      else if (match.winner === 'player2' || match.winner === match.player2_id) winnerSide = 'right';
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl px-3 py-2 flex items-center mb-3 hover:bg-neutral-800/90 transition-colors relative">
      {/* Main Content */}
      <Link href={`/match/${match.id}`} className="flex-1">
        <div className="flex-1 relative">
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
            <div className="flex flex-col items-center flex-1 relative">
              <div className={`w-12 h-12 rounded-full mb-1 border-2 border-white/20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center ${winnerSide === 'left' ? 'ring-4 ring-yellow-400' : ''}`}>
                <span className="text-lg font-bold text-blue-300">👤</span>
                {winnerSide === 'left' && (
                  <span className="absolute -top-2 -right-2 text-yellow-300 text-xl" title="Winner">🏆</span>
                )}
              </div>
              <span className="font-bold text-white text-sm truncate max-w-[80px] text-center whitespace-pre-line">{leftName}</span>
            </div>
            <div className="flex flex-col items-center min-w-[60px]">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-blue-400">{match.team1_score ?? '-'}</span>
                <span className="text-xs text-white/60">vs</span>
                <span className="text-lg font-bold text-red-400">{match.team2_score ?? '-'}</span>
              </div>
              <span className="text-xs text-purple-300 mt-1 font-bold">{match.match_no || 'TBD'}</span>
              <span
                className="block text-xs text-blue-400 hover:text-blue-300 transition-colors z-20 underline cursor-pointer mt-1"
              >
                View Details →
              </span>
            </div>
            <div className="flex flex-col items-center flex-1 relative">
              <div className={`w-12 h-12 rounded-full mb-1 border-2 border-white/20 bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center ${winnerSide === 'right' ? 'ring-4 ring-yellow-400' : ''}`}>
                <span className="text-lg font-bold text-red-300">👤</span>
                {winnerSide === 'right' && (
                  <span className="absolute -top-2 -right-2 text-yellow-300 text-xl" title="Winner">🏆</span>
                )}
              </div>
              <span className="font-bold text-white text-sm truncate max-w-[80px] text-center whitespace-pre-line">{rightName}</span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Live Score Link - Only show for in_progress matches */}
      {status === 'in_progress' && (
        <Link
          href={`/matches/${match.id}/livescore`}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white p-2 sm:p-3 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg z-10 animate-pulse"
          title="View Live Score"
          onClick={(e) => e.stopPropagation()}
        >
          <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
      )}
    </div>
  );
};

export default FixtureMatchCard; 