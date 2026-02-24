import { Link } from '@tanstack/react-router';
import { PlusCircle, Clock, BarChart2, Activity, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetAllRecords } from '../hooks/useQueries';

const features = [
  {
    icon: PlusCircle,
    title: 'Log Records',
    description: 'Add CBC, LFT, Cholesterol, Blood Sugar, Blood Pressure, and general ailment records with date tagging.',
    to: '/add',
    cta: 'Add Record',
  },
  {
    icon: Clock,
    title: 'View Timeline',
    description: 'Browse your complete health history in reverse chronological order with category filtering.',
    to: '/timeline',
    cta: 'View Timeline',
  },
  {
    icon: BarChart2,
    title: 'Analyze Trends',
    description: 'Visualize metric progression over time with charts and intelligent trend analysis.',
    to: '/analysis',
    cta: 'See Analysis',
  },
];

export function HomePage() {
  const { data: records } = useGetAllRecords();
  const totalRecords = records?.length ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="text-center py-12 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <Activity className="w-3.5 h-3.5" />
          Personal Health Records Tracker
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">
          Your Health,<br />
          <span className="text-primary">Tracked & Analyzed</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Log medical records, build a historical timeline, and gain insights into your health progression over time.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg" className="rounded-xl">
            <Link to="/add">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add First Record
            </Link>
          </Button>
          {totalRecords > 0 && (
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link to="/timeline">
                <Clock className="w-4 h-4 mr-2" />
                View {totalRecords} Record{totalRecords !== 1 ? 's' : ''}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {totalRecords > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Records', value: totalRecords },
            { label: 'Categories', value: new Set(records?.map((r) => r.recordType)).size },
            { label: 'Latest Entry', value: records?.[0] ? new Date(Number(records[0].recordDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card text-center">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-display font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {features.map(({ icon: Icon, title, description, to, cta }) => (
          <Card key={title} className="shadow-card hover:shadow-card-hover transition-shadow group">
            <CardContent className="pt-6 pb-6">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link to={to}>{cta} →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-muted-foreground py-4 border-t border-border">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          Data stored on-chain
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          Client-side trend analysis
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          6 record categories
        </span>
      </div>
    </div>
  );
}
