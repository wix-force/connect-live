import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video, Plus, Calendar, Clock, Play, Settings, Bell, LogOut,
  ChevronRight, Search, Users, LayoutGrid, History, Disc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';

const sidebarItems = [
  { icon: LayoutGrid, label: 'Dashboard', active: true },
  { icon: Calendar, label: 'Schedule' },
  { icon: History, label: 'History' },
  { icon: Disc, label: 'Recordings' },
  { icon: Settings, label: 'Settings' },
];

const upcomingMeetings = [
  { id: '1', title: 'Weekly Standup', time: '10:00 AM', date: 'Today', participants: 8 },
  { id: '2', title: 'Design Review', time: '2:00 PM', date: 'Today', participants: 5 },
  { id: '3', title: 'Sprint Planning', time: '9:00 AM', date: 'Tomorrow', participants: 12 },
];

const pastMeetings = [
  { id: '4', title: 'Client Presentation', date: 'Yesterday', duration: '45 min', participants: 6 },
  { id: '5', title: 'Team Retrospective', date: '2 days ago', duration: '30 min', participants: 10 },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAppSelector(s => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
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
            <Link to="/meeting/new">
              <div className="bg-primary text-primary-foreground rounded-xl p-5 hover:opacity-90 transition-opacity cursor-pointer">
                <Plus className="w-8 h-8 mb-3" />
                <h3 className="font-semibold">New Meeting</h3>
                <p className="text-sm opacity-80">Start an instant meeting</p>
              </div>
            </Link>
            <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
              <Calendar className="w-8 h-8 mb-3 text-meet-info" />
              <h3 className="font-semibold text-foreground">Schedule</h3>
              <p className="text-sm text-muted-foreground">Plan a future meeting</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
              <Play className="w-8 h-8 mb-3 text-meet-success" />
              <h3 className="font-semibold text-foreground">Join</h3>
              <p className="text-sm text-muted-foreground">Enter with a code</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
              <Disc className="w-8 h-8 mb-3 text-meet-warning" />
              <h3 className="font-semibold text-foreground">Recordings</h3>
              <p className="text-sm text-muted-foreground">View past recordings</p>
            </div>
          </motion.div>

          {/* Upcoming */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Meetings</h2>
            <div className="space-y-3">
              {upcomingMeetings.map(m => (
                <motion.div
                  key={m.id}
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
                      <p className="text-sm text-muted-foreground">{m.date} · {m.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="w-4 h-4" /> {m.participants}
                    </span>
                    <Button size="sm" variant="outline" className="rounded-full">
                      Join <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Past */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Meetings</h2>
            <div className="space-y-3">
              {pastMeetings.map(m => (
                <div
                  key={m.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{m.title}</h3>
                      <p className="text-sm text-muted-foreground">{m.date} · {m.duration}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" /> {m.participants}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
