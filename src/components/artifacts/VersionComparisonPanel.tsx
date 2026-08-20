'use client';
import useSWR from 'swr';
import { ArrowRight, GitCompare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime, isoOf } from '@/lib/format';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface VersionComparisonPanelProps {
  artifactId: string;
}

export function VersionComparisonPanel({ artifactId }: VersionComparisonPanelProps) {
  const { data: versionsData } = useSWR(`/api/artifacts/${artifactId}/versions`, fetcher);

  const versions: any[] = versionsData?.versions ?? [];

  if (versions.length < 2) {
    return (
      <Card>
        <EmptyState
          size="sm"
          icon={GitCompare}
          title="No version comparison available"
          description="Only one version of this artifact exists. A comparison appears once a revised version is generated."
        />
      </Card>
    );
  }

  // Sort by version number ascending
  const sorted = [...versions].sort((a, b) => a.version - b.version);
  const initial = sorted[0];
  const latest = sorted[sorted.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare size={14} strokeWidth={2} className="text-fg-muted" />
          Version comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <VersionSide version={initial} label="Initial" />
          <ArrowRight
            size={15}
            strokeWidth={2}
            className="mx-auto shrink-0 rotate-90 text-fg-faint sm:rotate-0"
          />
          <VersionSide version={latest} label="Latest" highlight />
        </div>

        {versions.length > 2 && (
          <p className="mt-3 text-center text-[11.5px] text-fg-muted">
            {versions.length} total versions — showing initial and latest
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function VersionSide({
  version,
  label,
  highlight,
}: {
  version: any;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex-1 space-y-1.5 rounded-lg border p-3',
        highlight ? 'border-pass-line bg-pass-soft' : 'border-line bg-raised/50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold text-fg">v{version.version}</span>
        <StatusPill tone={highlight ? 'pass' : 'neutral'} size="sm">
          {label}
        </StatusPill>
      </div>
      <p className="font-mono text-[11px] text-fg-muted">{version.artifactType}</p>
      <p className="text-[11.5px] text-fg-muted">
        <time dateTime={isoOf(version.timestamp)}>{formatDateTime(version.timestamp)}</time>
      </p>
      <p className="truncate text-[11.5px] text-fg-muted">By {version.generatedBy}</p>
    </div>
  );
}
