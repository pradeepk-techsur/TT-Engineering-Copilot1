'use client';
import useSWR from 'swr';
import { History } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable, THead, TH, TBody, TR, TD } from '@/components/ui/data-table';
import { SkeletonRows } from '@/components/ui/skeleton';
import { Hint } from '@/components/ui/hint';
import { BEHAVIOR_GLOSSARY } from '@/lib/status';
import { formatDateTime, isoOf } from '@/lib/format';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Version {
  versionId: number;
  versionNumber: number;
  intakeBehavior: string;
  active: boolean;
  intakeTimestamp: string;
}

export function VersionHistoryTable({ phaseId, inputRole }: { phaseId: number; inputRole: string }) {
  const { data, isLoading } = useSWR(
    `/api/phases/${phaseId}/inputs/${inputRole}/versions`,
    fetcher,
    { keepPreviousData: true }
  );

  if (isLoading && !data) return <SkeletonRows rows={2} />;

  if (!data?.versions?.length) {
    return (
      <EmptyState
        size="sm"
        icon={History}
        title="No versions yet"
        description="Upload or ingest this input to create the first version entry."
      />
    );
  }

  return (
    <DataTable data-testid={`version-history-${inputRole}`}>
      <THead>
        <tr>
          <TH className="w-[74px]">Version</TH>
          <TH className="w-[90px]">Behavior</TH>
          <TH className="w-[104px]">Status</TH>
          <TH>Recorded</TH>
        </tr>
      </THead>
      <TBody>
        {data.versions.map((v: Version) => (
          <TR key={v.versionId} interactive>
            <TD className="font-mono text-[11.5px] text-fg">v{v.versionNumber}</TD>
            <TD className="text-[12px]">
              <Hint label={v.intakeBehavior}>
                {BEHAVIOR_GLOSSARY[v.intakeBehavior] ?? v.intakeBehavior}
              </Hint>
            </TD>
            <TD>
              {v.active ? (
                <StatusPill tone="pass" dot size="sm">Active</StatusPill>
              ) : (
                <StatusPill tone="neutral" size="sm">Historical</StatusPill>
              )}
            </TD>
            <TD className="text-[11.5px] whitespace-nowrap text-fg-muted">
              <time dateTime={isoOf(v.intakeTimestamp)}>
                {formatDateTime(v.intakeTimestamp)}
              </time>
            </TD>
          </TR>
        ))}
      </TBody>
    </DataTable>
  );
}
