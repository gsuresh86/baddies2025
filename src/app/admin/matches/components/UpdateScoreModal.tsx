import React from 'react';
import { Match, Category } from '@/types';

interface UpdateScoreModalProps {
  show: boolean;
  match: Match | null;
  matchStatus: string;
  team1Score: string;
  team2Score: string;
  onTeam1ScoreChange: (v: string) => void;
  onTeam2ScoreChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onUpdateScore: () => void;
  onClose: () => void;
  getCategoryForMatch: (match: Match) => Category | undefined;
  getTeamName: (id: string) => string;
  getPlayerName: (id: string) => string;
}

const UpdateScoreModal: React.FC<UpdateScoreModalProps> = ({
  show,
  match,
  matchStatus,
  team1Score,
  team2Score,
  onTeam1ScoreChange,
  onTeam2ScoreChange,
  onStatusChange,
  onUpdateScore,
  onClose,
  getCategoryForMatch,
  getTeamName,
  getPlayerName,
}) => {
  if (!show || !match) return null;
  const matchCategory = getCategoryForMatch(match);
  const matchType = matchCategory?.type;
  let participant1 = '', participant2 = '';
  if (matchType === 'team') {
    participant1 = getTeamName(match.team1_id || '');
    participant2 = getTeamName(match.team2_id || '');
  } else if (matchType === 'player') {
    participant1 = getPlayerName((match as any).player1_id || '');
    participant2 = getPlayerName((match as any).player2_id || '');
  } else if (matchType === 'pair') {
    participant1 = 'Pair 1';
    participant2 = 'Pair 2';
  }
  const team1Wins = (match.team1_score ?? 0) > (match.team2_score ?? 0);
  const team2Wins = (match.team2_score ?? 0) > (match.team1_score ?? 0);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-auto flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Match Score</h3>
        <div className="flex items-center justify-center gap-2 w-full mb-6">
          <span className={`font-semibold text-center ${team1Wins ? 'text-green-700 font-bold' : 'text-gray-800'}`} title={participant1}>{participant1}</span>
          <span className="font-bold text-gray-500">vs</span>
          <span className={`font-semibold text-center ${team2Wins ? 'text-green-700 font-bold' : 'text-gray-800'}`} title={participant2}>{participant2}</span>
        </div>
        <div className="flex items-center justify-center gap-4 w-full mb-6">
          <input
            type="number"
            value={team1Score}
            onChange={e => onTeam1ScoreChange(e.target.value)}
            min="0"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-center"
          />
          <input
            type="number"
            value={team2Score}
            onChange={e => onTeam2ScoreChange(e.target.value)}
            min="0"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-center"
          />
        </div>
        <div className="w-full mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={matchStatus}
            onChange={e => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onUpdateScore}
            disabled={!team1Score || !team2Score}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Score
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateScoreModal; 