import { Team, Player, Match, TournamentStandings } from '@/types';

export function calculateStandings(teams: Team[], players: Player[], matches: Match[], categoryCode?: string): TournamentStandings[] {
  const standings: { [id: string]: TournamentStandings } = {};
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
    };
  });

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