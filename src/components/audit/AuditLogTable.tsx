'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock } from 'lucide-react';
import { AuditEventRow } from './AuditEventRow';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const PHASE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: `Phase ${i}` }));
const EVENT_TYPE_OPTIONS = [
  { value: 'IntakeEvent', label: 'Intake Events' },
  { value: 'GateDecision', label: 'Gate Decisions' },
  { value: 'PhaseStateChange', label: 'Phase State Changes' },
  { value: 'FindingRaised', label: 'Findings' },
  { value: 'ActionCreated', label: 'Actions' },
];

export function AuditLogTable() {
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('IntakeEvent');
  const [searchText, setSearchText] = useState('');

  const params = new URLSearchParams();
  if (eventTypeFilter !== 'all') params.set('eventType', eventTypeFilter);
  if (phaseFilter !== 'all') params.set('phaseId', phaseFilter);

  const { data } = useSWR(`/api/audit?${params.toString()}`, fetcher, { refreshInterval: 10000 });

  const events = (data?.events ?? []).filter((e: any) =>
    searchText === '' || JSON.stringify(e).toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="space-y-4" data-testid="audit-log-table">
      {/* Immutable record notice — always visible */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-500/5 border border-slate-500/20 text-xs text-slate-400"
        data-testid="immutable-record-badge"
      >
        <Lock size={12} />
        <span className="font-medium">Immutable Record — Append Only</span>
        <span className="text-slate-500">· No events can be modified or deleted</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-48 text-xs h-8">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {EVENT_TYPE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-36 text-xs h-8">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {PHASE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search events..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-48 text-xs h-8"
          data-testid="audit-search-input"
        />

        <Badge className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20 self-center">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Table — 9 columns matching FRD F02 fields */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {[
                'Phase',           // field 1
                'Logical Input',   // field 2
                'Behavior',        // field 3
                'User Action',     // field 4
                'System Repr.',    // field 5
                'Status',          // field 6
                'Source Artifact', // field 7
                'Version',         // field 8
                'Timestamp',       // field 9
              ].map(h => (
                <th key={h} className="text-left py-2 px-2 text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                  No events found. Execute phases to generate intake events.
                </td>
              </tr>
            ) : (
              events.map((event: any) => (
                <AuditEventRow key={event.auditId} event={event} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
