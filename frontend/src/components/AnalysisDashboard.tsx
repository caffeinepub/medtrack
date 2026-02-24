import { useState } from 'react';
import { RecordType, RECORD_TYPE_LABELS } from '../types/medicalRecords';
import { useGetAllRecords } from '../hooks/useQueries';
import { ProgressionChart } from './ProgressionChart';
import { TrendSummary } from './TrendSummary';
import { buildChartData, analyzeMetricTrend, CATEGORY_METRIC_KEYS } from '../utils/trendAnalysis';
import type { MetricTrend } from '../utils/trendAnalysis';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, AlertCircle } from 'lucide-react';

const ANALYZABLE_CATEGORIES = [
  RecordType.CBC,
  RecordType.LFT,
  RecordType.Cholesterol,
  RecordType.BloodSugar,
  RecordType.BloodPressure,
];

function InsufficientDataState({ category }: { category: RecordType }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-3">
        <BarChart2 className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">Not enough data</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Add at least 2 {RECORD_TYPE_LABELS[category]} records to see progression charts and trend analysis.
      </p>
    </div>
  );
}

function CategoryAnalysis({ category }: { category: RecordType }) {
  const { data: allRecords, isLoading } = useGetAllRecords();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-60 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>
    );
  }

  const categoryRecords = (allRecords ?? []).filter((r) => r.recordType === category);
  const metricDefs = CATEGORY_METRIC_KEYS[category];

  if (categoryRecords.length < 2) {
    return <InsufficientDataState category={category} />;
  }

  const recordsForChart = categoryRecords.map((r) => ({
    date: Number(r.recordDate),
    data: r.data as unknown as Record<string, string>,
  }));

  const chartData = buildChartData(recordsForChart, metricDefs.map((m) => m.key));

  // Compute trends per metric
  const trends: MetricTrend[] = metricDefs
    .map((metric) => {
      const values = chartData
        .map((d) => d[metric.key])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
      if (values.length < 2) return null;
      return analyzeMetricTrend(metric.key, metric.label, metric.unit, values);
    })
    .filter((t): t is MetricTrend => t !== null);

  // Filter to metrics that have data
  const chartMetrics = metricDefs.filter((m) =>
    chartData.some((d) => typeof d[m.key] === 'number')
  );

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {RECORD_TYPE_LABELS[category]} Progression
          </CardTitle>
          <p className="text-xs text-muted-foreground">{categoryRecords.length} records · {chartData.length} data points</p>
        </CardHeader>
        <CardContent>
          <ProgressionChart data={chartData} metrics={chartMetrics} />
        </CardContent>
      </Card>

      {/* Trend Summary */}
      {trends.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Trend Analysis
          </h3>
          <TrendSummary trends={trends} />
        </div>
      )}
    </div>
  );
}

export function AnalysisDashboard() {
  const { data: allRecords } = useGetAllRecords();
  const [activeCategory, setActiveCategory] = useState<RecordType>(RecordType.CBC);

  // Count records per category
  const categoryCounts = ANALYZABLE_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = (allRecords ?? []).filter((r) => r.recordType === cat).length;
    return acc;
  }, {});

  return (
    <div>
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as RecordType)}>
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <TabsList className="flex w-max gap-1 bg-muted/50 p-1 rounded-xl mb-6">
            {ANALYZABLE_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="rounded-lg px-3 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-xs"
              >
                {RECORD_TYPE_LABELS[cat]}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({categoryCounts[cat] ?? 0})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {ANALYZABLE_CATEGORIES.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-0">
            <CategoryAnalysis category={cat} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
