import React from 'react';
import { Dialog } from '@headlessui/react';
import { Pool, Player, Team } from '@/types';

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
  return (
    <Dialog as="div" open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Panel className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-auto p-6 z-10 border border-gray-200">
            <div className="text-center mb-6">
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
                Create New Match
              </Dialog.Title>
              <p className="text-gray-600">
                Set up a new tournament match with teams or players
              </p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
              {/* Pool Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tournament Pool
                </label>
                <select
                  value={newMatchPool}
                  onChange={(e) => onPoolChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                  required
                >
                  <option value="">Select a pool</option>
                  {pools.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team/Player 1 Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isTeamCategory ? 'Team 1' : 'Player 1'}
                </label>
                <select
                  value={newMatchTeam1}
                  onChange={(e) => onTeam1Change(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                  required
                >
                  <option value="">Select {isTeamCategory ? 'team' : 'player'} 1</option>
                  {participantsInSelectedModalPool.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {'name' in participant ? participant.name : (participant as any).brand_name || (participant as any).name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team/Player 2 Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isTeamCategory ? 'Team 2' : 'Player 2'}
                </label>
                <select
                  value={newMatchTeam2}
                  onChange={(e) => onTeam2Change(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                  required
                >
                  <option value="">Select {isTeamCategory ? 'team' : 'player'} 2</option>
                  {participantsInSelectedModalPool
                    .filter(p => p.id !== newMatchTeam1)
                    .map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {'name' in participant ? participant.name : (participant as any).brand_name || (participant as any).name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newMatchDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={newMatchTime}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Court Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Court</label>
                <select
                  value={newMatchCourt}
                  onChange={(e) => onCourtChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
                >
                  <option value="">Select court</option>
                  <option value="C">Court C</option>
                  <option value="G">Court G</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`flex-1 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                    !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Create Match
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}; 