import { Disc, Download, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RecordingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-foreground">Recordings</h1>
      <Card>
        <CardContent className="py-16 text-center">
          <Disc className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No recordings yet</h3>
          <p className="text-sm text-muted-foreground">Your meeting recordings will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
}
