import { useEffect } from 'react';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchAdminAnalytics } from '@/store/slices/adminSlice';

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const { analytics } = useAppSelector(s => s.admin);

  useEffect(() => { dispatch(fetchAdminAnalytics()); }, [dispatch]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-foreground">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-3xl font-bold text-foreground">{analytics?.meetingsLast30Days ?? '—'}</p>
            <p className="text-sm text-muted-foreground mt-1">Meetings (30 days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-meet-info mx-auto mb-3" />
            <p className="text-3xl font-bold text-foreground">{analytics?.newUsersLast30Days ?? '—'}</p>
            <p className="text-sm text-muted-foreground mt-1">New Users (30 days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-meet-success mx-auto mb-3" />
            <p className="text-3xl font-bold text-foreground">{analytics?.avgParticipantsPerMeeting?.toFixed(1) ?? '—'}</p>
            <p className="text-sm text-muted-foreground mt-1">Avg Participants</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
