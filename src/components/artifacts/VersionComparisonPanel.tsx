'use client';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface VersionComparisonPanelProps {
  artifactId: string;
}

export function VersionComparisonPanel({ artifactId }: VersionComparisonPanelProps) {
  const { data: versionsData } = useSWR(`/api/artifacts/${artifactId}/versions`, fetcher);

  const versions: any[] = versionsData?.versions ?? [];

  if (versions.length < 2) {
    return (
      <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
        <CardContent className="pt-6">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            No version comparison available — only one version exists.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by version number ascending
  const sorted = [...versions].sort((a, b) => a.version - b.version);
  const initial = sorted[0];
  const latest = sorted[sorted.length - 1];

  return (
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
      <CardHeader>
        <CardTitle className="text-sm">Version Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Initial version */}
          <div className="flex-1 rounded-md border border-[var(--color-border)] p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono">v{initial.version}</span>
              <Badge className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20">Initial</Badge>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{initial.artifactType}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{new Date(initial.timestamp).toLocaleString()}</p>
            <p className="text-xs text-[var(--color-text-muted)]">By: {initial.generatedBy}</p>
          </div>

          <ArrowRight size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />

          {/* Latest version */}
          <div className="flex-1 rounded-md border border-green-500/20 bg-green-500/5 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono">v{latest.version}</span>
              <Badge className="text-xs bg-green-500/10 text-green-400 border border-green-500/20">Latest</Badge>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{latest.artifactType}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{new Date(latest.timestamp).toLocaleString()}</p>
            <p className="text-xs text-[var(--color-text-muted)]">By: {latest.generatedBy}</p>
          </div>
        </div>

        {versions.length > 2 && (
          <p className="text-xs text-[var(--color-text-muted)] mt-3 text-center">
            {versions.length} total versions — showing initial and latest
          </p>
        )}
      </CardContent>
    </Card>
  );
}
