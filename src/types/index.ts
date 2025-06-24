export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category?: string;
  level?: string;
  flat_no?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  pool_id?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  players?: Player[];
  pool?: Pool;
  teamCount?: number;
}

export interface Game {
  id: string;
  type: 'singles' | 'doubles';
  player1Id?: string;
  player2Id?: string;
  player3Id?: string;
  player4Id?: string;
  team1Score: number;
  team2Score: number;
  winner: 'team1' | 'team2';
  completed: boolean;
}

export interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score?: number;
  team2_score?: number;
  winner?: 'team1' | 'team2';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  pool_id: string;
  scheduled_date?: string;
  court?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data from Supabase queries
  team1?: Team;
  team2?: Team;
  pool?: Pool;
  games?: Game[];
  completed?: boolean;
}

export interface Pool {
  id: string;
  name: string;
  max_teams: number;
  created_at?: string;
  updated_at?: string;
  // Joined data
  teams?: Team[];
  matches?: Match[];
  teamCount?: number;
}

export interface TournamentStandings {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

export interface GameResult {
  gameId: string;
  team1Score: number;
  team2Score: number;
  winner: 'team1' | 'team2';
}

// Database table interfaces for Supabase
export interface PlayerTable {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category?: string;
  level?: string;
  flat_no?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamTable {
  id: string;
  name: string;
  pool_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PoolTable {
  id: string;
  name: string;
  max_teams: number;
  created_at: string;
  updated_at: string;
}

export interface MatchTable {
  id: string;
  team1_id?: string;
  team2_id?: string;
  team1_score?: number;
  team2_score?: number;
  winner?: 'team1' | 'team2';
  completed: boolean;
  pool_id: string;
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamPlayerTable {
  id: string;
  team_id: string;
  player_id: string;
  created_at: string;
}

export interface Registration {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category?: string;
  level?: string;
  flat_no?: string;
  created_at?: string;
  updated_at?: string;
  tshirt_size?: string;
  partner_name?: string;
  partner_phone?: string;
  partner_tshirt_size?: string;
  partner_flat_no?: string;
  paid_to?: string;
  paid_amt?: string;
  payment_status?: boolean;
} 