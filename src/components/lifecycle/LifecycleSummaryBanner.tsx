'use client';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const GATE_OUTCOMES_LABELS: Record<string, { label: string; style: string }> = {
  'GatePassed':       { label: 'Pass', style: 'bg-green-500/10 text-green-400 border-green-500/20' },
  'GateConditional':  { label: 'Cond. Pass', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  'GateFailed':       { label: 'Fail', style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'AwaitingGate':     { label: 'Awaiting', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'Running':          { label: 'Running', style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'AwaitingInputs':   { label: 'Inputs', style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'Pending':          { label: '—', style: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  'Cancelled':        { label: 'Cancelled', style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'Paused':           { label: 'Paused', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export function LifecycleSummaryBanner() {
  const { data } = useSWR('/api/lifecycle', fetcher, { refreshInterval: 5000 });

  if (!data?.phases) return null;

  const projectClosed = data.projectStatus === 'Closed';

  return (
    <div
      className="flex items-center gap-1.5 flex-wrap py-2 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)]"
      data-testid="lifecycle-summary-banner"
    >
      <span className="text-xs text-[var(--color-text-muted)] mr-1">G0–G9:</span>
      {data.phases.map((phase: { phaseState: string }, i: number) => {
        const outcome = GATE_OUTCOMES_LABELS[phase.phaseState] ?? GATE_OUTCOMES_LABELS['Pending'];
        return (
          <span key={i} className="flex items-center gap-0.5">
            <span className="text-xs text-[var(--color-text-muted)] font-mono">G{i}</span>
            <Badge className={`text-xs border ${outcome.style} h-4 px-1.5`}>
              {outcome.label}
            </Badge>
          </span>
        );
      })}
      {projectClosed && (
        <Badge className="ml-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20">
          PROJECT CLOSED
        </Badge>
      )}
    </div>
  );
}
