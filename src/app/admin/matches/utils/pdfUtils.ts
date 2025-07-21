import jsPDF from 'jspdf';
import { Match, Category, Pool, Team, Player } from '@/types';
import { formatISTDateTime, getParticipantNamesForSheet, groupMatchesByCourt, chunkArray } from './matchUtils';

export const generateScoreSheetPDFForDate = (
  matchesToPrint: Match[],
  categories: Category[],
  pools: Pool[],
  teams: Team[],
  players: Player[]
) => {
  const grouped = groupMatchesByCourt(matchesToPrint);
  const doc = new jsPDF();
  let firstPage = true;
  
  Object.entries(grouped).forEach(([court, matches]) => {
    const matchChunks = chunkArray(matches, 5);
    matchChunks.forEach((chunk) => {
      if (!firstPage) doc.addPage();
      firstPage = false;
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185); // blue
      doc.text('PBEL City Badminton 2025', 105, 18, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Court: ${court}`, 20, 28);
      doc.text('Score Sheet (30 Points)', 160, 28, { align: 'right' });
      doc.setLineWidth(0.5);
      doc.line(15, 32, 195, 32);
      
      let y = 40;
      chunk.forEach((match, idx) => {
        const [p1, p2] = getParticipantNamesForSheet(match, categories, pools, teams, players);
        const matchCategory = match.category_id
          ? categories.find(c => c.id === match.category_id)
          : categories.find(c => c.id === pools.find(p => p.id === match.pool_id)?.category_id);
        
        // Color map for category code
        const categoryColorMap: Record<string, { bg: [number, number, number], text: [number, number, number] }> = {
          'MT': { bg: [41, 128, 185], text: [255,255,255] }, // blue (Men's Team)
          'WS': { bg: [39, 174, 96], text: [255,255,255] }, // green (Women's Singles)
          'WD': { bg: [142, 68, 173], text: [255,255,255] }, // purple (Women's Doubles)
          'XD': { bg: [243, 156, 18], text: [255,255,255] }, // orange (Mixed Doubles)
          'BU18': { bg: [52, 152, 219], text: [255,255,255] }, // light blue (Boys U18)
          'BU13': { bg: [22, 160, 133], text: [255,255,255] }, // teal (Boys U13)
          'GU18': { bg: [231, 76, 60], text: [255,255,255] }, // red (Girls U18)
          'GU13': { bg: [241, 196, 15], text: [0,0,0] }, // yellow (Girls U13)
          'FM': { bg: [127, 140, 141], text: [255,255,255] }, // gray (Family Mixed)
          'default': { bg: [155, 89, 182], text: [255,255,255] } // fallback purple
        };
        const catCode = matchCategory?.code || 'default';
        const catColor = categoryColorMap[catCode] || categoryColorMap['default'];
        
        // Colored match label
        doc.setFillColor(...catColor.bg);
        doc.setTextColor(...catColor.text);
        doc.setFontSize(12);
        doc.rect(20, y-5, 40, 8, 'F');
        doc.text(`Match #${match.match_no || '-'}`, 22, y, { baseline: 'middle' });
        doc.setTextColor(0,0,0);
        doc.setFontSize(11);
        doc.text(`Date: ${formatISTDateTime(match.scheduled_date).date}`, 70, y);
        doc.text(`Time: ${formatISTDateTime(match.scheduled_date).time}`, 130, y);
        y += 8;
        
        // Player 1 row
        doc.setFontSize(10);
        doc.text(p1, 20, y+6);
        // Draw score boxes on the same row
        for (let i = 0; i < 30; i++) {
          doc.rect(70 + i*4, y, 4, 8);
          doc.setFontSize(7);
          doc.text(String(i+1), 72 + i*4 - (i+1 >= 10 ? 1 : 0), y+6);
        }
        y += 10;
        
        // Player 2 row
        doc.setFontSize(10);
        doc.text(p2, 20, y+6);
        for (let i = 0; i < 30; i++) {
          doc.rect(70 + i*4, y, 4, 8);
          doc.setFontSize(7);
          doc.text(String(i+1), 72 + i*4 - (i+1 >= 10 ? 1 : 0), y+6);
        }
        y += 14;
        
        // Add Referee Name and Signature fields
        doc.setFontSize(9);
        doc.text('Referee Name: ____________________', 20, y + 6);
        doc.text('Signature: ____________________', 120, y + 6);
        y += 14;
        
        if (idx < chunk.length - 1) {
          doc.setDrawColor(180);
          doc.line(20, y, 190, y);
          y += 6;
        }
      });
    });
  });
  
  doc.save('PBEL_Badminton_Score_Sheets.pdf');
};

