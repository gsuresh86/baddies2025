import React from 'react';
import { Match, Player, Team, Pool, Category } from '@/types';
import { formatISTDateTime, getStatusColor, getStatusIcon, getCategoryForMatch, getTeamName, getPlayerName, getPoolName } from '../utils/matchUtils';

interface MatchTableProps {
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

export const MatchTable: React.FC<MatchTableProps> = ({
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
    <div className="hidden sm:block overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Match</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Pool</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Match No</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Date</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Time</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Court</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Score</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, idx) => {
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
              <tr
                key={match.id}
                className={
                  `${isEditing ? 'bg-yellow-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ` +
                  'hover:bg-blue-50 transition-colors duration-100'
                }
                style={{ borderRadius: isEditing ? '0.5rem' : undefined }}
              >
                <td className="px-3 py-2 whitespace-nowrap align-middle">
                  <div className="text-sm font-medium text-gray-900">
                    <div className="font-semibold">
                      {participant1}
                    </div>
                    <div className="text-gray-500 text-xs">vs</div>
                    <div className="font-semibold">
                      {participant2}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">{poolName}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editMatchNo}
                      onChange={e => onMatchNoChange(e.target.value)}
                      className="px-2 py-1 border rounded text-sm w-full"
                      placeholder="Match No"
                    />
                  ) : (
                    match.match_no || '-'
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
                  {isEditing ? (
                    <input 
                      type="date" 
                      value={editDate} 
                      onChange={e => onDateChange(e.target.value)} 
                      className="px-2 py-1 border rounded text-sm w-full"
                    />
                  ) : (
                    date
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
                  {isEditing ? (
                    <input 
                      type="time" 
                      value={editTime} 
                      onChange={e => onTimeChange(e.target.value)} 
                      className="px-2 py-1 border rounded text-sm w-full"
                    />
                  ) : (
                    time
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
                  {isEditing ? (
                    <select 
                      value={editCourt} 
                      onChange={e => onCourtChange(e.target.value)} 
                      className="px-2 py-1 border rounded text-sm w-full"
                    >
                      <option value="">-</option>
                      <option value="C">C</option>
                      <option value="G">G</option>
                    </select>
                  ) : (
                    match.court || '-'
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap align-middle">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status || 'scheduled')}`}>
                    {getStatusIcon(match.status || 'scheduled')}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{match.team1_score ?? '-'}</span>
                    <span className="text-gray-400">-</span>
                    <span className="font-bold text-red-600">{match.team2_score ?? '-'}</span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium align-middle">
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => onSaveEdit(match)} 
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button 
                          onClick={onCancelEdit} 
                          className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => onStartEdit(match)} 
                          className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        {match.side1_label && (
                          <button
                            onClick={() => onAssignMatch(match)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 ml-1"
                          >
                            Assign
                          </button>
                        )}
                        {matchType === 'team' && (
                          <a 
                            href={`/admin/matches/${match.id}/manage`} 
                            className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 text-center"
                            style={{ textDecoration: 'none' }}
                          >
                            Lineup
                          </a>
                        )}
                        <a 
                          href={`/admin/matches/${match.id}`} 
                          className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs hover:bg-purple-300 text-center"
                          style={{ textDecoration: 'none' }}
                        >
                          Details
                        </a>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 