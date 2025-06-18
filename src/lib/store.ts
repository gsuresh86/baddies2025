import { Pool, Team, Match, Game, TournamentStandings, Player } from '@/types';

// Mock data
const mockPlayers: Player[] = [
  { id: 'p1', name: 'John Smith' },
  { id: 'p2', name: 'Jane Doe' },
  { id: 'p3', name: 'Mike Johnson' },
  { id: 'p4', name: 'Sarah Wilson' },
  { id: 'p5', name: 'David Brown' },
  { id: 'p6', name: 'Lisa Garcia' },
  { id: 'p7', name: 'Tom Davis' },
  { id: 'p8', name: 'Emma Taylor' },
  { id: 'p9', name: 'Chris Lee' },
  { id: 'p10', name: 'Anna Martinez' },
  { id: 'p11', name: 'Ryan Clark' },
  { id: 'p12', name: 'Megan White' },
];

const mockTeams: Team[] = [
  {
    id: 'team1',
    name: 'Team Alpha',
    players: mockPlayers.slice(0, 6),
  },
  {
    id: 'team2',
    name: 'Team Beta',
    players: mockPlayers.slice(6, 12),
  },
];

const mockPools: Pool[] = [
  {
    id: 'pool1',
    name: 'Pool A',
    teams: mockTeams,
    matches: [],
    maxTeams: 4,
  },
];

class TournamentStore {
  private pools: Pool[] = mockPools;
  private teams: Team[] = mockTeams;

  // Pool management
  getPools(): Pool[] {
    return this.pools;
  }

  getPoolById(id: string): Pool | undefined {
    return this.pools.find(pool => pool.id === id);
  }

  createPool(name: string): Pool {
    const newPool: Pool = {
      id: `pool-${Date.now()}`,
      name,
      teams: [],
      matches: [],
      maxTeams: 4,
    };
    this.pools.push(newPool);
    return newPool;
  }

  addTeamToPool(teamId: string, poolId: string): boolean {
    const pool = this.getPoolById(poolId);
    const team = this.teams.find(t => t.id === teamId);
    
    if (!pool || !team) return false;
    if (pool.teams.length >= pool.maxTeams) return false;
    if (pool.teams.find(t => t.id === teamId)) return false;

    team.poolId = poolId;
    pool.teams.push(team);
    return true;
  }

  // Team management
  getTeams(): Team[] {
    return this.teams;
  }

  getTeamsNotInPool(): Team[] {
    return this.teams.filter(team => !team.poolId);
  }

  createTeam(name: string, players: Player[]): Team {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name,
      players,
    };
    this.teams.push(newTeam);
    return newTeam;
  }

  // Match scheduling
  generateMatchesForPool(poolId: string): Match[] {
    const pool = this.getPoolById(poolId);
    if (!pool || pool.teams.length < 2) return [];

    const matches: Match[] = [];
    const teams = pool.teams;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const match: Match = {
          id: `match-${Date.now()}-${i}-${j}`,
          team1Id: teams[i].id,
          team2Id: teams[j].id,
          games: this.generateGamesForMatch(teams[i], teams[j]),
          team1Score: 0,
          team2Score: 0,
          completed: false,
        };
        matches.push(match);
      }
    }

    pool.matches = matches;
    return matches;
  }

  private generateGamesForMatch(team1: Team, team2: Team): Game[] {
    const games: Game[] = [];

    // 2 Singles games
    for (let i = 0; i < 2; i++) {
      games.push({
        id: `game-${Date.now()}-singles-${i}`,
        type: 'singles',
        player1Id: team1.players[i]?.id,
        player2Id: team2.players[i]?.id,
        team1Score: 0,
        team2Score: 0,
        winner: 'team1',
        completed: false,
      });
    }

    // 3 Doubles games
    for (let i = 0; i < 3; i++) {
      const startIndex = 2 + (i * 2);
      games.push({
        id: `game-${Date.now()}-doubles-${i}`,
        type: 'doubles',
        player1Id: team1.players[startIndex]?.id,
        player2Id: team1.players[startIndex + 1]?.id,
        player3Id: team2.players[startIndex]?.id,
        player4Id: team2.players[startIndex + 1]?.id,
        team1Score: 0,
        team2Score: 0,
        winner: 'team1',
        completed: false,
      });
    }

    return games;
  }

  // Match results
  updateGameResult(matchId: string, gameId: string, team1Score: number, team2Score: number): boolean {
    const pool = this.pools.find(p => p.matches.find(m => m.id === matchId));
    if (!pool) return false;

    const match = pool.matches.find(m => m.id === matchId);
    if (!match) return false;

    const game = match.games.find(g => g.id === gameId);
    if (!game) return false;

    game.team1Score = team1Score;
    game.team2Score = team2Score;
    game.winner = team1Score > team2Score ? 'team1' : 'team2';
    game.completed = true;

    // Update match score
    this.updateMatchScore(match);
    return true;
  }

  private updateMatchScore(match: Match): void {
    const team1Wins = match.games.filter(g => g.completed && g.winner === 'team1').length;
    const team2Wins = match.games.filter(g => g.completed && g.winner === 'team2').length;
    
    match.team1Score = team1Wins;
    match.team2Score = team2Wins;
    
    if (match.games.every(g => g.completed)) {
      match.completed = true;
      match.winner = team1Wins > team2Wins ? 'team1' : 'team2';
    }
  }

  // Standings calculation
  getPoolStandings(poolId: string): TournamentStandings[] {
    const pool = this.getPoolById(poolId);
    if (!pool) return [];

    const standings: { [teamId: string]: TournamentStandings } = {};

    // Initialize standings for each team
    pool.teams.forEach(team => {
      standings[team.id] = {
        teamId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        points: 0,
      };
    });

    // Calculate standings from matches
    pool.matches.forEach(match => {
      if (!match.completed) return;

      const team1Standing = standings[match.team1Id];
      const team2Standing = standings[match.team2Id];

      team1Standing.matchesPlayed++;
      team2Standing.matchesPlayed++;

      if (match.winner === 'team1') {
        team1Standing.matchesWon++;
        team2Standing.matchesLost++;
      } else {
        team2Standing.matchesWon++;
        team1Standing.matchesLost++;
      }

      // Count games
      match.games.forEach(game => {
        if (game.completed) {
          if (game.winner === 'team1') {
            team1Standing.gamesWon++;
            team2Standing.gamesLost++;
          } else {
            team2Standing.gamesWon++;
            team1Standing.gamesLost++;
          }
        }
      });
    });

    // Calculate points (3 for match win, 1 for each game win)
    Object.values(standings).forEach(standing => {
      standing.points = (standing.matchesWon * 3) + standing.gamesWon;
    });

    // Sort by points, then by match wins, then by game wins
    return Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      return b.gamesWon - a.gamesWon;
    });
  }
}

export const tournamentStore = new TournamentStore(); 