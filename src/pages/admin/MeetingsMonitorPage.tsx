import { useEffect } from 'react';
import { Video, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchActiveMeetings } from '@/store/slices/adminSlice';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';

export default function MeetingsMonitorPage() {
  const dispatch = useAppDispatch();
  const { activeMeetings } = useAppSelector(s => s.admin);

  useEffect(() => { dispatch(fetchActiveMeetings()); }, [dispatch]);

  const handleForceEnd = async (meetingId: string) => {
    if (!confirm('Force end this meeting?')) return;
    try {
      await adminService.forceEndMeeting(meetingId);
      toast.success('Meeting ended');
      dispatch(fetchActiveMeetings());
    } catch { toast.error('Failed to end meeting'); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Live Meetings</h1>
        <Badge variant="default">{activeMeetings.length} active</Badge>
      </div>

      {activeMeetings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No active meetings</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {activeMeetings.map((m: any) => (
            <Card key={m._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-meet-success/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-meet-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Host: {m.hostId?.name || 'Unknown'} · Started {new Date(m.startTime || m.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" /> {m.participants?.length || 0}
                  </span>
                  <Button variant="destructive" size="sm" onClick={() => handleForceEnd(m.meetingId)} className="rounded-full">
                    <XCircle className="w-4 h-4 mr-1" /> End
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
