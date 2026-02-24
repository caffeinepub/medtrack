import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import type { MetricTrend, TrendDirection } from '../utils/trendAnalysis';

interface TrendSummaryProps {
  trends: MetricTrend[];
}

function TrendIcon({ direction }: { direction: TrendDirection }) {
  switch (direction) {
    case 'improving':
      return <TrendingDown className="w-4 h-4 text-success" />;
    case 'worsening':
      return <TrendingUp className="w-4 h-4 text-destructive" />;
    case 'stable':
      return <Minus className="w-4 h-4 text-muted-foreground" />;
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

function TrendBadge({ direction }: { direction: TrendDirection }) {
  const styles: Record<TrendDirection, string> = {
    improving: 'bg-success/10 text-success',
    worsening: 'bg-destructive/10 text-destructive',
    stable: 'bg-muted text-muted-foreground',
    insufficient: 'bg-muted text-muted-foreground',
  };
  const labels: Record<TrendDirection, string> = {
    improving: 'Improving',
    worsening: 'Worsening',
    stable: 'Stable',
    insufficient: 'Insufficient data',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[direction]}`}>
      {labels[direction]}
    </span>
  );
}

export function TrendSummary({ trends }: TrendSummaryProps) {
  if (trends.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {trends.map((trend) => (
        <div
          key={trend.key}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border"
        >
          <div className="shrink-0">
            <TrendIcon direction={trend.direction} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">{trend.label}</span>
              <TrendBadge direction={trend.direction} />
              {!trend.isInRange && trend.direction !== 'insufficient' && (
                <span className="text-xs text-destructive font-medium">Out of range</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground tabular-nums">
                {trend.firstValue} → {trend.latestValue} {trend.unit}
              </span>
              {trend.direction !== 'insufficient' && (
                <span className={`text-xs tabular-nums ${
                  trend.changePercent > 0 ? 'text-destructive' : trend.changePercent < 0 ? 'text-success' : 'text-muted-foreground'
                }`}>
                  ({trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
