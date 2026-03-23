import { useEffect } from 'react';
import { Users, Video, Activity, Server, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchAdminStats, fetchAdminAnalytics } from '@/store/slices/adminSlice';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminOverview() {
  const dispatch = useAppDispatch();
  const { stats, analytics, isLoading } = useAppSelector(s => s.admin);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAdminAnalytics());
  }, [dispatch]);

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-meet-info' },
    { label: 'Active Meetings', value: stats?.activeMeetings ?? '—', icon: Video, color: 'text-meet-success' },
    { label: 'Total Meetings', value: stats?.totalMeetings ?? '—', icon: Activity, color: 'text-primary' },
    { label: 'Total Messages', value: stats?.totalMessages ?? '—', icon: Server, color: 'text-meet-warning' },
  ];

  const formatUptime = (s?: number) => {
    if (!s) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-foreground">Admin Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? '—' : c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{analytics?.meetingsLast30Days ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Meetings (30 days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{analytics?.newUsersLast30Days ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">New Users (30 days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{analytics?.avgParticipantsPerMeeting?.toFixed(1) ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Participants/Meeting</p>
          </CardContent>
        </Card>
      </div>

      {stats?.uptime != null && (
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Server className="w-5 h-5 text-meet-success" />
            <span className="text-sm text-foreground">Server Uptime: <strong>{formatUptime(stats.uptime)}</strong></span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
