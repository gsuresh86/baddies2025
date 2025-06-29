"use client"

import { useEffect, useState } from 'react';
import { tournamentStore } from '@/lib/store';
import { categoryLabels, PlayerCategory } from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';
import { Category, Player, Pool, Team } from '@/types';
import {
  shuffleArray,
  getSelectedCategoryType,
  assignPlayerToPool,
  assignPlayerToTeam
} from './spinWheelUtils';
import {
  fetchCategories,
  fetchPlayersByCategory,
  fetchPlayersByCategoryCode,
  fetchPoolsByCategoryId,
  fetchTeams,
  fetchTeamPlayers
} from './spinWheelData';
import ResultDialog from './ResultDialog';
import SpinWheel from './SpinWheel';
import AssignmentList from './AssignmentList';

export default function SpinWheelPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [spunPlayers, setSpunPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [lastWinner, setLastWinner] = useState<Player | null>(null);
  const [assignedPool, setAssignedPool] = useState<Pool | null>(null);
  const [playersPerPool, setPlayersPerPool] = useState<number>(4);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAssignIndex, setTeamAssignIndex] = useState(0);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await fetchCategories();
        if (error) throw error;
        setCategories(data || []);
      } catch {
        // No need to setError here, as the error handling is done in the component
      }
    };
    loadCategories();
  }, []);

  // Fetch players and pools when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
        if (!selectedCategoryData) {
          // No need to setError here, as the error handling is done in the component
          setLoading(false);
          return;
        }
        const isMensTeam = selectedCategoryData.type === 'team';
        if (isMensTeam) {
          const playersRes = await fetchPlayersByCategory(PlayerCategory.MensTeam);
          const teamsRes = await fetchTeams();
          if (playersRes.error) throw playersRes.error;
          if (teamsRes.error) throw teamsRes.error;
          setPlayers(playersRes.data || []);
          setTeams(teamsRes.data || []);

          // Fetch existing team-player assignments
          const teamPlayersRes = await fetchTeamPlayers();
          if (teamPlayersRes.error) throw teamPlayersRes.error;
          const teamPlayers = teamPlayersRes.data || [];

          // Build assignments and spunPlayers from existing data
          const assignmentsInit = teamPlayers.map(tp => {
            const player = (playersRes.data || []).find(p => p.id === tp.player_id);
            const team = (teamsRes.data || []).find(t => t.id === tp.team_id);
            return player && team ? {
              player,
              team,
              pool: null,
              timestamp: tp.created_at ? new Date(tp.created_at).toLocaleTimeString() : '',
            } : null;
          }).filter((a): a is { player: Player; team: Team; pool: null; timestamp: string } => !!a);
          setAssignments(assignmentsInit);
          setSpunPlayers(assignmentsInit.map(a => a.player));

          setPlayersPerPool(4);
          setTeamAssignIndex(assignmentsInit.length % (teamsRes.data?.length || 1));
          setLoading(false);
          return;
        }
        // Find the PlayerCategory enum value that matches the category code
        const playerCategoryValue = Object.values(PlayerCategory).find(category => {
          const categoryInfo = categoryLabels[category as PlayerCategory];
          return categoryInfo && categoryInfo.code === selectedCategoryData.code;
        });
        if (!playerCategoryValue) {
          // Fallback: try to find by category code directly
          const fallbackCategory = Object.entries(categoryLabels).find(([, info]) => info.code === selectedCategoryData.code);
          if (fallbackCategory) {
            const [categoryKey] = fallbackCategory;
            const playersRes = await fetchPlayersByCategoryCode(categoryKey);
            const poolsRes = await fetchPoolsByCategoryId(selectedCategory);
            if (playersRes.error) throw playersRes.error;
            if (poolsRes.error) throw poolsRes.error;
            setPlayers(playersRes.data || []);
            setPools(poolsRes.data || []);
            setAssignments([]);
            setSpunPlayers([]);
            setPlayersPerPool(4);
            setLoading(false);
            return;
          }
          setLoading(false);
          return;
        }
        const [playersRes, poolsRes] = await Promise.all([
          fetchPlayersByCategory(playerCategoryValue),
          fetchPoolsByCategoryId(selectedCategory)
        ]);
        if (playersRes.error) throw playersRes.error;
        if (poolsRes.error) throw poolsRes.error;
        setPlayers(playersRes.data || []);
        setPools(poolsRes.data || []);
        setAssignments([]);
        setSpunPlayers([]);
        setPlayersPerPool(4);
      } catch {
        // No need to setError here, as the error handling is done in the component
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedCategory, categories]);

  // Auto-save assignment to database
  const saveAssignmentToDatabase = async (player: Player, pool: Pool | null) => {
    try {
      if (!pool) {
        console.log('No pool available for assignment');
        return;
      }

      const categoryType = getSelectedCategoryType(categories, selectedCategory);
      // Check if this is the men's team category
      const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
      if (selectedCategoryData && selectedCategoryData.type === 'team') {
        // For men's team, assign player to the first team in the pool (if any)
        if (pool.teams && pool.teams.length > 0) {
          const team = pool.teams[0];
          await tournamentStore.addPlayerToTeam(team.id, player.id);
          console.log('Player assigned to team_players:', { player: player.name, team_id: team.id });
        } else {
          console.warn('No teams found for pool:', pool);
        }
      }
      // Use the tournament store methods for proper assignment
      if (categoryType === 'pair') {
        // For pair categories, use assignPairToPool
        await tournamentStore.assignPairToPool(player.id, pool.id);
        console.log('Pair assignment saved successfully:', { player: player.name, pool: pool.name });
      } else {
        // For individual categories, use assignPlayerToPool
        await tournamentStore.assignPlayerToPool(player.id, pool.id);
        console.log('Player assignment saved successfully:', { player: player.name, pool: pool.name });
      }
    } catch {
      // No need to throw error to user, just log it
    }
  };

  // Assignment logic using utils
  const isMensTeamCategory = getSelectedCategoryType(categories, selectedCategory) === 'team';

  // Handler for spinning the wheel
  const handleSpin = async (winner: Player) => {
    setSpunPlayers((prev) => [...prev, winner]);
    setLastWinner(winner);
    const { assignedPool } = assignPlayerToPool({
      pools,
      assignments,
      playersPerPool,
      isMensTeamCategory
    });
    if (!assignedPool) {
      setAssignments((prev) => [...prev, {
        player: winner,
        pool: null,
        team: null,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setAssignedPool(null);
    } else {
      setAssignments((prev) => [...prev, {
        player: winner,
        pool: assignedPool,
        team: null,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setAssignedPool(assignedPool);
    }
    await saveAssignmentToDatabase(winner, assignedPool);
    setResultDialogOpen(true);
  };

  // For men's team, spin wheel shows players, and assigns to teams in round-robin
  const handleMensTeamSpin = async (winner: Player) => {
    if (!teams.length) return;
    const { assignedTeam } = assignPlayerToTeam({
      teams,
      teamAssignIndex
    }) || { assignedTeam: null };
    if (!assignedTeam) return;
    setAssignments((prev) => [...prev, {
      player: winner,
      team: assignedTeam,
      pool: null,
      timestamp: new Date().toLocaleTimeString()
    }]);
    setSpunPlayers((prev) => [...prev, winner]);
    await tournamentStore.addPlayerToTeam(assignedTeam.id, winner.id);
    setResultDialogOpen(true);
    setLastWinner(winner);
    setAssignedPool(null);
    setTeamAssignIndex((prev) => prev + 1);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col items-start py-2 animate-fade-in-scale w-full">
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 drop-shadow-lg text-left w-full">
          🎡 Spin the Wheel - Player Assignment
        </h1>
        <div className="mb-2 grid md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
          <div className="flex flex-col items-start">
            <label className="block mb-1 font-bold text-gray-700 text-left">Select Category:</label>
            <select
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
          <div className="flex flex-col items-start">
            <label className="block mb-1 font-bold text-gray-700 text-left">Players per Pool:</label>
            <select
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
              value={playersPerPool}
              onChange={e => setPlayersPerPool(Number(e.target.value))}
            >
              <option value={2}>2 players</option>
              <option value={3}>3 players</option>
              <option value={4}>4 players</option>
              <option value={5}>5 players</option>
              <option value={6}>6 players</option>
              <option value={8}>8 players</option>
              <option value={10}>10 players</option>
              <option value={12}>12 players</option>
            </select>
          </div>
        </div>
        {loading && (
          <div className="text-left text-gray-700 py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mb-2"></div>
            Loading players and pools...
          </div>
        )}
        {!loading && selectedCategory && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-[30%_70%] gap-8 items-start">
            <div className="flex justify-start">
              <SpinWheel
                items={isMensTeamCategory ? shuffleArray(players.filter(p => !spunPlayers.includes(p))) : players.filter(p => !spunPlayers.includes(p))}
                onSpin={isMensTeamCategory ? handleMensTeamSpin : handleSpin}
                disabled={loading}
                playersPerPool={playersPerPool}
                categoryType={getSelectedCategoryType(categories, selectedCategory)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-900">Assignments</h2>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <AssignmentList
                  assignments={assignments}
                  teams={teams}
                  pools={pools}
                  playersPerPool={playersPerPool}
                  categories={categories}
                  selectedCategory={selectedCategory}
                />
              </div>
            </div>
          </div>
        )}
        {/* Result Dialog (still available for assignment feedback) */}
        <ResultDialog
          isOpen={resultDialogOpen}
          onClose={() => setResultDialogOpen(false)}
          winner={lastWinner}
          assignedPool={assignedPool}
          assignedTeam={isMensTeamCategory ? (assignments.find(a => a.player?.id === lastWinner?.id)?.team || null) : undefined}
          categoryType={getSelectedCategoryType(categories, selectedCategory)}
        />
      </div>
    </AuthGuard>
  );
} 