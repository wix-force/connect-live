import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video, Plus, Calendar, Clock, Play, Disc, Loader2,
  Users, ChevronRight, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchMeetings, createMeetingAsync } from '@/store/slices/meetingSlice';
import { fetchDashboardOverview, fetchDashboardActivity } from '@/store/slices/dashboardSlice';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { MeetingData } from '@/services/meetingService';

export default function DashboardOverview() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { meetings, isLoadingMeetings, isCreating } = useAppSelector(s => s.meeting);
  const { overview, activity, isLoading } = useAppSelector(s => s.dashboard);

  useEffect(() => {
    dispatch(fetchMeetings(undefined));
    dispatch(fetchDashboardOverview());
    dispatch(fetchDashboardActivity());
  }, [dispatch]);

  const handleNewMeeting = async () => {
    const result = await dispatch(createMeetingAsync({ title: 'Instant Meeting' }));
    if (createMeetingAsync.fulfilled.match(result)) {
      navigate(`/meeting/${result.payload.meetingId}`);
    }
  };

  const activeMeetings = meetings.filter((m: MeetingData) => m.status === 'active' || m.status === 'waiting');
  const pastMeetings = meetings.filter((m: MeetingData) => m.status === 'ended');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statCards = [
    { label: 'Upcoming', value: overview?.upcomingMeetings ?? activeMeetings.length, icon: Calendar, color: 'text-meet-info' },
    { label: 'Total Meetings', value: overview?.meetingCount ?? meetings.length, icon: Video, color: 'text-primary' },
    { label: 'Hours Spent', value: overview?.totalHours?.toFixed(1) ?? '0', icon: Clock, color: 'text-meet-warning' },
    { label: 'Recordings', value: overview?.recordingsCount ?? 0, icon: Disc, color: 'text-meet-success' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? '—' : s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={handleNewMeeting} disabled={isCreating} className="text-left">
          <div className="bg-primary text-primary-foreground rounded-xl p-4 hover:opacity-90 transition-opacity">
            {isCreating ? <Loader2 className="w-6 h-6 mb-2 animate-spin" /> : <Plus className="w-6 h-6 mb-2" />}
            <p className="font-semibold text-sm">{isCreating ? 'Creating...' : 'New Meeting'}</p>
          </div>
        </button>
        <Link to="/dashboard/schedule">
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <Calendar className="w-6 h-6 mb-2 text-meet-info" />
            <p className="font-semibold text-sm text-foreground">Schedule</p>
          </div>
        </Link>
        <Link to="/join">
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <Play className="w-6 h-6 mb-2 text-meet-success" />
            <p className="font-semibold text-sm text-foreground">Join</p>
          </div>
        </Link>
        <Link to="/dashboard/recordings">
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
            <Disc className="w-6 h-6 mb-2 text-meet-warning" />
            <p className="font-semibold text-sm text-foreground">Recordings</p>
          </div>
        </Link>
      </div>

      {/* Chart */}
      {activity.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activity}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="meetings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming Meetings</h2>
        {isLoadingMeetings ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton-pulse h-16 rounded-xl" />)}</div>
        ) : activeMeetings.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No upcoming meetings</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {activeMeetings.map((m: MeetingData) => (
              <Card key={m._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(m.scheduledAt || m.createdAt)} · {formatTime(m.scheduledAt || m.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {m.participants.length}</span>
                    <Link to={`/meeting/${m.meetingId}`}>
                      <Button size="sm" variant="outline" className="rounded-full text-xs">
                        Join <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Meetings</h2>
        {pastMeetings.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No past meetings</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {pastMeetings.slice(0, 8).map((m: MeetingData) => (
              <Card key={m._id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(m.endTime || m.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {m.participants.length}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
