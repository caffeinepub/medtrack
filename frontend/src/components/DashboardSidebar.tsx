import { Link, useLocation } from '@tanstack/react-router';
import { Clock, BarChart2, Activity, TrendingUp, Calendar } from 'lucide-react';
import { useGetAllRecords } from '../hooks/useQueries';
import { getCategorySummaries } from '../utils/recordSummary';
import { RECORD_TYPE_LABELS, RECORD_TYPE_COLORS } from '../types/medicalRecords';
import { RecordType } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const CATEGORY_ICONS: Record<RecordType, string> = {
  [RecordType.CBC]: '🩸',
  [RecordType.LFT]: '🫀',
  [RecordType.Cholesterol]: '💊',
  [RecordType.BloodSugar]: '🍬',
  [RecordType.BloodPressure]: '💓',
  [RecordType.GeneralAilments]: '📋',
};

const quickLinks = [
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
  { to: '/add', label: 'Add Record', icon: Activity },
];

export function DashboardSidebar() {
  const { data: records, isLoading } = useGetAllRecords();
  const location = useLocation();

  const totalRecords = records?.length ?? 0;
  const summaries = records ? getCategorySummaries(records) : [];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-4 sticky top-24 self-start">
      {/* Summary header */}
      <div className="bg-card rounded-xl border border-border shadow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Health Dashboard</span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Records</span>
            <Badge variant="secondary" className="font-bold text-primary">
              {totalRecords}
            </Badge>
          </div>
        )}
      </div>

      {/* Quick navigation */}
      <div className="bg-card rounded-xl border border-border shadow-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Nav
        </p>
        <nav className="flex flex-col gap-1">
          {quickLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Category breakdown */}
      {(isLoading || summaries.length > 0) && (
        <div className="bg-card rounded-xl border border-border shadow-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            By Category
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {summaries.map((summary, idx) => (
                <div key={summary.category}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none shrink-0">
                        {CATEGORY_ICONS[summary.category]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {RECORD_TYPE_LABELS[summary.category]}
                        </p>
                        {summary.latestDate && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 shrink-0" />
                            {summary.latestDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 ${RECORD_TYPE_COLORS[summary.category]}`}
                    >
                      {summary.count}
                    </span>
                  </div>
                  {idx < summaries.length - 1 && <Separator className="opacity-40" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
