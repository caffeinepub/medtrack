import { useState } from 'react';
import { RecordType, RECORD_TYPE_LABELS } from '../types/medicalRecords';
import { useGetAllRecords } from '../hooks/useQueries';
import { TimelineCard } from './TimelineCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';

const FILTER_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: RecordType.CBC, label: 'CBC' },
  { value: RecordType.LFT, label: 'LFT' },
  { value: RecordType.Cholesterol, label: 'Cholesterol' },
  { value: RecordType.BloodSugar, label: 'Sugar' },
  { value: RecordType.BloodPressure, label: 'BP' },
  { value: RecordType.GeneralAilments, label: 'Ailments' },
];

function EmptyState({ category }: { category: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <ClipboardList className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">No records found</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {category === 'all'
          ? 'Start by adding your first medical record using the Add Record page.'
          : `No ${RECORD_TYPE_LABELS[category as RecordType] || category} records yet. Add one to get started.`}
      </p>
    </div>
  );
}

function RecordSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function TimelineView() {
  const { data: records, isLoading } = useGetAllRecords();
  const [activeTab, setActiveTab] = useState('all');

  const filteredRecords = records?.filter((r) =>
    activeTab === 'all' ? true : r.recordType === activeTab
  ) ?? [];

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <TabsList className="flex w-max gap-1 bg-muted/50 p-1 rounded-xl mb-6">
            {FILTER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-3 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-xs"
              >
                {tab.label}
                {tab.value !== 'all' && records && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({records.filter((r) => r.recordType === tab.value).length})
                  </span>
                )}
                {tab.value === 'all' && records && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({records.length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {FILTER_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {isLoading ? (
              <RecordSkeleton />
            ) : filteredRecords.length === 0 ? (
              <EmptyState category={tab.value} />
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <TimelineCard key={record.recordId} record={record} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
