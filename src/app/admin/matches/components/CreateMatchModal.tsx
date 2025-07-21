import React from 'react';
import { Pool, Player, Team } from '@/types';
import { getParticipantDisplayName } from '../utils/matchUtils';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  pools: Pool[];
  participantsInSelectedModalPool: (Player | Team)[];
  isTeamCategory: boolean;
  newMatchPool: string;
  newMatchTeam1: string;
  newMatchTeam2: string;
  newMatchDate: string;
  newMatchTime: string;
  newMatchCourt: string;
  onPoolChange: (poolId: string) => void;
  onTeam1Change: (teamId: string) => void;
  onTeam2Change: (teamId: string) => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onCourtChange: (court: string) => void;
  canSubmit: boolean;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pools,
  participantsInSelectedModalPool,
  isTeamCategory,
  newMatchPool,
  newMatchTeam1,
  newMatchTeam2,
  newMatchDate,
  newMatchTime,
  newMatchCourt,
  onPoolChange,
  onTeam1Change,
  onTeam2Change,
  onDateChange,
  onTimeChange,
  onCourtChange,
  canSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Match</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pool *</label>
            <select
              value={newMatchPool}
              onChange={(e) => onPoolChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select Pool</option>
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isTeamCategory ? 'Team 1' : 'Player 1'} *
            </label>
            <select
              value={newMatchTeam1}
              onChange={(e) => onTeam1Change(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              disabled={!newMatchPool}
            >
              <option value="">Select {isTeamCategory ? 'Team' : 'Player'} 1</option>
              {participantsInSelectedModalPool.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {getParticipantDisplayName(participant, isTeamCategory)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isTeamCategory ? 'Team 2' : 'Player 2'} *
            </label>
            <select
              value={newMatchTeam2}
              onChange={(e) => onTeam2Change(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              disabled={!newMatchPool}
            >
              <option value="">Select {isTeamCategory ? 'Team' : 'Player'} 2</option>
              {participantsInSelectedModalPool.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {getParticipantDisplayName(participant, isTeamCategory)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newMatchDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={newMatchTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
            <select
              value={newMatchCourt}
              onChange={(e) => onCourtChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select Court</option>
              <option value="C">C</option>
              <option value="G">G</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Match
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