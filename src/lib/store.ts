import { Pool, Team, Player, Match, Category, MatchMedia } from '@/types';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// WebSocket-enabled Supabase client with debugging
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Debug WebSocket connection
if (typeof window !== 'undefined') {
  // Debug logs removed for production
}

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
  // Player management
  async getPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('t_players')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
    return data as Player[];
  }

  async getPlayerById(id: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from('t_players')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Player;
  }

  async createPlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player> {
    const { data, error } = await supabase
      .from('t_players')
      .insert([player])
      .select()
      .single();
    if (error) throw error;
    return data as Player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    const { data, error } = await supabase
      .from('t_players')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Player;
  }

  async deletePlayer(id: string): Promise<void> {
    const { error } = await supabase
      .from('t_players')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async searchPlayers(query: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from('t_players')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name');
    if (error) throw error;
    return data as Player[];
  }

  // Team management
  async getTeams(): Promise<Team[]> {
    // First, get basic team data
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (teamsError) {
      console.error('Error fetching basic teams:', teamsError);
      throw teamsError;
    }
    
    if (!teamsData || teamsData.length === 0) {
      return [];
    }
    
    // Then, get pool and players for each team
    const teamsWithDetails = await Promise.all(
      teamsData.map(async (team) => {
        try {
          // Get pool info
          let pool = null;
          if (team.pool_id) {
            const { data: poolData, error: poolError } = await supabase
              .from('pools')
              .select('name')
              .eq('id', team.pool_id)
              .single();
            
            if (!poolError && poolData) {
              pool = poolData;
            }
          }
          
          // Get players for this team
          const { data: playersData, error: playersError } = await supabase
            .from('team_players')
            .select(`
              player:t_players(*)
            `)
            .eq('team_id', team.id);
          
          if (playersError) {
            console.error(`Error fetching players for team ${team.id}:`, playersError);
            return {
              ...team,
              pool,
              players: []
            };
          }
          
          const players = (playersData || []).map((tp: any) => tp.player);
          
          return {
            ...team,
            pool,
            players
          };
        } catch (error) {
          console.error(`Error processing team ${team.id}:`, error);
          return {
            ...team,
            pool: null,
            players: []
          };
        }
      })
    );
    
    console.log('Teams with details:', teamsWithDetails);
    return teamsWithDetails as Team[];
  }

  async getTeamById(id: string): Promise<Team | null> {
    console.log('Fetching team by ID:', id);
    
    // First, get basic team data
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (teamError) {
      console.error('Error fetching team:', teamError);
      throw teamError;
    }
    
    if (!teamData) {
      console.log('Team not found');
      return null;
    }
    
    console.log('Basic team data:', teamData);
    
    try {
      // Get pool info
      let pool = null;
      if (teamData.pool_id) {
        const { data: poolData, error: poolError } = await supabase
          .from('pools')
          .select('name')
          .eq('id', teamData.pool_id)
          .single();
        
        if (!poolError && poolData) {
          pool = poolData;
        }
      }
      
      // Get players for this team
      const { data: playersData, error: playersError } = await supabase
        .from('team_players')
        .select(`
          player:t_players(*)
        `)
        .eq('team_id', id);
      
      if (playersError) {
        console.error('Error fetching players for team:', playersError);
        return {
          ...teamData,
          pool,
          players: []
        } as Team;
      }
      
      const players = (playersData || []).map((tp: any) => tp.player);
      
      const teamWithDetails = {
        ...teamData,
        pool,
        players
      } as Team;
      
      console.log('Team with details:', teamWithDetails);
      return teamWithDetails;
    } catch (error) {
      console.error('Error processing team details:', error);
      return {
        ...teamData,
        pool: null,
        players: []
      } as Team;
    }
  }

  async getTeamsNotInPool(): Promise<Team[]> {
    console.log('Fetching teams not in pool...');
    
    // First, get basic team data for teams not in any pool
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .is('pool_id', null)
      .order('name');
    
    if (teamsError) {
      console.error('Error fetching teams not in pool:', teamsError);
      throw teamsError;
    }
    
    console.log('Teams not in pool (basic):', teamsData);
    
    if (!teamsData || teamsData.length === 0) {
      console.log('No teams found outside pools');
      return [];
    }
    
    // Then, get players for each team
    const teamsWithPlayers = await Promise.all(
      teamsData.map(async (team) => {
        try {
          const { data: playersData, error: playersError } = await supabase
            .from('team_players')
            .select(`
              player:t_players(*)
            `)
            .eq('team_id', team.id);
          
          if (playersError) {
            console.error(`Error fetching players for team ${team.id}:`, playersError);
            return {
              ...team,
              players: []
            };
          }
          
          const players = (playersData || []).map((tp: any) => tp.player);
          
          return {
            ...team,
            players
          };
        } catch (error) {
          console.error(`Error processing team ${team.id}:`, error);
          return {
            ...team,
            players: []
          };
        }
      })
    );
    
    console.log('Teams not in pool (with players):', teamsWithPlayers);
    return teamsWithPlayers as Team[];
  }

  async createTeam(name: string): Promise<Team> {
    console.log('Creating team:', name);
    
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('User not authenticated. Please log in.');
    }
    
    console.log('User authenticated:', user.email);
    
    // First, let's check if the table exists and we have permissions
    const { error: tableError } = await supabase
      .from('teams')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('Table access error:', tableError);
      throw new Error(`Cannot access teams table: ${tableError.message}`);
    }
    
    console.log('Table access successful, proceeding with insert...');
    
    const { data, error } = await supabase
      .from('teams')
      .insert([{ name }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating team:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('Team created:', data);
    return data as Team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Team;
  }

  async updateTeamBrandNames(): Promise<void> {
    console.log('Updating team brand names...');
    
    // Get all teams
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Update each team with a brand name based on their number
    for (const team of teams || []) {
      const teamNumberMatch = team.name.match(/(\d+)/);
      const teamNumber = teamNumberMatch ? teamNumberMatch[1] : null;
      
      if (teamNumber && !team.brand_name) {
        const brandName = `Team ${teamNumber}`;
        console.log(`Updating team ${team.name} with brand name: ${brandName}`);
        
        await this.updateTeam(team.id, { brand_name: brandName });
      }
    }
    
    console.log('Team brand names updated successfully');
  }

  async deleteTeam(id: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async addPlayerToTeam(teamId: string, playerId: string): Promise<void> {
    console.log('Adding player to team:', { teamId, playerId });
    const { error } = await supabase
      .from('team_players')
      .insert([{ team_id: teamId, player_id: playerId }]);
    if (error) {
      console.error('Error adding player to team:', error);
      throw error;
    }
  }

  async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    const { error } = await supabase
      .from('team_players')
      .delete()
      .eq('team_id', teamId)
      .eq('player_id', playerId);
    if (error) throw error;
  }

  async assignTeamToPool(teamId: string, poolId: string): Promise<void> {
    console.log('Assigning team to pool:', { teamId, poolId });
    const { error } = await supabase
      .from('teams')
      .update({ pool_id: poolId })
      .eq('id', teamId);
    if (error) {
      console.error('Error assigning team to pool:', error);
      throw error;
    }
  }

  async removeTeamFromPool(teamId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({ pool_id: null })
      .eq('id', teamId);
    if (error) throw error;
  }

  // Pool management
  async getPools(): Promise<Pool[]> {
    console.log('Fetching pools...');
    // First, get basic pool data with category join
    const { data: poolsData, error: poolsError } = await supabase
      .from('pools')
      .select('*, category:categories(*)')
      .order('name');
    if (poolsError) {
      console.error('Error fetching basic pools:', poolsError);
      throw poolsError;
    }
    console.log('Basic pools fetched:', poolsData);
    if (!poolsData || poolsData.length === 0) {
      console.log('No pools found');
      return [];
    }
    // Then, get teams and/or players for each pool
    const poolsWithDetails = await Promise.all(
      poolsData.map(async (pool) => {
        try {
          let teams: any[] = [];
          let players: any[] = [];
          // Fetch teams for all pools
          const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('*, players:team_players(player:t_players(*))')
            .eq('pool_id', pool.id);
          if (!teamsError && teamsData) {
            teams = teamsData.map((team: any) => ({
              ...team,
              players: team.players?.map((tp: any) => tp.player) || []
            }));
          }
          // For non-Men's Team, fetch players directly assigned to pool
          if (pool.category?.type === 'player' || pool.category?.type === 'pair') {
            const { data: poolPlayers, error: poolPlayersError } = await supabase
              .from('pool_players')
              .select('*, player:t_players(*)')
              .eq('pool_id', pool.id);
            if (!poolPlayersError && poolPlayers) {
              players = poolPlayers.map((pp: any) => pp.player).filter(Boolean);
            }
          }
          return {
            ...pool,
            teams,
            teamCount: teams.length,
            players,
          };
        } catch (error) {
          console.error(`Error processing pool ${pool.id}:`, error);
          return {
            ...pool,
            teams: [],
            teamCount: 0,
            players: [],
          };
        }
      })
    );
    console.log('Pools with details:', poolsWithDetails);
    return poolsWithDetails as Pool[];
  }

  async getPoolById(id: string): Promise<Pool | null> {
    console.log('Fetching pool by ID:', id);
    
    // First, get basic pool data
    const { data: poolData, error: poolError } = await supabase
      .from('pools')
      .select('*')
      .eq('id', id)
      .single();
    
    if (poolError) {
      console.error('Error fetching pool:', poolError);
      throw poolError;
    }
    
    if (!poolData) {
      console.log('Pool not found');
      return null;
    }
    
    console.log('Basic pool data:', poolData);
    
    // Then, get teams for this pool
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          players:team_players(
            player:t_players(*)
          )
        `)
        .eq('pool_id', id);
      
      if (teamsError) {
        console.error('Error fetching teams for pool:', teamsError);
        return {
          ...poolData,
          teams: [],
          teamCount: 0
        } as Pool;
      }
      
      const teams = (teamsData || []).map((team: any) => ({
        ...team,
        players: team.players?.map((tp: any) => tp.player) || []
      }));
      
      const poolWithTeams = {
        ...poolData,
        teams,
        teamCount: teams.length
      } as Pool;
      
      console.log('Pool with teams:', poolWithTeams);
      return poolWithTeams;
    } catch (error) {
      console.error('Error processing pool teams:', error);
      return {
        ...poolData,
        teams: [],
        teamCount: 0
      } as Pool;
    }
  }

  async createPool(name: string, maxTeams: number = 4, category_id?: string): Promise<Pool> {
    console.log('Creating pool:', { name, maxTeams, category_id });
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('User not authenticated. Please log in.');
    }
    console.log('User authenticated:', user.email);
    // First, let's check if the table exists and we have permissions
    const { error: tableError } = await supabase
      .from('pools')
      .select('count')
      .limit(1);
    if (tableError) {
      console.error('Table access error:', tableError);
      throw new Error(`Cannot access pools table: ${tableError.message}`);
    }
    console.log('Table access successful, proceeding with insert...');
    const { data, error } = await supabase
      .from('pools')
      .insert([{ name, max_teams: maxTeams, category_id }])
      .select()
      .single();
    if (error) {
      console.error('Error creating pool:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    console.log('Pool created:', data);
    return data as Pool;
  }

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('label');
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    return data as Category[];
  }

  async updatePool(id: string, updates: Partial<Pool>): Promise<Pool> {
    const { data, error } = await supabase
      .from('pools')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Pool;
  }

  async deletePool(id: string): Promise<void> {
    const { error } = await supabase
      .from('pools')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async assignPlayerToPool(playerId: string, poolId: string): Promise<void> {
    const { error } = await supabase
      .from('pool_players')
      .insert([{ player_id: playerId, pool_id: poolId }]);
    if (error) {
      console.error('Error assigning player to pool:', error);
      throw error;
    }
  }

  async assignPairToPool(player1Id: string, poolId: string): Promise<void> {
    
    const { data: existingAssignments, error: checkError } = await supabase
      .from('pool_players')
      .select('player_id')
      .eq('pool_id', poolId)
      .in('player_id', [player1Id]);
    
    if (checkError) throw checkError;
    
    if (existingAssignments && existingAssignments.length > 0) {
      throw new Error('One or both players are already assigned to this pool');
    }
    
    // Assign both players to the pool
    const { error } = await supabase
      .from('pool_players')
      .insert([
        { player_id: player1Id, pool_id: poolId }
      ]);
    
    if (error) {
      console.error('Error assigning pair to pool:', error);
      throw error;
    }
  }

  async removePlayerFromPool(playerId: string, poolId: string): Promise<void> {
    const { error } = await supabase
      .from('pool_players')
      .delete()
      .eq('player_id', playerId)
      .eq('pool_id', poolId);
    if (error) {
      console.error('Error removing player from pool:', error);
      throw error;
    }
  }

  async removePairFromPool(playerId: string, poolId: string): Promise<void> {
    // Get the partner of the player being removed
    const { data: player, error: playerError } = await supabase
      .from('t_players')
      .select('partner_name')
      .eq('id', playerId)
      .single();
    
    if (playerError) throw playerError;
    
    if (player.partner_name) {
      // Find the partner's ID
      const { data: partner, error: partnerError } = await supabase
        .from('t_players')
        .select('id')
        .eq('name', player.partner_name)
        .single();
      
      if (partnerError) throw partnerError;
      
      // Remove both players from the pool
      const { error } = await supabase
        .from('pool_players')
        .delete()
        .eq('pool_id', poolId)
        .in('player_id', [playerId, partner.id]);
      
      if (error) {
        console.error('Error removing pair from pool:', error);
        throw error;
      }
    } else {
      // Fallback to single player removal
      await this.removePlayerFromPool(playerId, poolId);
    }
  }

  // Match scheduling
  async generateMatchesForPool(poolId: string): Promise<void> {
    console.log('Generating matches for pool:', poolId);
    // Fetch pool with category
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .select('*, category:categories(*)')
      .eq('id', poolId)
      .single();
    if (poolError || !pool) throw poolError || new Error('Pool not found');
    if (pool.category?.type === 'team') {
      // Existing team logic
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('pool_id', poolId);
      if (teamsError) throw teamsError;
      if (!teams || teams.length < 2) throw new Error('Need at least 2 teams in pool to generate matches');
      const matches = [];
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({ team1_id: teams[i].id, team2_id: teams[j].id, pool_id: poolId, status: 'scheduled' });
        }
      }
      const { error: matchesError } = await supabase.from('matches').insert(matches);
      if (matchesError) throw matchesError;
      console.log(`Generated ${matches.length} matches for pool ${poolId}`);
    } else if (pool.category?.type === 'player') {
      // Player-based logic
      const { data: poolPlayers, error: poolPlayersError } = await supabase
        .from('pool_players')
        .select('player_id')
        .eq('pool_id', poolId);
      if (poolPlayersError) throw poolPlayersError;
      if (!poolPlayers || poolPlayers.length < 2) throw new Error('Need at least 2 players in pool to generate matches');
      const matches = [];
      for (let i = 0; i < poolPlayers.length; i++) {
        for (let j = i + 1; j < poolPlayers.length; j++) {
          matches.push({ player1_id: poolPlayers[i].player_id, player2_id: poolPlayers[j].player_id, pool_id: poolId, status: 'scheduled' });
        }
      }
      const { error: matchesError } = await supabase.from('matches').insert(matches);
      if (matchesError) throw matchesError;
      console.log(`Generated ${matches.length} player matches for pool ${poolId}`);
    } else if (pool.category?.type === 'pair') {
      // Pair-based logic for Family Mixed, Women's Doubles, Mixed Doubles
      const { data: poolPlayers, error: poolPlayersError } = await supabase
        .from('pool_players')
        .select('player_id')
        .eq('pool_id', poolId);
      if (poolPlayersError) throw poolPlayersError;
      if (!poolPlayers || poolPlayers.length < 2) throw new Error('Need at least 2 players in pool to generate matches');
      
      // Get player details
      const { data: playersData, error: playersError } = await supabase
        .from('t_players')
        .select('id, name, partner_name')
        .in('id', poolPlayers.map(pp => pp.player_id));
      if (playersError) throw playersError;
      
      console.log('Pool players:', poolPlayers);
      console.log('Players data:', playersData);
      
      if (!playersData || playersData.length < 2) {
        throw new Error('Need at least 2 players in pool to generate matches');
      }
      
      // Generate matches between all players (pairs will be handled by partner_name lookup)
      const matches = [];
      for (let i = 0; i < playersData.length; i++) {
        for (let j = i + 1; j < playersData.length; j++) {
          matches.push({
            player1_id: playersData[i].id,
            player2_id: playersData[j].id,
            pool_id: poolId,
            status: 'scheduled'
          });
        }
      }
      
      const { error: matchesError } = await supabase.from('matches').insert(matches);
      if (matchesError) throw matchesError;
      console.log(`Generated ${matches.length} matches for pool ${poolId}`);
    } else {
      throw new Error('Unknown category type for match generation.');
    }
  }

  // Match management
  async getMatches(): Promise<Match[]> {
    console.log('Fetching matches...');
    
    // First, get basic match data
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (matchesError) {
      console.error('Error fetching basic matches:', matchesError);
      throw matchesError;
    }
    
    console.log('Basic matches fetched:', matchesData);
    
    if (!matchesData || matchesData.length === 0) {
      console.log('No matches found');
      return [];
    }
    
    // Then, get team and pool names for each match
    const matchesWithDetails = await Promise.all(
      matchesData.map(async (match) => {
        try {
          // Get team1 name
          let team1 = null;
          if (match.team1_id) {
            const { data: team1Data, error: team1Error } = await supabase
              .from('teams')
              .select('name')
              .eq('id', match.team1_id)
              .single();
            
            if (!team1Error && team1Data) {
              team1 = team1Data;
            }
          }
          
          // Get team2 name
          let team2 = null;
          if (match.team2_id) {
            const { data: team2Data, error: team2Error } = await supabase
              .from('teams')
              .select('name')
              .eq('id', match.team2_id)
              .single();
            
            if (!team2Error && team2Data) {
              team2 = team2Data;
            }
          }
          
          // Get pool name
          let pool = null;
          if (match.pool_id) {
            const { data: poolData, error: poolError } = await supabase
              .from('pools')
              .select('name')
              .eq('id', match.pool_id)
              .single();
            
            if (!poolError && poolData) {
              pool = poolData;
            }
          }
          
          return {
            ...match,
            team1,
            team2,
            pool
          };
        } catch (error) {
          console.error(`Error processing match ${match.id}:`, error);
          return {
            ...match,
            team1: null,
            team2: null,
            pool: null
          };
        }
      })
    );
    
    console.log('Matches with details:', matchesWithDetails);
    return matchesWithDetails as Match[];
  }

  async getMatchById(id: string): Promise<Match | null> {
    console.log('Fetching match by ID:', id);
    
    // First, get basic match data
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();
    
    if (matchError) {
      console.error('Error fetching match:', matchError);
      throw matchError;
    }
    
    if (!matchData) {
      console.log('Match not found');
      return null;
    }
    
    console.log('Basic match data:', matchData);
    
    try {
      // Get team1 name
      let team1 = null;
      if (matchData.team1_id) {
        const { data: team1Data, error: team1Error } = await supabase
          .from('teams')
          .select('name')
          .eq('id', matchData.team1_id)
          .single();
        
        if (!team1Error && team1Data) {
          team1 = team1Data;
        }
      }
      
      // Get team2 name
      let team2 = null;
      if (matchData.team2_id) {
        const { data: team2Data, error: team2Error } = await supabase
          .from('teams')
          .select('name')
          .eq('id', matchData.team2_id)
          .single();
        
        if (!team2Error && team2Data) {
          team2 = team2Data;
        }
      }
      
      // Get pool name
      let pool = null;
      if (matchData.pool_id) {
        const { data: poolData, error: poolError } = await supabase
          .from('pools')
          .select('name')
          .eq('id', matchData.pool_id)
          .single();
        
        if (!poolError && poolData) {
          pool = poolData;
        }
      }
      
      const matchWithDetails = {
        ...matchData,
        team1,
        team2,
        pool
      } as Match;
      
      console.log('Match with details:', matchWithDetails);
      return matchWithDetails;
    } catch (error) {
      console.error('Error processing match details:', error);
      return {
        ...matchData,
        team1: null,
        team2: null,
        pool: null
      } as Match;
    }
  }

  async createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>): Promise<Match> {
    console.log('Creating match:', match);
    const { data, error } = await supabase
      .from('matches')
      .insert([match])
      .select()
      .single();
    if (error) {
      console.error('Error creating match:', error);
      throw error;
    }
    console.log('Match created:', data);
    return data as Match;
  }

  async updateMatchScore(matchId: string, scoreData: { team1_score: number; team2_score: number; status: string; winner?: 'team1' | 'team2' | 'player1' | 'player2' | null; match_referee?: string }): Promise<void> {
    console.log('Updating match score:', { matchId, scoreData });
    const { error } = await supabase
      .from('matches')
      .update(scoreData)
      .eq('id', matchId);
    if (error) {
      console.error('Error updating match score:', error);
      throw error;
    }
    console.log('Match score updated');
    // Log activity
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('activity_logs').insert([
        {
          match_id: matchId,
          activity_type: scoreData.status === 'completed' ? 'MATCH_COMPLETED' : 'MATCH_UPDATED',
          description: scoreData.status === 'completed'
            ? `Match marked as completed. Final score: ${scoreData.team1_score} - ${scoreData.team2_score}`
            : `Match score updated to ${scoreData.team1_score} - ${scoreData.team2_score}`,
          performed_by_user_id: user.id,
          metadata: { ...scoreData },
        }
      ]);
    }
  }

  async deleteMatch(matchId: string): Promise<void> {
    console.log('Deleting match:', matchId);
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId);
    if (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
    console.log('Match deleted');
  }

  async updateMatchResult(matchId: string, team1Score: number, team2Score: number, winner: 'team1' | 'team2'): Promise<void> {
    console.log('Updating match result:', { matchId, team1Score, team2Score, winner });
    const { error } = await supabase
      .from('matches')
      .update({
        team1_score: team1Score,
        team2_score: team2Score,
        winner,
        status: 'completed'
      })
      .eq('id', matchId);
    if (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
    console.log('Match result updated');
    // Log activity
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('activity_logs').insert([
        {
          match_id: matchId,
          activity_type: 'MATCH_COMPLETED',
          description: `Match completed. Winner: ${winner}. Final score: ${team1Score} - ${team2Score}`,
          performed_by_user_id: user.id,
          metadata: { team1Score, team2Score, winner },
        }
      ]);
    }
  }

  // Standings calculation
  async getPoolStandings(poolId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!team1_id(name),
        team2:teams!team2_id(name)
      `)
      .eq('pool_id', poolId)
      .eq('completed', true);
    
    if (error) throw error;
    
    // Calculate standings
    const standings: { [key: string]: any } = {};
    
    data?.forEach((match: any) => {
      const team1Id = match.team1_id;
      const team2Id = match.team2_id;
      
      if (!standings[team1Id]) {
        standings[team1Id] = {
          teamId: team1Id,
          teamName: match.team1?.name || 'Unknown',
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          points: 0
        };
      }
      
      if (!standings[team2Id]) {
        standings[team2Id] = {
          teamId: team2Id,
          teamName: match.team2?.name || 'Unknown',
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          points: 0
        };
      }
      
      standings[team1Id].matchesPlayed++;
      standings[team2Id].matchesPlayed++;
      
      if (match.winner === 'team1') {
        standings[team1Id].matchesWon++;
        standings[team1Id].points += 3;
        standings[team2Id].matchesLost++;
      } else {
        standings[team2Id].matchesWon++;
        standings[team2Id].points += 3;
        standings[team1Id].matchesLost++;
      }
    });
    
    return Object.values(standings).sort((a, b) => b.points - a.points);
  }

  // Match media management
  async uploadMatchMedia(matchId: string, file: File, mediaType: 'photo' | 'video', description?: string): Promise<MatchMedia> {
    console.log('Uploading match media:', { matchId, fileName: file.name, mediaType });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${matchId}/${Date.now()}.${fileExt}`;
    const filePath = `match-media/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tournament-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tournament-media')
      .getPublicUrl(filePath);

    // Insert media record
    const { data, error } = await supabase
      .from('match_media')
      .insert([{
        match_id: matchId,
        media_type: mediaType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        description,
        uploaded_by_user_id: user.id,
        is_public: true,
        is_featured: false
      }])
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting media record:', error);
      throw error;
    }

    console.log('Media uploaded successfully:', data);
    return data as MatchMedia;
  }

  async getMatchMedia(matchId: string): Promise<MatchMedia[]> {
    console.log('Fetching match media for:', matchId);
    
    try {
      const { data, error } = await supabase
        .from('match_media')
        .select('*')
        .eq('match_id', matchId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching match media:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Match media fetched successfully:', data);
      return data as MatchMedia[];
    } catch (err) {
      console.error('Exception in getMatchMedia:', err);
      throw err;
    }
  }

  async deleteMatchMedia(mediaId: string): Promise<void> {
    console.log('Deleting match media:', mediaId);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get media record to check ownership and get file path
    const { data: mediaData, error: fetchError } = await supabase
      .from('match_media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (fetchError || !mediaData) {
      throw new Error('Media not found');
    }

    // Check if user owns the media or is admin
    if (mediaData.uploaded_by_user_id !== user.id) {
      throw new Error('Not authorized to delete this media');
    }

    // Delete from storage
    const filePath = mediaData.file_url.split('/').slice(-2).join('/');
    const { error: storageError } = await supabase.storage
      .from('tournament-media')
      .remove([`match-media/${filePath}`]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Delete from database
    const { error } = await supabase
      .from('match_media')
      .delete()
      .eq('id', mediaId);

    if (error) {
      console.error('Error deleting media record:', error);
      throw error;
    }

    console.log('Media deleted successfully');
  }
}

export const tournamentStore = new TournamentStore(); 