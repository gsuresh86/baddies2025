import { Team } from '@/types';

export default function TeamsTab({ teams }: { teams: Team[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <div key={team.id} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{team.name}</h3>
          <div className="space-y-2">
            {team.players?.map((player, index) => (
              <div key={player.id} className="flex items-center text-sm">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
                  {index + 1}
                </span>
                <span className="text-gray-900">{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 