import { Match, Player, Team, Pool, Category } from '@/types';

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '🔄';
    case 'cancelled': return '❌';
    default: return '⏰';
  }
};

export const formatISTDateTime = (dateString: string | undefined | null) => {
  if (!dateString) return { date: '-', time: '-' };
  try {
    const dt = new Date(dateString);
    
    const istDate = dt.toLocaleDateString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const istTime = dt.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date: istDate, time: istTime };
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return { date: '-', time: '-' };
  }
};

export const getISTTimeFromStored = (storedDateString: string | undefined | null) => {
  if (!storedDateString) return { date: '', time: '' };
  try {
    const dt = new Date(storedDateString);
    const istDate = dt.toLocaleDateString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-');
    
    const istTime = dt.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return { date: istDate, time: istTime };
  } catch (error) {
    console.error('Error getting IST time from stored date:', error);
    return { date: '', time: '' };
  }
};

export const getTeamName = (teamId: string, teams: Team[]) => {
  const team = teams.find(team => team.id === teamId);
  if (!team) return 'Unknown Team';
  
  const displayName = team.brand_name || team.name;
  
  const teamNumberMatch = team.name.match(/(\d+)/);
  const teamNumber = teamNumberMatch ? teamNumberMatch[1] : null;
  
  if (team.brand_name && teamNumber) {
    return `${team.brand_name} #${teamNumber}`;
  }
  
  return displayName;
};

export const getPoolName = (poolId: string, pools: Pool[]) => {
  return pools.find(pool => pool.id === poolId)?.name || 'Unknown Pool';
};

export const getPlayerName = (id: string, players: Player[]) => {
  return players.find(p => p.id === id)?.name || '-';
};

export const getCategoryForMatch = (match: Match, pools: Pool[], categories: Category[]) => {
  const pool = pools.find(p => p.id === match.pool_id);
  if (!pool) return undefined;
  return categories.find(c => c.id === pool.category_id);
};

export const getPoolsForCategory = (categoryId: string, pools: Pool[]) => {
  return pools.filter(pool => pool.category_id === categoryId);
};

export const getNextMatchNumber = (
  categoryId: string, 
  poolId: string, 
  categories: Category[], 
  matches: Match[], 
  pools: Pool[]
) => {
  const category = categories.find(c => c.id === categoryId);
  if (!category) return 'CAT-001';
  
  const code = category.code || category.label.replace(/\s/g, '').substring(0, 3);
  
  const existingMatches = matches.filter(match => {
    const matchPool = pools.find(p => p.id === match.pool_id);
    return matchPool?.category_id === categoryId && match.pool_id === poolId;
  });
  
  let maxSequence = 0;
  existingMatches.forEach(existingMatch => {
    if (existingMatch.match_no) {
      const matchNoPattern = new RegExp(`^${code}-(\\d+)$`);
      const matchResult = existingMatch.match_no.match(matchNoPattern);
      if (matchResult && matchResult[1]) {
        const sequence = parseInt(matchResult[1]);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }
  });
  
  const nextSequence = maxSequence + 1;
  return `${code}-${String(nextSequence).padStart(3, '0')}`;
};

export const getParticipantDisplayName = (participant: any, isTeamCategory: boolean) => {
  if (isTeamCategory) {
    return participant.brand_name || participant.name;
  } else {
    if (participant.partner_name) {
      return `${participant.name} / ${participant.partner_name}`;
    }
    return participant.name;
  }
};

export const getOptionsForPool = (poolId: string, pools: Pool[], teams: Team[], players: Player[], poolPlayers: any[]) => {
  const pool = pools.find(p => p.id === poolId);
  if (!pool) return [];
  if (pool.category?.type === 'team') {
    return teams.filter(t => t.pool_id === poolId).map(t => ({ id: t.id, name: t.name }));
  } else {
    const playerIds = poolPlayers.filter(pp => pp.pool_id === poolId).map(pp => pp.player_id);
    return players.filter(p => playerIds.includes(p.id)).map(p => ({ id: p.id, name: p.name }));
  }
};

export const groupMatchesByCourt = (matches: Match[]) => {
  const grouped: Record<string, Match[]> = {};
  matches.forEach((m) => {
    const court = m.court || 'Unknown';
    if (!grouped[court]) grouped[court] = [];
    grouped[court].push(m);
  });
  return grouped;
};

export const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

export const getParticipantNamesForSheet = (
  match: Match, 
  categories: Category[], 
  pools: Pool[], 
  teams: Team[], 
  players: Player[]
) => {
  const matchCategory = match.category_id
    ? categories.find(c => c.id === match.category_id)
    : getCategoryForMatch(match, pools, categories);
  const matchType = matchCategory?.type;
  
  if (matchType === 'team') {
    return [getTeamName(match.team1_id || '', teams), getTeamName(match.team2_id || '', teams)];
  } else if (matchType === 'player') {
    const player1 = players.find(p => p.id === match.player1_id);
    const player2 = players.find(p => p.id === match.player2_id);
    return [player1?.name || '-', player2?.name || '-'];
  } else if (matchType === 'pair') {
    const player1 = players.find(p => p.id === match.player1_id);
    const player2 = players.find(p => p.id === match.player2_id);
    const player1First = player1 ? player1.name.split(' ')[0] : '-';
    const player2First = player2 ? player2.name.split(' ')[0] : '-';
    const player1PartnerFirstName = player1?.partner_name ? player1.partner_name.split(' ')[0] : '';
    const player2PartnerFirstName = player2?.partner_name ? player2.partner_name.split(' ')[0] : '';
    const player1Full = player1PartnerFirstName ? `${player1First} / ${player1PartnerFirstName}` : player1First;
    const player2Full = player2PartnerFirstName ? `${player2First} / ${player2PartnerFirstName}` : player2First;
    return [player1Full, player2Full];
  }
  return ['-', '-'];
}; 