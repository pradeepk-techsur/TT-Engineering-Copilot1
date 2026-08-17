'use client';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function VersionHistoryTable({ phaseId, inputRole }: { phaseId: number; inputRole: string }) {
  const { data } = useSWR(`/api/phases/${phaseId}/inputs/${inputRole}/versions`, fetcher);

  if (!data?.versions?.length) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-[var(--color-text-muted)]">No versions yet.</p>
        <p className="text-xs text-[var(--color-text-muted)]/70">Upload or ingest an input to create the first version entry.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-xs" data-testid={`version-history-${inputRole}`}>
      <thead>
        <tr className="border-b border-[var(--color-border)]">
          <th className="text-left py-1 px-2 text-[var(--color-text-muted)]">Version</th>
          <th className="text-left py-1 px-2 text-[var(--color-text-muted)]">Behavior</th>
          <th className="text-left py-1 px-2 text-[var(--color-text-muted)]">Status</th>
          <th className="text-left py-1 px-2 text-[var(--color-text-muted)]">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {data.versions.map((v: { versionId: number; versionNumber: number; intakeBehavior: string; active: boolean; intakeTimestamp: string }) => (
          <tr key={v.versionId} className="border-b border-[var(--color-border)]/50">
            <td className="py-1.5 px-2 font-mono">v{v.versionNumber}</td>
            <td className="py-1.5 px-2">{v.intakeBehavior}</td>
            <td className="py-1.5 px-2">
              {v.active ? (
                <Badge className="text-xs bg-green-500/10 text-green-400 border border-green-500/20">Active</Badge>
              ) : (
                <Badge className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20">Historical</Badge>
              )}
            </td>
            <td className="py-1.5 px-2 text-[var(--color-text-muted)]">
              {new Date(v.intakeTimestamp).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
