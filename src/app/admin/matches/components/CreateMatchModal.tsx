'use client';

import { useState, useMemo } from 'react';
import { Pool, Team, Player } from '@/types';

interface CreateMatchModalProps {
  isOpen: boolean;
  pools: Pool[];
  teams: Team[];
  players: Player[];
  poolPlayers: any[];
  onClose: () => void;
  onCreate: (matchData: any) => void;
}

export default function CreateMatchModal({
  isOpen,
  pools,
  teams,
  players,
  poolPlayers,
  onClose,
  onCreate
}: CreateMatchModalProps) {
  const [selectedPool, setSelectedPool] = useState('');
  const [participant1, setParticipant1] = useState('');
  const [participant2, setParticipant2] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [court, setCourt] = useState('');

  const participantsInPool = useMemo(() => {
    if (!selectedPool) return [];
    
    const pool = pools.find(p => p.id === selectedPool);
    if (!pool) return [];
    
    const isTeamCategory = pool.category?.type === 'team';
    
    if (isTeamCategory) {
      return teams.filter(team => team.pool_id === selectedPool);
    } else {
      const poolPlayerIds = poolPlayers
        .filter(pp => pp.pool_id === selectedPool)
        .map(pp => pp.player_id);
      
      return players.filter(player => poolPlayerIds.includes(player.id));
    }
  }, [selectedPool, pools, teams, poolPlayers, players]);

  const selectedPoolObj = useMemo(() => {
    return pools.find(p => p.id === selectedPool);
  }, [selectedPool, pools]);

  const isTeamCategory = selectedPoolObj?.category?.type === 'team';

  const getParticipantDisplayName = (participant: any) => {
    if (isTeamCategory) {
      return participant.name;
    } else {
      if (participant.partner_name) {
        return `${participant.name} / ${participant.partner_name}`;
      }
      return participant.name;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant1 || !participant2 || !selectedPool) return;

    const matchData = {
      pool_id: selectedPool,
      scheduled_date: date ? `${date}T${time || '00:00'}:00` : undefined,
      court: court || undefined,
      status: 'scheduled' as const,
      [isTeamCategory ? 'team1_id' : 'player1_id']: participant1,
      [isTeamCategory ? 'team2_id' : 'player2_id']: participant2,
    };

    onCreate(matchData);
    
    // Reset form
    setSelectedPool('');
    setParticipant1('');
    setParticipant2('');
    setDate('');
    setTime('');
    setCourt('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Create New Match</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pool
            </label>
            <select
              value={selectedPool}
              onChange={(e) => setSelectedPool(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Pool</option>
              {pools.map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isTeamCategory ? 'Team 1' : 'Player/Pair 1'}
            </label>
            <select
              value={participant1}
              onChange={(e) => setParticipant1(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select {isTeamCategory ? 'Team' : 'Player'}</option>
              {participantsInPool.map(participant => (
                <option key={participant.id} value={participant.id}>
                  {getParticipantDisplayName(participant)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isTeamCategory ? 'Team 2' : 'Player/Pair 2'}
            </label>
            <select
              value={participant2}
              onChange={(e) => setParticipant2(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select {isTeamCategory ? 'Team' : 'Player'}</option>
              {participantsInPool
                .filter(p => p.id !== participant1)
                .map(participant => (
                  <option key={participant.id} value={participant.id}>
                    {getParticipantDisplayName(participant)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date (optional)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time (optional)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court (optional)
            </label>
            <input
              type="text"
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Court number or name"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Create Match
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}