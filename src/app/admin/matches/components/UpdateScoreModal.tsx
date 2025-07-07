'use client';

import { useState, useEffect } from 'react';
import { Match } from '@/types';

interface UpdateScoreModalProps {
  isOpen: boolean;
  match: Match | null;
  onClose: () => void;
  onUpdate: (scoreData: any) => void;
}

export default function UpdateScoreModal({
  isOpen,
  match,
  onClose,
  onUpdate
}: UpdateScoreModalProps) {
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [status, setStatus] = useState('scheduled');

  useEffect(() => {
    if (match) {
      setTeam1Score(match.team1_score?.toString() || '');
      setTeam2Score(match.team2_score?.toString() || '');
      setStatus(match.status || 'scheduled');
    }
  }, [match]);

  const getParticipantName = (match: Match, side: 'team1' | 'team2') => {
    if (side === 'team1') {
      if (match.team1) return match.team1.name;
      if (match.player1) {
        return match.player1.partner_name 
          ? `${match.player1.name} / ${match.player1.partner_name}`
          : match.player1.name;
      }
    } else {
      if (match.team2) return match.team2.name;
      if (match.player2) {
        return match.player2.partner_name 
          ? `${match.player2.name} / ${match.player2.partner_name}`
          : match.player2.name;
      }
    }
    return 'TBD';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1Score || !team2Score) return;

    const scoreData = {
      team1_score: parseInt(team1Score),
      team2_score: parseInt(team2Score),
      status: status
    };

    onUpdate(scoreData);
    
    // Reset form
    setTeam1Score('');
    setTeam2Score('');
    setStatus('scheduled');
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Update Match Score</h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Pool:</span> {match.pool?.name || 'Unknown'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Match:</span> {getParticipantName(match, 'team1')} vs {getParticipantName(match, 'team2')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {match.team1?.name || match.player1?.name || 'Team 1'} Score
              </label>
              <input
                type="number"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {match.team2?.name || match.player2?.name || 'Team 2'} Score
              </label>
              <input
                type="number"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Match Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
            >
              Update Score
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}