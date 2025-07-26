import React from "react";

interface RefereeOption {
  id: string;
  name: string;
}
interface StatusOption {
  value: string;
  label: string;
}

interface CompleteConfirmationProps {
  team1: string;
  team2: string;
  team1_score: number;
  team2_score: number;
  winnerName: string;
  refereeOptions: RefereeOption[];
  statusOptions: StatusOption[];
  selectedReferee: string;
  setSelectedReferee: (ref: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const CompleteConfirmation: React.FC<CompleteConfirmationProps> = ({
  team1,
  team2,
  team1_score,
  team2_score,
  winnerName,
  refereeOptions,
  statusOptions,
  selectedReferee,
  setSelectedReferee,
  selectedStatus,
  setSelectedStatus,
  loading,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-auto p-6 z-50">
      <h2 className="text-xl font-bold mb-3 text-gray-900">Confirm Match Completion</h2>
      <div className="mb-4">
        <div className="mb-1 text-gray-600 font-medium">Final Score:</div>
        <div className="font-extrabold text-3xl mb-2 text-blue-700">
          {team1} <span className="text-black">{team1_score}</span>
          <span className="mx-2 text-gray-500">-</span>
          <span className="text-black">{team2_score}</span> {team2}
        </div>
        <div className="mb-2 text-gray-700 font-semibold">Winner: <span className="text-green-600 font-bold">{winnerName}</span></div>
        
        {/* Enhanced score display */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Score Details:</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{team1}</div>
              <div className="text-2xl font-extrabold text-blue-800">{team1_score}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{team2}</div>
              <div className="text-2xl font-extrabold text-green-800">{team2_score}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold text-gray-700">Referee</label>
        <select
          className="w-full border border-gray-300 rounded px-2 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedReferee}
          onChange={e => setSelectedReferee(e.target.value)}
        >
          <option value="">Select referee</option>
          {refereeOptions.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold text-gray-700">Status</label>
        <select
          className="w-full border border-gray-300 rounded px-2 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
          onClick={onCancel}
          disabled={loading}
        >Cancel</button>
        <button
          onClick={onConfirm}
          disabled={loading || !selectedReferee}
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 shadow"
        >{loading ? 'Completing...' : 'Confirm'}</button>
      </div>
    </div>
  );
};

export default CompleteConfirmation; 