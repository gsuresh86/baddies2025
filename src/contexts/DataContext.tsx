'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/store';
import { Player, Team, Pool, Category, Match } from '@/types';

interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  created_at: string;
}

interface DataContextType {
  players: Player[];
  teams: Team[];
  pools: Pool[];
  categories: Category[];
  teamPlayers: TeamPlayer[];
  matches: Match[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [playersResult, teamsResult, poolsResult, categoriesResult, teamPlayersResult, matchesResult] = await Promise.all([
        supabase.from('t_players').select('*').order('name'),
        supabase.from('teams').select('*').order('name'),
        supabase.from('pools').select('*').order('name'),
        supabase.from('categories').select('*').order('label'),
        supabase.from('team_players').select('*'),
        supabase.from('matches').select('*').order('created_at', { ascending: false }),
      ]);
      
      if (playersResult.error) throw playersResult.error;
      if (teamsResult.error) throw teamsResult.error;
      if (poolsResult.error) throw poolsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (teamPlayersResult.error) throw teamPlayersResult.error;
      if (matchesResult.error) throw matchesResult.error;
      
      setPlayers(playersResult.data || []);
      setTeams(teamsResult.data || []);
      setPools(poolsResult.data || []);
      setCategories(categoriesResult.data || []);
      setTeamPlayers(teamPlayersResult.data || []);
      setMatches(matchesResult.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const value = {
    players,
    teams,
    pools,
    categories,
    teamPlayers,
    matches,
    loading,
    error,
    refreshData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 