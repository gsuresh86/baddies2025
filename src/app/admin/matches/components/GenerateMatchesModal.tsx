import React from 'react';
import { Category, Pool } from '@/types';
import { getPoolsForCategory } from '../utils/matchUtils';

interface GenerateMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: () => void;
  onConfirm: () => void;
  onEdit: () => void;
  categories: Category[];
  pools: Pool[];
  generateCategory: string;
  generatePools: string[];
  generateDate: string;
  generateTime: string;
  generateDuration: number;
  generatePreview: any[];
  generateLoading: boolean;
  generateError: string | null;
  onCategoryChange: (category: string) => void;
  onPoolsChange: (pools: string[]) => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (duration: number) => void;
  getTeamName: (teamId: string) => string;
  getPlayerName: (id: string) => string;
  formatISTDateTime: (dateString: string | undefined | null) => { date: string; time: string };
}

export const GenerateMatchesModal: React.FC<GenerateMatchesModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  onConfirm,
  onEdit,
  categories,
  pools,
  generateCategory,
  generatePools,
  generateDate,
  generateTime,
  generateDuration,
  generatePreview,
  generateLoading,
  generateError,
  onCategoryChange,
  onPoolsChange,
  onDateChange,
  onTimeChange,
  onDurationChange,
  getTeamName,
  getPlayerName,
  formatISTDateTime
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Matches</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={generateCategory} 
              onChange={e => onCategoryChange(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          {generateCategory && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              Will generate matches from all pools in: <strong>{categories.find(c => c.id === generateCategory)?.label}</strong>
              <br />
              Pools: {getPoolsForCategory(generateCategory, pools).map(p => p.name).join(', ')}
            </div>
          )}
          
          {generateCategory && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pools</label>
              <select
                multiple
                value={generatePools}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  onPoolsChange(options);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32"
              >
                {getPoolsForCategory(generateCategory, pools).map(pool => (
                  <option key={pool.id} value={pool.id}>{pool.name}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple pools. Leave empty to select all pools.
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={generateDate} 
              onChange={e => onDateChange(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input 
              type="time" 
              value={generateTime} 
              onChange={e => onTimeChange(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration per match (minutes)</label>
            <input 
              type="number" 
              min={5} 
              value={generateDuration} 
              onChange={e => onDurationChange(Number(e.target.value))} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
            />
          </div>
          
          {generateError && (
            <div className="text-red-600 text-sm">{generateError}</div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={onAnalyze} 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Analyze
            </button>
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
        
        {generatePreview.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2">Preview Schedule ({generatePreview.length} matches)</h4>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50">
              {generatePreview.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b last:border-b-0">
                  <span className="text-sm text-gray-800">
                    {m.team1_id && m.team2_id && (
                      <>
                        {getTeamName(m.team1_id)} vs {getTeamName(m.team2_id)}
                      </>
                    )}
                    {m.player1_id && m.player2_id && (
                      <>
                        {getPlayerName(m.player1_id)} vs {getPlayerName(m.player2_id)}
                      </>
                    )}
                  </span>
                  <span className="text-xs text-gray-600">
                    {formatISTDateTime(m.scheduled_date).date} {formatISTDateTime(m.scheduled_date).time}
                  </span>
                  <span className="text-xs text-gray-600">Court: {m.court}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={onConfirm} 
                disabled={generateLoading} 
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Confirm & Save
              </button>
              <button 
                onClick={onEdit} 
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 