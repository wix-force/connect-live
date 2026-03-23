import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Lock, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch } from '@/store';
import { createMeetingAsync } from '@/store/slices/meetingSlice';
import { toast } from 'sonner';

export default function ScheduleMeetingPage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title required'); return; }
    setIsSubmitting(true);
    const scheduledAt = date && time ? new Date(`${date}T${time}`).toISOString() : undefined;
    const result = await dispatch(createMeetingAsync({
      title: title.trim(),
      password: usePassword ? password : undefined,
      scheduledAt,
      settings: { waitingRoom },
    }));
    setIsSubmitting(false);
    if (createMeetingAsync.fulfilled.match(result)) {
      toast.success('Meeting scheduled!');
      navigate('/dashboard/meetings');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Schedule Meeting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input id="title" placeholder="Weekly standup..." value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Password Protection</p>
                  <p className="text-xs text-muted-foreground">Require a password to join</p>
                </div>
              </div>
              <Switch checked={usePassword} onCheckedChange={setUsePassword} />
            </div>
            {usePassword && (
              <Input placeholder="Meeting password" value={password} onChange={e => setPassword(e.target.value)} />
            )}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Waiting Room</p>
                  <p className="text-xs text-muted-foreground">Admit participants manually</p>
                </div>
              </div>
              <Switch checked={waitingRoom} onCheckedChange={setWaitingRoom} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
