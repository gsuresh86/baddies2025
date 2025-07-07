'use client';

import { useState, useCallback } from 'react';
import { Pool, Category, Team, Player } from '@/types';
import { tournamentStore, supabase } from '@/lib/store';
import { useToast } from '@/contexts/ToastContext';

interface GenerateMatchesModalProps {
  isOpen: boolean;
  pools: Pool[];
  categories: Category[];
  teams: Team[];
  players: Player[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateMatchesModal({
  isOpen,
  pools,
  categories,
  teams,
  players,
  onClose,
  onSuccess
}: GenerateMatchesModalProps) {
  const { showSuccess, showError } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPools, setSelectedPools] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPoolsForCategory = useCallback((categoryId: string) => {
    return pools.filter(pool => pool.category_id === categoryId);
  }, [pools]);

  const getAllPossibleMatchesForCategory = useCallback(async (categoryId: string, poolId?: string) => {
    let categoryPools = getPoolsForCategory(categoryId);
    if (poolId) {
      categoryPools = categoryPools.filter(pool => pool.id === poolId);
    }
    if (!categoryPools.length) return [];

    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];

    const allMatches: any[] = [];
    const maxMatchesPerPool = 50;

    for (const pool of categoryPools) {
      if (category.type === 'team') {
        const poolTeams = teams.filter(t => t.pool_id === pool.id);
        let matchCount = 0;
        for (let i = 0; i < poolTeams.length && matchCount < maxMatchesPerPool; i++) {
          for (let j = i + 1; j < poolTeams.length && matchCount < maxMatchesPerPool; j++) {
            allMatches.push({
              team1_id: poolTeams[i].id,
              team2_id: poolTeams[j].id,
              pool_id: pool.id
            });
            matchCount++;
          }
        }
      } else if (category.type === 'player' || category.type === 'pair') {
        const { data: poolPlayers, error } = await supabase
          .from('pool_players')
          .select('player_id')
          .eq('pool_id', pool.id);
        if (error) {
          console.error(`Error fetching players for pool ${pool.id}:`, error);
          continue;
        }
        if (!poolPlayers || poolPlayers.length < 2) continue;
        let matchCount = 0;
        for (let i = 0; i < poolPlayers.length && matchCount < maxMatchesPerPool; i++) {
          for (let j = i + 1; j < poolPlayers.length && matchCount < maxMatchesPerPool; j++) {
            allMatches.push({
              player1_id: poolPlayers[i].player_id,
              player2_id: poolPlayers[j].player_id,
              pool_id: pool.id
            });
            matchCount++;
          }
        }
      }
    }
    return allMatches;
  }, [categories, teams, getPoolsForCategory]);

  const handleAnalyze = useCallback(async () => {
    setError(null);
    if (!selectedCategory || !date || !time || !duration) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(() => {
      setError('Analysis is taking too long. Please try with fewer matches.');
      setLoading(false);
    }, 10000);

    try {
      let matches: any[] = [];
      if (!selectedPools.length) {
        matches = await getAllPossibleMatchesForCategory(selectedCategory);
      } else if (selectedPools.length === 1) {
        matches = await getAllPossibleMatchesForCategory(selectedCategory, selectedPools[0]);
      } else {
        matches = [];
        for (const poolId of selectedPools) {
          const poolMatches = await getAllPossibleMatchesForCategory(selectedCategory, poolId);
          matches = matches.concat(poolMatches);
        }
      }

      if (!matches.length) {
        setError('No matches to generate');
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      const limitedMatches = matches.slice(0, 100);
      const shuffledMatches = limitedMatches.sort(() => Math.random() - 0.5);
      
      const previewResults = [];
      let currentTime = new Date(`${date}T${time}:00+05:30`);

      for (let i = 0; i < shuffledMatches.length; i++) {
        const match = shuffledMatches[i];
        const court = `Court ${(i % 4) + 1}`;
        
        previewResults.push({
          ...match,
          scheduled_date: currentTime.toISOString(),
          court: court,
          match_no: (i + 1).toString().padStart(3, '0')
        });

        currentTime = new Date(currentTime.getTime() + duration * 60000);
      }

      const category = categories.find(c => c.id === selectedCategory);
      setPreview(previewResults);
      clearTimeout(timeoutId);
    } catch (err) {
      setError('Error analyzing matches');
      clearTimeout(timeoutId);
    }
    setLoading(false);
  }, [selectedCategory, date, time, duration, getAllPossibleMatchesForCategory, categories, selectedPools]);

  const handleConfirm = async () => {
    if (selectedPools.length === 1) {
      setLoading(true);
      setError(null);
      try {
        await tournamentStore.generateMatchesForPool(selectedPools[0]);
        onSuccess();
        showSuccess('Matches generated successfully!');
        handleClose();
      } catch (err: any) {
        setError(err.message || 'Error generating matches');
      }
      setLoading(false);
      return;
    }

    if (!preview.length) return;
    setLoading(true);
    setError(null);
    try {
      const matchesToInsert = preview.map(m => ({
        ...m,
        status: 'scheduled'
      }));
      
      for (const match of matchesToInsert) {
        await tournamentStore.createMatch(match);
      }
      
      onSuccess();
      showSuccess('Matches generated successfully!');
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error generating matches');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSelectedCategory('');
    setSelectedPools([]);
    setDate('');
    setTime('');
    setDuration(30);
    setPreview([]);
    setError(null);
    onClose();
  };

  const handlePoolSelection = (poolIds: string[]) => {
    setSelectedPools(poolIds);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Generate Matches</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Will generate matches from: <strong>{categories.find(c => c.id === selectedCategory)?.label}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Pools: {getPoolsForCategory(selectedCategory).map(p => p.name).join(', ')}
              </p>
            </div>
          )}

          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Pools (optional)
              </label>
              <div className="space-y-2">
                {getPoolsForCategory(selectedCategory).map(pool => (
                  <label key={pool.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPools.includes(pool.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPools([...selectedPools, pool.id]);
                        } else {
                          setSelectedPools(selectedPools.filter(id => id !== pool.id));
                        }
                      }}
                      className="mr-2"
                    />
                    {pool.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Match Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>

          {preview.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Preview Schedule ({preview.length} matches)</h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                {preview.slice(0, 10).map((match, idx) => (
                  <div key={idx} className="text-sm py-1 border-b border-gray-100">
                    Match {match.match_no} - {new Date(match.scheduled_date).toLocaleString()} - {match.court}
                  </div>
                ))}
                {preview.length > 10 && (
                  <div className="text-sm text-gray-500 py-1">
                    ... and {preview.length - 10} more matches
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Confirm & Save'}
                </button>
                <button
                  onClick={() => setPreview([])}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}