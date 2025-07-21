import React from 'react';
import { Dialog } from '@headlessui/react';
import { Category, Pool, Team, Player } from '@/types';

interface CrossPoolMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  categories: Category[];
  pools: Pool[];
  teams: Team[];
  players: Player[];
  poolPlayers: any[];
  crossCategory: string;
  side1Pool: string;
  side2Pool: string;
  side1Player: string;
  side2Player: string;
  creating: boolean;
  scheduleDate: string;
  court: string;
  stage: string;
  usePool: boolean;
  manualSide1: string;
  manualSide2: string;
  manualMatchCode: string;
  poolsForCategory: Pool[];
  onCategoryChange: (category: string) => void;
  onSide1PoolChange: (poolId: string) => void;
  onSide2PoolChange: (poolId: string) => void;
  onSide1PlayerChange: (playerId: string) => void;
  onSide2PlayerChange: (playerId: string) => void;
  onDateChange: (date: string) => void;
  onCourtChange: (court: string) => void;
  onStageChange: (stage: string) => void;
  onUsePoolChange: (usePool: boolean) => void;
  onManualSide1Change: (side: string) => void;
  onManualSide2Change: (side: string) => void;
  onManualMatchCodeChange: (code: string) => void;
  getOptionsForPoolHelper: (poolId: string) => { id: string; name: string }[];
}

export const CrossPoolMatchModal: React.FC<CrossPoolMatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  crossCategory,
  side1Pool,
  side2Pool,
  side1Player,
  side2Player,
  creating,
  scheduleDate,
  court,
  stage,
  usePool,
  manualSide1,
  manualSide2,
  manualMatchCode,
  poolsForCategory,
  onCategoryChange,
  onSide1PoolChange,
  onSide2PoolChange,
  onSide1PlayerChange,
  onSide2PlayerChange,
  onDateChange,
  onCourtChange,
  onStageChange,
  onUsePoolChange,
  onManualSide1Change,
  onManualSide2Change,
  onManualMatchCodeChange,
  getOptionsForPoolHelper
}) => {
  return (
    <Dialog as="div" open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-40" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Panel className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto p-6 z-10">
            <Dialog.Title className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                              Create Cross-Pool Match
            </Dialog.Title>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
              <select
                value={crossCategory}
                onChange={e => {
                  onCategoryChange(e.target.value);
                  onSide1PoolChange('');
                  onSide2PoolChange('');
                  onSide1PlayerChange('');
                  onSide2PlayerChange('');
                  onDateChange('');
                  onCourtChange('');
                  onStageChange('');
                  onUsePoolChange(true);
                  onManualSide1Change('');
                  onManualSide2Change('');
                  onManualMatchCodeChange('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat: any) => (
                  <option key={cat.code} value={cat.code}>{cat.label || cat.code}</option>
                ))}
              </select>
              
              {crossCategory && (
                <div className="flex items-center mt-2">
                  <input
                    id="use-pool-switch"
                    type="checkbox"
                    checked={usePool}
                    onChange={e => onUsePoolChange(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="use-pool-switch" className="text-sm text-gray-700">Use Pool</label>
                </div>
              )}
            </div>
            
            {usePool ? (
              <div className="mb-4 flex flex-col gap-4">
                {/* Side 1: Pool and Player/Team */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Side 1: Select Pool</label>
                  <select
                    value={side1Pool}
                    onChange={e => { onSide1PoolChange(e.target.value); onSide1PlayerChange(''); }}
                    className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
                    disabled={!crossCategory}
                  >
                    <option value="">-- Select Pool --</option>
                    {poolsForCategory.map(pool => (
                      <option key={pool.id} value={pool.id}>{pool.name}</option>
                    ))}
                  </select>
                  <label className="block text-xs font-medium text-gray-600 mt-2 mb-1">Select Team/Player</label>
                  <select
                    value={side1Player}
                    onChange={e => onSide1PlayerChange(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
                    disabled={!side1Pool}
                  >
                    <option value="">-- Select --</option>
                    {getOptionsForPoolHelper(side1Pool).map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Side 2: Pool and Player/Team */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Side 2: Select Pool</label>
                  <select
                    value={side2Pool}
                    onChange={e => { onSide2PoolChange(e.target.value); onSide2PlayerChange(''); }}
                    className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
                    disabled={!crossCategory}
                  >
                    <option value="">-- Select Pool --</option>
                    {poolsForCategory.map(pool => (
                      <option key={pool.id} value={pool.id}>{pool.name}</option>
                    ))}
                  </select>
                  <label className="block text-xs font-medium text-gray-600 mt-2 mb-1">Select Team/Player</label>
                  <select
                    value={side2Player}
                    onChange={e => onSide2PlayerChange(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
                    disabled={!side2Pool}
                  >
                    <option value="">-- Select --</option>
                    {getOptionsForPoolHelper(side2Pool).map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="mb-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Side 1: Team/Player Name</label>
                  <input
                    type="text"
                    value={manualSide1}
                    onChange={e => onManualSide1Change(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
                    placeholder="e.g. Top Team Group A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Side 2: Team/Player Name</label>
                  <input
                    type="text"
                    value={manualSide2}
                    onChange={e => onManualSide2Change(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
                    placeholder="e.g. 2nd Top Team Group D"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Match Code</label>
                  <input
                    type="text"
                    value={manualMatchCode}
                    onChange={e => onManualMatchCodeChange(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
                    placeholder="e.g. FMXD-R16-M2"
                  />
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Schedule Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={e => onDateChange(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Court</label>
              <select
                value={court}
                onChange={e => onCourtChange(e.target.value)}
                className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
              >
                <option value="">-- Select Court --</option>
                <option value="C">C</option>
                <option value="G">G</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
              <select
                value={stage}
                onChange={e => onStageChange(e.target.value)}
                className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
              >
                <option value="">-- Select Stage --</option>
                <option value="Round 1">Round 1</option>
                <option value="R16">R16</option>
                <option value="QF">QF</option>
                <option value="SF">SF</option>
                <option value="F">F</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={
                  creating || 
                  !crossCategory || 
                  !scheduleDate || 
                  !court || 
                  !stage || 
                  (usePool ? (!side1Pool || !side2Pool || !side1Player || !side2Player) : (!manualSide1 || !manualSide2 || !manualMatchCode))
                }
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium ${
                  creating || 
                  !crossCategory || 
                  !scheduleDate || 
                  !court || 
                  !stage || 
                  (usePool ? (!side1Pool || !side2Pool || !side1Player || !side2Player) : (!manualSide1 || !manualSide2 || !manualMatchCode)) 
                    ? 'opacity-60 cursor-not-allowed' 
                    : ''
                }`}
              >
                {creating ? 'Creating...' : 'Create Match'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}; 