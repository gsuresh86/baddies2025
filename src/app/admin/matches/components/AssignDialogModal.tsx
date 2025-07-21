import React from 'react';
import { Dialog } from '@headlessui/react';
import { Match, Category, Pool, Team, Player } from '@/types';

interface AssignDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  assignMatch: Match | null;
  assignPool1: string;
  assignPool2: string;
  assignSide1: string;
  assignSide2: string;
  assignLoading: boolean;
  categories: Category[];
  pools: Pool[];
  teams: Team[];
  players: Player[];
  poolPlayers: any[];
  onPool1Change: (poolId: string) => void;
  onPool2Change: (poolId: string) => void;
  onSide1Change: (sideId: string) => void;
  onSide2Change: (sideId: string) => void;
  getCategoryForMatchHelper: (match: Match) => Category | undefined;
}

export const AssignDialogModal: React.FC<AssignDialogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assignMatch,
  assignPool1,
  assignPool2,
  assignSide1,
  assignSide2,
  assignLoading,
  categories,
  pools,
  teams,
  players,
  poolPlayers,
  onPool1Change,
  onPool2Change,
  onSide1Change,
  onSide2Change,
  getCategoryForMatchHelper
}) => {
  if (!isOpen || !assignMatch) return null;

  // Determine category and options
  const matchCategory = assignMatch.category_id
    ? categories.find(c => c.id === assignMatch.category_id)
    : getCategoryForMatchHelper(assignMatch);
  const isTeamCategory = matchCategory?.type === 'team';
  const isPlayerCategory = matchCategory?.type === 'player' || matchCategory?.type === 'pair';

  // Pool options (for this category)
  const poolOptions = pools.filter(p => matchCategory && p.category_id === matchCategory.id);

  // Team options for each side
  const teamOptions1: Team[] = isTeamCategory ? teams.filter(t => assignPool1 ? t.pool_id === assignPool1 : true) : [];
  const teamOptions2: Team[] = isTeamCategory ? teams.filter(t => assignPool2 ? t.pool_id === assignPool2 : true) : [];

  // Player options for each side
  const playerOptions1: Player[] = isPlayerCategory ? players.filter(p => {
    if (assignPool1) {
      return poolPlayers.some(pp => pp.pool_id === assignPool1 && pp.player_id === p.id);
    } else if (matchCategory?.code) {
      return p.category === matchCategory.code;
    }
    return true;
  }) : [];
  const playerOptions2: Player[] = isPlayerCategory ? players.filter(p => {
    if (assignPool2) {
      return poolPlayers.some(pp => pp.pool_id === assignPool2 && pp.player_id === p.id);
    } else if (matchCategory?.code) {
      return p.category === matchCategory.code;
    }
    return true;
  }) : [];

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-40" aria-hidden="true" />
      <Dialog.Panel className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto p-6 z-10">
        <Dialog.Title className="text-xl font-bold mb-4 text-gray-800">Assign Player/Team</Dialog.Title>
        
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Side 1: Pool and Player/Team */}
          {poolOptions.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pool (Side 1)</label>
              <select
                value={assignPool1}
                onChange={e => {
                  onPool1Change(e.target.value);
                  onSide1Change('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Pool</option>
                {poolOptions.map(pool => (
                  <option key={pool.id} value={pool.id}>{pool.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isTeamCategory ? 'Team 1' : 'Player 1'}
            </label>
            <select
              value={assignSide1}
              onChange={e => onSide1Change(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select {isTeamCategory ? 'Team' : 'Player'} 1</option>
              {isTeamCategory
                ? teamOptions1.map((opt: Team) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.brand_name || opt.name}
                    </option>
                  ))
                : playerOptions1.map((opt: Player) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name + (opt.partner_name ? ` / ${opt.partner_name}` : '')}
                    </option>
                  ))}
            </select>
          </div>
          
          {/* Side 2: Pool and Player/Team */}
          {poolOptions.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pool (Side 2)</label>
              <select
                value={assignPool2}
                onChange={e => {
                  onPool2Change(e.target.value);
                  onSide2Change('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Pool</option>
                {poolOptions.map(pool => (
                  <option key={pool.id} value={pool.id}>{pool.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isTeamCategory ? 'Team 2' : 'Player 2'}
            </label>
            <select
              value={assignSide2}
              onChange={e => onSide2Change(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select {isTeamCategory ? 'Team' : 'Player'} 2</option>
              {isTeamCategory
                ? teamOptions2.map((opt: Team) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.brand_name || opt.name}
                    </option>
                  ))
                : playerOptions2.map((opt: Player) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name + (opt.partner_name ? ` / ${opt.partner_name}` : '')}
                    </option>
                  ))}
            </select>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={assignLoading || !assignSide1 || !assignSide2}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {assignLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
}; 