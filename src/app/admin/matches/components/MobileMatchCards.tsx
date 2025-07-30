import React from 'react';
import Link from 'next/link';
import { Match, Player, Team, Pool, Category } from '@/types';
import { formatISTDateTime, getStatusColor, getStatusIcon, getCategoryForMatch, getTeamName, getPlayerName, getPoolName } from '../utils/matchUtils';

interface MobileMatchCardsProps {
  matches: Match[];
  players: Player[];
  teams: Team[];
  pools: Pool[];
  categories: Category[];
  editingMatchId: string | null;
  editDate: string;
  editTime: string;
  editCourt: string;
  editMatchNo: string;
  onStartEdit: (match: Match) => void;
  onSaveEdit: (match: Match) => void;
  onCancelEdit: () => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onCourtChange: (court: string) => void;
  onMatchNoChange: (matchNo: string) => void;
  onAssignMatch: (match: Match) => void;
}

export const MobileMatchCards: React.FC<MobileMatchCardsProps> = ({
  matches,
  players,
  teams,
  pools,
  categories,
  editingMatchId,
  editDate,
  editTime,
  editCourt,
  editMatchNo,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDateChange,
  onTimeChange,
  onCourtChange,
  onMatchNoChange,
  onAssignMatch
}) => {
  const getParticipantNames = (match: Match) => {
    const matchCategory = match.category_id
      ? categories.find(c => c.id === match.category_id)
      : getCategoryForMatch(match, pools, categories);
    const matchType = matchCategory?.type;
    
    if (matchType === 'team') {
      // For team categories, prioritize team IDs over side labels
      const team1Name = match.team1_id ? getTeamName(match.team1_id, teams) : '';
      const team2Name = match.team2_id ? getTeamName(match.team2_id, teams) : '';
      
      return {
        participant1: team1Name || match.side1_label || '-',
        participant2: team2Name || match.side2_label || '-'
      };
    } else if (matchType === 'player' || (!match.pool_id && match.player1_id && match.player2_id)) {
      // For player categories, prioritize player IDs over side labels
      const player1Name = match.player1_id ? getPlayerName(match.player1_id, players) : '';
      const player2Name = match.player2_id ? getPlayerName(match.player2_id, players) : '';
      
      return {
        participant1: player1Name || match.side1_label || '-',
        participant2: player2Name || match.side2_label || '-'
      };
    } else if (matchType === 'pair') {
      const player1 = players.find(p => p.id === (match as any).player1_id);
      const player2 = players.find(p => p.id === (match as any).player2_id);
      
      // For pair games, show first names with partner first names
      const getPlayerDisplayName = (player: Player | undefined) => {
        if (!player) return '';
        const firstName = player.name.split(' ')[0];
        const partnerFirstName = player.partner_name ? player.partner_name.split(' ')[0] : '';
        return partnerFirstName ? `${firstName} / ${partnerFirstName}` : firstName;
      };
      
      return {
        participant1: getPlayerDisplayName(player1) || match.side1_label || '-',
        participant2: getPlayerDisplayName(player2) || match.side2_label || '-',
      };
    }
    return { participant1: '-', participant2: '-' };
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:hidden">
      {matches.map((match) => {
        const matchCategory = match.category_id
          ? categories.find(c => c.id === match.category_id)
          : getCategoryForMatch(match, pools, categories);
        const matchType = matchCategory?.type;
        const isEditing = editingMatchId === match.id;
        
        const { participant1, participant2 } = getParticipantNames(match);
        const { date, time } = formatISTDateTime(match.scheduled_date);
        const poolName = match.pool_id
          ? getPoolName(match.pool_id, pools)
          : matchCategory?.code
            ? matchCategory.code + (match.stage ? ` - ${match.stage}` : '')
            : (match.stage || 'N/A');
        
        return (
          <div key={match.id} className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-medium text-gray-600">{poolName}</div>
                <div className="text-lg font-bold text-blue-700">
                  {participant1}
                  <span className="text-gray-500 text-xs">vs</span>
                  {participant2}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status || 'scheduled')}`}>
                  {getStatusIcon(match.status || 'scheduled')}
                </span>
                <span className="text-xs text-gray-500 mt-1">{date} {time}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-bold text-blue-600">{match.team1_score ?? '-'}</span>
                <span className="text-gray-400">-</span>
                <span className="font-bold text-red-600">{match.team2_score ?? '-'}</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-xs text-gray-500">Court: {isEditing ? (
                <select value={editCourt} onChange={e => onCourtChange(e.target.value)} className="px-2 py-1 border rounded text-xs">
                  <option value="">-</option>
                  <option value="C">C</option>
                  <option value="G">G</option>
                </select>
              ) : (match.court || '-')}</span>
              <span className="text-gray-400">|</span>
              <span className="text-xs text-gray-500">Match No: {isEditing ? (
                <input
                  type="text"
                  value={editMatchNo}
                  onChange={e => onMatchNoChange(e.target.value)}
                  className="px-1 py-0.5 border rounded text-xs w-20"
                  placeholder="Match No"
                />
              ) : (
                match.match_no || '-'
              )}</span>
            </div>
            <div className="flex items-center gap-3 text-xs mt-1">
              <span className="text-gray-500">Date: {isEditing ? (
                <input type="date" value={editDate} onChange={e => onDateChange(e.target.value)} className="px-2 py-1 border rounded text-xs" />
              ) : date}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Time: {isEditing ? (
                <input type="time" value={editTime} onChange={e => onTimeChange(e.target.value)} className="px-2 py-1 border rounded text-xs" />
              ) : time}</span>
            </div>
            <div className="flex gap-2 mt-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => onSaveEdit(match)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold text-center hover:bg-green-700 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg text-xs font-semibold text-center hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onStartEdit(match)}
                  className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs font-semibold text-center hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Link
                href={`/admin/matches/${match.id}`}
                className="flex-1 px-3 py-2 bg-purple-200 text-purple-800 rounded-lg text-xs font-semibold text-center hover:bg-purple-300 transition"
              >
                Details
              </Link>
              {matchType === 'team' && (
                <Link
                  href={`/admin/matches/${match.id}/manage`}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold text-center hover:bg-gray-300 transition"
                >
                  Lineup
                </Link>
              )}
              {match.side1_label && (
                <button
                  onClick={() => onAssignMatch(match)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 ml-1"
                >
                  Assign Player/Team
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 