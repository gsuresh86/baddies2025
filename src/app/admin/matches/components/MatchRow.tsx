'use client';

import { useState } from 'react';
import { Match, Category } from '@/types';
import { supabase } from '@/lib/store';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';

interface MatchRowProps {
  match: Match;
  onScoreUpdate: (match: Match) => void;
  onRefresh: () => void;
  getCategoryForMatch: (match: Match) => Category | undefined;
  isMobile?: boolean;
}

export default function MatchRow({ match, onScoreUpdate, onRefresh, getCategoryForMatch, isMobile }: MatchRowProps) {
  const { showSuccess, showError } = useToast();
  const { players, teams } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCourt, setEditCourt] = useState('');

  const formatISTDateTime = (dateString: string | undefined | null) => {
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

  const getISTTimeFromStored = (storedDateString: string | undefined | null) => {
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
    } catch {
      return { date: '', time: '' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getParticipantName = (match: Match, side: 'team1' | 'team2') => {
    const matchCategory = getCategoryForMatch(match);
    const matchType = matchCategory?.type;
    
    if (matchType === 'team') {
      if (side === 'team1') {
        if (match.team1) return match.team1.name;
        const team = teams.find(t => t.id === match.team1_id);
        return team?.name || 'TBD';
      } else {
        if (match.team2) return match.team2.name;
        const team = teams.find(t => t.id === match.team2_id);
        return team?.name || 'TBD';
      }
    } else if (matchType === 'player') {
      if (side === 'team1') {
        if (match.player1) return match.player1.name;
        const player = players.find(p => p.id === (match as any).player1_id);
        return player?.name || 'TBD';
      } else {
        if (match.player2) return match.player2.name;
        const player = players.find(p => p.id === (match as any).player2_id);
        return player?.name || 'TBD';
      }
    } else if (matchType === 'pair') {
      if (side === 'team1') {
        if (match.player1) {
          return match.player1.partner_name 
            ? `${match.player1.name} / ${match.player1.partner_name}`
            : match.player1.name;
        }
        const player = players.find(p => p.id === (match as any).player1_id);
        if (player) {
          return player.partner_name 
            ? `${player.name} / ${player.partner_name}`
            : player.name;
        }
        return 'TBD';
      } else {
        if (match.player2) {
          return match.player2.partner_name 
            ? `${match.player2.name} / ${match.player2.partner_name}`
            : match.player2.name;
        }
        const player = players.find(p => p.id === (match as any).player2_id);
        if (player) {
          return player.partner_name 
            ? `${player.name} / ${player.partner_name}`
            : player.name;
        }
        return 'TBD';
      }
    }
    return 'TBD';
  };

  const startEdit = () => {
    setIsEditing(true);
    const { date, time } = getISTTimeFromStored(match.scheduled_date);
    setEditDate(date);
    setEditTime(time);
    setEditCourt(match.court || '');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditDate('');
    setEditTime('');
    setEditCourt('');
  };

  const saveEdit = async () => {
    try {
      let scheduledDate = null;
      if (editDate && editTime) {
        scheduledDate = `${editDate}T${editTime}:00+05:30`;
      }
      
      const updated = {
        scheduled_date: scheduledDate,
        court: editCourt || null,
      };
      
      const { error } = await supabase
        .from('matches')
        .update(updated)
        .eq('id', match.id);
        
      if (error) throw error;
      
      showSuccess('Match updated');
      setIsEditing(false);
      onRefresh();
    } catch {
      showError('Error updating match');
    }
  };

  const { date, time } = formatISTDateTime(match.scheduled_date);

  if (isMobile) {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Match #</span>
          <span>{match.match_no || '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Pool</span>
          <span>{match.pool?.name || 'Unknown Pool'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Players</span>
          <span>{getParticipantName(match, 'team1')} <span className="text-gray-500">vs</span> {getParticipantName(match, 'team2')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Score</span>
          <span>{match.team1_score || 0} - {match.team2_score || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Status</span>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(match.status || 'scheduled')}`}>{match.status || 'Scheduled'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Date</span>
          <span>{date}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Time</span>
          <span>{time}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Court</span>
          <span>{match.court || '-'}</span>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={startEdit}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
          <button
            onClick={() => onScoreUpdate(match)}
            className="text-green-600 hover:text-green-900"
          >
            Score
          </button>
        </div>
      </div>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {match.match_no || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {match.pool?.name || 'Unknown Pool'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {getParticipantName(match, 'team1')} <span className="text-gray-500">vs</span> {getParticipantName(match, 'team2')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {match.team1_score || 0} - {match.team2_score || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(match.status || 'scheduled')}`}>
          {match.status || 'Scheduled'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {isEditing ? (
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full p-1 border border-gray-300 rounded text-xs"
          />
        ) : (
          date
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {isEditing ? (
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="w-full p-1 border border-gray-300 rounded text-xs"
          />
        ) : (
          time
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {isEditing ? (
          <input
            type="text"
            value={editCourt}
            onChange={(e) => setEditCourt(e.target.value)}
            className="w-full p-1 border border-gray-300 rounded text-xs"
            placeholder="Court"
          />
        ) : (
          match.court || '-'
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="text-green-600 hover:text-green-900"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={startEdit}
              className="text-blue-600 hover:text-blue-900"
            >
              Edit
            </button>
            <button
              onClick={() => onScoreUpdate(match)}
              className="text-green-600 hover:text-green-900"
            >
              Score
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}