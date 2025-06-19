import { Pool } from '@/types';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Supabase Auth Helpers ---
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

class TournamentStore {
  // Remove in-memory arrays
  // private pools: Pool[] = mockPools;
  // private teams: Team[] = mockTeams;

  // Pool management
  async getPools(): Promise<Pool[]> {
    const { data, error } = await supabase.from('pools').select('*');
    if (error) throw error;
    return data as Pool[];
  }

  async getPoolById(id: string): Promise<Pool | undefined> {
    const { data, error } = await supabase.from('pools').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Pool;
  }

  async createPool(name: string): Promise<Pool> {
    const newPool = {
      id: `pool-${Date.now()}`,
      name,
      max_teams: 4
    };
    const { data, error } = await supabase.from('pools').insert([newPool]).select().single();
    if (error) throw error;
    return data as Pool;
  }

  // addTeamToPool(teamId: string, poolId: string): boolean {
  //   // TODO: Refactor to use Supabase
  // }

  // Team management
  // getTeams(): Team[] {
  //   // TODO: Refactor to use Supabase
  // }

  // getTeamsNotInPool(): Team[] {
  //   // TODO: Refactor to use Supabase
  // }

  // createTeam(name: string, players: Player[]): Team {
  //   // TODO: Refactor to use Supabase
  // }

  // Match scheduling
  // generateMatchesForPool(poolId: string): Match[] {
  //   // TODO: Refactor to use Supabase
  // }

  // private generateGamesForMatch(team1: Team, team2: Team): Game[] {
  //   // TODO: Refactor to use Supabase
  // }

  // Match results
  // updateGameResult(matchId: string, gameId: string, team1Score: number, team2Score: number): boolean {
  //   // TODO: Refactor to use Supabase
  // }

  // private updateMatchScore(match: Match): void {
  //   // TODO: Refactor to use Supabase
  // }

  // Standings calculation
  // getPoolStandings(poolId: string): TournamentStandings[] {
  //   // TODO: Refactor to use Supabase
  // }
}

export const tournamentStore = new TournamentStore(); 