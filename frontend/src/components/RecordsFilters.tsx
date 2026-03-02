import React from 'react';
import { Search, X, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export interface RecordsFilterState {
  search: string;
  fromDate: Date | undefined;
  toDate: Date | undefined;
}

interface RecordsFiltersProps {
  filters: RecordsFilterState;
  onChange: (filters: RecordsFilterState) => void;
}

export function RecordsFilters({ filters, onChange }: RecordsFiltersProps) {
  const hasActiveFilters = filters.search || filters.fromDate || filters.toDate;

  const clearAll = () => {
    onChange({ search: '', fromDate: undefined, toDate: undefined });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by file name or patient name…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* From Date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            {filters.fromDate ? format(filters.fromDate, 'MMM d, yyyy') : 'From date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.fromDate}
            onSelect={(d) => onChange({ ...filters, fromDate: d })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* To Date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            {filters.toDate ? format(filters.toDate, 'MMM d, yyyy') : 'To date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.toDate}
            onSelect={(d) => onChange({ ...filters, toDate: d })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
          <X className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
