import { Player, Pool, Team } from '@/types';

function ResultDialog({ 
  isOpen, 
  onClose, 
  winner, 
  assignedPool,
  assignedTeam,
  categoryType
}: { 
  isOpen: boolean;
  onClose: () => void;
  winner: Player | null;
  assignedPool: Pool | null;
  assignedTeam?: Team | null;
  categoryType: 'team' | 'player' | 'pair';
}) {
  if (!isOpen || !winner) return null;

  // Display name based on category type
  const getDisplayName = () => {
    if (categoryType === 'pair' && winner.partner_name) {
      return `${winner.name} / ${winner.partner_name}`;
    }
    return winner.name;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Congratulations!</h2>
          <div className="text-xl font-semibold text-gray-800 mb-4">
            {getDisplayName()}
          </div>
          
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6 border border-purple-200">
            <div className="text-lg font-bold text-purple-700 mb-2">
              {categoryType === 'pair' ? '🏸 Pair Assigned to Pool' : categoryType === 'team' ? '👥 Player Assigned to Team' : '🏸 Assigned to Pool'}
            </div>
            {categoryType === 'team' ? (
              assignedTeam ? (
                <div className="text-xl font-bold text-purple-800">{assignedTeam.name}</div>
              ) : (
                <div className="text-lg text-red-600 font-semibold">No available teams</div>
              )
            ) : assignedPool ? (
              <div className="text-xl font-bold text-purple-800">{assignedPool.name}</div>
            ) : (
              <div className="text-lg text-red-600 font-semibold">No available pools</div>
            )}
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
            >
              Continue Spinning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultDialog; 