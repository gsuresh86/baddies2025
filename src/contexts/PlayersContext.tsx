'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/store';
import { Player } from '@/types';

interface PlayersContextType {
  players: Player[];
  loading: boolean;
  error: string | null;
  refreshPlayers: () => Promise<void>;
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined);

export const usePlayers = () => {
  const context = useContext(PlayersContext);
  if (context === undefined) {
    throw new Error('usePlayers must be used within a PlayersProvider');
  }
  return context;
};

interface PlayersProviderProps {
  children: ReactNode;
}

export const PlayersProvider: React.FC<PlayersProviderProps> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('t_players')
        .select('*')
        .order('name');
      
      if (fetchError) {
        throw fetchError;
      }
      
      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  const refreshPlayers = async () => {
    await fetchPlayers();
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const value = {
    players,
    loading,
    error,
    refreshPlayers,
  };

  return (
    <PlayersContext.Provider value={value}>
      {children}
    </PlayersContext.Provider>
  );
}; 