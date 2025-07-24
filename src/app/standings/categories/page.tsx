'use client';

import { useData } from '@/contexts/DataContext';
import { useEffect, useState } from 'react';
import { Match, Player, Team, Pool, Category } from '@/types';
import { useSearchParams, useRouter } from 'next/navigation';

const STAGES = [
  'Round 1',
  'R16',
  'QF',
  'SF',
  'F',
];

function getMatchDisplay(match: Match, players: Player[], teams: Team[], pools: Pool[], categories: Category[]) {
  // Determine if team or player based
  const pool = match.pool_id ? pools.find(p => p.id === match.pool_id) : undefined;
  const category = pool?.category || categories.find(c => c.id === match.category_id);
  const isCompleted = match.status === 'completed' || match.winner;
  if (category?.type === 'team') {
    const team1 = teams.find(t => t.id === match.team1_id);
    const team2 = teams.find(t => t.id === match.team2_id);
    const winnerId = match.winner === 'team1' ? team1?.id : match.winner === 'team2' ? team2?.id : undefined;
    return (
      <div key={match.id} className="bg-white/10 rounded-lg p-2 mb-4 flex flex-col items-center border border-white/20 min-w-[120px]">
        <div className={`font-semibold text-xs mb-1 ${isCompleted && winnerId === team1?.id ? 'text-yellow-300 font-extrabold' : 'text-white'}`}>{team1?.brand_name || team1?.name || 'TBD'}</div>
        <div className="text-white/80 text-xs mb-1">vs</div>
        <div className={`font-semibold text-xs mb-1 ${isCompleted && winnerId === team2?.id ? 'text-yellow-300 font-extrabold' : 'text-white'}`}>{team2?.brand_name || team2?.name || 'TBD'}</div>
        <div className="text-yellow-300 text-xs mt-1">
          {match.team1_score ?? '-'} : {match.team2_score ?? '-'}
        </div>
      </div>
    );
  } else {
    const player1 = players.find(p => p.id === match.player1_id);
    const player2 = players.find(p => p.id === match.player2_id);
    let winnerId: string | undefined = undefined;
    if (match.winner === 'player1') winnerId = player1?.id;
    else if (match.winner === 'player2') winnerId = player2?.id;
    return (
      <div key={match.id} className="bg-white/10 rounded-lg p-2 mb-4 flex flex-col items-center border border-white/20 min-w-[120px]">
        <div className={`font-semibold text-xs mb-1 ${isCompleted && winnerId === player1?.id ? 'text-yellow-300 font-extrabold' : 'text-white'}`}>{player1?.name || 'TBD'}</div>
        <div className="text-white/80 text-xs mb-1">vs</div>
        <div className={`font-semibold text-xs mb-1 ${isCompleted && winnerId === player2?.id ? 'text-yellow-300 font-extrabold' : 'text-white'}`}>{player2?.name || 'TBD'}</div>
        <div className="text-yellow-300 text-xs mt-1">
          {match.team1_score ?? '-'} : {match.team2_score ?? '-'}
        </div>
      </div>
    );
  }
}

export default function BracketCategoryPage() {
  const { matches: cachedMatches, players, teams, pools, categories } = useData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('category') || (categories.find(c => c.code === 'GU13')?.code || categories[0]?.code || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [matchesByStage, setMatchesByStage] = useState<Record<string, Match[]>>({});

  useEffect(() => {
    if (!selectedCategory) return;
    // Find selected category
    const cat = categories.find(c => c.code === selectedCategory);
    if (!cat) return;
    // Filter matches for selected category
    const catMatches = cachedMatches.filter(match => {
      if (match.pool_id) {
        const pool = pools.find(p => p.id === match.pool_id);
        if (!pool) return false;
        return pool.category?.code === selectedCategory;
      } else if (match.category_id) {
        const matchCat = categories.find(c => c.id === match.category_id);
        return matchCat?.code === selectedCategory;
      }
      return false;
    });
    // Group by stage
    const grouped: Record<string, Match[]> = {};
    for (const stage of STAGES) {
      grouped[stage] = catMatches.filter(m => m.stage === stage);
    }
    setMatchesByStage(grouped);
  }, [cachedMatches, pools, categories, selectedCategory]);

  // Update URL when category changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    const params = new URLSearchParams(window.location.search);
    params.set('category', e.target.value);
    router.replace(`?${params.toString()}`);
  };

  // Compute which stages have matches
  const visibleStages = STAGES.filter(stage => matchesByStage[stage] && matchesByStage[stage].length > 0);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Bracket</h1>
        <p className="text-white/80 mb-4">Tournament bracket by round (R1, R16, QF, SF, F)</p>
        <div className="flex justify-center mb-4">
          <label htmlFor="category-select" className="text-white/80 mr-2">Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
          >
            {categories.map(cat => (
              <option key={cat.code} value={cat.code} className="text-gray-800">
                {cat.label || cat.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Bracket columns: force horizontal scroll on mobile */}
      <div className="w-full overflow-x-auto pb-2">
        <div
          className="flex flex-nowrap gap-4"
          style={{ minWidth: `${visibleStages.length * 200}px` }} // Each column 200px min
        >
          {visibleStages.map(stage => (
            <div key={stage} className="min-w-[200px]">
              <div className="text-center text-white/80 font-semibold mb-4">{stage}</div>
              {matchesByStage[stage]?.length ? (
                matchesByStage[stage].map(match => getMatchDisplay(match, players, teams, pools, categories))
              ) : (
                <div className="text-center text-white/40 text-xs">No matches</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 