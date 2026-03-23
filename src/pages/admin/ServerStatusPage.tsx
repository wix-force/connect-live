import { useEffect } from 'react';
import { Server, Cpu, HardDrive, Wifi, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchServerStatus } from '@/store/slices/adminSlice';

export default function ServerStatusPage() {
  const dispatch = useAppDispatch();
  const { serverStatus } = useAppSelector(s => s.admin);

  useEffect(() => {
    dispatch(fetchServerStatus());
    const interval = setInterval(() => dispatch(fetchServerStatus()), 10000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const formatUptime = (s?: number) => {
    if (!s) return '—';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-foreground">Server Status</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="w-4 h-4" /> CPU Usage</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground mb-2">{serverStatus?.cpuUsage?.toFixed(1) ?? '—'}%</p>
            <Progress value={serverStatus?.cpuUsage ?? 0} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><HardDrive className="w-4 h-4" /> Memory Usage</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground mb-2">{serverStatus?.memoryUsage?.toFixed(1) ?? '—'}%</p>
            <Progress value={serverStatus?.memoryUsage ?? 0} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Wifi className="w-4 h-4" /> Active Sockets</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{serverStatus?.activeSockets ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Uptime</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{formatUptime(serverStatus?.uptime)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
