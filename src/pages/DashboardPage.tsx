import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video, Plus, Calendar, Clock, Play, Settings, Bell, LogOut,
  ChevronRight, Search, Users, LayoutGrid, History, Disc, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import { fetchMeetings, createMeetingAsync } from '@/store/slices/meetingSlice';
import { toast } from 'sonner';
import type { MeetingData } from '@/services/meetingService';

const sidebarItems = [
  { icon: LayoutGrid, label: 'Dashboard', active: true },
  { icon: Calendar, label: 'Schedule' },
  { icon: History, label: 'History' },
  { icon: Disc, label: 'Recordings' },
  { icon: Settings, label: 'Settings' },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAppSelector(s => s.auth.user);
  const { meetings, isLoadingMeetings, isCreating } = useAppSelector(s => s.meeting);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchMeetings(undefined));
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
    toast.success('Signed out successfully');
  };

  const handleNewMeeting = async () => {
    const result = await dispatch(createMeetingAsync({ title: 'Instant Meeting' }));
    if (createMeetingAsync.fulfilled.match(result)) {
      navigate(`/meeting/${result.payload.meetingId}`);
    }
  };

  const activeMeetings = meetings.filter((m: MeetingData) => m.status === 'active' || m.status === 'waiting');
  const pastMeetingsList = meetings.filter((m: MeetingData) => m.status === 'ended');

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

  return (
    <div className="min-h-screen flex bg-meet-surface">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-4">
        <Link to="/" className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">MeetFlow</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {user?.name?.[0] || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Demo User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'demo@meetflow.com'}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground" aria-label="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-accent" aria-label="Notifications">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-meet-danger rounded-full" />
            </button>
          </div>
        </header>

        <div className="p-6 max-w-5xl mx-auto space-y-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <button onClick={handleNewMeeting} disabled={isCreating} className="text-left">
              <div className="bg-primary text-primary-foreground rounded-xl p-5 hover:opacity-90 transition-opacity cursor-pointer">
                {isCreating ? <Loader2 className="w-8 h-8 mb-3 animate-spin" /> : <Plus className="w-8 h-8 mb-3" />}
                <h3 className="font-semibold">{isCreating ? 'Creating...' : 'New Meeting'}</h3>
                <p className="text-sm opacity-80">Start an instant meeting</p>
              </div>
            </button>
            <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
              <Calendar className="w-8 h-8 mb-3 text-meet-info" />
              <h3 className="font-semibold text-foreground">Schedule</h3>
              <p className="text-sm text-muted-foreground">Plan a future meeting</p>
            </div>
            <Link to="/join">
              <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                <Play className="w-8 h-8 mb-3 text-meet-success" />
                <h3 className="font-semibold text-foreground">Join</h3>
                <p className="text-sm text-muted-foreground">Enter with a code</p>
              </div>
            </Link>
            <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
              <Disc className="w-8 h-8 mb-3 text-meet-warning" />
              <h3 className="font-semibold text-foreground">Recordings</h3>
              <p className="text-sm text-muted-foreground">View past recordings</p>
            </div>
          </motion.div>

          {/* Upcoming / Active */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Meetings</h2>
            {isLoadingMeetings ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-pulse h-20 rounded-xl" />
                ))}
              </div>
            ) : activeMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No upcoming meetings</p>
            ) : (
              <div className="space-y-3">
                {activeMeetings.map((m: MeetingData) => (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{m.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(m.scheduledAt || m.createdAt)} · {formatTime(m.scheduledAt || m.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-4 h-4" /> {m.participants.length}
                      </span>
                      <Link to={`/meeting/${m.meetingId}`}>
                        <Button size="sm" variant="outline" className="rounded-full">
                          Join <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Meetings</h2>
            {pastMeetingsList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No past meetings</p>
            ) : (
              <div className="space-y-3">
                {pastMeetingsList.slice(0, 10).map((m: MeetingData) => (
                  <div
                    key={m._id}
                    className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{m.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(m.endTime || m.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="w-4 h-4" /> {m.participants.length}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
