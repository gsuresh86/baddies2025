"use client"

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';
import { categoryLabels, PlayerCategory } from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';
import { Category, Player, Pool } from '@/types';

// Simple spinning wheel component with animation
function SpinWheel({ items, onSpin, disabled }: { 
  items: any[], 
  onSpin: (winner: any) => void,
  disabled: boolean 
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (items.length === 0 || disabled || isSpinning) return;
    
    setIsSpinning(true);
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const finalRotation = rotation + (spins * 360);
    setRotation(finalRotation);
    
    // Simulate spinning animation
    setTimeout(() => {
      const winner = items[Math.floor(Math.random() * items.length)];
      setIsSpinning(false);
      onSpin(winner);
    }, 3000);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl shadow-2xl">
        <div className="text-4xl mb-4">🎡</div>
        <div className="mb-4 text-white font-bold">No players available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-700 via-pink-500 to-yellow-400 rounded-3xl shadow-2xl animate-fade-in-scale">
      <div className="text-4xl mb-4">🎡</div>
      <div className="mb-4 text-white font-bold text-center">
        {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
      </div>
      
      {/* Wheel visualization */}
      <div 
        className="w-48 h-48 rounded-full border-8 border-white shadow-lg mb-6 flex items-center justify-center"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
        }}
      >
        <div className="text-white font-bold text-lg">
          {items.length} Players
        </div>
      </div>
      
      <button
        className={`px-6 py-3 font-bold rounded-full shadow-lg transition ${
          disabled || isSpinning || items.length === 0
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-white text-purple-700 hover:bg-yellow-200'
        }`}
        onClick={handleSpin}
        disabled={disabled || isSpinning || items.length === 0}
      >
        {isSpinning ? 'Spinning...' : 'Spin'}
      </button>
      
      <div className="mt-4 text-white text-sm text-center">
        {items.length} players remaining
      </div>
    </div>
  );
}

export default function SpinWheelPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [spunPlayers, setSpunPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const { data, error } = await supabase.from('categories').select('*').order('label');
        console.log('Categories response:', { data, error });
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        setCategories(data || []);
        console.log('Categories set:', data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  // Fetch players and pools when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Get the category code for the selected category ID
        const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
        if (!selectedCategoryData) {
          setError('Selected category not found');
          setLoading(false);
          return;
        }
        
        // Find the PlayerCategory enum value that matches the category code
        const playerCategoryValue = Object.values(PlayerCategory).find(category => {
          const categoryInfo = categoryLabels[category as PlayerCategory];
          return categoryInfo && categoryInfo.code === selectedCategoryData.code;
        });
        
        if (!playerCategoryValue) {
          setError('Category not found in PlayerCategory enum');
          setLoading(false);
          return;
        }
        
        console.log('Fetching data for category:', selectedCategoryData);
        console.log('Using PlayerCategory enum value:', playerCategoryValue);
        
        const [playersRes, poolsRes] = await Promise.all([
          supabase.from('t_players').select('*').eq('category', playerCategoryValue),
          supabase.from('pools').select('*, category:categories(*)').eq('category_id', selectedCategory)
        ]);
        
        console.log('Players response:', playersRes);
        console.log('Pools response:', poolsRes);
        
        if (playersRes.error) throw playersRes.error;
        if (poolsRes.error) throw poolsRes.error;
        
        setPlayers(playersRes.data || []);
        setPools(poolsRes.data || []);
        setAssignments([]);
        setSpunPlayers([]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load players and pools');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCategory, categories]);

  // Handler for spinning the wheel
  const handleSpin = (winner: Player) => {
    setSpunPlayers((prev) => [...prev, winner]);
    
    // Simple assignment logic - assign to first available pool
    const availablePool = pools.find(pool => {
      if (pool.category?.code === 'MT') {
        // For Men's Team, check team capacity
        return (pool.teams?.length || 0) < (pool.max_teams || 4);
      } else {
        // For other categories, check player capacity
        return (pool.players?.length || 0) < (pool.max_teams || 4);
      }
    });
    
    setAssignments((prev) => [...prev, { 
      player: winner, 
      pool: availablePool || null, 
      team: null,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const resetAssignments = () => {
    setAssignments([]);
    setSpunPlayers([]);
  };

  const saveAssignments = async () => {
    // TODO: Implement saving to database
    console.log('Saving assignments:', assignments);
    alert('Assignment saving functionality to be implemented');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-700 to-yellow-400 flex flex-col items-center py-12 animate-fade-in-scale">
        <div className="bg-white/90 rounded-3xl shadow-2xl p-8 max-w-4xl w-full mx-4">
          <h1 className="text-4xl font-extrabold text-center mb-8 text-purple-800 drop-shadow-lg">
            🎡 Spin the Wheel - Player Assignment
          </h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block mb-2 font-bold text-purple-700">Select Category:</label>
            <select
              className="w-full p-3 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">-- Choose a category --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label || cat.code}
                </option>
              ))}
            </select>
          </div>
          
          {loading && (
            <div className="text-center text-purple-700 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto mb-2"></div>
              Loading players and pools...
            </div>
          )}
          
          {!loading && selectedCategory && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Spin Wheel Section */}
              <div>
                <h2 className="text-2xl font-bold text-purple-700 mb-4">Spin the Wheel</h2>
                <SpinWheel 
                  items={players.filter(p => !spunPlayers.includes(p))} 
                  onSpin={handleSpin}
                  disabled={loading}
                />
              </div>
              
              {/* Assignments Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-purple-700">Assignments</h2>
                  <div className="space-x-2">
                    <button
                      onClick={resetAssignments}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Reset
                    </button>
                    <button
                      onClick={saveAssignments}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {assignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No assignments yet. Start spinning!</p>
                  ) : (
                    <ul className="space-y-2">
                      {assignments.map((a, i) => (
                        <li key={i} className="bg-purple-100 rounded-lg px-4 py-3 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-purple-800">{a.player.name}</span>
                              <span className="text-purple-500 text-sm ml-2">({a.player.email})</span>
                            </div>
                            <span className="text-xs text-gray-500">{a.timestamp}</span>
                          </div>
                          {a.pool && (
                            <div className="text-sm text-purple-600 mt-1">
                              Assigned to: {a.pool.name}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Available Pools */}
                {pools.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-purple-700 mb-2">Available Pools</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {pools.map(pool => (
                        <div key={pool.id} className="bg-blue-100 rounded p-2 text-sm">
                          <div className="font-medium">{pool.name}</div>
                          <div className="text-blue-600">
                            {pool.category?.code === 'MT' 
                              ? `${pool.teams?.length || 0}/${pool.max_teams} teams`
                              : `${pool.players?.length || 0}/${pool.max_teams} players`
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
} 