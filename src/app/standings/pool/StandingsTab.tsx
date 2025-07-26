import { TournamentStandings, Team } from '@/types';
import React from 'react';

const statColor = {
  matchesPlayed: 'text-white',
  matchesWon: 'text-green-400 font-bold',
  matchesLost: 'text-red-400 font-bold',
  gamesWon: 'text-purple-400 font-bold',
  gamesLost: 'text-orange-400 font-bold',
  points: 'text-yellow-300 font-extrabold',
};

interface StandingsTabProps {
  standings: TournamentStandings[];
  teams?: Team[];
  isMensTeam?: boolean;
  expandedTeams?: Set<string>;
  onToggleTeamExpansion?: (teamId: string) => void;
  categoryCode?: string;
  qualifiedPlayerIds?: Set<string>;
  poolName?: string;
}

export default function StandingsTab({ 
  standings, 
  teams = [], 
  isMensTeam = false, 
  expandedTeams = new Set(), 
  onToggleTeamExpansion,
  categoryCode,
  qualifiedPlayerIds,
  poolName
}: StandingsTabProps) {
  const [pdPopoverTeamId, setPdPopoverTeamId] = React.useState<string | null>(null);
  // Dynamically set stat labels based on category
  const mensTeamStatLabels = [
    { key: 'matchesPlayed', label: 'MP' },
    { key: 'matchesWon', label: 'W' },
    { key: 'matchesLost', label: 'L' },
    { key: 'points', label: 'PTS' },
    { key: 'gamesWon', label: 'GW' },
    { key: 'gamesLost', label: 'GL' },
    { key: 'gameDiff', label: 'GD', desktopOnly: true },
    // On mobile, only show PD; on desktop, show PW, PL, PD
    { key: 'pointsWon', label: 'PW', desktopOnly: true },
    { key: 'pointsLost', label: 'PL', desktopOnly: true },
    { key: 'pointDiff', label: 'PD' },
  ];
  const defaultStatLabels = [
    { key: 'matchesPlayed', label: 'MP' },
    { key: 'matchesWon', label: 'W' },
    { key: 'matchesLost', label: 'L' },
    { key: 'points', label: 'PTS' },
    { key: 'gamesWon', label: 'PW' },
    { key: 'gamesLost', label: 'PL' },
    { key: 'gameDiff', label: 'PD' }
  ];
  const dynamicStatLabels = isMensTeam ? mensTeamStatLabels : defaultStatLabels;
  function isQualifiedByDefault(categoryCode: string | undefined, poolName: string | undefined, idx: number) {
    // Qualification logic based on category and pool
    if (
      (categoryCode === 'BU18' && (idx === 0 || idx === 1)) ||
      (categoryCode === 'GU13' && (idx === 0 || idx === 1)) ||
      (categoryCode === 'WD' && (idx === 0 || idx === 1)) ||
      (categoryCode === 'WS' && (idx === 0 || idx === 1) && ['WS - Group A', 'WS - Group B', 'WS - Group C'].includes(poolName || '')) ||
      (categoryCode === 'FM' && (idx === 0 || idx === 1) && poolName !== 'FM - Group C') ||
      (categoryCode === 'MT' && (idx === 0 || idx === 1) && ['MT - Group A', 'MT - Group B'].includes(poolName || ''))
    ) {
      return true;
    }
    return false;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs sm:text-sm min-w-max">
        <thead>
          <tr className="bg-gradient-to-r from-white/20 to-white/10 border-b border-white/20">
            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-bold text-white uppercase tracking-wider w-24 sm:w-32">Team</th>
            {dynamicStatLabels.map(stat => (
              <th
                key={stat.key}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-white uppercase tracking-wider${(stat as any).desktopOnly ? ' hidden sm:table-cell' : ''}`}
              >
                {stat.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {standings.length === 0 ? (
            <tr>
              <td colSpan={dynamicStatLabels.length + 2} className="text-center py-8 text-white/80 text-base">
                <div className="text-3xl mb-2">📊</div>
                No standings available yet. Matches need to be completed to show rankings.
              </td>
            </tr>
          ) : (
            standings.map((standing, idx) => {
              const team = teams.find(t => t.id === standing.teamId);
              const isExpanded = expandedTeams.has(standing.teamId);
              const hasPlayers = team?.players && team.players.length > 0;
              const isQualified = qualifiedPlayerIds
                ? qualifiedPlayerIds.has(standing.teamId)
                : isQualifiedByDefault(categoryCode, poolName, idx)

              return (
                <React.Fragment key={standing.teamId}>
                  <tr
                    key={standing.teamId}
                    className="transition-all duration-200 hover:bg-white/10"
                  >
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-white font-semibold w-24 sm:w-32">
                      <div className="flex items-center gap-2">
                        {isQualified && (
                          <span title="Qualified" className="mr-1 font-bold" style={{ color: '#FFD700' }}>Q</span>
                        )}
                        <span className={isMensTeam ? "text-cyan-300 font-bold" : undefined}>
                          {isMensTeam ? (team?.brand_name || team?.name || standing.teamName) : standing.teamName}
                        </span>
                        {isMensTeam && hasPlayers && onToggleTeamExpansion && (
                          <button
                            onClick={() => onToggleTeamExpansion(standing.teamId)}
                            className="text-white/70 hover:text-white transition-colors"
                            title={isExpanded ? "Hide players" : "Show players"}
                          >
                            {isExpanded ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    {dynamicStatLabels.map(stat => {
                      // For men's team, show only PD on mobile, and PW/PL/PD on desktop
                      if ((stat as any).desktopOnly) {
                        return (
                          <td
                            key={stat.key}
                            className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center${(stat as any).desktopOnly ? ' hidden sm:table-cell' : ''} ${statColor[stat.key as keyof typeof statColor] || 'text-white'}`}
                          >
                            {(standing as any)[stat.key]}
                          </td>
                        );
                      }
                      if (isMensTeam && stat.key === 'pointDiff') {
                        return (
                          <td
                            key={stat.key}
                            className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center text-cyan-300 font-bold relative`}
                          >
                            {/* On mobile, show PD as button; on desktop, just show value */}
                            <span className="sm:hidden">
                              <button
                                className="underline underline-offset-2 cursor-pointer focus:outline-none"
                                onClick={() => setPdPopoverTeamId(pdPopoverTeamId === standing.teamId ? null : standing.teamId)}
                              >
                                {(standing as any).pointDiff}
                              </button>
                            </span>
                            <span className="hidden sm:inline">{(standing as any).pointDiff}</span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={stat.key}
                          className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center ${statColor[stat.key as keyof typeof statColor] || 'text-white'}`}
                        >
                          {standing[stat.key as keyof TournamentStandings]}
                        </td>
                      );
                    })}
                  </tr>
                  {/* PW/PL row for mobile, shown when PD is clicked */}
                  {isMensTeam && pdPopoverTeamId === standing.teamId && (
                    <tr className="sm:hidden bg-cyan-950/80">
                      <td colSpan={dynamicStatLabels.length + 1} className="px-2 py-2 text-center text-cyan-200">
                        <div className="flex justify-center gap-6">
                          <div>PW: <span className="font-bold">{(standing as any).pointsWon}</span></div>
                          <div>PL: <span className="font-bold">{(standing as any).pointsLost}</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* Players list row */}
                  {isMensTeam && isExpanded && hasPlayers && (
                    <tr key={`${standing.teamId}-players`} className="bg-white/5">
                      <td colSpan={dynamicStatLabels.length + 2} className="px-2 sm:px-4 py-3">
                        <div className="ml-4">
                          <div className="flex flex-wrap gap-2">
                            {team.players?.map((player) => (
                              <span key={player.id} className="text-white text-xs bg-white/10 px-2 py-1 rounded">
                                {player.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
      {/* Only show popover click-catcher on mobile */}
      {isMensTeam && pdPopoverTeamId && (
        <div
          className="fixed inset-0 z-10 sm:hidden"
          onClick={() => setPdPopoverTeamId(null)}
          style={{ cursor: 'default' }}
        />
      )}
    </div>
  );
} 