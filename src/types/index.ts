export interface Player {
  id: string;
  name: string;
  email?: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  poolId?: string;
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
  team1Id: string;
  team2Id: string;
  games: Game[];
  team1Score: number;
  team2Score: number;
  winner?: 'team1' | 'team2';
  completed: boolean;
  scheduledDate?: string;
}

export interface Pool {
  id: string;
  name: string;
  teams: Team[];
  matches: Match[];
  maxTeams: number;
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