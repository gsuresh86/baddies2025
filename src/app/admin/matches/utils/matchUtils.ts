import { Match } from '@/types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export const exportMatchesToExcel = (matches: Match[], players: any[], filename: string = 'matches.xlsx') => {
  const getParticipantNameExcel = (match: Match, side: 'team1' | 'team2') => {
    if (side === 'team1') {
      if (match.team1) return match.team1.name;
      if (match.player1) {
        return match.player1.partner_name 
          ? `${match.player1.name} / ${match.player1.partner_name}`
          : match.player1.name;
      }
      if ((match as any).player1_id) {
        const player = players.find(p => p.id === (match as any).player1_id);
        return player ? (player.partner_name ? `${player.name} / ${player.partner_name}` : player.name) : '-';
      }
    } else {
      if (match.team2) return match.team2.name;
      if (match.player2) {
        return match.player2.partner_name 
          ? `${match.player2.name} / ${match.player2.partner_name}`
          : match.player2.name;
      }
      if ((match as any).player2_id) {
        const player = players.find(p => p.id === (match as any).player2_id);
        return player ? (player.partner_name ? `${player.name} / ${player.partner_name}` : player.name) : '-';
      }
    }
    return '-';
  };
  const data = matches.map(match => ({
    'Match No': match.match_no || '-',
    'Pool': match.pool?.name || 'Unknown Pool',
    'Team 1 / Player 1': getParticipantNameExcel(match, 'team1'),
    'Team 2 / Player 2': getParticipantNameExcel(match, 'team2'),
    'Score': `${match.team1_score || 0} - ${match.team2_score || 0}`,
    'Status': match.status || 'Scheduled',
    'Date': match.scheduled_date ? new Date(match.scheduled_date).toLocaleDateString() : '-',
    'Time': match.scheduled_date ? new Date(match.scheduled_date).toLocaleTimeString() : '-',
    'Court': match.court || '-',
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Matches');
  XLSX.writeFile(workbook, filename);
};

export const exportMatchesToPDF = (matches: Match[], filename: string = 'matches.pdf') => {
  const pdf = new jsPDF();
  
  pdf.setFontSize(18);
  pdf.text('Tournament Matches', 20, 20);
  
  let yPosition = 40;
  const lineHeight = 7;
  
  matches.forEach((match) => {
    if (yPosition > 280) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(12);
    pdf.text(`${match.match_no || '-'} - ${match.pool?.name || 'Unknown Pool'}`, 20, yPosition);
    pdf.text(`${getParticipantName(match, 'team1')} vs ${getParticipantName(match, 'team2')}`, 20, yPosition + lineHeight);
    pdf.text(`Score: ${match.team1_score || 0} - ${match.team2_score || 0}`, 20, yPosition + lineHeight * 2);
    pdf.text(`Status: ${match.status || 'Scheduled'}`, 20, yPosition + lineHeight * 3);
    
    if (match.scheduled_date) {
      const date = new Date(match.scheduled_date);
      pdf.text(`Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, 20, yPosition + lineHeight * 4);
    }
    
    if (match.court) {
      pdf.text(`Court: ${match.court}`, 20, yPosition + lineHeight * 5);
    }
    
    yPosition += lineHeight * 6 + 5;
  });
  
  pdf.save(filename);
};

export const getParticipantName = (match: Match, side: 'team1' | 'team2') => {
  if (side === 'team1') {
    if (match.team1) return match.team1.name;
    if (match.player1) {
      return match.player1.partner_name 
        ? `${match.player1.name} / ${match.player1.partner_name}`
        : match.player1.name;
    }
  } else {
    if (match.team2) return match.team2.name;
    if (match.player2) {
      return match.player2.partner_name 
        ? `${match.player2.name} / ${match.player2.partner_name}`
        : match.player2.name;
    }
  }
  return 'TBD';
};

export const getMatchStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatDateTime = (dateString: string | undefined | null) => {
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
  } catch {
    return { date: '-', time: '-' };
  }
};