import { Team, Player, Match, TournamentStandings, MatchHistory } from '@/types';

export function calculateStandings(
  teams: Team[],
  players: Player[],
  matches: Match[],
  categoryCode?: string,
  games?: MatchHistory[]
): TournamentStandings[] {
  const standings: { [id: string]: any } = {};
  const pairFirstNameOnly = ["XD", "FM", "WD"];

  // Initialize standings for teams
  teams.forEach(team => {
    standings[team.id] = {
      teamId: team.id,
      teamName: team.name,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
      pointsWon: 0,
      pointsLost: 0,
      gameDiff: 0,
      pointDiff: 0,
    };
  });

  // Initialize standings for players (for player-based categories)
  players.forEach(player => {
    let displayName;
    if (player.partner_name) {
      if (pairFirstNameOnly.includes(categoryCode || "")) {
        const first = player.name.split(" ")[0];
        const partnerFirst = player.partner_name.split(" ")[0];
        displayName = `${first} / ${partnerFirst}`;
      } else {
        displayName = `${player.name} / ${player.partner_name}`;
      }
    } else {
      displayName = player.name;
    }
    standings[player.id] = {
      teamId: player.id,
      teamName: displayName,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
      pointsWon: 0,
      pointsLost: 0,
      gameDiff: 0,
      pointDiff: 0,
    };
  });

  if (categoryCode === 'MT' && games) {
    // Map matchId to team1_id/team2_id
    const matchIdToTeams: Record<string, { team1_id: string, team2_id: string }> = {};
    matches.forEach(match => {
      if (match.team1_id && match.team2_id) {
        matchIdToTeams[match.id] = { team1_id: match.team1_id, team2_id: match.team2_id };
      }
    });
    // Aggregate points for each team from games table
    games.forEach(game => {
      const matchTeams = matchIdToTeams[game.match_id];
      if (!matchTeams) return;
      // Team 1
      if (standings[matchTeams.team1_id]) {
        standings[matchTeams.team1_id].pointsWon += game.team1_score || 0;
        standings[matchTeams.team1_id].pointsLost += game.team2_score || 0;
      }
      // Team 2
      if (standings[matchTeams.team2_id]) {
        standings[matchTeams.team2_id].pointsWon += game.team2_score || 0;
        standings[matchTeams.team2_id].pointsLost += game.team1_score || 0;
      }
    });
    // Use match-level for GW, GL, GD, MP, W, L, PTS
    matches.forEach(match => {
      if (match.status !== 'completed') return;
      if (match.team1_id && match.team2_id) {
        const team1 = standings[match.team1_id];
        const team2 = standings[match.team2_id];
        if (!team1 || !team2) return;
        team1.matchesPlayed++;
        team2.matchesPlayed++;
        if ((match.team1_score ?? 0) > (match.team2_score ?? 0)) {
          team1.matchesWon++;
          team2.matchesLost++;
        } else if ((match.team2_score ?? 0) > (match.team1_score ?? 0)) {
          team2.matchesWon++;
          team1.matchesLost++;
        }
      }
    });
    Object.values(standings).forEach(standing => {
      standing.points = (standing.matchesWon * 2);
      standing.gamesWon = standing.matchesWon;
      standing.gamesLost = standing.matchesLost;
      standing.gameDiff = standing.gamesWon - standing.gamesLost;
      standing.pointDiff = standing.pointsWon - standing.pointsLost;
    });
    return Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      return b.gamesWon - a.gamesWon;
    });
  }

  // Default: old logic for other categories
  matches.forEach(match => {
    if (match.status !== 'completed') return;
    // Handle team-based matches
    if (match.team1_id && match.team2_id) {
      const team1 = standings[match.team1_id];
      const team2 = standings[match.team2_id];
      if (!team1 || !team2) return;
      team1.matchesPlayed++;
      team2.matchesPlayed++;
      if ((match.team1_score ?? 0) > (match.team2_score ?? 0)) {
        team1.matchesWon++;
        team2.matchesLost++;
      } else if ((match.team2_score ?? 0) > (match.team1_score ?? 0)) {
        team2.matchesWon++;
        team1.matchesLost++;
      }
      // Count games
      team1.gamesWon += match.team1_score || 0;
      team1.gamesLost += match.team2_score || 0;
      team2.gamesWon += match.team2_score || 0;
      team2.gamesLost += match.team1_score || 0;
    }
    // Handle player-based matches (for categories like Boys U13)
    if ((match as any).player1_id && (match as any).player2_id) {
      const player1 = standings[(match as any).player1_id];
      const player2 = standings[(match as any).player2_id];
      if (!player1 || !player2) return;
      player1.matchesPlayed++;
      player2.matchesPlayed++;
      if ((match.team1_score ?? 0) > (match.team2_score ?? 0)) {
        player1.matchesWon++;
        player2.matchesLost++;
      } else if ((match.team2_score ?? 0) > (match.team1_score ?? 0)) {
        player2.matchesWon++;
        player1.matchesLost++;
      }
      // Count games
      player1.gamesWon += match.team1_score || 0;
      player1.gamesLost += match.team2_score || 0;
      player2.gamesWon += match.team2_score || 0;
      player2.gamesLost += match.team1_score || 0;
    }
  });

  // Calculate points
  Object.values(standings).forEach(standing => {
    standing.points = (standing.matchesWon * 2);
  });

  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
    // Game win percentage as tiebreaker
    const aGames = a.gamesWon + a.gamesLost;
    const bGames = b.gamesWon + b.gamesLost;
    const aPct = aGames > 0 ? a.gamesWon / aGames : 0;
    const bPct = bGames > 0 ? b.gamesWon / bGames : 0;
    if (bPct !== aPct) return bPct - aPct;
    return b.gamesWon - a.gamesWon;
  });
} 