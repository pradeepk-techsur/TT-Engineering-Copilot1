'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Lock, Search, ScrollText, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, THead, TH, TBody, TEmpty } from '@/components/ui/data-table';
import { SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { AuditEventRow } from './AuditEventRow';
import { count } from '@/lib/format';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const PHASE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: `Phase ${i}` }));
const EVENT_TYPE_OPTIONS = [
  { value: 'IntakeEvent', label: 'Intake Events' },
  { value: 'GateDecision', label: 'Gate Decisions' },
  { value: 'PhaseStateChange', label: 'Phase State Changes' },
  { value: 'FindingRaised', label: 'Findings' },
  { value: 'ActionCreated', label: 'Actions' },
];

// Base UI's <Select.Value> prints the raw value unless told otherwise, which
// surfaced "IntakeEvent" and "all" in the trigger instead of their labels.
const EVENT_TYPE_LABELS: Record<string, string> = {
  all: 'All Events',
  ...Object.fromEntries(EVENT_TYPE_OPTIONS.map(o => [o.value, o.label])),
};
const PHASE_LABELS: Record<string, string> = {
  all: 'All Phases',
  ...Object.fromEntries(PHASE_OPTIONS.map(o => [o.value, o.label])),
};

const COLUMNS = [
  { label: 'Phase',           width: 'w-[64px]' },
  { label: 'Logical Input',   width: '' },
  { label: 'Behavior',        width: 'w-[86px]' },
  { label: 'User Action',     width: 'w-[150px]' },
  { label: 'System Repr.',    width: 'w-[160px]' },
  { label: 'Status',          width: 'w-[150px]' },
  { label: 'Source Artifact', width: 'w-[120px]' },
  { label: 'Version',         width: 'w-[78px]' },
  { label: 'Timestamp',       width: 'w-[170px]' },
];

export function AuditLogTable() {
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('IntakeEvent');
  const [searchText, setSearchText] = useState('');

  const params = new URLSearchParams();
  if (eventTypeFilter !== 'all') params.set('eventType', eventTypeFilter);
  if (phaseFilter !== 'all') params.set('phaseId', phaseFilter);

  const { data, isLoading } = useSWR(`/api/audit?${params.toString()}`, fetcher, {
    refreshInterval: 10000,
    keepPreviousData: true,
  });

  const allEvents = data?.events ?? [];
  const events = allEvents.filter((e: any) =>
    searchText === '' || JSON.stringify(e).toLowerCase().includes(searchText.toLowerCase())
  );

  const filtered = searchText !== '' || phaseFilter !== 'all';

  const clearFilters = () => {
    setSearchText('');
    setPhaseFilter('all');
  };

  return (
    <div className="space-y-4" data-testid="audit-log-table">
      {/* Immutable record notice — always visible */}
      <div
        className="flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-2 text-[12px]"
        data-testid="immutable-record-badge"
      >
        <Lock size={12} strokeWidth={2} className="shrink-0 text-fg-muted" />
        <span className="font-medium text-fg-2">Immutable Record — Append Only</span>
        <span className="text-fg-muted">· No events can be modified or deleted</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select value={eventTypeFilter} onValueChange={(v) => setEventTypeFilter(v ?? 'all')}>
          <SelectTrigger className="h-9 w-[190px] text-[12.5px]">
            <SelectValue placeholder="Event type">
              {(value: string) => EVENT_TYPE_LABELS[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {EVENT_TYPE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={phaseFilter} onValueChange={(v) => setPhaseFilter(v ?? 'all')}>
          <SelectTrigger className="h-9 w-[150px] text-[12.5px]">
            <SelectValue placeholder="Phase">
              {(value: string) => PHASE_LABELS[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {PHASE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search
            size={13}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-faint"
          />
          <Input
            placeholder="Search events…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-[220px] pl-7.5 text-[12.5px]"
            data-testid="audit-search-input"
          />
        </div>

        {filtered && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X size={13} strokeWidth={2} />
            Clear
          </Button>
        )}

        <span className="ml-auto text-[12px] text-fg-muted tabular-nums">
          {count(events.length, 'event')}
          {searchText && allEvents.length !== events.length && (
            <span className="text-fg-faint"> of {allEvents.length}</span>
          )}
        </span>
      </div>

      {/* Table — 9 columns matching FRD F02 fields */}
      <Card className="py-0">
        <DataTable minWidth={1180}>
          <THead>
            <tr>
              {COLUMNS.map(c => (
                <TH key={c.label} className={c.width}>
                  {c.label}
                </TH>
              ))}
            </tr>
          </THead>
          <TBody>
            {isLoading && !data ? (
              <TEmpty colSpan={9}>
                <div className="-mx-4">
                  <SkeletonRows rows={4} />
                </div>
              </TEmpty>
            ) : events.length === 0 ? (
              <TEmpty colSpan={9}>
                <EmptyState
                  icon={ScrollText}
                  title={filtered ? 'No events match these filters' : 'No events yet'}
                  description={
                    filtered
                      ? 'Try a different phase or clear the search to see the full log.'
                      : 'Execute phases to generate intake events. Every action is appended here permanently.'
                  }
                  action={
                    filtered ? (
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              </TEmpty>
            ) : (
              events.map((event: any) => (
                <AuditEventRow key={event.auditId} event={event} />
              ))
            )}
          </TBody>
        </DataTable>
      </Card>
    </div>
  );
}