export const generateMensTeamScoreSheet = (
  doc: jsPDF, 
  match: Match, 
  categories: Category[], 
  pools: Pool[], 
  teams: Team[], 
  players: Player[]
) => {
  const [team1, team2] = getParticipantNamesForSheet(match, categories, pools, teams, players);
  
  // Header for Men's Team match
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185); // blue
  doc.text('PBEL City Badminton 2025', 105, 18, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Match #${match.match_no || '-'} - Men's Team`, 20, 28);
  doc.text(`Date: ${formatISTDateTime(match.scheduled_date).date}`, 130, 28);
  doc.setLineWidth(0.5);
  doc.line(15, 32, 195, 32);
  
  // Teams section
  doc.setFontSize(12);
  doc.text(`${team1} vs ${team2}`, 105, 42, { align: 'center' });
  
  // Game types: D-S-D-S-D (Doubles-Singles-Doubles-Singles-Doubles)
  const gameTypes = [
    { name: '1st Doubles', type: 'D' },
    { name: '1st Singles', type: 'S' },
    { name: '2nd Doubles', type: 'D' },
    { name: '2nd Singles', type: 'S' },
    { name: '3rd Doubles', type: 'D' }
  ];
  
  let currentY = 50;
  
  gameTypes.forEach((game, gameIndex) => {
    // Game header
    doc.setFontSize(10);
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, currentY-3, 160, 6, 'F');
    doc.text(`Game ${gameIndex + 1}: ${game.name} (${game.type})`, 22, currentY, { baseline: 'middle' });
    doc.setTextColor(0, 0, 0);
    currentY += 8;
    
    // Standard 2-row format like other categories
    doc.setFontSize(9);
    doc.text('P1: _________________', 20, currentY);
    // Draw score boxes for P1
    for (let i = 0; i < 30; i++) {
      doc.rect(70 + i*4, currentY, 4, 6);
      doc.setFontSize(6);
      doc.text(String(i+1), 72 + i*4 - (i+1 >= 10 ? 1 : 0), currentY+4);
    }
    currentY += 8;
    
    // Second row for P2
    doc.setFontSize(9);
    doc.text('P2: _________________', 20, currentY);
    // Draw score boxes for P2
    for (let i = 0; i < 30; i++) {
      doc.rect(70 + i*4, currentY, 4, 6);
      doc.setFontSize(6);
      doc.text(String(i+1), 72 + i*4 - (i+1 >= 10 ? 1 : 0), currentY+4);
    }
    currentY += 8;
    
    // Game result
    doc.setFontSize(8);
    doc.text('Winner: Team 1 [ ]  Team 2 [ ]', 20, currentY);
    currentY += 6;
    
    // Separator line
    if (gameIndex < gameTypes.length - 1) {
      doc.setDrawColor(180);
      doc.line(20, currentY, 190, currentY);
      currentY += 4;
    }
  });
  
  // Match result section
  currentY += 3;
  doc.setFontSize(10);
  doc.setFillColor(39, 174, 96);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, currentY-3, 160, 6, 'F');
  doc.text('MATCH RESULT', 22, currentY, { baseline: 'middle' });
  doc.setTextColor(0, 0, 0);
  currentY += 8;
  
  doc.setFontSize(9);
  doc.text('Games Won - Team 1: ___  Team 2: ___', 20, currentY);
  currentY += 6;
  doc.text('Overall Winner: Team 1 [ ]  Team 2 [ ]', 20, currentY);
  currentY += 8;
  
  // Referee section
  doc.setFontSize(8);
  doc.text('Referee Name: ____________________', 20, currentY);
  doc.text('Signature: ____________________', 120, currentY);
  
  return currentY + 10; // Return the Y position for next match
};

export const generateMensTeamScoreSheets = (
  matches: Match[],
  categories: Category[],
  pools: Pool[],
  teams: Team[],
  players: Player[]
) => {
  // Filter only Men's team matches
  const mensTeamMatches = matches.filter(match => {
    const matchCategory = match.category_id
      ? categories.find(c => c.id === match.category_id)
      : categories.find(c => c.id === pools.find(p => p.id === match.pool_id)?.category_id);
    return matchCategory?.code === 'MT';
  });
  
  if (mensTeamMatches.length === 0) {
    throw new Error('No Men\'s team matches found');
  }
  
  const doc = new jsPDF();
  let currentY = 40;
  
  // Generate Men's team score sheets
  mensTeamMatches.forEach((match, idx) => {
    // Add new page only if not the first match and current page is full
    if (idx > 0 && currentY > 250) {
      doc.addPage();
      currentY = 40;
    }
    
    currentY = generateMensTeamScoreSheet(doc, match, categories, pools, teams, players);
    
    // Add new page only if there are more matches and current page is getting full
    if (idx < mensTeamMatches.length - 1 && currentY > 200) {
      doc.addPage();
      currentY = 40;
    }
  });
  
  doc.save('PBEL_Mens_Team_Score_Sheets.pdf');
  return mensTeamMatches.length;
}; 