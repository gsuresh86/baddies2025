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
  partner_name?: string;
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
  team1_id?: string;
  team2_id?: string;
  player1_id?: string;
  player2_id?: string;
  team1_score?: number;
  team2_score?: number;
  winner?: 'team1' | 'team2' | 'player1' | 'player2';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  pool_id: string;
  scheduled_date?: string;
  court?: string;
  match_no?: string;
  created_at?: string;
  updated_at?: string;
  // New fields for match history
  match_notes?: string;
  match_highlights?: string;
  match_duration?: number;
  match_venue?: string;
  match_officials?: string[];
  match_referee?: string;
  // Joined data from Supabase queries
  team1?: Team;
  team2?: Team;
  player1?: Player;
  player2?: Player;
  pool?: Pool;
  games?: Game[];
  completed?: boolean;
  // Media and history
  media?: MatchMedia[];
  history?: MatchHistory[];
  highlights?: MatchHighlight[];
}

export interface Pool {
  id: string;
  name: string;
  max_teams: number;
  created_at?: string;
  updated_at?: string;
  category_id?: string;
  category?: Category;
  // Joined data
  teams?: Team[];
  matches?: Match[];
  teamCount?: number;
  players?: Player[]; // For non-Men's Team pools
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
  category_id?: string;
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

export interface Category {
  id: string;
  code: string;
  label: string;
  description?: string;
  created_at?: string;
  type: 'team' | 'player' | 'pair';
}

export interface PoolPlayer {
  id: string;
  pool_id: string;
  player_id: string;
  pair_id?: string; // For pair-based categories
  created_at?: string;
  player?: Player;
}

export interface PoolPair {
  id: string;
  pool_id: string;
  player1_id: string;
  player2_id: string;
  created_at?: string;
  player1?: Player;
  player2?: Player;
}

export interface MatchHistory {
  id: string;
  match_id: string;
  game_number: number;
  team1_score?: number;
  team2_score?: number;
  winner?: 'team1' | 'team2' | 'draw';
  game_duration?: number; // in minutes
  game_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MatchMedia {
  id: string;
  match_id: string;
  media_type: 'photo' | 'video';
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  uploaded_by_user_id: string;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  user?: { email?: string };
}

export interface MatchHighlight {
  id: string;
  match_id: string;
  highlight_type: string;
  description?: string;
  timestamp?: number; // seconds from match start
  media_id?: string;
  created_at: string;
  media?: MatchMedia;
} 