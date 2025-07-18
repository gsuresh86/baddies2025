import { Pool, Team, Category } from '@/types';
import { getSelectedCategoryType } from './spinWheelUtils';

interface AssignmentListProps {
  assignments: any[];
  teams: Team[];
  pools: Pool[];
  playersPerPool: number;
  categories: Category[];
  selectedCategory: string;
}

const AssignmentList = ({ assignments, teams, pools, playersPerPool, categories, selectedCategory }: AssignmentListProps) => {
  const isMensTeamCategory = getSelectedCategoryType(categories, selectedCategory) === 'team';

  if (assignments.length === 0) {
    return <p className="text-gray-500 py-4">No assignments yet. Start spinning!</p>;
  }

  if (isMensTeamCategory) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(team => {
          const teamAssignments = assignments.filter(a => a.team?.id === team.id);
          if (teamAssignments.length === 0) {
            return (
              <div key={team.id} className="bg-gray-50 rounded p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-700 text-sm">{team.brand_name || team.name}</h4>
                  <span className="text-xs text-gray-500">0 players</span>
                </div>
                <p className="text-gray-400 text-xs">No players assigned yet</p>
              </div>
            );
          }
          return (
            <div key={team.id} className="bg-gray-100 rounded p-3 border border-gray-300 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-900 text-sm">{team.brand_name || team.name}</h4>
                <span className="text-xs text-gray-700 font-medium">
                  {teamAssignments.length} players
                </span>
              </div>
              <div className="space-y-1">
                {teamAssignments.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded p-2 border border-gray-200 w-full">
                    <span className="text-gray-900 font-medium text-xs truncate max-w-[70%] block overflow-ellipsis whitespace-nowrap">{assignment.player.name}</span>
                    <span className="text-xs text-gray-500 text-right min-w-20">{assignment.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // For pool assignments
  const isPairCategory = getSelectedCategoryType(categories, selectedCategory) === 'pair';
  const participantLabel = isPairCategory ? 'pairs' : 'players';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pools.map(pool => {
        const poolAssignments = assignments.filter(a => a.pool?.id === pool.id);
        if (poolAssignments.length === 0) {
          return (
            <div key={pool.id} className="bg-gray-50 rounded p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-gray-700 text-sm">{pool.name}</h4>
                <span className="text-xs text-gray-500">0/{playersPerPool} {participantLabel}</span>
              </div>
              <p className="text-gray-400 text-xs">No {participantLabel} assigned yet</p>
            </div>
          );
        }
        return (
          <div key={pool.id} className="bg-gray-100 rounded p-3 border border-gray-300 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900 text-sm">{pool.name}</h4>
              <span className="text-xs text-gray-700 font-medium">
                {poolAssignments.length}/{playersPerPool} {participantLabel}
              </span>
            </div>
            <div className="space-y-1">
              {poolAssignments.map((assignment, index) => {
                const displayName = isPairCategory && assignment.player.partner_name 
                  ? `${assignment.player.name} / ${assignment.player.partner_name}`
                  : assignment.player.name;
                return (
                  <div key={index} className="flex items-center justify-between bg-white rounded p-2 border border-gray-200 w-full">
                    <span className="text-gray-900 font-medium text-xs truncate max-w-[70%] block overflow-ellipsis whitespace-nowrap">{displayName}</span>
                    <span className="text-xs text-gray-500 text-right min-w-20">{assignment.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Show unassigned players if any */}
      {(() => {
        const unassignedPlayers = assignments.filter(a => !a.pool);
        if (unassignedPlayers.length === 0) return null;
        return (
          <div className="bg-red-50 rounded p-3 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-red-800 text-sm">Unassigned {participantLabel}</h4>
              <span className="text-xs text-red-600 font-medium">
                {unassignedPlayers.length} {participantLabel}
              </span>
            </div>
            <div className="space-y-1">
              {unassignedPlayers.map((assignment, index) => {
                const displayName = isPairCategory && assignment.player.partner_name 
                  ? `${assignment.player.name} / ${assignment.player.partner_name}`
                  : assignment.player.name;
                return (
                  <div key={index} className="flex items-center justify-between bg-white rounded p-2 border border-red-100">
                    <div className="flex items-center">
                      <span className="text-red-700 font-medium text-xs">{displayName}</span>
                    </div>
                    <span className="text-xs text-gray-500">{assignment.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AssignmentList; 