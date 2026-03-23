import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Search, Users, Trash2, Edit, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchMeetings } from '@/store/slices/meetingSlice';
import type { MeetingData } from '@/services/meetingService';

export default function MyMeetingsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  const dispatch = useAppDispatch();
  const { meetings, isLoadingMeetings } = useAppSelector(s => s.meeting);

  useEffect(() => { dispatch(fetchMeetings(undefined)); }, [dispatch]);

  const filtered = meetings.filter((m: MeetingData) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || m.status === filter || (filter === 'active' && m.status === 'waiting');
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">My Meetings</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-56" />
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['all', 'active', 'ended'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoadingMeetings ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton-pulse h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No meetings found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((m: MeetingData) => (
            <Card key={m._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()} · Code: {m.meetingId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={m.status === 'ended' ? 'secondary' : 'default'} className="text-xs capitalize">{m.status}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {m.participants.length}</span>
                  {(m.status === 'active' || m.status === 'waiting') && (
                    <Link to={`/meeting/${m.meetingId}`}>
                      <Button size="sm" variant="outline" className="rounded-full text-xs">Join <ChevronRight className="w-3 h-3 ml-1" /></Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
