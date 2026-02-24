import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint } from '../utils/trendAnalysis';
import { CHART_COLORS } from '../utils/trendAnalysis';
import { REFERENCE_RANGES } from '../types/medicalRecords';

interface ProgressionChartProps {
  data: ChartDataPoint[];
  metrics: Array<{ key: string; label: string; unit: string }>;
  title?: string;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-card-hover p-3 text-sm">
      <p className="font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry) => {
        const range = REFERENCE_RANGES[entry.dataKey];
        const inRange = range ? entry.value >= range.min && entry.value <= range.max : null;
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium tabular-nums">{entry.value}</span>
            {range && <span className="text-xs text-muted-foreground">{range.unit}</span>}
            {inRange !== null && (
              <span className={`text-xs ${inRange ? 'text-success' : 'text-destructive'}`}>
                {inRange ? '✓' : '!'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ProgressionChart({ data, metrics, title }: ProgressionChartProps) {
  if (data.length < 2) return null;

  // Get reference ranges for the first metric (for reference lines)
  const primaryMetric = metrics[0];
  const primaryRange = primaryMetric ? REFERENCE_RANGES[primaryMetric.key] : null;

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 200)" strokeOpacity={0.5} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 210)' }}
            tickLine={false}
            axisLine={{ stroke: 'oklch(0.88 0.02 200)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 210)' }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          {metrics.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
          )}
          {primaryRange && metrics.length === 1 && (
            <>
              <ReferenceLine
                y={primaryRange.max}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: `Max ${primaryRange.max}`, position: 'right', fontSize: 10, fill: '#ef4444' }}
              />
              <ReferenceLine
                y={primaryRange.min}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: `Min ${primaryRange.min}`, position: 'right', fontSize: 10, fill: '#10b981' }}
              />
            </>
          )}
          {metrics.map((metric, idx) => (
            <Line
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              name={metric.label}
              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS[idx % CHART_COLORS.length], strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
