import * as XLSX from 'xlsx';
import { Match, Category, Pool, Team, Player } from '@/types';
import { formatISTDateTime, getCategoryForMatch, getTeamName, getPoolName } from './matchUtils';

export const exportMatchesToExcel = (
  matches: Match[],
  categories: Category[],
  pools: Pool[],
  teams: Team[],
  players: Player[]
) => {
  const headers = [
    'Match ID',
    'Team 1',
    'Team 2', 
    'Pool',
    'Category',
    'Date',
    'Time',
    'Court',
    'Status',
    'Team 1 Score',
    'Team 2 Score',
    'Created At'
  ];

  const data = matches.map((match) => {
    const matchCategory = match.category_id
      ? categories.find(c => c.id === match.category_id)
      : getCategoryForMatch(match, pools, categories);
    const matchType = matchCategory?.type;
    const { date, time } = formatISTDateTime(match.scheduled_date);
    
    // Helper to get participant names
    const getParticipantNames = () => {
      if (matchType === 'team') {
        return {
          participant1: getTeamName(match.team1_id || '', teams),
          participant2: getTeamName(match.team2_id || '', teams)
        };
      } else if (matchType === 'player' || (!match.pool_id && match.player1_id && match.player2_id)) {
        const player1 = players.find(p => p.id === (match as any).player1_id);
        const player2 = players.find(p => p.id === (match as any).player2_id);
        return {
          participant1: player1 ? player1.name.split(' ')[0] : '-',
          participant2: player2 ? player2.name.split(' ')[0] : '-'
        };
      } else if (matchType === 'pair') {
        const player1 = players.find(p => p.id === (match as any).player1_id);
        const player2 = players.find(p => p.id === (match as any).player2_id);
        const player1FirstName = player1 ? player1.name.split(' ')[0] : '-';
        const player2FirstName = player2 ? player2.name.split(' ')[0] : '-';
        const player1PartnerFirstName = player1?.partner_name ? player1.partner_name.split(' ')[0] : '';
        const player2PartnerFirstName = player2?.partner_name ? player2.partner_name.split(' ')[0] : '';
        return {
          participant1: player1PartnerFirstName ? `${player1FirstName} / ${player1PartnerFirstName}` : player1FirstName,
          participant2: player2PartnerFirstName ? `${player2FirstName} / ${player2PartnerFirstName}` : player2FirstName
        };
      }
      return { participant1: '-', participant2: '-' };
    };
    
    const { participant1, participant2 } = getParticipantNames();
    
    return [
      match.id,
      participant1,
      participant2,
      getPoolName(match.pool_id, pools),
      matchCategory?.label || '-',
      date,
      time,
      match.court || '-',
      match.status || 'scheduled',
      match.team1_score || '-',
      match.team2_score || '-',
      match.created_at ? new Date(match.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Matches');
  
  // Auto-size columns
  const columnWidths = [
    { wch: 15 }, // Match ID
    { wch: 25 }, // Team 1
    { wch: 25 }, // Team 2
    { wch: 15 }, // Pool
    { wch: 20 }, // Category
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 8 },  // Court
    { wch: 12 }, // Status
    { wch: 12 }, // Team 1 Score
    { wch: 12 }, // Team 2 Score
    { wch: 20 }  // Created At
  ];
  worksheet['!cols'] = columnWidths;
  
  const fileName = `tournament-matches-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}; 