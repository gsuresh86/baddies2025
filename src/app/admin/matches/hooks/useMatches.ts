'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Match } from '@/types';
import { tournamentStore } from '@/lib/store';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';

export function useMatches() {
  const { showSuccess, showError } = useToast();
  const { matches: cachedMatches, pools, categories } = useData();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<string>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      // Enrich each match with the full pool object
      const enrichedMatches = cachedMatches.map(match => ({
        ...match,
        pool: pools.find(p => p.id === match.pool_id) || undefined
      }));
      setMatches(enrichedMatches);
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
    setLoading(false);
  }, [cachedMatches, pools]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Helper function to get category for a match
  const getCategoryForMatch = useCallback((match: Match) => {
    const pool = pools.find(p => p.id === match.pool_id);
    if (!pool) return undefined;
    return categories.find(c => c.id === pool.category_id);
  }, [pools, categories]);

  // Filter matches based on selected pool and category
  const filteredMatches = useMemo(() => {
    let ms = selectedPool === 'all' ? matches : matches.filter(match => match.pool_id === selectedPool);
    if (activeCategoryId !== 'all') {
      ms = ms.filter(match => getCategoryForMatch(match)?.id === activeCategoryId);
    }
    
    // Sort by scheduled date and time when "All Categories" is selected
    if (activeCategoryId === 'all') {
      ms = ms.sort((a, b) => {
        // Handle matches without scheduled dates
        if (!a.scheduled_date && !b.scheduled_date) return 0;
        if (!a.scheduled_date) return 1; // Put unscheduled matches at the end
        if (!b.scheduled_date) return -1;
        
        // Sort by scheduled date and time
        const dateA = new Date(a.scheduled_date);
        const dateB = new Date(b.scheduled_date);
        return dateA.getTime() - dateB.getTime();
      });
    }
    
    return ms;
  }, [matches, selectedPool, activeCategoryId, getCategoryForMatch]);

  // Get next match number for a category and pool
  const getNextMatchNumber = useCallback((categoryId: string, poolId: string) => {
    const existingMatches = matches.filter(match => 
      match.pool?.category_id === categoryId && match.pool_id === poolId
    );
    const maxMatchNumber = Math.max(
      ...existingMatches.map(match => parseInt(match.match_no || '0')),
      0
    );
    return (maxMatchNumber + 1).toString().padStart(3, '0');
  }, [matches]);

  const createMatch = async (matchData: any) => {
    try {
      const selectedPool = pools.find(p => p.id === matchData.pool_id);
      const nextMatchNumber = getNextMatchNumber(selectedPool?.category_id || '', matchData.pool_id);
      
      const finalMatchData = {
        ...matchData,
        match_no: nextMatchNumber
      };

      await tournamentStore.createMatch(finalMatchData);
      showSuccess('Match created successfully');
      await fetchMatches();
    } catch (error) {
      console.error('Error creating match:', error);
      showError('Error creating match');
      throw error;
    }
  };

  const updateMatchScore = async (matchId: string, scoreData: any) => {
    try {
      await tournamentStore.updateMatchScore(matchId, scoreData);
      showSuccess('Score updated successfully');
      await fetchMatches();
    } catch (error) {
      console.error('Error updating score:', error);
      showError('Error updating score');
      throw error;
    }
  };

  return {
    matches: filteredMatches,
    loading,
    selectedPool,
    activeCategoryId,
    setSelectedPool,
    setActiveCategoryId,
    createMatch,
    updateMatchScore,
    refetch: fetchMatches,
    getNextMatchNumber,
    getCategoryForMatch
  };
}