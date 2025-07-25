import React from 'react';
import { Match, Player, Team, Pool, Category } from '@/types';

interface NextMatchesModalProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  pools: Pool[];
  categories: Category[];
  onClose: () => void;
  onSetInProgress: (matchId: string) => void;
}

function getTeamName(teamId: string | undefined, teams: Team[]): string {
  if (!teamId) return '';
  const team = teams.find(t => t.id === teamId);
  return team?.brand_name || team?.name || '';
}

function getPlayerName(playerId: string | undefined, players: Player[]): string {
  if (!playerId) return '';
  const player = players.find(p => p.id === playerId);
  return player?.name || '';
}

function getParticipantNames(match: Match, teams: Team[], players: Player[], pools: Pool[], categories: Category[]) {
  const matchCategory = match.category_id
    ? categories.find(c => c.id === match.category_id)
    : undefined;
  const matchType = matchCategory?.type;

  if (matchType === 'team') {
    return {
      participant1: getTeamName(match.team1_id, teams) || match.side1_label || '-',
      participant2: getTeamName(match.team2_id, teams) || match.side2_label || '-',
    };
  } else if (matchType === 'player' || (!match.pool_id && match.player1_id && match.player2_id)) {
    return {
      participant1: getPlayerName(match.player1_id, players) || match.side1_label || '-',
      participant2: getPlayerName(match.player2_id, players) || match.side2_label || '-',
    };
  } else if (matchType === 'pair') {
    const player1 = players.find(p => p.id === (match as any).player1_id);
    const player2 = players.find(p => p.id === (match as any).player2_id);
    const player1FirstName = player1 ? player1.name.split(' ')[0] : '';
    const player2FirstName = player2 ? player2.name.split(' ')[0] : '';
    const player1PartnerFirstName = player1?.partner_name ? player1.partner_name.split(' ')[0] : '';
    const player2PartnerFirstName = player2?.partner_name ? player2.partner_name.split(' ')[0] : '';
    return {
      participant1: player1PartnerFirstName ? `${player1FirstName} / ${player1PartnerFirstName}` : player1FirstName || match.side1_label || '-',
      participant2: player2PartnerFirstName ? `${player2FirstName} / ${player2PartnerFirstName}` : player2FirstName || match.side2_label || '-',
    };
  }
  return { participant1: '-', participant2: '-' };
}

const NextMatchesModal: React.FC<NextMatchesModalProps> = ({ matches, teams, players, pools, categories, onClose, onSetInProgress }) => {
  return (
    <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto p-6 z-50">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Next Scheduled Matches</h2>
      <div className="mb-4 max-h-96 overflow-y-auto">
        {matches.length === 0 ? (
          <div className="text-gray-600">No scheduled matches found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {matches.map((match) => {
              const { participant1, participant2 } = getParticipantNames(match, teams, players, pools, categories);
              return (
                <li key={match.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-800">
                      {participant1} <span className="text-gray-500">vs</span> {participant2}
                    </div>
                    <div className="text-xs text-gray-500">
                      {match.scheduled_date ? new Date(match.scheduled_date).toLocaleString() : 'No date'}
                    </div>
                    <div className="text-xs text-gray-400">Court: {match.court || '-'}</div>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-semibold"
                      onClick={() => onSetInProgress(match.id)}
                    >
                      Set In Progress & Open
                    </button>
                    <a
                      href={`/admin/matches/${match.id}/livescore`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-semibold"
                    >
                      Open Only
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NextMatchesModal; 