import { useEffect, useState } from 'react';
import { supabase } from '@/lib/store';

interface ActivityLog {
  id: string;
  match_id?: string;
  game_id?: string;
  activity_type: string;
  description: string;
  performed_by_user_id: string;
  created_at: string;
  metadata?: any;
  user?: { email?: string };
}

export default function ActivityLogSection() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, user:performed_by_user_id ( email )')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) setLogs(data || []);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 mt-8">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Recent Activity</h3>
      {loading ? (
        <div>Loading activity...</div>
      ) : logs.length === 0 ? (
        <div className="text-gray-500">No recent activity.</div>
      ) : (
        <ul className="divide-y">
          {logs.map((log) => (
            <li key={log.id} className="py-2">
              <div className="text-sm text-gray-700 font-semibold">{log.activity_type.replace(/_/g, ' ')}</div>
              <div className="text-gray-900">{log.description}</div>
              <div className="text-xs text-gray-500">
                By {log.user?.email || log.performed_by_user_id} on {new Date(log.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 