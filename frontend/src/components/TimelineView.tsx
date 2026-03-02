import { useState } from 'react';
import { RecordType, RECORD_TYPE_LABELS } from '../types/medicalRecords';
import { useGetAllRecords, useListFamilyMembers } from '../hooks/useQueries';
import { TimelineCard } from './TimelineCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Users } from 'lucide-react';

const FILTER_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: RecordType.CBC, label: 'CBC' },
  { value: RecordType.LFT, label: 'LFT' },
  { value: RecordType.Cholesterol, label: 'Cholesterol' },
  { value: RecordType.BloodSugar, label: 'Sugar' },
  { value: RecordType.BloodPressure, label: 'BP' },
  { value: RecordType.GeneralAilments, label: 'Ailments' },
];

function EmptyState({ category, memberName }: { category: string; memberName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <ClipboardList className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">No records found</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {category === 'all'
          ? `No records for ${memberName}. Start by adding a medical record.`
          : `No ${RECORD_TYPE_LABELS[category as RecordType] || category} records for ${memberName}.`}
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
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('__personal__');

  const { data: familyMembers = [] } = useListFamilyMembers();
  const familyMemberIdParam = selectedMemberId === '__personal__' ? null : selectedMemberId;
  const { data: records, isLoading } = useGetAllRecords(familyMemberIdParam);

  const memberName =
    selectedMemberId === '__personal__'
      ? 'My Records'
      : familyMembers.find((m) => m.profileId === selectedMemberId)?.name ?? 'Family Member';

  const filteredRecords = (records ?? []).filter((r) =>
    activeTab === 'all' ? true : r.recordType === activeTab
  );

  // Show records newest first
  const sortedRecords = [...filteredRecords].sort(
    (a, b) => Number(b.recordDate) - Number(a.recordDate)
  );

  return (
    <div>
      {/* Family member filter */}
      <div className="flex items-center gap-3 mb-5">
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__personal__">My Records</SelectItem>
            {familyMembers.map((m) => (
              <SelectItem key={m.profileId} value={m.profileId}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground hidden sm:inline">— {memberName}</span>
      </div>

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
            ) : sortedRecords.length === 0 ? (
              <EmptyState category={tab.value} memberName={memberName} />
            ) : (
              <div className="space-y-3">
                {sortedRecords.map((record) => (
                  <TimelineCard
                    key={record.recordId}
                    record={record}
                    familyMemberId={familyMemberIdParam}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
