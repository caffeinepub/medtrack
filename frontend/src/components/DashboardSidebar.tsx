import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Activity,
  PlusCircle,
  Clock,
  BarChart2,
  Users,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { useGetAllRecords } from '../hooks/useQueries';
import { getCategorySummaries } from '../utils/recordSummary';
import type { ParsedMedicalRecord as LocalParsedMedicalRecord } from '../types/medicalRecords';

const CATEGORY_COLORS: Record<string, string> = {
  CBC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LFT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Cholesterol: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  BloodSugar: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  BloodPressure: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  GeneralAilments: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const navLinks = [
  { to: '/add', label: 'Add Record', icon: PlusCircle },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/records', label: 'Records', icon: FolderOpen },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
  { to: '/family-members', label: 'Family', icon: Users },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { data: rawRecords = [] } = useGetAllRecords(null);

  // getCategorySummaries only reads recordType and recordDate — it never accesses data.
  // We cast through unknown to satisfy the strict RecordData union type requirement.
  const compatRecords = rawRecords.map((r) => ({
    recordId: r.recordId,
    recordDate: r.recordDate,
    recordType: r.recordType,
    data: {} as LocalParsedMedicalRecord['data'],
  })) as unknown as LocalParsedMedicalRecord[];

  const summaries = getCategorySummaries(compatRecords);
  const totalRecords = rawRecords.length;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-4 sticky top-24 self-start">
      {/* Navigation */}
      <nav className="bg-card border border-border rounded-xl p-3 space-y-1 shadow-card">
        {navLinks.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Stats */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Overview</span>
        </div>
        <div className="text-2xl font-bold text-foreground mb-1">{totalRecords}</div>
        <div className="text-xs text-muted-foreground mb-4">Total Records</div>

        {summaries.length > 0 && (
          <div className="space-y-2">
            {summaries.map((s) => (
              <div key={s.category} className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    CATEGORY_COLORS[s.category] ?? 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.category}
                </span>
                <span className="text-xs font-semibold text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick link to records */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">File Records</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          View and manage your uploaded PDFs and images.
        </p>
        <Link
          to="/records"
          className="text-xs font-medium text-primary hover:underline"
        >
          Go to Records →
        </Link>
      </div>
    </aside>
  );
}
