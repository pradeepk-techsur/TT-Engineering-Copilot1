import { Badge } from '@/components/ui/badge';

interface Finding {
  findingId: string; severity: string; description: string;
  status: string; seeded: boolean;
}

export function FindingsSummaryTable({ findings }: { findings: Finding[] }) {
  if (!findings.length) {
    return <p className="text-xs text-[var(--color-text-muted)]">No findings for this phase.</p>;
  }

  const SEVERITY_STYLES: Record<string, string> = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    Major: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Minor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Observation: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <table className="w-full text-sm" data-testid="findings-summary-table">
      <thead>
        <tr className="border-b border-[var(--color-border)]">
          {['ID', 'Severity', 'Description', 'Status', ''].map(h => (
            <th key={h} className="text-left py-2 px-2 text-xs text-[var(--color-text-muted)]">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {findings.map(f => (
          <tr key={f.findingId} className="border-b border-[var(--color-border)]/50 hover:bg-white/5">
            <td className="py-2 px-2 font-mono text-xs">{f.findingId}</td>
            <td className="py-2 px-2">
              <Badge className={`text-xs border ${SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.Observation}`}>
                {f.severity}
              </Badge>
            </td>
            <td className="py-2 px-2 text-xs max-w-xs truncate">{f.description}</td>
            <td className="py-2 px-2 text-xs text-[var(--color-text-muted)]">{f.status}</td>
            <td className="py-2 px-2">
              {f.seeded && (
                <Badge className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20" data-testid="seeded-badge">
                  Seeded
                </Badge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
