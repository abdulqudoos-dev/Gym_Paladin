'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [dateRange, setDateRange] = useState('30d');

  // Real data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subsStats, setSubsStats] = useState<any>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [workoutsTotal, setWorkoutsTotal] = useState<number>(0);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const headers = { 'Authorization': `Bearer ${token}` } as any;

        const [subsRes, weeklyRes, monthlyRes, lbRes, workoutsRes, sessionsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/stats`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/weekly-progress`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/monthly-progress`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/leaderboard?type=totalXP&limit=10`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/recent-sessions?limit=200`, { headers })
        ]);

        if (!subsRes.ok) throw new Error('Failed to load subscription stats');

        const subsJson = await subsRes.json();
        setSubsStats(subsJson?.stats || null);

        if (weeklyRes.ok) {
          const wj = await weeklyRes.json();
          setWeeklyProgress(Array.isArray(wj.weeklyProgress) ? wj.weeklyProgress : []);
        }

        if (monthlyRes.ok) {
          const mj = await monthlyRes.json();
          setMonthlyProgress(Array.isArray(mj.monthlyProgress) ? mj.monthlyProgress : []);
        }

        if (lbRes.ok) {
          const lbj = await lbRes.json();
          setLeaderboard(Array.isArray(lbj.leaderboard) ? lbj.leaderboard : []);
        }

        if (workoutsRes.ok) {
          const w = await workoutsRes.json();
          setWorkoutsTotal(Array.isArray(w.workouts) ? w.workouts.length : 0);
        }

        if (sessionsRes.ok) {
          const sj = await sessionsRes.json();
          setRecentSessions(Array.isArray(sj.sessions) ? sj.sessions : []);
        }
      } catch (e: any) {
        setError(e.message || 'Error loading reports');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Analytics <span className="text-red-500">& Reports</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Comprehensive insights into your platform performance
          </p>
        </div>
        <div className="flex space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              try {
                const now = new Date();
                const filename = `${selectedReport}-report-${now.toISOString().split('T')[0]}.csv`;
                let csvLines: string[] = [];

                if (selectedReport === 'revenue' && subsStats) {
                  csvLines.push('Metric,Value');
                  csvLines.push(`totalRevenue,${subsStats.totalRevenue || 0}`);
                  csvLines.push(`total,${subsStats.total || 0}`);
                  csvLines.push(`active,${subsStats.active || 0}`);
                  csvLines.push(`cancelled,${subsStats.cancelled || 0}`);
                  csvLines.push('');
                  csvLines.push('Plan,Count');
                  (subsStats.byPlan || []).forEach((p: any) => csvLines.push(`${p._id || 'Unknown'},${p.count || 0}`));
                } else if (selectedReport === 'engagement') {
                  const source = weeklyProgress.length ? weeklyProgress : recentSessions.map(s => ({ week: (s.completedAt || '').slice(0,10), workouts: 1 }));
                  const map: Record<string, number> = {};
                  source.forEach((w: any) => { const k = w.week || w.completedAt?.slice(0,10); if (!k) return; map[k] = (map[k]||0) + (w.workouts || 1); });
                  csvLines.push('Week,Workouts');
                  Object.entries(map).forEach(([week, workouts]) => csvLines.push(`${week},${workouts}`));
                  csvLines.push('');
                  csvLines.push('Top Users (by XP)');
                  csvLines.push('Name,Level,TotalXP');
                  leaderboard.forEach((u: any) => csvLines.push(`${(u.userId?.name || '').replace(/,/g,'')},${u.level || 0},${u.totalXP || 0}`));
                } else if (selectedReport === 'subscriptions' && subsStats) {
                  csvLines.push('Metric,Value');
                  csvLines.push(`total,${subsStats.total || 0}`);
                  csvLines.push(`active,${subsStats.active || 0}`);
                  csvLines.push(`cancelled,${subsStats.cancelled || 0}`);
                  csvLines.push('');
                  csvLines.push('Plan,Count,Revenue');
                  (subsStats.byPlan || []).forEach((p: any) => csvLines.push(`${p._id},${p.count || 0},${p.totalRevenue || 0}`));
                } else if (selectedReport === 'workouts') {
                  csvLines.push('KPI,Value');
                  csvLines.push(`TotalWorkouts,${workoutsTotal}`);
                  const avg = weeklyProgress.length ? Math.round(weeklyProgress.reduce((a, w) => a + (w.duration || 0), 0) / weeklyProgress.length) : 0;
                  csvLines.push(`AvgWeeklyDuration(min),${avg}`);
                  csvLines.push(`RecentSessions,${recentSessions.length}`);
                  csvLines.push('');
                  csvLines.push('Recent Sessions');
                  csvLines.push('CompletedAt,ProgramId,DurationSec,Calories');
                  recentSessions.forEach((s: any) => csvLines.push(`${s.completedAt || ''},${s.programId?._id || ''},${s.totalDuration || 0},${s.caloriesBurned || 0}`));
                }

                if (csvLines.length === 0) { csvLines.push('note'); csvLines.push('no_data'); }
                const csv = csvLines.join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename; a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error('Export error', e);
              }
            }}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-2 rounded-xl transition-all duration-300"
          >
            Export Report
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try {
                // Build a consolidated JSON workbook-like structure
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } as any : {};
                let users: any[] = [];
                try {
                  const usersRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`, { headers });
                  if (usersRes.ok) {
                    const uj = await usersRes.json();
                    users = uj.users || uj || [];
                  }
                } catch {}
                const payload = {
                  generatedAt: new Date().toISOString(),
                  revenue: subsStats || {},
                  engagement: {
                    weeklyProgress,
                    derivedFromSessions: weeklyProgress.length === 0,
                    leaderboard
                  },
                  subscriptions: subsStats || {},
                  workouts: {
                    totalWorkouts: workoutsTotal,
                    recentSessions
                  },
                  users
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'full-report.json'; a.click();
                URL.revokeObjectURL(url);
              } catch (e) { console.error('Full report export failed', e); }
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-6 py-2 rounded-xl transition-all duration-300"
          >
            Export Full Report
          </motion.button>
        </div>
      </motion.div>

      {/* Report Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700"
      >
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'revenue', label: 'Revenue Report', icon: 'revenue' },
            { id: 'engagement', label: 'User Engagement', icon: 'engagement' },
            { id: 'subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
            // { id: 'workouts', label: 'Workout Analytics', icon: 'workouts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                selectedReport === tab.id
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.icon === 'revenue' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              )}
              {tab.icon === 'engagement' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
              {tab.icon === 'subscriptions' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
              {tab.icon === 'workouts' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Revenue Report (uses subscriptions/stats totals) */}
        {selectedReport === 'revenue' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Totals from DB */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Total Revenue</h3>
                  <p className="text-3xl font-bold text-white">${(subsStats?.totalRevenue || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Active Subscriptions</h3>
                  <p className="text-3xl font-bold text-white">{(subsStats?.active || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🧾</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Cancelled Subscriptions</h3>
                  <p className="text-3xl font-bold text-white">{(subsStats?.cancelled || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* End of revenue metrics */}
          </motion.div>
        )}

        {/* Engagement Report (weekly progress) */}
        {selectedReport === 'engagement' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Weekly Workouts & Duration (from DB). If empty, derive from recentSessions (last 7 days) */}
            <div className="bg-gray-700/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Weekly Workouts</h3>
              <div className="h-64 flex items-end justify-between space-x-4">
                {(weeklyProgress.length ? weeklyProgress : (() => {
                  const now = new Date();
                  const byDay: Record<string, number> = {};
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    byDay[key] = 0;
                  }
                  recentSessions.forEach((s: any) => {
                    if (!s.completedAt) return;
                    const key = new Date(s.completedAt).toISOString().slice(0,10);
                    if (byDay[key] !== undefined) byDay[key] += 1;
                  });
                  return Object.entries(byDay).map(([day, workouts]) => ({ week: day, workouts }));
                })()).map((w: any, index: number) => (
                  <div key={w.week || index} className="flex flex-col items-center space-y-2">
                    <div className="flex flex-col space-y-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(100, (w.workouts || 0) * 10)}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg w-6"
                        style={{ minHeight: '20px' }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs">{w.week || ''}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Users from leaderboard */}
            <div className="bg-gray-700/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Top Users (by XP)</h3>
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.userId?._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-600/30 rounded-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                        {(entry.userId?.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{entry.userId?.name || 'Unknown User'}</p>
                        <p className="text-gray-400 text-sm">Level {entry.level} • XP {entry.totalXP?.toLocaleString?.() || 0}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Subscriptions Report (from subscriptions/stats) */}
        {selectedReport === 'subscriptions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Subscription Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-700/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Subscription Distribution</h3>
                <div className="space-y-4">
                  {(subsStats?.byPlan || []).map((p: any, index: number) => {
                    const users = p.count || 0;
                    const total = subsStats?.total || 1;
                    const percentage = Math.round((users / total) * 100);
                    const color = ['from-green-500 to-green-600','from-blue-500 to-blue-600','from-purple-500 to-purple-600','from-yellow-500 to-yellow-600'][index % 4];
                    return (
                    <motion.div
                      key={p._id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 bg-gradient-to-r ${color} rounded-full`}></div>
                        <span className="text-gray-300 font-medium">{p._id || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-bold">{users}</span>
                        <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className={`h-full bg-gradient-to-r ${color}`}
                          />
                        </div>
                        <span className="text-gray-400 text-sm w-8">{percentage}%</span>
                      </div>
                    </motion.div>
                  );})}
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Subscription Trends</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                    <span className="text-gray-300">Total Subscriptions</span>
                    <span className="text-white font-bold">{(subsStats?.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                    <span className="text-gray-300">Active</span>
                    <span className="text-green-400 font-bold">{(subsStats?.active || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                    <span className="text-gray-300">Cancelled</span>
                    <span className="text-red-400 font-bold">{(subsStats?.cancelled || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Workout Analytics (from workouts + recent sessions + monthly progress) */}
        {selectedReport === 'workouts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🏋️</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Total Workouts</h3>
                  <p className="text-3xl font-bold text-white">{workoutsTotal.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⏱️</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Avg. Weekly Duration</h3>
                  <p className="text-3xl font-bold text-white">{(() => {
                    if (!weeklyProgress.length) return '0m';
                    const avg = Math.round(weeklyProgress.reduce((a, w) => a + (w.duration || 0), 0) / weeklyProgress.length);
                    return `${avg}m`;
                  })()}</p>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1">Sessions (Last 30d)</h3>
                  <p className="text-3xl font-bold text-white">{recentSessions.length.toLocaleString()}</p>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </motion.div>
    </div>
  );
}





