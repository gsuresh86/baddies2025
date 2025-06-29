// Utility functions for Spin Wheel logic
import { Pool, Team, Category } from '@/types';

// Shuffle array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get selected category type
export function getSelectedCategoryType(categories: Category[], selectedCategory: string): 'team' | 'player' | 'pair' {
  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
  return selectedCategoryData?.type || 'player';
}

// Get pool assignment count
export function getPoolAssignmentCount(assignments: any[], poolId: string): number {
  return assignments.filter(assignment => assignment.pool?.id === poolId).length;
}

// Get available pools
export function getAvailablePools(pools: Pool[], assignments: any[], playersPerPool: number): Pool[] {
  return pools.filter(pool => {
    const currentAssignmentCount = getPoolAssignmentCount(assignments, pool.id);
    return currentAssignmentCount < playersPerPool;
  });
}

// Find pool with minimum assignments
export function getPoolWithMinAssignments(pools: Pool[], assignments: any[]): Pool | null {
  if (pools.length === 0) return null;
  return pools.reduce((minPool, currentPool) => {
    const minCount = getPoolAssignmentCount(assignments, minPool.id);
    const currentCount = getPoolAssignmentCount(assignments, currentPool.id);
    return currentCount < minCount ? currentPool : minPool;
  });
}

// Assignment logic for player/pair
export function assignPlayerToPool({
  pools,
  assignments,
  playersPerPool,
  isMensTeamCategory
}: {
  pools: Pool[],
  assignments: any[],
  playersPerPool: number,
  isMensTeamCategory: boolean
}): { assignedPool: Pool | null } {
  const availablePools = getAvailablePools(pools, assignments, playersPerPool);
  let validPool: Pool | null = null;
  if (isMensTeamCategory) {
    validPool = availablePools.find(pool => pool.teams && pool.teams.length > 0) || null;
  } else {
    validPool = availablePools.length > 0 ? getPoolWithMinAssignments(availablePools, assignments) : null;
  }
  return { assignedPool: validPool };
}

// Assignment logic for men's team (round robin)
export function assignPlayerToTeam({
  teams,
  teamAssignIndex
}: {
  teams: Team[],
  teamAssignIndex: number
}): { assignedTeam: Team } | null {
  if (!teams.length) return null;
  const team = teams[teamAssignIndex % teams.length];
  return { assignedTeam: team };
} 