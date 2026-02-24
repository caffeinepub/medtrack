import { AnalysisDashboard } from '../components/AnalysisDashboard';
import { BarChart2 } from 'lucide-react';

export function AnalysisPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Progression Analysis</h1>
            <p className="text-sm text-muted-foreground">Track trends and identify patterns in your health metrics</p>
          </div>
        </div>
      </div>
      <AnalysisDashboard />
    </div>
  );
}
