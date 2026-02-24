import { TimelineView } from '../components/TimelineView';
import { Clock } from 'lucide-react';

export function TimelinePage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Medical Timeline</h1>
            <p className="text-sm text-muted-foreground">Your complete health record history</p>
          </div>
        </div>
      </div>
      <TimelineView />
    </div>
  );
}
